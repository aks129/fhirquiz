import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFhirServerSchema, insertLabProgressSchema, insertBundleSchema, insertArtifactSchema,
         insertQuizAttemptSchema, insertQuizAnswerSchema, type QuizData, type QuizSubmission, 
         type QuizResult } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { extractHealthMetrics, generateMetricsPreview, createFhirObservations, publishObservationsToFhir, generateAppConfig } from "./byod/processor";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware for anonymous users
  app.use('/api', (req, res, next) => {
    if (!req.headers['x-session-id']) {
      req.headers['x-session-id'] = randomUUID();
    }
    next();
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
      const { baseUrl } = req.body;
      const start = Date.now();
      
      // Test basic connectivity
      const response = await fetch(`${baseUrl}/metadata`, {
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
      const { bundle, fhirServerUrl, fileName } = req.body;
      const sessionId = req.headers['x-session-id'] as string;
      
      // Post bundle to FHIR server
      const response = await fetch(fhirServerUrl, {
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
      const { fhirServerUrl, patientId } = req.body;
      
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

  const httpServer = createServer(app);
  return httpServer;
}
