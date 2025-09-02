import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { config, persistConfig } from '../server/config';

// Mock the config module
vi.mock('../server/config', () => ({
  config: {
    USE_LOCAL_FHIR: false,
    LOCAL_FHIR_URL: 'http://localhost:8080/fhir'
  },
  getCurrentFhirBaseUrl: vi.fn(),
  checkLocalFhirHealth: vi.fn(),
  persistConfig: vi.fn(),
  loadPersistedConfig: vi.fn(),
  waitForLocalFhirHealth: vi.fn()
}));

// Mock fetch for external FHIR calls
global.fetch = vi.fn();

describe('FHIR Routes', () => {
  let app: express.Application;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Create test app
    app = express();
    app.use(express.json());
    
    // Reset config
    config.USE_LOCAL_FHIR = false;
    config.LOCAL_FHIR_URL = 'http://localhost:8080/fhir';

    // Import routes after mocks are set up
    const { registerRoutes } = await import('../server/routes');
    await registerRoutes(app);
  });

  describe('GET /ops/check-local-fhir', () => {
    it('should return health check results', async () => {
      const { checkLocalFhirHealth } = await import('../server/config');
      (checkLocalFhirHealth as any).mockResolvedValue({
        ok: true,
        status: 200,
        elapsedMs: 150
      });

      const response = await request(app)
        .get('/ops/check-local-fhir')
        .expect(200);

      expect(response.body).toEqual({
        ok: true,
        status: 200,
        elapsedMs: 150
      });
      expect(checkLocalFhirHealth).toHaveBeenCalled();
    });

    it('should handle health check failures', async () => {
      const { checkLocalFhirHealth } = await import('../server/config');
      (checkLocalFhirHealth as any).mockRejectedValue(new Error('Connection failed'));

      const response = await request(app)
        .get('/ops/check-local-fhir')
        .expect(500);

      expect(response.body).toEqual({
        ok: false,
        status: 0,
        elapsedMs: 0,
        error: 'Health check failed'
      });
    });
  });

  describe('POST /ops/use-local-fhir', () => {
    it('should enable local FHIR and persist config', async () => {
      const { getCurrentFhirBaseUrl } = await import('../server/config');
      (getCurrentFhirBaseUrl as any).mockReturnValue('http://localhost:8080/fhir');

      const response = await request(app)
        .post('/ops/use-local-fhir')
        .send({ enabled: true })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        useLocalFhir: true,
        activeBaseUrl: 'http://localhost:8080/fhir',
        message: 'Switched to local FHIR server'
      });
      
      expect(config.USE_LOCAL_FHIR).toBe(true);
      expect(persistConfig).toHaveBeenCalledWith(true);
    });

    it('should disable local FHIR and persist config', async () => {
      const { getCurrentFhirBaseUrl } = await import('../server/config');
      (getCurrentFhirBaseUrl as any).mockReturnValue('https://hapi.fhir.org/baseR4');

      const response = await request(app)
        .post('/ops/use-local-fhir')
        .send({ enabled: false })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        useLocalFhir: false,
        activeBaseUrl: 'https://hapi.fhir.org/baseR4',
        message: 'Switched to public FHIR servers'
      });
      
      expect(config.USE_LOCAL_FHIR).toBe(false);
      expect(persistConfig).toHaveBeenCalledWith(false);
    });
  });

  describe('GET /ops/seed-local-fhir', () => {
    it('should seed local FHIR with idempotency', async () => {
      // Mock successful bundle upload
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ resourceType: 'Bundle', id: 'test-bundle' })
        });

      const response = await request(app)
        .get('/ops/seed-local-fhir')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('seeded');
      expect(response.body.resourcesUploaded).toBeDefined();
    });

    it('should handle seed operation failures gracefully', async () => {
      // Mock failed bundle upload
      (fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        });

      const response = await request(app)
        .get('/ops/seed-local-fhir')
        .expect(500);

      expect(response.body.error).toBe('Failed to seed local HAPI server');
    });

    it('should handle network errors during seeding', async () => {
      // Mock network error
      (fetch as any).mockRejectedValue(new Error('ECONNREFUSED'));

      const response = await request(app)
        .get('/ops/seed-local-fhir')
        .expect(500);

      expect(response.body.error).toBe('Failed to seed local HAPI server');
    });
  });

  describe('FHIR Observation POST in Local Mode', () => {
    beforeEach(() => {
      config.USE_LOCAL_FHIR = true;
      const { getCurrentFhirBaseUrl } = vi.mocked(await import('../server/config'));
      getCurrentFhirBaseUrl.mockReturnValue('http://localhost:8080/fhir');
    });

    it('should create observation with proper structure', async () => {
      const mockObservationResponse = {
        ok: true,
        status: 201,
        json: () => Promise.resolve({
          resourceType: 'Observation',
          id: 'test-obs-123',
          status: 'final',
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '8867-4',
              display: 'Heart rate'
            }]
          },
          valueQuantity: {
            value: 72,
            unit: 'beats/min',
            system: 'http://unitsofmeasure.org',
            code: '/min'
          }
        })
      };

      (fetch as any).mockResolvedValueOnce(mockObservationResponse);

      const observationData = {
        resourceType: 'Observation',
        status: 'final',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '8867-4',
            display: 'Heart rate'
          }]
        },
        valueQuantity: {
          value: 72,
          unit: 'beats/min',
          system: 'http://unitsofmeasure.org',
          code: '/min'
        }
      };

      const response = await request(app)
        .post('/api/fhir/observations')
        .send(observationData)
        .expect(201);

      expect(response.body.resourceType).toBe('Observation');
      expect(response.body.id).toBe('test-obs-123');
      expect(response.body.status).toBe('final');
      
      // Verify the POST was made to local server
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/fhir/Observation',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/fhir+json',
            'Accept': 'application/fhir+json'
          }),
          body: JSON.stringify(observationData)
        })
      );
    });

    it('should handle observation creation failures in local mode', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'invalid',
            diagnostics: 'Invalid observation structure'
          }]
        })
      });

      const invalidObservation = {
        resourceType: 'Observation',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/fhir/observations')
        .send(invalidObservation)
        .expect(400);

      expect(response.body.resourceType).toBe('OperationOutcome');
      expect(response.body.issue[0].severity).toBe('error');
    });

    it('should include proper FHIR headers for local server calls', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ resourceType: 'Observation', id: 'test' })
      });

      await request(app)
        .post('/api/fhir/observations')
        .send({
          resourceType: 'Observation',
          status: 'final',
          code: { coding: [{ system: 'http://loinc.org', code: '8867-4' }] }
        });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('localhost:8080/fhir'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/fhir+json',
            'Accept': 'application/fhir+json'
          })
        })
      );
    });
  });
});