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
