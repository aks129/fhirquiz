import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (existing)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// FHIR Server configurations
export const fhirServers = pgTable("fhir_servers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  baseUrl: text("base_url").notNull(),
  description: text("description"),
  fhirVersion: text("fhir_version").default("R4"),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lab progress tracking
export const labProgress = pgTable("lab_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: text("session_id"), // For anonymous users
  labDay: integer("lab_day").notNull(), // 1, 2, or 3
  stepName: text("step_name").notNull(),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata"), // Store additional step data
});

// Uploaded bundles tracking
export const bundles = pgTable("bundles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: text("session_id"),
  fileName: text("file_name").notNull(),
  bundleType: text("bundle_type").default("transaction"),
  resourceCount: integer("resource_count"),
  fhirServerId: varchar("fhir_server_id").references(() => fhirServers.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  metadata: jsonb("metadata"),
});

// Lab artifacts (CSV exports, generated observations, etc.)
export const artifacts = pgTable("artifacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: text("session_id"),
  artifactType: text("artifact_type").notNull(), // 'csv_export', 'observation', 'transform_result'
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  labDay: integer("lab_day"),
  createdAt: timestamp("created_at").defaultNow(),
  metadata: jsonb("metadata"),
});

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFhirServerSchema = createInsertSchema(fhirServers).omit({
  id: true,
  createdAt: true,
});

export const insertLabProgressSchema = createInsertSchema(labProgress).omit({
  id: true,
  completedAt: true,
});

export const insertBundleSchema = createInsertSchema(bundles).omit({
  id: true,
  uploadedAt: true,
});

export const insertArtifactSchema = createInsertSchema(artifacts).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type FhirServer = typeof fhirServers.$inferSelect;
export type InsertFhirServer = z.infer<typeof insertFhirServerSchema>;

export type LabProgress = typeof labProgress.$inferSelect;
export type InsertLabProgress = z.infer<typeof insertLabProgressSchema>;

export type Bundle = typeof bundles.$inferSelect;
export type InsertBundle = z.infer<typeof insertBundleSchema>;

export type Artifact = typeof artifacts.$inferSelect;
export type InsertArtifact = z.infer<typeof insertArtifactSchema>;

// FHIR Resource Types (shared between frontend and backend)
export interface FhirPatient {
  resourceType: "Patient";
  id?: string;
  identifier?: Array<{
    system?: string;
    value?: string;
  }>;
  name?: Array<{
    given?: string[];
    family?: string;
  }>;
  gender?: "male" | "female" | "other" | "unknown";
  birthDate?: string;
}

export interface FhirObservation {
  resourceType: "Observation";
  id?: string;
  status: "final" | "preliminary" | "registered" | "cancelled";
  code: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  subject: {
    reference: string;
  };
  encounter?: {
    reference: string;
  };
  valueQuantity?: {
    value: number;
    unit?: string;
    system?: string;
    code?: string;
  };
  valueString?: string;
  effectiveDateTime?: string;
}

export interface FhirEncounter {
  resourceType: "Encounter";
  id?: string;
  status: "planned" | "arrived" | "triaged" | "in-progress" | "onleave" | "finished" | "cancelled";
  class: {
    system?: string;
    code?: string;
    display?: string;
  };
  subject: {
    reference: string;
  };
  period?: {
    start?: string;
    end?: string;
  };
}

export interface FhirBundle {
  resourceType: "Bundle";
  id?: string;
  type: "transaction" | "collection" | "searchset" | "history";
  entry?: Array<{
    resource?: any;
    request?: {
      method: string;
      url: string;
    };
  }>;
}

export interface FhirCapabilityStatement {
  resourceType: "CapabilityStatement";
  fhirVersion?: string;
  format?: string[];
  rest?: Array<{
    mode: string;
    resource?: Array<{
      type: string;
      interaction?: Array<{
        code: string;
      }>;
    }>;
  }>;
}

// API Response types
export interface ServerTestResult {
  success: boolean;
  fhirVersion?: string;
  responseTime: number;
  capabilities?: FhirCapabilityStatement;
  error?: string;
}

export interface BundleUploadResult {
  success: boolean;
  resourcesCreated: number;
  resourceIds: string[];
  errors?: string[];
}

export interface ResourceStats {
  patients: number;
  encounters: number;
  observations: number;
  lastUpdated: string;
}

export interface TransformResult {
  success: boolean;
  recordsProcessed: number;
  outputPath: string;
  riskScores: Array<{
    patientId: string;
    riskScore: number;
    readmissionFlag: boolean;
  }>;
}

// Exam System Tables

// Competency areas for the HL7 FHIR Foundation exam
export const competencyAreas = pgTable("competency_areas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  minPercentage: integer("min_percentage").notNull(), // e.g., 4 for 4%
  maxPercentage: integer("max_percentage").notNull(), // e.g., 8 for 8%
  order: integer("order").default(0),
});

export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  quizType: text("quiz_type").notNull().default("practice"), // practice, exam, study
  competencyAreaId: varchar("competency_area_id").references(() => competencyAreas.id),
  timeLimit: integer("time_limit"), // in minutes
  passingScore: integer("passing_score").default(70), // 70% for foundation exam
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").references(() => quizzes.id),
  competencyAreaId: varchar("competency_area_id").references(() => competencyAreas.id),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull().default("single_choice"), // single_choice, multiple_choice, true_false
  explanation: text("explanation"),
  tags: jsonb("tags"), // array of strings
  difficulty: text("difficulty").default("medium"), // easy, medium, hard
  order: integer("order").default(0),
});

export const choices = pgTable("choices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").references(() => questions.id),
  choiceText: text("choice_text").notNull(),
  isCorrect: boolean("is_correct").default(false),
  order: integer("order").default(0),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: text("session_id"), // For anonymous users
  quizId: varchar("quiz_id").references(() => quizzes.id),
  score: integer("score"), // percentage
  passed: boolean("passed").default(false),
  duration: integer("duration"), // in seconds
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const quizAnswers = pgTable("quiz_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  attemptId: varchar("attempt_id").references(() => quizAttempts.id),
  questionId: varchar("question_id").references(() => questions.id),
  choiceIds: jsonb("choice_ids"), // array of choice IDs for multi-select
  isCorrect: boolean("is_correct").default(false),
  timeSpent: integer("time_spent"), // seconds spent on this question
});

// Study progress tracking by competency area
export const studyProgress = pgTable("study_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: text("session_id"), // For anonymous users
  competencyAreaId: varchar("competency_area_id").references(() => competencyAreas.id),
  studyTimeMinutes: integer("study_time_minutes").default(0),
  practiceQuestionsAttempted: integer("practice_questions_attempted").default(0),
  practiceQuestionsCorrect: integer("practice_questions_correct").default(0),
  masteryLevel: text("mastery_level").default("beginner"), // beginner, intermediate, advanced, mastered
  lastStudiedAt: timestamp("last_studied_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Detailed exam analytics
export const examAnalytics = pgTable("exam_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  attemptId: varchar("attempt_id").references(() => quizAttempts.id),
  competencyAreaId: varchar("competency_area_id").references(() => competencyAreas.id),
  questionsAttempted: integer("questions_attempted").default(0),
  questionsCorrect: integer("questions_correct").default(0),
  averageTimePerQuestion: integer("average_time_per_question"), // seconds
  strengthAreas: jsonb("strength_areas"), // array of tag strings
  weaknessAreas: jsonb("weakness_areas"), // array of tag strings
});

// BYOD System Tables
export const byodSessions = pgTable("byod_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: text("session_id"),
  sourceType: text("source_type").notNull(), // apple-health, google-fit, fitbit, garmin
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  rawData: jsonb("raw_data"), // parsed data before mapping
  mappings: jsonb("mappings"), // FHIR mappings configured
  createdAt: timestamp("created_at").defaultNow(),
});

export const byodObservations = pgTable("byod_observations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => byodSessions.id),
  fhirId: text("fhir_id"), // ID from FHIR server after POST
  observationType: text("observation_type").notNull(),
  value: text("value"),
  unit: text("unit"),
  effectiveDate: timestamp("effective_date"),
  fhirServerId: varchar("fhir_server_id").references(() => fhirServers.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const generatedApps = pgTable("generated_apps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: text("session_id"),
  byodSessionId: varchar("byod_session_id").references(() => byodSessions.id),
  appName: text("app_name").notNull(),
  appType: text("app_type").notNull(), // 'dashboard', 'trends', 'insights', 'custom'
  config: jsonb("config"), // App configuration and layout
  createdAt: timestamp("created_at").defaultNow(),
  lastAccessed: timestamp("last_accessed"),
});

// Insert schemas for exam system
export const insertCompetencyAreaSchema = createInsertSchema(competencyAreas).omit({
  id: true,
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertChoiceSchema = createInsertSchema(choices).omit({
  id: true,
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertQuizAnswerSchema = createInsertSchema(quizAnswers).omit({
  id: true,
});

export const insertStudyProgressSchema = createInsertSchema(studyProgress).omit({
  id: true,
  createdAt: true,
});

export const insertExamAnalyticsSchema = createInsertSchema(examAnalytics).omit({
  id: true,
});

export const insertByodSessionSchema = createInsertSchema(byodSessions).omit({
  id: true,
  createdAt: true,
});

export const insertByodObservationSchema = createInsertSchema(byodObservations).omit({
  id: true,
  createdAt: true,
});

export const insertGeneratedAppSchema = createInsertSchema(generatedApps).omit({
  id: true,
  createdAt: true,
  lastAccessed: true,
});

// Exam system types
export type CompetencyArea = typeof competencyAreas.$inferSelect;
export type InsertCompetencyArea = z.infer<typeof insertCompetencyAreaSchema>;

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type Choice = typeof choices.$inferSelect;
export type InsertChoice = z.infer<typeof insertChoiceSchema>;

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;

export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type InsertQuizAnswer = z.infer<typeof insertQuizAnswerSchema>;

export type StudyProgress = typeof studyProgress.$inferSelect;
export type InsertStudyProgress = z.infer<typeof insertStudyProgressSchema>;

export type ExamAnalytics = typeof examAnalytics.$inferSelect;
export type InsertExamAnalytics = z.infer<typeof insertExamAnalyticsSchema>;

export type ByodSession = typeof byodSessions.$inferSelect;
export type InsertByodSession = z.infer<typeof insertByodSessionSchema>;

export type ByodObservation = typeof byodObservations.$inferSelect;
export type InsertByodObservation = z.infer<typeof insertByodObservationSchema>;

export type GeneratedApp = typeof generatedApps.$inferSelect;
export type InsertGeneratedApp = z.infer<typeof insertGeneratedAppSchema>;

// Quiz-related API types
export interface QuizData {
  quiz: Quiz;
  questions: (Question & { choices: Choice[] })[];
}

export interface QuizSubmission {
  answers: Array<{
    questionId: string;
    choiceId: string;
  }>;
  duration: number;
}

export interface QuizResult {
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  feedback: Array<{
    questionId: string;
    questionText: string;
    selectedChoice: string;
    correctChoice: string;
    isCorrect: boolean;
    explanation: string;
  }>;
}

// Feature Flags Table
export const featureFlags = pgTable("feature_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  flagKey: text("flag_key").notNull().unique(),
  flagName: text("flag_name").notNull(),
  description: text("description"),
  isEnabled: boolean("is_enabled").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({
  id: true,
  updatedAt: true,
});

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;

// FHIR Simulator Tables
export const simulatorHistory = pgTable("simulator_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: text("session_id"), // For anonymous users
  method: text("method").notNull(), // GET, POST, PUT, DELETE
  url: text("url").notNull(),
  path: text("path").notNull(),
  headers: jsonb("headers"), // Request headers
  body: text("body"), // Request body
  responseStatus: integer("response_status"),
  responseHeaders: jsonb("response_headers"),
  responseBody: text("response_body"),
  elapsedMs: integer("elapsed_ms"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const simulatorCollections = pgTable("simulator_collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: text("session_id"), // For anonymous users
  name: text("name").notNull(),
  description: text("description"),
  method: text("method").notNull(),
  path: text("path").notNull(),
  headers: jsonb("headers"),
  body: text("body"),
  tags: jsonb("tags"), // array of strings for categorization
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSimulatorHistorySchema = createInsertSchema(simulatorHistory).omit({
  id: true,
  createdAt: true,
});

export const insertSimulatorCollectionSchema = createInsertSchema(simulatorCollections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SimulatorHistory = typeof simulatorHistory.$inferSelect;
export type InsertSimulatorHistory = z.infer<typeof insertSimulatorHistorySchema>;

export type SimulatorCollection = typeof simulatorCollections.$inferSelect;
export type InsertSimulatorCollection = z.infer<typeof insertSimulatorCollectionSchema>;

// Quiz API types
export interface ExamData {
  quiz: Quiz;
  competencyArea?: CompetencyArea;
  questions: Array<Question & { choices: Choice[] }>;
}

export interface ExamSubmission {
  answers: Array<{
    questionId: string;
    choiceIds: string[]; // array to support multi-select
    timeSpent?: number;
  }>;
  duration: number;
}

export interface ExamResult {
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  competencyBreakdown: Array<{
    competencyAreaId: string;
    competencyName: string;
    questionsAttempted: number;
    questionsCorrect: number;
    percentage: number;
  }>;
  feedback: Array<{
    questionId: string;
    questionText: string;
    selectedChoices: string[];
    correctChoices: string[];
    isCorrect: boolean;
    explanation: string;
    competencyArea: string;
    timeSpent?: number;
  }>;
  studyRecommendations: string[];
}

// Study progress API types
export interface StudyDashboard {
  overallProgress: {
    totalStudyTime: number;
    totalQuestionsAttempted: number;
    overallAccuracy: number;
    readinessLevel: 'not_ready' | 'needs_work' | 'ready' | 'exam_ready';
  };
  competencyProgress: Array<{
    competencyArea: CompetencyArea;
    progress: StudyProgress;
    accuracy: number;
    timeSpent: number;
    masteryLevel: string;
    recommendedActions: string[];
  }>;
}

// BYOD API types
export interface ByodImportResult {
  success: boolean;
  recordCount: number;
  metrics: string[];
  preview: Array<{
    metric: string;
    sampleValues: any[];
    count: number;
    unit?: string;
  }>;
}

export interface ByodMapping {
  metric: string;
  codeSystem: string;
  code: string;
  display: string;
  unit: string;
  category?: string;
}

export interface ByodPublishRequest {
  patientId: string;
  encounterId?: string;
  mappings: ByodMapping[];
  fhirServerId: string;
}

// Mini-app generation types
export interface AppGenerationRequest {
  sessionId: string;
  appName: string;
  appType: 'dashboard' | 'trends' | 'insights' | 'custom';
  metrics: string[];
  config?: any;
}

export interface AppConfig {
  theme: string;
  charts: Array<{
    type: 'line' | 'bar' | 'pie' | 'area';
    metric: string;
    title: string;
    timeRange?: string;
  }>;
  layout: 'single' | 'grid' | 'tabs';
  features: string[];
}
