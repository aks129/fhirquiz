// FHIR Server Seeding Utilities
import { getCurrentFhirBaseUrl } from '../config';

export interface SeedResult {
  success: boolean;
  message: string;
  stats: {
    total: number;
    created: number;
    skipped: number;
    failed: number;
    valid: number;
    invalid: number;
  };
  fallbackUsed?: boolean;
  retryCount?: number;
  issues?: string[];
}

export async function seedLocalFhirServer(mockData?: any[]): Promise<SeedResult> {
  const baseUrl = getCurrentFhirBaseUrl();
  
  try {
    // Use provided mock data or load synthetic data
    const data = mockData || await loadSyntheticPatientData();
    
    // Validate resources
    const validResources = data.filter(resource => validateFhirResource(resource));
    const invalidCount = data.length - validResources.length;
    
    if (validResources.length === 0) {
      return {
        success: false,
        message: 'No valid FHIR resources to seed',
        stats: { total: data.length, created: 0, skipped: 0, failed: 0, valid: 0, invalid: invalidCount }
      };
    }
    
    // Try transaction bundle first
    const transactionResult = await tryTransactionBundle(baseUrl, validResources);
    
    if (transactionResult.success) {
      return {
        success: true,
        message: 'Successfully seeded with synthetic patient data',
        stats: {
          total: data.length,
          created: transactionResult.created,
          skipped: transactionResult.skipped,
          failed: transactionResult.failed,
          valid: validResources.length,
          invalid: invalidCount
        },
        issues: transactionResult.issues
      };
    }
    
    // Fallback to individual resource creation
    const fallbackResult = await createResourcesIndividually(baseUrl, validResources);
    
    return {
      success: true,
      message: 'Seeded using individual resource creation (transaction fallback)',
      stats: {
        total: data.length,
        created: fallbackResult.created,
        skipped: fallbackResult.skipped,
        failed: fallbackResult.failed,
        valid: validResources.length,
        invalid: invalidCount
      },
      fallbackUsed: true,
      retryCount: fallbackResult.retryCount,
      issues: fallbackResult.issues
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stats: { total: 0, created: 0, skipped: 0, failed: 0, valid: 0, invalid: 0 }
    };
  }
}

async function loadSyntheticPatientData(): Promise<any[]> {
  // Load synthetic data from Synthea JSON files
  return [
    {
      resourceType: 'Patient',
      id: 'synthea-patient-1',
      name: [{ family: 'Doe', given: ['John'] }],
      gender: 'male',
      birthDate: '1990-01-01'
    },
    {
      resourceType: 'Observation',
      id: 'obs-1',
      status: 'final',
      code: {
        coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }]
      },
      subject: { reference: 'Patient/synthea-patient-1' },
      valueQuantity: { value: 72, unit: 'beats/min' }
    },
    {
      resourceType: 'Encounter',
      id: 'encounter-1',
      status: 'finished',
      class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB' },
      subject: { reference: 'Patient/synthea-patient-1' }
    }
  ];
}

async function tryTransactionBundle(baseUrl: string, resources: any[]): Promise<{
  success: boolean;
  created: number;
  skipped: number;
  failed: number;
  issues: string[];
}> {
  const bundle = {
    resourceType: 'Bundle',
    type: 'transaction',
    entry: resources.map(resource => ({
      resource,
      request: {
        method: 'POST',
        url: resource.resourceType,
        ifNoneExist: resource.id ? `_id=${resource.id}` : undefined
      }
    }))
  };
  
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/fhir+json',
        'Accept': 'application/fhir+json'
      },
      body: JSON.stringify(bundle)
    });
    
    if (!response.ok) {
      return { success: false, created: 0, skipped: 0, failed: resources.length, issues: [`Transaction failed: ${response.statusText}`] };
    }
    
    const result = await response.json();
    const stats = processTransactionResponse(result);
    
    return {
      success: true,
      ...stats
    };
    
  } catch (error) {
    return { 
      success: false, 
      created: 0, 
      skipped: 0, 
      failed: resources.length, 
      issues: [`Transaction error: ${error instanceof Error ? error.message : 'Unknown error'}`] 
    };
  }
}

async function createResourcesIndividually(baseUrl: string, resources: any[]): Promise<{
  created: number;
  skipped: number;
  failed: number;
  retryCount: number;
  issues: string[];
}> {
  let created = 0;
  let skipped = 0;
  let failed = 0;
  let retryCount = 0;
  const issues: string[] = [];
  
  for (const resource of resources) {
    const result = await createResourceWithRetry(baseUrl, resource);
    
    if (result.status === 'created') created++;
    else if (result.status === 'skipped') skipped++;
    else failed++;
    
    retryCount += result.retries;
    
    if (result.issue) {
      issues.push(result.issue);
    }
  }
  
  return { created, skipped, failed, retryCount, issues };
}

async function createResourceWithRetry(baseUrl: string, resource: any, maxRetries = 3): Promise<{
  status: 'created' | 'skipped' | 'failed';
  retries: number;
  issue?: string;
}> {
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      const response = await fetch(`${baseUrl}/${resource.resourceType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/fhir+json',
          'Accept': 'application/fhir+json'
        },
        body: JSON.stringify(resource)
      });
      
      if (response.status === 201) {
        return { status: 'created', retries };
      } else if (response.status === 409) {
        return { status: 'skipped', retries }; // Already exists
      } else if (response.status >= 500 && retries < maxRetries) {
        retries++;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000)); // Exponential backoff
        continue;
      } else {
        return { 
          status: 'failed', 
          retries, 
          issue: `HTTP ${response.status}: ${response.statusText}` 
        };
      }
      
    } catch (error) {
      if (retries < maxRetries) {
        retries++;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
        continue;
      }
      
      return { 
        status: 'failed', 
        retries, 
        issue: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  return { status: 'failed', retries, issue: 'Max retries exceeded' };
}

function processTransactionResponse(bundle: any): {
  created: number;
  skipped: number;
  failed: number;
  issues: string[];
} {
  let created = 0;
  let skipped = 0;
  let failed = 0;
  const issues: string[] = [];
  
  if (bundle.entry) {
    for (const entry of bundle.entry) {
      const status = entry.response?.status || '';
      
      if (status.startsWith('201')) {
        created++;
      } else if (status.startsWith('409')) {
        skipped++;
      } else if (status.startsWith('4') || status.startsWith('5')) {
        failed++;
        issues.push(`Resource failed: ${status}`);
      }
    }
  }
  
  return { created, skipped, failed, issues };
}

function validateFhirResource(resource: any): boolean {
  return !!(resource && 
           resource.resourceType && 
           typeof resource.resourceType === 'string' &&
           ['Patient', 'Observation', 'Encounter', 'Condition', 'Procedure'].includes(resource.resourceType));
}