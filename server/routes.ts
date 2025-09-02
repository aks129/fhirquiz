import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupCors, extractUser } from "./auth";
import { registerAuthRoutes } from "./routes-auth";
import { registerAdminRoutes } from "./routes-admin";
import { registerBillingRoutes } from "./routes-billing";
import { pointsRateLimit, redemptionRateLimit } from "./middleware/rateLimiter";
import { insertFhirServerSchema, insertLabProgressSchema, insertBundleSchema, insertArtifactSchema,
         insertQuizAttemptSchema, insertQuizAnswerSchema, type QuizData, type QuizSubmission, 
         type QuizResult } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { extractHealthMetrics, generateMetricsPreview, createFhirObservations, publishObservationsToFhir, generateAppConfig } from "./byod/processor";
import { getActiveFhirBaseUrl, getCurrentFhirBaseUrl, checkLocalFhirHealth, persistConfig, config } from "./config";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup CORS
  setupCors(app);
  
  // Extract JWT user from all requests
  app.use(extractUser);
  
  // Session middleware for anonymous users
  app.use('/api', (req, res, next) => {
    if (!req.headers['x-session-id']) {
      req.headers['x-session-id'] = randomUUID();
    }
    next();
  });

  // Register authentication routes
  registerAuthRoutes(app);
  
  // Register admin routes
  registerAdminRoutes(app);
  
  // Register billing routes
  registerBillingRoutes(app);

  // Feature Flag endpoints
  app.get("/config/features", async (req, res) => {
    try {
      const flags = await storage.getFeatureFlags();
      const flagsMap = flags.reduce((acc, flag) => {
        acc[flag.flagKey] = flag.isEnabled;
        return acc;
      }, {} as Record<string, boolean>);
      res.json(flagsMap);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch feature flags" });
    }
  });

  app.get("/api/admin/feature-flags", async (req, res) => {
    try {
      const flags = await storage.getFeatureFlags();
      res.json(flags);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch feature flags" });
    }
  });

  app.put("/api/admin/feature-flags/:flagKey", async (req, res) => {
    try {
      const { flagKey } = req.params;
      const { isEnabled } = req.body;
      const updatedBy = req.user?.id || undefined;
      
      const updatedFlag = await storage.updateFeatureFlag(flagKey, isEnabled, updatedBy);
      res.json(updatedFlag);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // FHIR Server endpoints
  app.get("/api/fhir/servers", async (req, res) => {
    try {
      const servers = await storage.getFhirServers();
      res.json(servers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch FHIR servers" });
    }
  });

  app.post("/api/fhir/servers", async (req, res) => {
    try {
      const server = insertFhirServerSchema.parse(req.body);
      const created = await storage.createFhirServer(server);
      res.json(created);
    } catch (error) {
      res.status(400).json({ error: "Invalid server data" });
    }
  });

  // FHIR connectivity testing
  app.post("/api/fhir/ping", async (req, res) => {
    try {
      const { baseUrl: userSelectedUrl } = req.body;
      const activeBaseUrl = getActiveFhirBaseUrl(userSelectedUrl);
      const start = Date.now();
      
      // Test basic connectivity
      const response = await fetch(`${activeBaseUrl}/metadata`, {
        method: 'GET',
        headers: {
          'Accept': 'application/fhir+json',
        },
      });
      
      const responseTime = Date.now() - start;
      
      if (!response.ok) {
        return res.json({
          success: false,
          responseTime,
          error: `Server responded with ${response.status}`,
        });
      }

      const capabilities = await response.json();
      
      res.json({
        success: true,
        responseTime,
        fhirVersion: capabilities.fhirVersion || "Unknown",
        capabilities,
      });
    } catch (error) {
      res.json({
        success: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : "Connection failed",
      });
    }
  });

  // Bundle upload and processing
  app.post("/api/fhir/load-bundle", async (req, res) => {
    try {
      const { bundle, fhirServerUrl: userSelectedUrl, fileName } = req.body;
      const sessionId = req.headers['x-session-id'] as string;
      const activeFhirServerUrl = getActiveFhirBaseUrl(userSelectedUrl);
      
      // Post bundle to FHIR server
      const response = await fetch(activeFhirServerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/fhir+json',
          'Accept': 'application/fhir+json',
        },
        body: JSON.stringify(bundle),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(400).json({
          success: false,
          error: `FHIR server error: ${response.status} - ${errorText}`,
        });
      }

      const result = await response.json();
      const resourceIds = result.entry?.map((e: any) => e.response?.location?.split('/').slice(-1)[0]).filter(Boolean) || [];
      
      // Store bundle record
      await storage.createBundle({
        sessionId,
        fileName,
        bundleType: bundle.type || "transaction",
        resourceCount: bundle.entry?.length || 0,
        fhirServerId: null, // We could map this if needed
        metadata: { resourceIds },
      });

      res.json({
        success: true,
        resourcesCreated: resourceIds.length,
        resourceIds,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      });
    }
  });

  // FHIR resource statistics
  app.post("/api/fhir/stats", async (req, res) => {
    try {
      const { fhirServerUrl: userSelectedUrl, patientId } = req.body;
      const fhirServerUrl = getActiveFhirBaseUrl(userSelectedUrl);
      
      const stats = {
        patients: 0,
        encounters: 0,
        observations: 0,
        lastUpdated: new Date().toISOString(),
      };

      // Count patients
      const patientResponse = await fetch(`${fhirServerUrl}/Patient?_summary=count`, {
        headers: { 'Accept': 'application/fhir+json' },
      });
      if (patientResponse.ok) {
        const patientData = await patientResponse.json();
        stats.patients = patientData.total || 0;
      }

      // Count encounters for specific patient if provided
      const encounterUrl = patientId 
        ? `${fhirServerUrl}/Encounter?patient=${patientId}&_summary=count`
        : `${fhirServerUrl}/Encounter?_summary=count`;
      
      const encounterResponse = await fetch(encounterUrl, {
        headers: { 'Accept': 'application/fhir+json' },
      });
      if (encounterResponse.ok) {
        const encounterData = await encounterResponse.json();
        stats.encounters = encounterData.total || 0;
      }

      // Count observations for specific patient if provided
      const observationUrl = patientId 
        ? `${fhirServerUrl}/Observation?patient=${patientId}&_summary=count`
        : `${fhirServerUrl}/Observation?_summary=count`;
      
      const observationResponse = await fetch(observationUrl, {
        headers: { 'Accept': 'application/fhir+json' },
      });
      if (observationResponse.ok) {
        const observationData = await observationResponse.json();
        stats.observations = observationData.total || 0;
      }

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // CSV Export functionality
  app.post("/api/export/flat", async (req, res) => {
    try {
      const { fhirServerUrl, patientId, resourceType } = req.body;
      const sessionId = req.headers['x-session-id'] as string;
      
      // Fetch resources from FHIR server
      const searchUrl = `${fhirServerUrl}/${resourceType}?patient=${patientId}&_count=1000`;
      const response = await fetch(searchUrl, {
        headers: { 'Accept': 'application/fhir+json' },
      });

      if (!response.ok) {
        return res.status(400).json({ error: "Failed to fetch resources" });
      }

      const bundle = await response.json();
      const resources = bundle.entry?.map((e: any) => e.resource) || [];
      
      // Convert to CSV format (simplified)
      const csvData = resources.map((resource: any) => {
        const flattened: any = {
          id: resource.id,
          resourceType: resource.resourceType,
        };
        
        // Flatten common fields based on resource type
        if (resourceType === 'Patient') {
          flattened.name = resource.name?.[0]?.given?.join(' ') + ' ' + resource.name?.[0]?.family || '';
          flattened.gender = resource.gender;
          flattened.birthDate = resource.birthDate;
        } else if (resourceType === 'Encounter') {
          flattened.status = resource.status;
          flattened.class = resource.class?.display || resource.class?.code;
          flattened.start = resource.period?.start;
          flattened.end = resource.period?.end;
          flattened.patient = resource.subject?.reference;
        } else if (resourceType === 'Observation') {
          flattened.status = resource.status;
          flattened.code = resource.code?.coding?.[0]?.code;
          flattened.display = resource.code?.coding?.[0]?.display || resource.code?.text;
          flattened.value = resource.valueQuantity?.value || resource.valueString;
          flattened.unit = resource.valueQuantity?.unit;
          flattened.date = resource.effectiveDateTime;
          flattened.patient = resource.subject?.reference;
          flattened.encounter = resource.encounter?.reference;
        }
        
        return flattened;
      });

      // Create CSV content
      if (csvData.length === 0) {
        return res.json({ success: false, error: "No data to export" });
      }

      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
      ].join('\n');

      // Store as artifact
      const fileName = `${resourceType.toLowerCase()}_export_${Date.now()}.csv`;
      const filePath = `/tmp/${fileName}`;
      
      await fs.writeFile(filePath, csvContent);
      
      await storage.createArtifact({
        sessionId,
        artifactType: 'csv_export',
        fileName,
        filePath,
        labDay: 1,
        metadata: { resourceType, recordCount: csvData.length },
      });

      res.json({
        success: true,
        fileName,
        recordCount: csvData.length,
        downloadUrl: `/api/artifacts/download/${fileName}`,
      });
    } catch (error) {
      res.status(500).json({ error: "Export failed" });
    }
  });

  // Lab progress tracking
  app.get("/api/lab/progress", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const progress = await storage.getLabProgress(sessionId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.post("/api/lab/progress", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const progressData = insertLabProgressSchema.parse({
        ...req.body,
        sessionId,
      });
      
      const progress = await storage.updateLabProgress(progressData);
      res.json(progress);
    } catch (error) {
      res.status(400).json({ error: "Invalid progress data" });
    }
  });

  app.delete("/api/lab/progress", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      await storage.resetLabProgress(sessionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset progress" });
    }
  });

  // Transform operations (Day 2)
  app.post("/api/transforms/run", async (req, res) => {
    try {
      const { transformType, inputData } = req.body;
      const sessionId = req.headers['x-session-id'] as string;
      
      // Simulate transform execution
      const results = {
        success: true,
        recordsProcessed: inputData?.length || 0,
        outputPath: `/tmp/transform_${Date.now()}.json`,
        riskScores: inputData?.map((record: any, index: number) => ({
          patientId: record.patientId || `patient-${index}`,
          riskScore: Math.random() * 100,
          readmissionFlag: Math.random() > 0.7,
        })) || [],
      };

      // Store as artifact
      await storage.createArtifact({
        sessionId,
        artifactType: 'transform_result',
        fileName: `transform_${transformType}_${Date.now()}.json`,
        filePath: results.outputPath,
        labDay: 2,
        metadata: results,
      });

      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Transform execution failed" });
    }
  });

  // Observation publishing (Day 3)
  app.post("/api/fhir/publish/observation", async (req, res) => {
    try {
      const { patientId, encounterId, code, display, value, unit, fhirServerUrl } = req.body;
      const sessionId = req.headers['x-session-id'] as string;
      
      const observation = {
        resourceType: "Observation",
        status: "final",
        code: {
          coding: [{
            system: "http://loinc.org",
            code: code,
            display: display,
          }],
          text: display,
        },
        subject: {
          reference: `Patient/${patientId}`,
        },
        encounter: encounterId ? {
          reference: `Encounter/${encounterId}`,
        } : undefined,
        valueQuantity: {
          value: value,
          unit: unit,
          system: "http://unitsofmeasure.org",
          code: unit,
        },
        effectiveDateTime: new Date().toISOString(),
      };

      // Post to FHIR server
      const response = await fetch(`${fhirServerUrl}/Observation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/fhir+json',
          'Accept': 'application/fhir+json',
        },
        body: JSON.stringify(observation),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(400).json({
          success: false,
          error: `FHIR server error: ${response.status} - ${errorText}`,
        });
      }

      const created = await response.json();
      const resourceId = created.id;
      const resourceUrl = `${fhirServerUrl}/Observation/${resourceId}`;

      // Store as artifact
      await storage.createArtifact({
        sessionId,
        artifactType: 'observation',
        fileName: `observation_${resourceId}.json`,
        filePath: `/tmp/observation_${resourceId}.json`,
        labDay: 3,
        metadata: { resourceId, resourceUrl, observation: created },
      });

      res.json({
        success: true,
        resourceId,
        resourceUrl,
        observation: created,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to publish observation" });
    }
  });

  // Artifact management
  app.get("/api/artifacts", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const artifacts = await storage.getArtifacts(sessionId);
      res.json(artifacts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch artifacts" });
    }
  });

  app.get("/api/artifacts/download/:fileName", async (req, res) => {
    try {
      const { fileName } = req.params;
      const filePath = path.join('/tmp', fileName);
      
      // Check if file exists
      await fs.access(filePath);
      
      res.download(filePath);
    } catch (error) {
      res.status(404).json({ error: "File not found" });
    }
  });

  // Bundles endpoint
  app.get("/api/bundles", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const bundles = await storage.getBundles(sessionId);
      res.json(bundles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bundles" });
    }
  });

  // Quiz endpoints
  app.get("/api/quiz/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const quiz = await storage.getQuizBySlug(slug);
      
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      
      const questions = await storage.getQuestionsByQuizId(quiz.id);
      const questionsWithChoices = await Promise.all(
        questions.map(async (question) => {
          const choices = await storage.getChoicesByQuestionId(question.id);
          // Remove is_correct from choices for security
          const sanitizedChoices = choices.map(({ isCorrect, ...choice }) => choice);
          return { ...question, choices: sanitizedChoices };
        })
      );
      
      const quizData: QuizData = {
        quiz,
        questions: questionsWithChoices
      };
      
      res.json(quizData);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ error: "Failed to fetch quiz" });
    }
  });

  app.post("/api/quiz/:slug/grade", async (req, res) => {
    try {
      const { slug } = req.params;
      const submission: QuizSubmission = req.body;
      
      const quiz = await storage.getQuizBySlug(slug);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      
      const questions = await storage.getQuestionsByQuizId(quiz.id);
      let correctAnswers = 0;
      const feedback = [];
      
      for (const question of questions) {
        const choices = await storage.getChoicesByQuestionId(question.id);
        const userAnswer = submission.answers.find(a => a.questionId === question.id);
        const correctChoice = choices.find(c => c.isCorrect);
        const selectedChoice = userAnswer ? choices.find(c => c.id === userAnswer.choiceId) : null;
        
        const isCorrect = userAnswer?.choiceId === correctChoice?.id;
        if (isCorrect) correctAnswers++;
        
        feedback.push({
          questionId: question.id,
          questionText: question.questionText,
          selectedChoice: selectedChoice?.choiceText || "No answer selected",
          correctChoice: correctChoice?.choiceText || "Unknown",
          isCorrect,
          explanation: question.explanation || ""
        });
      }
      
      const score = Math.round((correctAnswers / questions.length) * 100);
      const passed = score >= (quiz.passingScore || 80);
      
      const result: QuizResult = {
        score,
        passed,
        totalQuestions: questions.length,
        correctAnswers,
        feedback
      };
      
      res.json(result);
    } catch (error) {
      console.error("Error grading quiz:", error);
      res.status(500).json({ error: "Failed to grade quiz" });
    }
  });

  app.post("/api/quiz/:slug/attempt", async (req, res) => {
    try {
      const { slug } = req.params;
      const { answers, duration, score, passed } = req.body;
      const sessionId = req.headers['x-session-id'] as string;
      
      const quiz = await storage.getQuizBySlug(slug);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      
      // Create quiz attempt
      const attempt = await storage.createQuizAttempt({
        sessionId,
        quizId: quiz.id,
        score,
        passed,
        duration,
        userId: null
      });
      
      // Update attempt with completion time
      const completedAttempt = await storage.updateQuizAttempt(attempt.id, {
        completedAt: new Date()
      });
      
      // Create quiz answers
      for (const answer of answers) {
        const choices = await storage.getChoicesByQuestionId(answer.questionId);
        const selectedChoice = choices.find(c => c.id === answer.choiceId);
        
        await storage.createQuizAnswer({
          attemptId: attempt.id,
          questionId: answer.questionId,
          choiceId: answer.choiceId,
          isCorrect: selectedChoice?.isCorrect || false
        });
      }

      // Award points for first-time quiz completion
      const userId = req.user?.id;
      if (userId && passed) {
        // Check if this is the first successful attempt for this quiz
        const previousAttempts = await storage.getQuizAttempts(sessionId);
        const previousPassed = previousAttempts.filter(a => 
          a.quizId === quiz.id && 
          a.passed === true && 
          a.id !== attempt.id
        );

        if (previousPassed.length === 0) {
          // This is the first successful attempt
          const milestoneMap: Record<string, string> = {
            'fhir-day1': 'quiz_day1_first_pass',
            'fhir-day2': 'quiz_day2_first_pass', 
            'fhir-day3': 'quiz_day3_first_pass'
          };

          const milestone = milestoneMap[slug];
          if (milestone) {
            await awardPointsForMilestone(userId, milestone);
          }
        }
      }
      
      res.json(completedAttempt);
    } catch (error) {
      console.error("Error recording quiz attempt:", error);
      res.status(500).json({ error: "Failed to record quiz attempt" });
    }
  });

  app.get("/api/quiz-attempts", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const attempts = await storage.getQuizAttempts(sessionId);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
      res.status(500).json({ error: "Failed to fetch quiz attempts" });
    }
  });

  // BYOD endpoints
  app.post("/api/byod/import", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const { sourceType, fileName, fileSize, rawData } = req.body;
      
      // Parse and process health data
      const metrics = extractHealthMetrics(rawData, sourceType);
      
      // Create BYOD session
      const session = await storage.createByodSession({
        sessionId,
        userId: null,
        sourceType,
        fileName,
        fileSize,
        rawData,
        mappings: null
      });
      
      const preview = generateMetricsPreview(metrics);
      
      res.json({
        success: true,
        sessionId: session.id,
        recordCount: metrics.length,
        metrics: Object.keys(preview),
        preview
      });
    } catch (error) {
      console.error("Error importing BYOD data:", error);
      res.status(500).json({ error: "Failed to import health data" });
    }
  });

  app.post("/api/byod/publish", async (req, res) => {
    try {
      const { byodSessionId, mappings, fhirServerId, patientId } = req.body;
      
      // Get BYOD session
      const sessions = await storage.getByodSessions("");
      const session = sessions.find(s => s.id === byodSessionId);
      if (!session) {
        return res.status(404).json({ error: "BYOD session not found" });
      }
      
      // Get FHIR server
      const fhirServer = await storage.getFhirServer(fhirServerId);
      if (!fhirServer) {
        return res.status(404).json({ error: "FHIR server not found" });
      }
      
      // Convert data to FHIR Observations
      const observations = await createFhirObservations(session.rawData, mappings, patientId);
      
      // Publish to FHIR server
      const results = await publishObservationsToFhir(fhirServer.baseUrl, observations);
      
      // Store observation records
      for (const obs of results) {
        await storage.createByodObservation({
          sessionId: session.id,
          fhirId: obs.fhirId,
          observationType: obs.type,
          value: obs.value,
          unit: obs.unit,
          effectiveDate: obs.effectiveDate,
          fhirServerId
        });
      }

      // Award points for BYOD completion if user is authenticated
      const userId = req.user?.id;
      if (userId && results.length > 0) {
        await awardPointsForMilestone(userId, 'byod_complete');
      }
      
      res.json({
        success: true,
        observationsCreated: results.length,
        fhirIds: results.map(r => r.fhirId)
      });
    } catch (error) {
      console.error("Error publishing BYOD data:", error);
      res.status(500).json({ error: "Failed to publish to FHIR server" });
    }
  });

  app.post("/api/byod/generate-app", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const { byodSessionId, appName, appType, metrics, config } = req.body;
      
      // Generate app configuration
      const appConfig = await generateAppConfig(appType, metrics, config);
      
      // Create generated app record
      const app = await storage.createGeneratedApp({
        sessionId,
        userId: null,
        byodSessionId,
        appName,
        appType,
        config: appConfig
      });
      
      res.json({
        success: true,
        appId: app.id,
        appUrl: `/byod-app/${app.id}`,
        config: appConfig
      });
    } catch (error) {
      console.error("Error generating app:", error);
      res.status(500).json({ error: "Failed to generate mini-app" });
    }
  });

  app.get("/api/byod/sessions", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const sessions = await storage.getByodSessions(sessionId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching BYOD sessions:", error);
      res.status(500).json({ error: "Failed to fetch BYOD sessions" });
    }
  });

  app.get("/api/byod/apps", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const apps = await storage.getGeneratedApps(sessionId);
      res.json(apps);
    } catch (error) {
      console.error("Error fetching generated apps:", error);
      res.status(500).json({ error: "Failed to fetch generated apps" });
    }
  });

  // Demo endpoint to initialize sample data
  app.post("/api/demo/initialize", async (req, res) => {
    try {
      const { sessionId } = req.body;
      const demoSessionId = sessionId || "demo-session-123";
      
      // Initialize demo data
      await (storage as any).initializeDemoData(demoSessionId);
      
      res.json({
        success: true,
        message: "Demo data initialized successfully",
        sessionId: demoSessionId,
        instructions: `Set your session ID to '${demoSessionId}' to see all features in action`
      });
    } catch (error) {
      console.error("Error initializing demo data:", error);
      res.status(500).json({ error: "Failed to initialize demo data" });
    }
  });

  // Get currently active FHIR base URL
  app.get("/ops/fhir-base", async (req, res) => {
    try {
      const baseUrl = getCurrentFhirBaseUrl();
      res.json({
        activeBaseUrl: baseUrl,
        useLocalFhir: process.env.USE_LOCAL_FHIR === 'true',
        localFhirUrl: process.env.LOCAL_FHIR_URL || 'http://localhost:8080/fhir',
        fallbackUrl: process.env.FHIR_BASE_URL || 'https://hapi.fhir.org/baseR4',
        instructorMode: config.INSTRUCTOR_MODE
      });
    } catch (error) {
      console.error("Error getting FHIR base URL:", error);
      res.status(500).json({ error: "Failed to get FHIR base URL" });
    }
  });

  // Check local FHIR server health
  app.get("/ops/check-local-fhir", async (req, res) => {
    try {
      const healthResult = await checkLocalFhirHealth();
      res.json(healthResult);
    } catch (error) {
      console.error("Error checking local FHIR health:", error);
      res.status(500).json({
        ok: false,
        status: 0,
        elapsedMs: 0,
        error: "Health check failed"
      });
    }
  });

  // Set local FHIR usage preference
  app.post("/ops/use-local-fhir", async (req, res) => {
    try {
      const { enabled } = req.body;
      
      // Update configuration in memory and persist to file
      config.USE_LOCAL_FHIR = enabled;
      process.env.USE_LOCAL_FHIR = enabled ? 'true' : 'false';
      await persistConfig(enabled);
      
      const activeBaseUrl = getCurrentFhirBaseUrl();
      
      res.json({
        success: true,
        useLocalFhir: enabled,
        activeBaseUrl,
        message: enabled ? "Switched to local FHIR server" : "Switched to public FHIR servers"
      });
    } catch (error) {
      console.error("Error setting local FHIR preference:", error);
      res.status(500).json({ error: "Failed to set local FHIR preference" });
    }
  });

  // Seed local HAPI FHIR server endpoint
  app.get("/ops/seed-local-fhir", async (req, res) => {
    try {
      const localHapiUrl = "http://localhost:8080/fhir";
      
      // Read sample Synthea data
      const syntheaPath = path.join(process.cwd(), "client/public/data/synthea_patient_small.json");
      const syntheaData = await fs.readFile(syntheaPath, 'utf-8');
      const bundle = JSON.parse(syntheaData);
      
      // Upload bundle to local HAPI server
      const uploadResponse = await fetch(localHapiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/fhir+json',
        },
        body: JSON.stringify(bundle)
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`HAPI upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }
      
      const result = await uploadResponse.json();
      
      res.json({
        success: true,
        message: "Local HAPI FHIR server seeded successfully",
        resourcesUploaded: bundle.entry?.length || 0,
        fhirServer: localHapiUrl,
        bundleId: result.id
      });
    } catch (error) {
      console.error("Error seeding local HAPI server:", error);
      res.status(500).json({ 
        error: "Failed to seed local HAPI server",
        details: error instanceof Error ? error.message : "Unknown error",
        tip: "Make sure the local HAPI server is running with 'make up'"
      });
    }
  });

  // Reset class artifacts - Instructor mode only
  app.post("/ops/reset-class", async (req, res) => {
    // Check if instructor mode is enabled
    if (!config.INSTRUCTOR_MODE) {
      return res.status(403).json({ 
        error: "Reset class operation is only available in instructor mode",
        tip: "Set INSTRUCTOR_MODE=true to enable this feature"
      });
    }

    try {
      const { confirm } = req.body;
      const artifactsCleared = [];
      const errors = [];

      // Clear local artifacts directories
      const artifactDirs = ['artifacts', 'byod_artifacts'];
      
      for (const dir of artifactDirs) {
        const dirPath = path.join(process.cwd(), dir);
        try {
          // Check if directory exists
          await fs.access(dirPath);
          
          // Remove all files in the directory
          const files = await fs.readdir(dirPath);
          for (const file of files) {
            await fs.unlink(path.join(dirPath, file));
          }
          
          artifactsCleared.push(`${dir}/* (${files.length} files)`);
        } catch (error) {
          if ((error as any).code !== 'ENOENT') {
            errors.push(`Failed to clear ${dir}: ${(error as Error).message}`);
          }
        }
      }

      let hapiDataCleared = false;
      
      // Dangerous operation: wipe local HAPI data if explicitly confirmed
      if (confirm === true) {
        try {
          const hapiDataPath = path.join(process.cwd(), 'volumes', 'hapi-data');
          
          // Check if the directory exists
          await fs.access(hapiDataPath);
          
          // Remove the entire volumes/hapi-data directory
          await fs.rm(hapiDataPath, { recursive: true, force: true });
          
          // Recreate the directory for Docker volume mounting
          await fs.mkdir(hapiDataPath, { recursive: true });
          
          hapiDataCleared = true;
        } catch (error) {
          if ((error as any).code !== 'ENOENT') {
            errors.push(`Failed to clear HAPI data: ${(error as Error).message}`);
          }
        }
      }

      const response: any = {
        success: errors.length === 0,
        artifactsCleared,
        hapiDataCleared,
        message: errors.length === 0 
          ? "Class reset completed successfully" 
          : "Class reset completed with some errors"
      };

      if (errors.length > 0) {
        response.errors = errors;
      }

      if (hapiDataCleared) {
        response.warning = "⚠️ Local HAPI FHIR data has been completely wiped. Restart the Docker container to initialize a fresh database.";
      }

      res.json(response);
    } catch (error) {
      console.error("Error during class reset:", error);
      res.status(500).json({ 
        error: "Failed to reset class",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Seed commerce data (products, courses, badges)
  app.post("/ops/seed-commerce", async (req, res) => {
    try {
      const { spawn } = require('child_process');
      const path = require('path');
      
      // Path to the Python seed script
      const seedScriptPath = path.join(process.cwd(), 'apps/backend/db/seed.py');
      
      // Check if the seed script exists
      try {
        await fs.access(seedScriptPath);
      } catch (error) {
        return res.status(404).json({
          error: "Seed script not found",
          details: `Expected script at: ${seedScriptPath}`,
          tip: "Make sure apps/backend/db/seed.py exists"
        });
      }

      // Run the Python seed script
      const pythonProcess = spawn('python3', [seedScriptPath], {
        env: {
          ...process.env,
          DATABASE_URL: process.env.DATABASE_URL,
          STRIPE_PRICE_IDS_JSON: process.env.STRIPE_PRICE_IDS_JSON || '{}'
        },
        cwd: process.cwd()
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          res.json({
            success: true,
            message: "Commerce data seeding completed successfully",
            details: {
              productsSeeded: ['bootcamp_basic', 'bootcamp_plus', 'course_fhir101'],
              coursesSeeded: ['fhir-101', 'health-data-bootcamp', 'fhir-deep-dive'],
              badgesSeeded: ['BYOD_CHAMP', 'FHIR_LOOP_CLOSER', 'QUIZ_MASTER']
            },
            output: stdout
          });
        } else {
          console.error(`Seed process exited with code ${code}`);
          console.error('STDERR:', stderr);
          res.status(500).json({
            error: "Commerce seeding failed",
            exitCode: code,
            stderr: stderr,
            stdout: stdout,
            tip: "Check database connection and ensure Python dependencies are installed"
          });
        }
      });

      pythonProcess.on('error', (error) => {
        console.error("Error spawning seed process:", error);
        res.status(500).json({
          error: "Failed to start seeding process",
          details: error.message,
          tip: "Ensure python3 is installed and accessible"
        });
      });

    } catch (error) {
      console.error("Error in commerce seeding:", error);
      res.status(500).json({
        error: "Failed to initialize commerce seeding",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // FHIR Observation endpoint for testing
  app.post("/api/fhir/observations", async (req, res) => {
    try {
      const baseUrl = getCurrentFhirBaseUrl();
      const observation = req.body;
      
      const response = await fetch(`${baseUrl}/Observation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/fhir+json',
          'Accept': 'application/fhir+json'
        },
        body: JSON.stringify(observation)
      });
      
      if (!response.ok) {
        const errorBody = await response.json();
        return res.status(response.status).json(errorBody);
      }
      
      const result = await response.json();
      
      // Award points for observation publishing if user is authenticated
      const userId = req.user?.id;
      if (userId) {
        await awardPointsForMilestone(userId, 'observation_published');
      }
      
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating observation:", error);
      res.status(500).json({ error: "Failed to create observation" });
    }
  });

  // Points management endpoints
  app.get("/api/points/:userId", async (req, res) => {
    try {
      const { supabase } = await import('./auth');
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('fhir_points')
        .eq('id', req.params.userId)
        .single();
        
      if (error) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ points: profile.fhir_points });
    } catch (error) {
      console.error('Error fetching points:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/points/award", pointsRateLimit, async (req, res) => {
    try {
      const { userId, points, reason, milestone } = req.body;
      
      if (!userId || !points || !reason) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const { supabase } = await import('./auth');
      
      // Get current points
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('fhir_points')
        .eq('id', userId)
        .single();
        
      if (fetchError) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Update points
      const newPoints = profile.fhir_points + points;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ fhir_points: newPoints })
        .eq('id', userId);
        
      if (updateError) {
        throw updateError;
      }
      
      // Log the points award
      console.log(`Awarded ${points} points to user ${userId} for ${reason}`);
      
      res.json({ 
        success: true, 
        newTotal: newPoints,
        awarded: points,
        reason 
      });
    } catch (error) {
      console.error('Error awarding points:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Points redemption endpoint
  app.post("/api/points/redeem", redemptionRateLimit, async (req, res) => {
    try {
      const { rewardCode } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      if (!rewardCode) {
        return res.status(400).json({ error: "Reward code is required" });
      }
      
      const { supabase } = await import('./auth');
      
      // Define reward costs
      const rewardCosts: Record<string, number> = {
        'fhir-template-bundle': 50,
        'synthetic-patient-dataset': 75,
        'advanced-analytics-lab': 100,
        'hl7-integration-guide': 60,
        'interoperability-specialist': 150,
        'real-world-dataset': 120
      };
      
      const pointCost = rewardCosts[rewardCode];
      if (!pointCost) {
        return res.status(404).json({ error: "Invalid reward code" });
      }
      
      // Get current points
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('fhir_points')
        .eq('id', userId)
        .single();
        
      if (fetchError) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if user has enough points
      if (profile.fhir_points < pointCost) {
        return res.status(400).json({ 
          error: "Insufficient points",
          required: pointCost,
          available: profile.fhir_points
        });
      }
      
      // Deduct points
      const newPoints = profile.fhir_points - pointCost;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ fhir_points: newPoints })
        .eq('id', userId);
        
      if (updateError) {
        throw updateError;
      }
      
      // In a real implementation, you might:
      // 1. Generate a download token/URL
      // 2. Store redemption record in database
      // 3. Send email with download link
      
      console.log(`User ${userId} redeemed reward ${rewardCode} for ${pointCost} points`);
      
      res.json({
        success: true,
        pointsDeducted: pointCost,
        newBalance: newPoints,
        rewardCode,
        // You could return a signed download URL here
        downloadToken: `${rewardCode}-${Date.now()}`
      });
    } catch (error) {
      console.error('Error redeeming reward:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Helper function to award points for milestones
  async function awardPointsForMilestone(userId: string, milestone: string) {
    if (!userId) return;
    
    const pointValues: Record<string, { points: number; reason: string }> = {
      'quiz_day1_first_pass': { points: 25, reason: 'Passed Day 1 Quiz (First Attempt)' },
      'quiz_day2_first_pass': { points: 25, reason: 'Passed Day 2 Quiz (First Attempt)' },
      'quiz_day3_first_pass': { points: 25, reason: 'Passed Day 3 Quiz (First Attempt)' },
      'byod_complete': { points: 50, reason: 'Completed BYOD Badge' },
      'observation_published': { points: 10, reason: 'Published FHIR Observation' }
    };
    
    const milestoneData = pointValues[milestone];
    if (!milestoneData) return;
    
    try {
      const { supabase } = await import('./auth');
      
      // Get current points
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('fhir_points')
        .eq('id', userId)
        .single();
        
      if (fetchError) {
        console.error('User not found for milestone award:', userId);
        return;
      }
      
      // Update points
      const newPoints = profile.fhir_points + milestoneData.points;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ fhir_points: newPoints })
        .eq('id', userId);
        
      if (updateError) {
        console.error('Error updating points:', updateError);
        return;
      }
      
      console.log(`Milestone achieved: ${milestone} (+${milestoneData.points} points) for user ${userId}`);
    } catch (error) {
      console.error('Error awarding milestone points:', error);
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
