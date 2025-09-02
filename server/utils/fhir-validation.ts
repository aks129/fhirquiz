// FHIR Resource Validation Utilities

export function validateFhirResource(resource: any): boolean {
  if (!resource || typeof resource !== 'object') {
    return false;
  }
  
  // Check for required resourceType
  if (!resource.resourceType || typeof resource.resourceType !== 'string') {
    return false;
  }
  
  // Validate known resource types
  const validResourceTypes = [
    'Patient', 'Observation', 'Encounter', 'Condition', 'Procedure',
    'DiagnosticReport', 'Medication', 'MedicationRequest', 'AllergyIntolerance',
    'Immunization', 'CarePlan', 'Organization', 'Practitioner', 'Bundle'
  ];
  
  if (!validResourceTypes.includes(resource.resourceType)) {
    return false;
  }
  
  // Resource-specific validation
  switch (resource.resourceType) {
    case 'Patient':
      return validatePatient(resource);
    case 'Observation':
      return validateObservation(resource);
    case 'Encounter':
      return validateEncounter(resource);
    case 'Bundle':
      return validateBundle(resource);
    default:
      return true; // Basic validation passed
  }
}

function validatePatient(patient: any): boolean {
  // Patient must have either name or identifier
  const hasName = patient.name && Array.isArray(patient.name) && patient.name.length > 0;
  const hasIdentifier = patient.identifier && Array.isArray(patient.identifier) && patient.identifier.length > 0;
  
  return hasName || hasIdentifier;
}

function validateObservation(observation: any): boolean {
  // Observation must have status and code
  if (!observation.status || typeof observation.status !== 'string') {
    return false;
  }
  
  if (!observation.code || !observation.code.coding || !Array.isArray(observation.code.coding)) {
    return false;
  }
  
  // Valid status values
  const validStatuses = ['final', 'preliminary', 'amended', 'corrected', 'cancelled', 'entered-in-error'];
  return validStatuses.includes(observation.status);
}

function validateEncounter(encounter: any): boolean {
  // Encounter must have status and class
  if (!encounter.status || typeof encounter.status !== 'string') {
    return false;
  }
  
  if (!encounter.class) {
    return false;
  }
  
  // Valid status values
  const validStatuses = ['planned', 'arrived', 'triaged', 'in-progress', 'onleave', 'finished', 'cancelled'];
  return validStatuses.includes(encounter.status);
}

function validateBundle(bundle: any): boolean {
  // Bundle must have type
  if (!bundle.type || typeof bundle.type !== 'string') {
    return false;
  }
  
  // Valid bundle types
  const validTypes = ['document', 'message', 'transaction', 'transaction-response', 'batch', 'batch-response', 'history', 'searchset', 'collection'];
  return validTypes.includes(bundle.type);
}

export function validateFhirBundle(bundle: any): {
  isValid: boolean;
  errors: string[];
  resourceCount: number;
  validResources: number;
} {
  const errors: string[] = [];
  let resourceCount = 0;
  let validResources = 0;
  
  if (!validateFhirResource(bundle)) {
    errors.push('Invalid bundle structure');
    return { isValid: false, errors, resourceCount: 0, validResources: 0 };
  }
  
  if (bundle.entry && Array.isArray(bundle.entry)) {
    resourceCount = bundle.entry.length;
    
    for (let i = 0; i < bundle.entry.length; i++) {
      const entry = bundle.entry[i];
      
      if (!entry.resource) {
        errors.push(`Entry ${i}: Missing resource`);
        continue;
      }
      
      if (validateFhirResource(entry.resource)) {
        validResources++;
      } else {
        errors.push(`Entry ${i}: Invalid ${entry.resource?.resourceType || 'unknown'} resource`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    resourceCount,
    validResources
  };
}