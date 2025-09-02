import type { FhirBundle, FhirObservation, ServerTestResult, BundleUploadResult, ResourceStats } from "@shared/schema";

const API_BASE = "/api";

// Get session ID from localStorage or generate new one
export function getSessionId(): string {
  let sessionId = localStorage.getItem('fhir-bootcamp-session');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('fhir-bootcamp-session', sessionId);
  }
  return sessionId;
}

// Test FHIR server connectivity
export async function testFhirServer(baseUrl: string): Promise<ServerTestResult> {
  const response = await fetch(`${API_BASE}/fhir/ping`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': getSessionId(),
    },
    body: JSON.stringify({ baseUrl }),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

// Upload FHIR bundle
export async function uploadBundle(bundle: FhirBundle, fhirServerUrl: string, fileName: string): Promise<BundleUploadResult> {
  const response = await fetch(`${API_BASE}/fhir/load-bundle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': getSessionId(),
    },
    body: JSON.stringify({ bundle, fhirServerUrl, fileName }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }
  
  return response.json();
}

// Get resource statistics
export async function getResourceStats(fhirServerUrl: string, patientId?: string): Promise<ResourceStats> {
  const response = await fetch(`${API_BASE}/fhir/stats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': getSessionId(),
    },
    body: JSON.stringify({ fhirServerUrl, patientId }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch statistics');
  }
  
  return response.json();
}

// Export data to CSV
export async function exportResourcesCsv(fhirServerUrl: string, patientId: string, resourceType: string) {
  const response = await fetch(`${API_BASE}/export/flat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': getSessionId(),
    },
    body: JSON.stringify({ fhirServerUrl, patientId, resourceType }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Export failed');
  }
  
  return response.json();
}

// Publish observation
export async function publishObservation(data: {
  patientId: string;
  encounterId?: string;
  code: string;
  display: string;
  value: number;
  unit: string;
  fhirServerUrl: string;
}) {
  const response = await fetch(`${API_BASE}/fhir/publish/observation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': getSessionId(),
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to publish observation');
  }
  
  return response.json();
}
