import fs from 'fs/promises';
import path from 'path';

// Configuration for FHIR server settings
export const config = {
  // Use local FHIR server instead of public servers
  USE_LOCAL_FHIR: process.env.USE_LOCAL_FHIR === 'true',
  
  // Local FHIR server URL
  LOCAL_FHIR_URL: process.env.LOCAL_FHIR_URL || 'http://localhost:8080/fhir',
  
  // Fallback public FHIR server URL
  FHIR_BASE_URL: process.env.FHIR_BASE_URL || 'https://hapi.fhir.org/baseR4',
};

// File-backed persistence for local FHIR preference
const CONFIG_FILE = path.join(process.cwd(), '.local-fhir-config.json');

// Load persisted configuration on startup
export async function loadPersistedConfig(): Promise<void> {
  try {
    const configData = await fs.readFile(CONFIG_FILE, 'utf-8');
    const persistedConfig = JSON.parse(configData);
    if (typeof persistedConfig.useLocalFhir === 'boolean') {
      config.USE_LOCAL_FHIR = persistedConfig.useLocalFhir;
      process.env.USE_LOCAL_FHIR = persistedConfig.useLocalFhir ? 'true' : 'false';
      console.log(`📁 Loaded persisted config: USE_LOCAL_FHIR=${config.USE_LOCAL_FHIR}`);
    }
  } catch (error) {
    // File doesn't exist or is invalid, use environment defaults
    console.log('📁 No persisted config found, using environment defaults');
  }
}

// Persist configuration to file
export async function persistConfig(useLocalFhir: boolean): Promise<void> {
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify({ useLocalFhir }, null, 2));
    console.log(`💾 Persisted config: useLocalFhir=${useLocalFhir}`);
  } catch (error) {
    console.error('❌ Failed to persist config:', error);
  }
}

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

/**
 * Check local FHIR server health
 * @returns Health check result with status and timing
 */
export async function checkLocalFhirHealth(): Promise<{ ok: boolean; status: number; elapsedMs: number; error?: string }> {
  const start = Date.now();
  
  try {
    const response = await fetch(`${config.LOCAL_FHIR_URL}/metadata`, {
      method: 'GET',
      headers: {
        'Accept': 'application/fhir+json',
      },
    });
    
    const elapsedMs = Date.now() - start;
    
    return {
      ok: response.ok,
      status: response.status,
      elapsedMs,
    };
  } catch (error) {
    const elapsedMs = Date.now() - start;
    return {
      ok: false,
      status: 0,
      elapsedMs,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Background health monitoring with exponential backoff
 * Waits up to ~2 minutes for local FHIR server to become available
 */
export async function waitForLocalFhirHealth(): Promise<void> {
  if (!config.USE_LOCAL_FHIR) {
    return;
  }

  console.log('🔍 Waiting for local FHIR server to become available...');
  
  const maxAttempts = 8; // ~2 minutes with exponential backoff
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    const health = await checkLocalFhirHealth();
    
    if (health.ok) {
      console.log(`✅ Local FHIR server is available (${health.elapsedMs}ms)`);
      return;
    }
    
    attempt++;
    const backoffMs = Math.min(1000 * Math.pow(2, attempt), 30000); // Cap at 30 seconds
    
    console.log(`⏳ Local FHIR server not ready (attempt ${attempt}/${maxAttempts}), retrying in ${backoffMs}ms...`);
    
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
  
  console.log('⚠️ Local FHIR server did not become available within timeout period');
}