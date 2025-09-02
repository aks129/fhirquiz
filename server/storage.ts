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
