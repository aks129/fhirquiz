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
         type QuizResult, insertSimulatorHistorySchema, insertSimulatorCollectionSchema } from "@shared/schema";
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

  // Get learners count for landing page
  app.get("/api/stats/learners-count", async (req, res) => {
    try {
      const count = await storage.getLearnersCount();
      res.json(count);
    } catch (error) {
      console.error("Error fetching learners count:", error);
      // Return a default count if database fails
      res.json(2847);
    }
  });

  // Get trial status for authenticated users
  app.get("/api/billing/trial-status", async (req, res) => {
    try {
      // In a real implementation, this would check the user's purchase/trial records
      // For demo purposes, return a mock trial status
      const mockTrialStatus = {
        isTrialing: Math.random() > 0.7, // 30% chance of being in trial
        daysRemaining: Math.floor(Math.random() * 10) + 1, // 1-10 days remaining
        trialEndDate: new Date(Date.now() + (Math.random() * 10 + 1) * 24 * 60 * 60 * 1000).toISOString()
      };
      
      res.json(mockTrialStatus);
    } catch (error) {
      console.error("Error fetching trial status:", error);
      res.status(500).json({ error: "Failed to fetch trial status" });
    }
  });

  // FHIR Simulator endpoints
  app.post("/sim/send", async (req, res) => {
    try {
      const { method, path, headers = {}, body } = req.body;
      const sessionId = req.headers['x-session-id'] as string;
      const currentFhirBaseUrl = getCurrentFhirBaseUrl();
      
      // Construct full URL
      const url = `${currentFhirBaseUrl}${path}`;
      
      const start = Date.now();
      
      // Proxy the request to FHIR server
      const response = await fetch(url, {
        method,
        headers: {
          'Accept': 'application/fhir+json',
          'Content-Type': 'application/fhir+json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      
      const elapsedMs = Date.now() - start;
      const responseText = await response.text();
      let responseBody;
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = responseText;
      }
      
      // Store in history
      await storage.createSimulatorHistory({
        sessionId,
        method,
        url,
        path,
        headers: headers,
        body: body ? JSON.stringify(body) : null,
        responseStatus: response.status,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        responseBody: responseText,
        elapsedMs,
      });
      
      res.json({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody,
        elapsedMs,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Request failed",
        elapsedMs: 0,
      });
    }
  });

  app.get("/sim/history", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const history = await storage.getSimulatorHistory(sessionId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  app.post("/sim/history/clear", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      await storage.clearSimulatorHistory(sessionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear history" });
    }
  });

  app.get("/sim/collections", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const collections = await storage.getSimulatorCollections(sessionId);
      res.json(collections);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch collections" });
    }
  });

  app.post("/sim/collections/save", async (req, res) => {
    try {
      const collection = insertSimulatorCollectionSchema.parse(req.body);
      const sessionId = req.headers['x-session-id'] as string;
      
      const saved = await storage.createSimulatorCollection({
        ...collection,
        sessionId,
      });
      
      res.json(saved);
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Invalid collection data" 
      });
    }
  });

  app.delete("/sim/collections/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSimulatorCollection(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete collection" });
    }
  });

  // Challenge validation endpoint
  app.post("/sim/challenge", async (req, res) => {
    try {
      const { challengeId, request: challengeRequest, response: challengeResponse } = req.body;
      
      // Simple challenge validation logic
      const validateChallenge = (challengeId: string, request: any, response: any) => {
        switch (challengeId) {
          case "search-patients-smith":
            return request.queryParams?.family === "Smith" && 
                   response?.body?.entry && 
                   response.body.entry.length > 0;
          case "create-patient-basic":
            return response?.status === 201 && 
                   request.body?.resourceType === "Patient" &&
                   request.body?.name;
          case "observation-with-reference":
            return response?.status === 201 &&
                   request.body?.resourceType === "Observation" &&
                   request.body?.subject?.reference?.includes("Patient/") &&
                   request.body?.valueQuantity?.value;
          case "transaction-bundle-integrity":
            return response?.status === 200 &&
                   request.body?.resourceType === "Bundle" &&
                   request.body?.entry?.length >= 3;
          default:
            return false;
        }
      };

      const success = validateChallenge(challengeId, challengeRequest, challengeResponse);
      
      res.json({ 
        success,
        message: success ? "Challenge completed!" : "Requirements not met",
        firstTime: true // For simplicity, always treat as first time
      });
    } catch (error) {
      res.status(500).json({ error: "Challenge validation failed" });
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

  // Generate practice exam with proper question distribution
  app.get("/api/practice-exam/generate", async (req, res) => {
    try {
      // Official exam distribution percentages
      const competencyDistribution = {
        "implementation-guides": { min: 4, max: 8, target: 6 }, // 4-8%, target 6% = 3 questions
        "api-behavior": { min: 19, max: 33, target: 26 }, // 19-33%, target 26% = 13 questions  
        "resource-model": { min: 25, max: 33, target: 29 }, // 25-33%, target 29% = 14-15 questions
        "implementation": { min: 19, max: 29, target: 24 }, // 19-29%, target 24% = 12 questions
        "troubleshooting": { min: 13, max: 19, target: 16 } // 13-19%, target 16% = 8 questions
      };

      // Calculate questions per competency for 50 total questions
      // Must stay within official competency ranges
      const questionCounts = {
        "implementation-guides": 4,   // 8% (4-8% range)
        "api-behavior": 13,          // 26% (19-33% range)
        "resource-model": 12,        // 24% - Note: This is below the 25% minimum, but limited by available questions
        "implementation": 12,        // 24% (19-29% range)
        "troubleshooting": 9         // 18% (13-19% range)
      };

      const examQuestions = [];
      let questionOrder = 1;

      // Sample questions from each competency area
      for (const [competencySlug, count] of Object.entries(questionCounts)) {
        const competencyQuiz = await storage.getQuizBySlug(competencySlug);
        if (!competencyQuiz) {
          console.warn(`Quiz not found for competency: ${competencySlug}`);
          continue;
        }

        const allQuestions = await storage.getQuestionsByQuizId(competencyQuiz.id);
        
        // Shuffle and sample the required number of questions
        const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
        const selectedQuestions = shuffled.slice(0, count);

        // Add choices to selected questions
        const questionsWithChoices = await Promise.all(
          selectedQuestions.map(async (question) => {
            const choices = await storage.getChoicesByQuestionId(question.id);
            // Remove is_correct from choices for security
            const sanitizedChoices = choices.map(({ isCorrect, ...choice }) => choice);
            return { 
              ...question, 
              choices: sanitizedChoices,
              order: questionOrder++,
              competencyArea: competencySlug
            };
          })
        );

        examQuestions.push(...questionsWithChoices);
      }

      // Shuffle the final exam questions to mix competency areas
      const shuffledExam = examQuestions.sort(() => Math.random() - 0.5);
      
      // Re-assign order after shuffling
      shuffledExam.forEach((question, index) => {
        question.order = index + 1;
      });

      // Create exam metadata
      const examData = {
        quiz: {
          id: `practice-exam-${Date.now()}`,
          slug: "practice-exam",
          title: "FHIR Implementor Foundation Practice Exam",
          description: "Full-length 50-question practice exam simulating the official HL7 FHIR Implementor Foundation certification exam",
          timeLimit: 120, // 2 hours
          passingScore: 70,
          quizType: "exam",
          questionCount: 50,
          competencyDistribution: questionCounts
        },
        questions: shuffledExam
      };

      res.json(examData);
    } catch (error) {
      console.error("Error generating practice exam:", error);
      res.status(500).json({ error: "Failed to generate practice exam" });
    }
  });

  // Grade practice exam - special handling for generated exams
  app.post("/api/quiz/practice-exam/grade", async (req, res) => {
    try {
      const submission: QuizSubmission = req.body;
      
      // For practice exams, we need to look up the correct answers from the original quizzes
      let correctAnswers = 0;
      const feedback = [];
      
      for (const answer of submission.answers) {
        // Find the original question by looking through all competency quizzes
        let questionFound = false;
        let correctChoice = null;
        let originalQuestion = null;
        
        const competencyQuizzes = ['implementation-guides', 'api-behavior', 'resource-model', 'implementation', 'troubleshooting'];
        
        for (const competencySlug of competencyQuizzes) {
          const quiz = await storage.getQuizBySlug(competencySlug);
          if (!quiz) continue;
          
          const questions = await storage.getQuestionsByQuizId(quiz.id);
          originalQuestion = questions.find(q => q.id === answer.questionId);
          
          if (originalQuestion) {
            const choices = await storage.getChoicesByQuestionId(originalQuestion.id);
            correctChoice = choices.find(c => c.isCorrect);
            questionFound = true;
            break;
          }
        }
        
        if (!questionFound || !correctChoice || !originalQuestion) {
          console.warn(`Question not found for answer: ${answer.questionId}`);
          continue;
        }
        
        const isCorrect = answer.choiceId === correctChoice.id;
        if (isCorrect) correctAnswers++;
        
        // Find the selected choice text
        const allChoices = await storage.getChoicesByQuestionId(originalQuestion.id);
        const selectedChoice = allChoices.find(c => c.id === answer.choiceId);
        
        feedback.push({
          questionId: originalQuestion.id,
          questionText: originalQuestion.questionText,
          selectedChoice: selectedChoice?.choiceText || "No answer selected",
          correctChoice: correctChoice.choiceText || "Unknown",
          isCorrect,
          explanation: originalQuestion.explanation || ""
        });
      }
      
      const score = Math.round((correctAnswers / submission.answers.length) * 100);
      const passed = score >= 70; // Practice exam passing score is 70%
      
      const result: QuizResult = {
        score,
        passed,
        correctAnswers,
        totalQuestions: submission.answers.length,
        duration: submission.duration,
        feedback
      };

      // Store the attempt for progress tracking
      try {
        const sessionId = req.headers['x-session-id'] as string;
        if (sessionId) {
          await storage.createQuizAttempt({
            userId: null, // No user ID for anonymous
            sessionId,
            quizId: "practice-exam", // Use practice-exam as quiz ID
            score,
            passed,
            duration: submission.duration,
            startedAt: new Date(),
            completedAt: new Date()
          });
        }
      } catch (error) {
        console.warn("Failed to record practice exam attempt:", error);
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error grading practice exam:", error);
      res.status(500).json({ error: "Failed to grade practice exam" });
    }
  });

  // Progress tracking endpoint
  app.get("/api/progress/competency-analysis", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      
      // Get all competency areas
      const competencyAreas = await storage.getCompetencyAreas();
      
      const progressData = await Promise.all(
        competencyAreas.map(async (area) => {
          // Get study progress for this competency
          const studyProgress = await storage.getStudyProgressByCompetency(sessionId, area.id);
          
          // Get quiz attempts for this competency
          const quizAttempts = await storage.getQuizAttempts(sessionId);
          const competencyQuizAttempts = quizAttempts.filter(attempt => {
            // Match quiz attempts to competency areas by quiz slug
            return attempt.quizId === area.slug;
          });
          
          // Get quiz attempts for practice exams (need to analyze by question competency)
          const practiceExamAttempts = quizAttempts.filter(attempt => attempt.quizId === "practice-exam");
          
          // Calculate stats
          const totalAttempts = competencyQuizAttempts.length + practiceExamAttempts.length;
          const correctAttempts = competencyQuizAttempts.filter(a => a.passed).length;
          
          let overallAccuracy = 0;
          let totalCorrect = 0;
          let questionAttempts = 0;
          
          if (competencyQuizAttempts.length > 0) {
            const averageScore = competencyQuizAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / competencyQuizAttempts.length;
            overallAccuracy = averageScore;
            
            // Estimate question-level stats from scores
            questionAttempts = competencyQuizAttempts.length * 10; // Assume ~10 questions per competency quiz
            totalCorrect = Math.round((questionAttempts * averageScore) / 100);
          }
          
          // Calculate mastery score based on multiple factors
          const accuracyScore = overallAccuracy;
          const consistencyScore = competencyQuizAttempts.length > 1 ? 
            Math.max(0, 100 - (competencyQuizAttempts.map(a => a.score || 0).reduce((acc, score, _, arr) => 
              acc + Math.abs(score - (arr.reduce((s, sc) => s + sc, 0) / arr.length)), 0) / competencyQuizAttempts.length)) : 0;
          const volumeScore = Math.min(100, (competencyQuizAttempts.length / 3) * 100); // 3 attempts = full volume score
          
          const masteryScore = (accuracyScore * 0.6) + (consistencyScore * 0.2) + (volumeScore * 0.2);
          
          // Generate recommendations
          const recommendedActions = [];
          if (overallAccuracy < 60) {
            recommendedActions.push("Focus on understanding core concepts");
            recommendedActions.push("Review study materials for this competency");
          }
          if (competencyQuizAttempts.length < 2) {
            recommendedActions.push("Take more practice quizzes");
          }
          if (masteryScore < 70) {
            recommendedActions.push("Spend more time studying this area");
          }
          
          return {
            competencyArea: area,
            studyProgress,
            examAnalytics: [], // Will be populated when we have detailed analytics
            overallAccuracy,
            totalAttempts: questionAttempts,
            totalCorrect,
            averageStudyTime: studyProgress?.studyTimeMinutes || 0,
            masteryScore,
            recommendedActions
          };
        })
      );
      
      res.json(progressData);
    } catch (error) {
      console.error("Error fetching competency analysis:", error);
      res.status(500).json({ error: "Failed to fetch progress analysis" });
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

  // Competency area endpoints
  app.get("/api/competency-areas", async (req, res) => {
    try {
      const competencyAreas = await storage.getCompetencyAreas();
      res.json(competencyAreas);
    } catch (error) {
      console.error("Error fetching competency areas:", error);
      res.status(500).json({ error: "Failed to fetch competency areas" });
    }
  });

  app.get("/api/competency-areas/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const competencyArea = await storage.getCompetencyAreaBySlug(slug);
      
      if (!competencyArea) {
        return res.status(404).json({ error: "Competency area not found" });
      }
      
      res.json(competencyArea);
    } catch (error) {
      console.error("Error fetching competency area:", error);
      res.status(500).json({ error: "Failed to fetch competency area" });
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

  // Seed demo data (users, purchases, trials, testimonials)
  app.post("/ops/seed-demo", async (req, res) => {
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

      // Run the Python seed script with demo flag
      const pythonProcess = spawn('python3', ['-c', `
import sys
import os
sys.path.append('${process.cwd()}')
from apps.backend.db.seed import CommerceSeeder
import asyncio
import json

async def main():
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is required")
    
    stripe_price_ids_json = os.getenv('STRIPE_PRICE_IDS_JSON', '{}')
    try:
        stripe_price_ids = json.loads(stripe_price_ids_json)
    except json.JSONDecodeError:
        stripe_price_ids = {}
    
    seeder = CommerceSeeder(database_url, stripe_price_ids)
    await seeder.seed_demo_data()

if __name__ == "__main__":
    asyncio.run(main())
      `], {
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
            message: "Demo data seeding completed successfully",
            details: {
              usersSeeded: ['Dr. Sarah Chen (instructor)', 'Alex Rivera (student)', 'Jamie Kim (student)', 'Marcus Thompson (student)'],
              purchasesSeeded: ['Active Basic', 'Trial Plus', 'Active Plus'],
              testimonialsSeeded: 3,
              warning: "⚠️ Demo data includes fake user accounts and purchases"
            },
            output: stdout
          });
        } else {
          console.error(`Demo seed process exited with code ${code}`);
          console.error('STDERR:', stderr);
          res.status(500).json({
            error: "Demo data seeding failed",
            exitCode: code,
            stderr: stderr,
            stdout: stdout,
            tip: "Check database connection and ensure Python dependencies are installed"
          });
        }
      });

      pythonProcess.on('error', (error) => {
        console.error("Error spawning demo seed process:", error);
        res.status(500).json({
          error: "Failed to start demo seeding process",
          details: error.message,
          tip: "Ensure python3 is installed and accessible"
        });
      });

    } catch (error) {
      console.error("Error in demo data seeding:", error);
      res.status(500).json({
        error: "Failed to initialize demo data seeding",
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
