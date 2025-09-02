import { type User, type InsertUser, type FhirServer, type InsertFhirServer, 
         type LabProgress, type InsertLabProgress, type Bundle, type InsertBundle,
         type Artifact, type InsertArtifact, type Quiz, type InsertQuiz,
         type Question, type InsertQuestion, type Choice, type InsertChoice,
         type QuizAttempt, type InsertQuizAttempt, type QuizAnswer, type InsertQuizAnswer,
         type ByodSession, type InsertByodSession, type ByodObservation, type InsertByodObservation,
         type GeneratedApp, type InsertGeneratedApp } from "@shared/schema";
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
  
  // BYOD operations
  getByodSessions(sessionId: string): Promise<ByodSession[]>;
  createByodSession(session: InsertByodSession): Promise<ByodSession>;
  getByodObservations(sessionId: string): Promise<ByodObservation[]>;
  createByodObservation(observation: InsertByodObservation): Promise<ByodObservation>;
  
  // Generated App operations
  getGeneratedApps(sessionId: string): Promise<GeneratedApp[]>;
  createGeneratedApp(app: InsertGeneratedApp): Promise<GeneratedApp>;
  updateGeneratedApp(id: string, updates: Partial<GeneratedApp>): Promise<GeneratedApp>;
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
    
    // Seed with default FHIR servers and quizzes
    this.seedFhirServers();
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
}

export const storage = new MemStorage();
