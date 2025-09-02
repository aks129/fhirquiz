import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';

// Mock fetch for all tests
global.fetch = vi.fn();

describe('FHIR Server Integration Tests', () => {
  let app: express.Application;
  let server: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Active Base URL Resolution', () => {
    it('should resolve local FHIR when USE_LOCAL_FHIR is true', async () => {
      process.env.USE_LOCAL_FHIR = 'true';
      
      const response = await request(app)
        .get('/ops/fhir-base')
        .expect(200);

      expect(response.body.activeBaseUrl).toContain('localhost:8080');
      expect(response.body.useLocalFhir).toBe(true);
    });

    it('should resolve public FHIR when USE_LOCAL_FHIR is false', async () => {
      process.env.USE_LOCAL_FHIR = 'false';
      
      const response = await request(app)
        .get('/ops/fhir-base')
        .expect(200);

      expect(response.body.activeBaseUrl).toBe('https://hapi.fhir.org/baseR4');
      expect(response.body.useLocalFhir).toBe(false);
    });
  });

  describe('/fhir/ping endpoint', () => {
    it('should successfully ping FHIR server', async () => {
      const mockCapabilities = {
        resourceType: 'CapabilityStatement',
        fhirVersion: '4.0.1',
        status: 'active'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockCapabilities)
      });

      const response = await request(app)
        .post('/api/fhir/ping')
        .send({ baseUrl: 'http://localhost:8080/fhir' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.fhirVersion).toBe('4.0.1');
      expect(response.body.responseTime).toBeGreaterThan(0);
    });

    it('should handle FHIR server errors gracefully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const response = await request(app)
        .post('/api/fhir/ping')
        .send({ baseUrl: 'http://localhost:8080/fhir' })
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('500');
    });

    it('should handle network timeouts', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('ETIMEDOUT'));

      const response = await request(app)
        .post('/api/fhir/ping')
        .send({ baseUrl: 'http://localhost:8080/fhir' })
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('ETIMEDOUT');
    });
  });

  describe('/ops/use-local-fhir endpoint', () => {
    it('should enable local FHIR mode', async () => {
      const response = await request(app)
        .post('/ops/use-local-fhir')
        .send({ enabled: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.useLocalFhir).toBe(true);
      expect(response.body.activeBaseUrl).toContain('localhost:8080');
    });

    it('should disable local FHIR mode', async () => {
      const response = await request(app)
        .post('/ops/use-local-fhir')
        .send({ enabled: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.useLocalFhir).toBe(false);
      expect(response.body.activeBaseUrl).toBe('https://hapi.fhir.org/baseR4');
    });
  });

  describe('/ops/check-local-fhir endpoint', () => {
    it('should return healthy status when FHIR is available', async () => {
      const mockCapabilities = { resourceType: 'CapabilityStatement' };
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockCapabilities)
      });

      const response = await request(app)
        .get('/ops/check-local-fhir')
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.status).toBe(200);
      expect(response.body.elapsedMs).toBeGreaterThan(0);
    });

    it('should return unhealthy status on connection failure', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const response = await request(app)
        .get('/ops/check-local-fhir')
        .expect(200);

      expect(response.body.ok).toBe(false);
      expect(response.body.status).toBe(0);
      expect(response.body.error).toBe('ECONNREFUSED');
    });
  });

  describe('FHIR Bundle Loading', () => {
    it('should successfully load bundle via transaction', async () => {
      const mockTransactionResponse = {
        resourceType: 'Bundle',
        type: 'transaction-response',
        entry: [
          { response: { status: '201 Created', location: 'Patient/test-patient-001' } }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTransactionResponse)
      });

      const testBundle = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          {
            resource: { resourceType: 'Patient', name: [{ family: 'Test' }] },
            request: { method: 'POST', url: 'Patient' }
          }
        ]
      };

      const response = await request(app)
        .post('/api/fhir/load-bundle')
        .send({ bundle: testBundle })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.resourcesCreated).toBe(1);
    });

    it('should fallback to sequential when transaction fails', async () => {
      // Transaction fails
      (fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request'
        })
        // Individual resource creation succeeds
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ resourceType: 'Patient', id: 'test-patient-001' })
        });

      const testBundle = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          {
            resource: { resourceType: 'Patient', name: [{ family: 'Test' }] },
            request: { method: 'POST', url: 'Patient' }
          }
        ]
      };

      const response = await request(app)
        .post('/api/fhir/load-bundle')
        .send({ bundle: testBundle })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.fallbackUsed).toBe(true);
      expect(response.body.resourcesCreated).toBe(1);
    });
  });

  describe('Observation Publishing', () => {
    it('should publish valid FHIR observation', async () => {
      const mockResponse = {
        resourceType: 'Observation',
        id: 'obs-001',
        status: 'final'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse)
      });

      const observation = {
        resourceType: 'Observation',
        status: 'final',
        code: {
          coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }]
        },
        subject: { reference: 'Patient/test-patient-001' },
        valueQuantity: { value: 72, unit: 'beats/min' }
      };

      const response = await request(app)
        .post('/api/fhir/observations')
        .send(observation)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.id).toBe('obs-001');
    });

    it('should validate required observation fields', async () => {
      const invalidObservation = {
        resourceType: 'Observation',
        // Missing status and code
      };

      const response = await request(app)
        .post('/api/fhir/observations')
        .send(invalidObservation)
        .expect(400);

      expect(response.body.error).toContain('validation');
    });
  });

  describe('Capability Checks', () => {
    it('should validate R4 FHIR version', async () => {
      const r4Capabilities = {
        resourceType: 'CapabilityStatement',
        fhirVersion: '4.0.1',
        rest: [{ mode: 'server' }]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(r4Capabilities)
      });

      const response = await request(app)
        .post('/api/fhir/capabilities')
        .send({ baseUrl: 'http://localhost:8080/fhir' })
        .expect(200);

      expect(response.body.fhirVersion).toBe('4.0.1');
      expect(response.body.isR4Compatible).toBe(true);
    });

    it('should detect unsupported R5 version', async () => {
      const r5Capabilities = {
        resourceType: 'CapabilityStatement',
        fhirVersion: '5.0.0',
        rest: [{ mode: 'server' }]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(r5Capabilities)
      });

      const response = await request(app)
        .post('/api/fhir/capabilities')
        .send({ baseUrl: 'http://localhost:8080/fhir' })
        .expect(200);

      expect(response.body.fhirVersion).toBe('5.0.0');
      expect(response.body.isR4Compatible).toBe(false);
      expect(response.body.warnings).toContain('R5');
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 Unauthorized responses', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      const response = await request(app)
        .post('/api/fhir/ping')
        .send({ baseUrl: 'http://secure-server.com/fhir' })
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('401');
    });

    it('should handle 403 Forbidden responses', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      });

      const response = await request(app)
        .post('/api/fhir/ping')
        .send({ baseUrl: 'http://secure-server.com/fhir' })
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('403');
    });

    it('should handle rate limit responses', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: {
          get: (name: string) => name === 'Retry-After' ? '60' : null
        }
      });

      const response = await request(app)
        .post('/api/fhir/ping')
        .send({ baseUrl: 'http://rate-limited.com/fhir' })
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('429');
      expect(response.body.retryAfter).toBe(60);
    });
  });
});