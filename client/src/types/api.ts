// Shared API response types for the FHIR Bootcamp application

export interface LabProgress {
  id: string;
  labDay: number;
  stepName: string;
  completed: boolean;
  completedAt?: string;
  metadata?: any;
  userId?: string;
  sessionId?: string;
}

export interface FhirServer {
  id: string;
  name: string;
  baseUrl: string;
  description?: string;
  fhirVersion?: string;
  isPublic?: boolean;
  createdAt?: string;
}

export interface Artifact {
  id: string;
  fileName: string;
  artifactType: string;
  filePath: string;
  labDay?: number;
  createdAt?: string;
  metadata?: any;
  userId?: string;
  sessionId?: string;
}

export interface Bundle {
  id: string;
  fileName: string;
  bundleType?: string;
  resourceCount?: number;
  fhirServerId?: string;
  uploadedAt?: string;
  metadata?: any;
  userId?: string;
  sessionId?: string;
}