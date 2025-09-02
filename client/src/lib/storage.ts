import type { LabProgress } from "@shared/schema";

const STORAGE_KEYS = {
  SELECTED_SERVER: 'fhir-bootcamp-selected-server',
  SELECTED_PATIENT: 'fhir-bootcamp-selected-patient',
  LAB_PROGRESS: 'fhir-bootcamp-lab-progress',
} as const;

// Local storage helpers
export function getSelectedServer(): string | null {
  return localStorage.getItem(STORAGE_KEYS.SELECTED_SERVER);
}

export function setSelectedServer(serverId: string): void {
  localStorage.setItem(STORAGE_KEYS.SELECTED_SERVER, serverId);
}

export function getSelectedPatient(): string | null {
  return localStorage.getItem(STORAGE_KEYS.SELECTED_PATIENT);
}

export function setSelectedPatient(patientId: string): void {
  localStorage.setItem(STORAGE_KEYS.SELECTED_PATIENT, patientId);
}

// Progress tracking helpers
export function getLocalProgress(): Record<string, boolean> {
  const stored = localStorage.getItem(STORAGE_KEYS.LAB_PROGRESS);
  return stored ? JSON.parse(stored) : {};
}

export function setLocalProgress(stepKey: string, completed: boolean): void {
  const current = getLocalProgress();
  current[stepKey] = completed;
  localStorage.setItem(STORAGE_KEYS.LAB_PROGRESS, JSON.stringify(current));
}

export function resetLocalProgress(): void {
  localStorage.removeItem(STORAGE_KEYS.LAB_PROGRESS);
}

// Lab step keys
export const LAB_STEPS = {
  DAY1_SERVER_SETUP: 'day1_server_setup',
  DAY1_BUNDLE_UPLOAD: 'day1_bundle_upload',
  DAY1_CSV_EXPORT: 'day1_csv_export',
  DAY2_STAGING_TABLES: 'day2_staging_tables',
  DAY2_RISK_CALCULATION: 'day2_risk_calculation',
  DAY2_READMISSION_FLAG: 'day2_readmission_flag',
  DAY3_OBSERVATION_CREATE: 'day3_observation_create',
  DAY3_RESOURCE_LINK: 'day3_resource_link',
  DAY3_VALIDATION: 'day3_validation',
} as const;

export type LabStepKey = typeof LAB_STEPS[keyof typeof LAB_STEPS];
