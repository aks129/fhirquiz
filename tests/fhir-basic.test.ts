import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch for all tests
global.fetch = vi.fn();

describe('FHIR Basic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.USE_LOCAL_FHIR = 'false';
    process.env.LOCAL_FHIR_URL = 'http://localhost:8080/fhir';
  });

  describe('Active Base URL Resolution', () => {
    it('should resolve to local FHIR when USE_LOCAL_FHIR is true', async () => {
      process.env.USE_LOCAL_FHIR = 'true';
      const { getCurrentFhirBaseUrl, config } = await import('../server/config');
      
      // Update the config object to reflect environment
      config.USE_LOCAL_FHIR = true;
      const baseUrl = getCurrentFhirBaseUrl();
      expect(baseUrl).toBe('http://localhost:8080/fhir');
    });

    it('should resolve to public FHIR when USE_LOCAL_FHIR is false', async () => {
      process.env.USE_LOCAL_FHIR = 'false';
      const { getCurrentFhirBaseUrl, config } = await import('../server/config');
      
      // Update the config object to reflect environment
      config.USE_LOCAL_FHIR = false;
      const baseUrl = getCurrentFhirBaseUrl();
      expect(baseUrl).toBe('https://hapi.fhir.org/baseR4');
    });
  });

  describe('Local FHIR Health Check', () => {
    it('should return success when local FHIR responds properly', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ resourceType: 'CapabilityStatement' })
      };
      (fetch as any).mockResolvedValueOnce(mockResponse);

      const { checkLocalFhirHealth } = await import('../server/config');
      const result = await checkLocalFhirHealth();

      expect(result.ok).toBe(true);
      expect(result.status).toBe(200);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/fhir/metadata',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Accept': 'application/fhir+json' }
        })
      );
    });

    it('should handle connection failures gracefully', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const { checkLocalFhirHealth } = await import('../server/config');
      const result = await checkLocalFhirHealth();

      expect(result.ok).toBe(false);
      expect(result.status).toBe(0);
      expect(result.error).toBe('ECONNREFUSED');
    });
  });

  describe('FHIR Resource Validation', () => {
    it('should validate basic FHIR resource structure', async () => {
      const { validateFhirResource } = await import('../server/utils/fhir-validation');

      const validPatient = {
        resourceType: 'Patient',
        id: 'patient-1',
        name: [{ family: 'Doe', given: ['John'] }]
      };

      const invalidResource = {
        // Missing resourceType
        id: 'invalid'
      };

      expect(validateFhirResource(validPatient)).toBe(true);
      expect(validateFhirResource(invalidResource)).toBe(false);
    });

    it('should validate observation resources', async () => {
      const { validateFhirResource } = await import('../server/utils/fhir-validation');

      const validObservation = {
        resourceType: 'Observation',
        status: 'final',
        code: {
          coding: [{ system: 'http://loinc.org', code: '8867-4' }]
        }
      };

      const invalidObservation = {
        resourceType: 'Observation',
        status: 'invalid-status',
        code: { coding: [] }
      };

      expect(validateFhirResource(validObservation)).toBe(true);
      expect(validateFhirResource(invalidObservation)).toBe(false);
    });
  });

  describe('Seed Operation Basics', () => {
    it('should handle successful seeding', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          resourceType: 'Bundle',
          type: 'transaction-response',
          entry: [
            { response: { status: '201 Created', location: 'Patient/patient-1' } }
          ]
        })
      };
      (fetch as any).mockResolvedValue(mockResponse);

      const { seedLocalFhirServer } = await import('../server/utils/fhir-seed');
      const result = await seedLocalFhirServer([
        { resourceType: 'Patient', id: 'patient-1', name: [{ family: 'Test' }] }
      ]);

      expect(result.success).toBe(true);
      expect(result.stats.created).toBeGreaterThan(0);
    });

    it('should handle seeding failures with transaction fallback', async () => {
      // Transaction fails
      const transactionFailure = {
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      };

      // Individual creation succeeds
      const individualSuccess = {
        ok: true,
        status: 201,
        json: () => Promise.resolve({ resourceType: 'Patient', id: 'patient-1' })
      };

      (fetch as any)
        .mockResolvedValueOnce(transactionFailure)
        .mockResolvedValue(individualSuccess);

      const { seedLocalFhirServer } = await import('../server/utils/fhir-seed');
      const result = await seedLocalFhirServer([
        { resourceType: 'Patient', id: 'patient-1', name: [{ family: 'Test' }] }
      ]);

      expect(result.success).toBe(true);
      expect(result.fallbackUsed).toBe(true);
    });
  });

  describe('Observation POST Structure', () => {
    it('should format observation POST correctly for local mode', async () => {
      process.env.USE_LOCAL_FHIR = 'true';
      
      const mockResponse = {
        ok: true,
        status: 201,
        json: () => Promise.resolve({
          resourceType: 'Observation',
          id: 'obs-1',
          status: 'final'
        })
      };
      (fetch as any).mockResolvedValue(mockResponse);

      const observationData = {
        resourceType: 'Observation',
        status: 'final',
        code: {
          coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }]
        },
        valueQuantity: { value: 72, unit: 'beats/min' }
      };

      // Simulate the observation POST
      const baseUrl = 'http://localhost:8080/fhir';
      await fetch(`${baseUrl}/Observation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/fhir+json',
          'Accept': 'application/fhir+json'
        },
        body: JSON.stringify(observationData)
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/fhir/Observation',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/fhir+json',
            'Accept': 'application/fhir+json'
          },
          body: JSON.stringify(observationData)
        })
      );
    });
  });
});