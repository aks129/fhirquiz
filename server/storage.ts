import { type User, type InsertUser, type FhirServer, type InsertFhirServer, 
         type LabProgress, type InsertLabProgress, type Bundle, type InsertBundle,
         type Artifact, type InsertArtifact } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private fhirServers: Map<string, FhirServer>;
  private labProgress: Map<string, LabProgress>;
  private bundles: Map<string, Bundle>;
  private artifacts: Map<string, Artifact>;

  constructor() {
    this.users = new Map();
    this.fhirServers = new Map();
    this.labProgress = new Map();
    this.bundles = new Map();
    this.artifacts = new Map();
    
    // Seed with default FHIR servers
    this.seedFhirServers();
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
}

export const storage = new MemStorage();
