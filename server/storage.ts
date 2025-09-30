import { type User, type InsertUser, type FhirServer, type InsertFhirServer, 
         type LabProgress, type InsertLabProgress, type Bundle, type InsertBundle,
         type Artifact, type InsertArtifact, type Quiz, type InsertQuiz,
         type Question, type InsertQuestion, type Choice, type InsertChoice,
         type QuizAttempt, type InsertQuizAttempt, type QuizAnswer, type InsertQuizAnswer,
         type CompetencyArea, type InsertCompetencyArea, type StudyProgress, type InsertStudyProgress,
         type ExamAnalytics, type InsertExamAnalytics,
         type ByodSession, type InsertByodSession, type ByodObservation, type InsertByodObservation,
         type GeneratedApp, type InsertGeneratedApp, type FeatureFlag, type InsertFeatureFlag,
         type SimulatorHistory, type InsertSimulatorHistory, type SimulatorCollection, type InsertSimulatorCollection } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // FHIR Server operations
  getFhirServers(): Promise<FhirServer[]>;
  getFhirServer(id: string): Promise<FhirServer | undefined>;
  createFhirServer(server: InsertFhirServer): Promise<FhirServer>;
  
  // Lab progress operations
  getLabProgress(sessionId: string): Promise<LabProgress[]>;
  getLabProgressByDay(sessionId: string, labDay: number): Promise<LabProgress[]>;
  updateLabProgress(progress: InsertLabProgress): Promise<LabProgress>;
  resetLabProgress(sessionId: string): Promise<void>;
  
  // Bundle operations
  getBundles(sessionId: string): Promise<Bundle[]>;
  createBundle(bundle: InsertBundle): Promise<Bundle>;
  
  // Artifact operations
  getArtifacts(sessionId: string): Promise<Artifact[]>;
  getArtifactsByDay(sessionId: string, labDay: number): Promise<Artifact[]>;
  createArtifact(artifact: InsertArtifact): Promise<Artifact>;
  
  // Quiz operations
  getQuizzes(): Promise<Quiz[]>;
  getQuizBySlug(slug: string): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  
  // Question operations
  getQuestionsByQuizId(quizId: string): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  
  // Choice operations
  getChoicesByQuestionId(questionId: string): Promise<Choice[]>;
  createChoice(choice: InsertChoice): Promise<Choice>;
  
  // Quiz attempt operations
  getQuizAttempts(sessionId: string): Promise<QuizAttempt[]>;
  getQuizAttemptsByQuizId(sessionId: string, quizId: string): Promise<QuizAttempt[]>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  updateQuizAttempt(id: string, updates: Partial<QuizAttempt>): Promise<QuizAttempt>;
  
  // Quiz answer operations
  getQuizAnswersByAttemptId(attemptId: string): Promise<QuizAnswer[]>;
  createQuizAnswer(answer: InsertQuizAnswer): Promise<QuizAnswer>;
  
  // Competency area operations
  getCompetencyAreas(): Promise<CompetencyArea[]>;
  getCompetencyArea(id: string): Promise<CompetencyArea | undefined>;
  getCompetencyAreaBySlug(slug: string): Promise<CompetencyArea | undefined>;
  createCompetencyArea(area: InsertCompetencyArea): Promise<CompetencyArea>;
  
  // Study progress operations
  getStudyProgress(sessionId: string): Promise<StudyProgress[]>;
  getStudyProgressByCompetency(sessionId: string, competencyAreaId: string): Promise<StudyProgress | undefined>;
  updateStudyProgress(progress: InsertStudyProgress): Promise<StudyProgress>;
  
  // Exam analytics operations
  getExamAnalytics(attemptId: string): Promise<ExamAnalytics[]>;
  createExamAnalytics(analytics: InsertExamAnalytics): Promise<ExamAnalytics>;
  
  // BYOD operations
  getByodSessions(sessionId: string): Promise<ByodSession[]>;
  createByodSession(session: InsertByodSession): Promise<ByodSession>;
  getByodObservations(sessionId: string): Promise<ByodObservation[]>;
  createByodObservation(observation: InsertByodObservation): Promise<ByodObservation>;
  
  // Generated App operations
  getGeneratedApps(sessionId: string): Promise<GeneratedApp[]>;
  getGeneratedApp(appId: string): Promise<GeneratedApp | undefined>;
  createGeneratedApp(app: InsertGeneratedApp): Promise<GeneratedApp>;
  updateGeneratedApp(id: string, updates: Partial<GeneratedApp>): Promise<GeneratedApp>;
  
  // Feature Flag operations
  getFeatureFlags(): Promise<FeatureFlag[]>;
  getFeatureFlag(flagKey: string): Promise<FeatureFlag | undefined>;
  updateFeatureFlag(flagKey: string, isEnabled: boolean, updatedBy?: string): Promise<FeatureFlag>;
  
  // Statistics operations
  getLearnersCount(): Promise<number>;
  
  // Simulator operations
  getSimulatorHistory(sessionId: string): Promise<SimulatorHistory[]>;
  createSimulatorHistory(history: InsertSimulatorHistory): Promise<SimulatorHistory>;
  clearSimulatorHistory(sessionId: string): Promise<void>;
  
  getSimulatorCollections(sessionId: string): Promise<SimulatorCollection[]>;
  createSimulatorCollection(collection: InsertSimulatorCollection): Promise<SimulatorCollection>;
  deleteSimulatorCollection(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private fhirServers: Map<string, FhirServer>;
  private labProgress: Map<string, LabProgress>;
  private bundles: Map<string, Bundle>;
  private artifacts: Map<string, Artifact>;
  private quizzes: Map<string, Quiz>;
  private questions: Map<string, Question>;
  private choices: Map<string, Choice>;
  private quizAttempts: Map<string, QuizAttempt>;
  private quizAnswers: Map<string, QuizAnswer>;
  private byodSessions: Map<string, ByodSession>;
  private byodObservations: Map<string, ByodObservation>;
  private generatedApps: Map<string, GeneratedApp>;
  private featureFlags: Map<string, FeatureFlag>;
  private simulatorHistory: Map<string, SimulatorHistory>;
  private simulatorCollections: Map<string, SimulatorCollection>;
  private competencyAreas: Map<string, CompetencyArea>;
  private studyProgress: Map<string, StudyProgress>;
  private examAnalytics: Map<string, ExamAnalytics>;

  constructor() {
    this.users = new Map();
    this.fhirServers = new Map();
    this.labProgress = new Map();
    this.bundles = new Map();
    this.artifacts = new Map();
    this.quizzes = new Map();
    this.questions = new Map();
    this.choices = new Map();
    this.quizAttempts = new Map();
    this.quizAnswers = new Map();
    this.byodSessions = new Map();
    this.byodObservations = new Map();
    this.generatedApps = new Map();
    this.featureFlags = new Map();
    this.simulatorHistory = new Map();
    this.simulatorCollections = new Map();
    this.competencyAreas = new Map();
    this.studyProgress = new Map();
    this.examAnalytics = new Map();
    
    // Seed with default FHIR servers, quizzes, and feature flags
    this.seedFhirServers();
    this.seedFeatureFlags();
    this.seedCompetencyAreas();
    // Seed quizzes asynchronously (don't await in constructor)
    this.seedQuizzes().catch(console.error);
  }

  private seedFhirServers() {
    const defaultServers: FhirServer[] = [
      {
        id: "local-hapi",
        name: "Local HAPI FHIR Server",
        baseUrl: "http://localhost:8080/fhir",
        description: "Local HAPI FHIR R4 server (Docker)",
        fhirVersion: "R4",
        isPublic: false,
        createdAt: new Date(),
      },
      {
        id: "hapi-public",
        name: "HAPI FHIR Server (Public)",
        baseUrl: "https://hapi.fhir.org/baseR4",
        description: "Public HAPI FHIR R4 test server",
        fhirVersion: "R4",
        isPublic: true,
        createdAt: new Date(),
      },
      {
        id: "medplum-demo",
        name: "Medplum Demo Server",
        baseUrl: "https://api.medplum.com/fhir/R4",
        description: "Medplum demonstration FHIR server",
        fhirVersion: "R4",
        isPublic: true,
        createdAt: new Date(),
      }
    ];

    defaultServers.forEach(server => {
      this.fhirServers.set(server.id, server);
    });
  }

  // Initialize sample data for demo purposes
  async initializeDemoData(demoSessionId: string = "demo-session-123"): Promise<void> {
    // Sample lab progress for all 3 days
    const progressData = [
      { stepName: "server_setup", labDay: 1, completed: true, metadata: { server: "hapi-public" } },
      { stepName: "bundle_upload", labDay: 1, completed: true, metadata: { bundleId: "demo-bundle-1" } },
      { stepName: "csv_export", labDay: 1, completed: true, metadata: { artifactCount: 3 } },
      { stepName: "sql_setup", labDay: 2, completed: true, metadata: { queryCount: 5 } },
      { stepName: "risk_analysis", labDay: 2, completed: true, metadata: { riskScore: 85 } },
      { stepName: "transform_complete", labDay: 2, completed: true, metadata: { transformedRows: 450 } },
      { stepName: "observation_publish", labDay: 3, completed: true, metadata: { observationCount: 12 } },
      { stepName: "api_integration", labDay: 3, completed: true, metadata: { endpointsTested: 8 } },
      { stepName: "dashboard_complete", labDay: 3, completed: true, metadata: { chartsCreated: 6 } }
    ];

    for (const prog of progressData) {
      await this.updateLabProgress({
        sessionId: demoSessionId,
        userId: null,
        stepName: prog.stepName,
        labDay: prog.labDay,
        completed: prog.completed,
        metadata: prog.metadata
      });
    }

    // Sample bundles
    const bundle = await this.createBundle({
      sessionId: demoSessionId,
      userId: null,
      fileName: "synthea_sample_fhir_bundle.json",
      fileSize: 245680,
      resourceCount: 156,
      uploadStatus: "completed",
      fhirServerId: "hapi-public"
    });

    // Sample artifacts
    const artifacts = [
      { name: "patients.csv", type: "csv", labDay: 1, size: 15420 },
      { name: "observations.csv", type: "csv", labDay: 1, size: 89650 },
      { name: "conditions.csv", type: "csv", labDay: 1, size: 12350 },
      { name: "risk_analysis.sql", type: "sql", labDay: 2, size: 2840 },
      { name: "patient_risk_scores.csv", type: "result", labDay: 2, size: 8920 },
      { name: "high_risk_observations.json", type: "fhir", labDay: 3, size: 45680 }
    ];

    for (const art of artifacts) {
      await this.createArtifact({
        sessionId: demoSessionId,
        userId: null,
        name: art.name,
        type: art.type,
        labDay: art.labDay,
        filePath: `/demo/${art.name}`,
        fileSize: art.size,
        metadata: { demo: true }
      });
    }

    // Sample quiz attempts
    const quizzes = await this.getQuizzes();
    for (const quiz of quizzes.slice(0, 3)) { // First 3 quizzes
      const attempt = await this.createQuizAttempt({
        sessionId: demoSessionId,
        userId: null,
        quizId: quiz.id
      });

      // Mark as completed with high score
      await this.updateQuizAttempt(attempt.id, {
        completedAt: new Date(),
        score: Math.floor(Math.random() * 20) + 80, // 80-100%
        totalQuestions: quiz.questionCount || 10,
        correctAnswers: Math.floor((quiz.questionCount || 10) * 0.9) // 90% correct
      });
    }

    // Sample BYOD session
    const byodSession = await this.createByodSession({
      sessionId: demoSessionId,
      userId: null,
      sourceType: "apple-health",
      fileName: "apple_health_export.xml",
      fileSize: 1250000,
      rawData: {
        HealthData: {
          Record: [
            { type: "HKQuantityTypeIdentifierHeartRate", value: "72", unit: "count/min", startDate: "2024-01-15" },
            { type: "HKQuantityTypeIdentifierStepCount", value: "8450", unit: "count", startDate: "2024-01-15" },
            { type: "HKQuantityTypeIdentifierBodyMass", value: "70.5", unit: "kg", startDate: "2024-01-15" }
          ]
        }
      },
      mappings: null
    });

    // Sample BYOD observations
    const observations = [
      { type: "HeartRate", value: "72", unit: "bpm", effectiveDate: new Date("2024-01-15") },
      { type: "Steps", value: "8450", unit: "steps", effectiveDate: new Date("2024-01-15") },
      { type: "Weight", value: "70.5", unit: "kg", effectiveDate: new Date("2024-01-15") }
    ];

    for (const obs of observations) {
      await this.createByodObservation({
        sessionId: byodSession.id,
        fhirId: `demo-obs-${Math.random().toString(36).substr(2, 9)}`,
        observationType: obs.type,
        value: obs.value,
        unit: obs.unit,
        effectiveDate: obs.effectiveDate,
        fhirServerId: "hapi-public"
      });
    }

    // Sample generated apps
    const apps = [
      {
        name: "My Health Dashboard",
        type: "dashboard",
        config: {
          theme: "light" as const,
          layout: "grid" as const,
          charts: [
            { type: "line" as const, metric: "HeartRate", title: "Heart Rate Trends" },
            { type: "bar" as const, metric: "Steps", title: "Daily Steps" },
            { type: "area" as const, metric: "Weight", title: "Weight Progress" }
          ],
          features: ["export", "share", "filters"]
        }
      },
      {
        name: "Activity Trends",
        type: "trends",
        config: {
          theme: "dark" as const,
          layout: "single" as const,
          charts: [
            { type: "area" as const, metric: "Steps", title: "Step Count Trend", timeRange: "90d" }
          ],
          features: ["trendlines", "predictions"]
        }
      }
    ];

    for (const app of apps) {
      await this.createGeneratedApp({
        sessionId: demoSessionId,
        userId: null,
        byodSessionId: byodSession.id,
        appName: app.name,
        appType: app.type,
        config: app.config
      });
    }

    console.log(`✅ Demo data initialized for session: ${demoSessionId}`);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getFhirServers(): Promise<FhirServer[]> {
    return Array.from(this.fhirServers.values());
  }

  async getFhirServer(id: string): Promise<FhirServer | undefined> {
    return this.fhirServers.get(id);
  }

  async createFhirServer(insertServer: InsertFhirServer): Promise<FhirServer> {
    const id = randomUUID();
    const server: FhirServer = { 
      ...insertServer, 
      id, 
      createdAt: new Date() 
    };
    this.fhirServers.set(id, server);
    return server;
  }

  async getLabProgress(sessionId: string): Promise<LabProgress[]> {
    return Array.from(this.labProgress.values()).filter(
      (progress) => progress.sessionId === sessionId
    );
  }

  async getLabProgressByDay(sessionId: string, labDay: number): Promise<LabProgress[]> {
    return Array.from(this.labProgress.values()).filter(
      (progress) => progress.sessionId === sessionId && progress.labDay === labDay
    );
  }

  async updateLabProgress(insertProgress: InsertLabProgress): Promise<LabProgress> {
    // Find existing progress or create new
    const existing = Array.from(this.labProgress.values()).find(
      (p) => p.sessionId === insertProgress.sessionId && 
             p.labDay === insertProgress.labDay && 
             p.stepName === insertProgress.stepName
    );

    if (existing) {
      const updated: LabProgress = {
        ...existing,
        completed: insertProgress.completed,
        completedAt: insertProgress.completed ? new Date() : existing.completedAt,
        metadata: insertProgress.metadata || existing.metadata,
      };
      this.labProgress.set(existing.id, updated);
      return updated;
    } else {
      const id = randomUUID();
      const progress: LabProgress = {
        ...insertProgress,
        id,
        userId: insertProgress.userId || null,
        completedAt: insertProgress.completed ? new Date() : null,
      };
      this.labProgress.set(id, progress);
      return progress;
    }
  }

  async resetLabProgress(sessionId: string): Promise<void> {
    const toDelete = Array.from(this.labProgress.entries()).filter(
      ([_, progress]) => progress.sessionId === sessionId
    );
    toDelete.forEach(([id]) => this.labProgress.delete(id));
  }

  async getBundles(sessionId: string): Promise<Bundle[]> {
    return Array.from(this.bundles.values()).filter(
      (bundle) => bundle.sessionId === sessionId
    );
  }

  async createBundle(insertBundle: InsertBundle): Promise<Bundle> {
    const id = randomUUID();
    const bundle: Bundle = { 
      ...insertBundle, 
      id, 
      uploadedAt: new Date() 
    };
    this.bundles.set(id, bundle);
    return bundle;
  }

  async getArtifacts(sessionId: string): Promise<Artifact[]> {
    return Array.from(this.artifacts.values()).filter(
      (artifact) => artifact.sessionId === sessionId
    );
  }

  async getArtifactsByDay(sessionId: string, labDay: number): Promise<Artifact[]> {
    return Array.from(this.artifacts.values()).filter(
      (artifact) => artifact.sessionId === sessionId && artifact.labDay === labDay
    );
  }

  async createArtifact(insertArtifact: InsertArtifact): Promise<Artifact> {
    const id = randomUUID();
    const artifact: Artifact = { 
      ...insertArtifact, 
      id, 
      createdAt: new Date() 
    };
    this.artifacts.set(id, artifact);
    return artifact;
  }

  private async seedQuizzes() {
    // Load quiz banks from JSON files
    try {
      const { loadQuizBanks } = await import('./quiz/loader');
      await loadQuizBanks();
    } catch (error) {
      console.error('Error loading quiz banks:', error);
    }
  }

  // Quiz operations
  async getQuizzes(): Promise<Quiz[]> {
    return Array.from(this.quizzes.values());
  }

  async getQuizBySlug(slug: string): Promise<Quiz | undefined> {
    return Array.from(this.quizzes.values()).find(quiz => quiz.slug === slug);
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const id = randomUUID();
    const quiz: Quiz = {
      ...insertQuiz,
      id,
      createdAt: new Date()
    };
    this.quizzes.set(id, quiz);
    return quiz;
  }

  // Question operations
  async getQuestionsByQuizId(quizId: string): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(q => q.quizId === quizId);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const question: Question = {
      ...insertQuestion,
      id
    };
    this.questions.set(id, question);
    return question;
  }

  // Choice operations
  async getChoicesByQuestionId(questionId: string): Promise<Choice[]> {
    return Array.from(this.choices.values()).filter(c => c.questionId === questionId);
  }

  async createChoice(insertChoice: InsertChoice): Promise<Choice> {
    const id = randomUUID();
    const choice: Choice = {
      ...insertChoice,
      id
    };
    this.choices.set(id, choice);
    return choice;
  }

  // Quiz attempt operations
  async getQuizAttempts(sessionId: string): Promise<QuizAttempt[]> {
    return Array.from(this.quizAttempts.values()).filter(
      attempt => attempt.sessionId === sessionId
    );
  }

  async getQuizAttemptsByQuizId(sessionId: string, quizId: string): Promise<QuizAttempt[]> {
    return Array.from(this.quizAttempts.values()).filter(
      attempt => attempt.sessionId === sessionId && attempt.quizId === quizId
    );
  }

  async createQuizAttempt(insertAttempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const id = randomUUID();
    const attempt: QuizAttempt = {
      ...insertAttempt,
      id,
      startedAt: new Date(),
      completedAt: null
    };
    this.quizAttempts.set(id, attempt);
    return attempt;
  }

  async updateQuizAttempt(id: string, updates: Partial<QuizAttempt>): Promise<QuizAttempt> {
    const existing = this.quizAttempts.get(id);
    if (!existing) {
      throw new Error(`Quiz attempt ${id} not found`);
    }
    const updated = { ...existing, ...updates };
    this.quizAttempts.set(id, updated);
    return updated;
  }

  // Quiz answer operations
  async getQuizAnswersByAttemptId(attemptId: string): Promise<QuizAnswer[]> {
    return Array.from(this.quizAnswers.values()).filter(
      answer => answer.attemptId === attemptId
    );
  }

  async createQuizAnswer(insertAnswer: InsertQuizAnswer): Promise<QuizAnswer> {
    const id = randomUUID();
    const answer: QuizAnswer = {
      ...insertAnswer,
      id
    };
    this.quizAnswers.set(id, answer);
    return answer;
  }

  // BYOD operations
  async getByodSessions(sessionId: string): Promise<ByodSession[]> {
    return Array.from(this.byodSessions.values()).filter(
      session => session.sessionId === sessionId
    );
  }

  async createByodSession(insertSession: InsertByodSession): Promise<ByodSession> {
    const id = randomUUID();
    const session: ByodSession = {
      ...insertSession,
      id,
      createdAt: new Date()
    };
    this.byodSessions.set(id, session);
    return session;
  }

  async getByodObservations(sessionId: string): Promise<ByodObservation[]> {
    return Array.from(this.byodObservations.values()).filter(
      obs => obs.sessionId === sessionId
    );
  }

  async createByodObservation(insertObservation: InsertByodObservation): Promise<ByodObservation> {
    const id = randomUUID();
    const observation: ByodObservation = {
      ...insertObservation,
      id,
      createdAt: new Date()
    };
    this.byodObservations.set(id, observation);
    return observation;
  }

  // Generated App operations
  async getGeneratedApps(sessionId: string): Promise<GeneratedApp[]> {
    return Array.from(this.generatedApps.values()).filter(
      app => app.sessionId === sessionId
    );
  }

  async getGeneratedApp(appId: string): Promise<GeneratedApp | undefined> {
    return this.generatedApps.get(appId);
  }

  async createGeneratedApp(insertApp: InsertGeneratedApp): Promise<GeneratedApp> {
    const id = randomUUID();
    const app: GeneratedApp = {
      ...insertApp,
      id,
      createdAt: new Date(),
      lastAccessed: new Date()
    };
    this.generatedApps.set(id, app);
    return app;
  }

  async updateGeneratedApp(id: string, updates: Partial<GeneratedApp>): Promise<GeneratedApp> {
    const app = this.generatedApps.get(id);
    if (!app) {
      throw new Error(`Generated app with id ${id} not found`);
    }
    const updatedApp = { ...app, ...updates, lastAccessed: new Date() };
    this.generatedApps.set(id, updatedApp);
    return updatedApp;
  }

  private seedFeatureFlags() {
    const defaultFlags: FeatureFlag[] = [
      {
        id: randomUUID(),
        flagKey: "enableDemo",
        flagName: "Demo Mode",
        description: "Enable demo mode with simulated lab experiences",
        isEnabled: true,
        updatedAt: new Date(),
        updatedBy: null,
      },
      {
        id: randomUUID(),
        flagKey: "enableBYOD",
        flagName: "Bring Your Own Data",
        description: "Enable BYOD functionality for personal health data",
        isEnabled: true,
        updatedAt: new Date(),
        updatedBy: null,
      },
      {
        id: randomUUID(),
        flagKey: "enableDeepDive",
        flagName: "Deep Dive Sessions",
        description: "Enable advanced deep dive learning modules",
        isEnabled: false,
        updatedAt: new Date(),
        updatedBy: null,
      },
      {
        id: randomUUID(),
        flagKey: "enableCertificates",
        flagName: "Certificate Generation",
        description: "Enable certificate generation upon course completion",
        isEnabled: false,
        updatedAt: new Date(),
        updatedBy: null,
      },
    ];

    defaultFlags.forEach(flag => {
      this.featureFlags.set(flag.flagKey, flag);
    });
  }

  private seedCompetencyAreas() {
    const competencyAreas: CompetencyArea[] = [
      {
        id: randomUUID(),
        slug: "implementation-guides",
        name: "Understanding Implementation Guides",
        description: "Select profiles and implementation guides based on use cases, understand scope and relationships",
        minPercentage: 4,
        maxPercentage: 8,
        order: 1,
      },
      {
        id: randomUUID(),
        slug: "api-behavior",
        name: "FHIR API Behavior",
        description: "Exchange paradigms, RESTful methods, operations, capability statements, bundles, safety and security",
        minPercentage: 19,
        maxPercentage: 33,
        order: 2,
      },
      {
        id: randomUUID(),
        slug: "resource-model",
        name: "Resource Model and Structure",
        description: "Resource selection, element suitability, search parameters, extensions, and terminology",
        minPercentage: 25,
        maxPercentage: 33,
        order: 3,
      },
      {
        id: randomUUID(),
        slug: "implementation",
        name: "Implementation",
        description: "Using extensions, elements, search parameters, operations, and terminology in practice",
        minPercentage: 19,
        maxPercentage: 29,
        order: 4,
      },
      {
        id: randomUUID(),
        slug: "troubleshooting",
        name: "Troubleshooting and Validation",
        description: "Validation errors, REST API server errors, and profile rule application",
        minPercentage: 13,
        maxPercentage: 19,
        order: 5,
      },
    ];

    competencyAreas.forEach(area => {
      this.competencyAreas.set(area.id, area);
    });
  }

  async getFeatureFlags(): Promise<FeatureFlag[]> {
    return Array.from(this.featureFlags.values());
  }

  async getFeatureFlag(flagKey: string): Promise<FeatureFlag | undefined> {
    return this.featureFlags.get(flagKey);
  }

  async updateFeatureFlag(flagKey: string, isEnabled: boolean, updatedBy?: string): Promise<FeatureFlag> {
    const existingFlag = this.featureFlags.get(flagKey);
    if (!existingFlag) {
      throw new Error(`Feature flag with key ${flagKey} not found`);
    }
    
    const updatedFlag = {
      ...existingFlag,
      isEnabled,
      updatedAt: new Date(),
      updatedBy: updatedBy || null,
    };
    
    this.featureFlags.set(flagKey, updatedFlag);
    return updatedFlag;
  }
  
  async getLearnersCount(): Promise<number> {
    // In a real database, this would count unique learners from enrollments/purchases
    // For now, return a realistic demo count based on existing sessions and some baseline
    const sessions = this.labProgress.size;
    const baseCount = 2800; // Baseline learners
    return baseCount + sessions;
  }

  // Simulator History operations
  async getSimulatorHistory(sessionId: string): Promise<SimulatorHistory[]> {
    return Array.from(this.simulatorHistory.values())
      .filter(h => h.sessionId === sessionId || h.userId === sessionId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createSimulatorHistory(history: InsertSimulatorHistory): Promise<SimulatorHistory> {
    const newHistory: SimulatorHistory = {
      id: randomUUID(),
      ...history,
      createdAt: new Date(),
    };
    this.simulatorHistory.set(newHistory.id, newHistory);
    return newHistory;
  }

  async clearSimulatorHistory(sessionId: string): Promise<void> {
    for (const [id, history] of this.simulatorHistory.entries()) {
      if (history.sessionId === sessionId || history.userId === sessionId) {
        this.simulatorHistory.delete(id);
      }
    }
  }

  // Simulator Collections operations
  async getSimulatorCollections(sessionId: string): Promise<SimulatorCollection[]> {
    return Array.from(this.simulatorCollections.values())
      .filter(c => c.sessionId === sessionId || c.userId === sessionId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async createSimulatorCollection(collection: InsertSimulatorCollection): Promise<SimulatorCollection> {
    const newCollection: SimulatorCollection = {
      id: randomUUID(),
      ...collection,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.simulatorCollections.set(newCollection.id, newCollection);
    return newCollection;
  }

  async deleteSimulatorCollection(id: string): Promise<void> {
    this.simulatorCollections.delete(id);
  }

  // Competency area operations
  async getCompetencyAreas(): Promise<CompetencyArea[]> {
    return Array.from(this.competencyAreas.values()).sort((a, b) => a.order - b.order);
  }

  async getCompetencyArea(id: string): Promise<CompetencyArea | undefined> {
    return this.competencyAreas.get(id);
  }

  async getCompetencyAreaBySlug(slug: string): Promise<CompetencyArea | undefined> {
    return Array.from(this.competencyAreas.values()).find(area => area.slug === slug);
  }

  async createCompetencyArea(insertArea: InsertCompetencyArea): Promise<CompetencyArea> {
    const id = randomUUID();
    const area: CompetencyArea = {
      ...insertArea,
      id,
    };
    this.competencyAreas.set(id, area);
    return area;
  }

  // Study progress operations
  async getStudyProgress(sessionId: string): Promise<StudyProgress[]> {
    return Array.from(this.studyProgress.values())
      .filter(p => p.sessionId === sessionId || p.userId === sessionId);
  }

  async getStudyProgressByCompetency(sessionId: string, competencyAreaId: string): Promise<StudyProgress | undefined> {
    return Array.from(this.studyProgress.values())
      .find(p => (p.sessionId === sessionId || p.userId === sessionId) && p.competencyAreaId === competencyAreaId);
  }

  async updateStudyProgress(insertProgress: InsertStudyProgress): Promise<StudyProgress> {
    // Find existing progress or create new
    const existing = await this.getStudyProgressByCompetency(
      insertProgress.sessionId || insertProgress.userId || '',
      insertProgress.competencyAreaId || ''
    );

    if (existing) {
      const updated: StudyProgress = {
        ...existing,
        ...insertProgress,
        lastStudiedAt: new Date(),
      };
      this.studyProgress.set(existing.id, updated);
      return updated;
    } else {
      const id = randomUUID();
      const progress: StudyProgress = {
        ...insertProgress,
        id,
        createdAt: new Date(),
        lastStudiedAt: new Date(),
      };
      this.studyProgress.set(id, progress);
      return progress;
    }
  }

  // Exam analytics operations
  async getExamAnalytics(attemptId: string): Promise<ExamAnalytics[]> {
    return Array.from(this.examAnalytics.values())
      .filter(a => a.attemptId === attemptId);
  }

  async createExamAnalytics(insertAnalytics: InsertExamAnalytics): Promise<ExamAnalytics> {
    const id = randomUUID();
    const analytics: ExamAnalytics = {
      ...insertAnalytics,
      id,
    };
    this.examAnalytics.set(id, analytics);
    return analytics;
  }
}

export const storage = new MemStorage();
