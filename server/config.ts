// Configuration for FHIR server settings
export const config = {
  // Use local FHIR server instead of public servers
  USE_LOCAL_FHIR: process.env.USE_LOCAL_FHIR === 'true',
  
  // Local FHIR server URL
  LOCAL_FHIR_URL: process.env.LOCAL_FHIR_URL || 'http://localhost:8080/fhir',
  
  // Fallback public FHIR server URL
  FHIR_BASE_URL: process.env.FHIR_BASE_URL || 'https://hapi.fhir.org/baseR4',
};

/**
 * FHIR client factory that resolves the active base URL
 * @param userSelectedUrl - The URL selected by the user from the frontend
 * @returns The active FHIR base URL to use
 */
export function getActiveFhirBaseUrl(userSelectedUrl?: string): string {
  // If USE_LOCAL_FHIR is true, always use local server
  if (config.USE_LOCAL_FHIR) {
    return config.LOCAL_FHIR_URL;
  }
  
  // Otherwise use user-selected server, falling back to default
  return userSelectedUrl || config.FHIR_BASE_URL;
}

/**
 * Get the currently active FHIR base URL based on configuration
 * @returns The active FHIR base URL
 */
export function getCurrentFhirBaseUrl(): string {
  return config.USE_LOCAL_FHIR ? config.LOCAL_FHIR_URL : config.FHIR_BASE_URL;
}