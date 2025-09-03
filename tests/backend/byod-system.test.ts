import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { registerRoutes } from '../../server/routes';
import fs from 'fs/promises';
import path from 'path';

describe('BYOD System Integration Tests', () => {
  let app: Express;
  let server: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  describe('Data Import Parsers', () => {
    describe('Apple Health Import', () => {
      it('should parse Apple Health XML export', async () => {
        const appleHealthXml = await fs.readFile(
          path.join(__dirname, '../fixtures/apple-health/export-small.xml'),
          'utf-8'
        );

        const response = await request(app)
          .post('/api/byod/import/apple-health')
          .attach('file', Buffer.from(appleHealthXml), 'export.xml')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.recordsParsed).toBeGreaterThan(0);
        expect(response.body.dataTypes).toContain('HeartRate');
        expect(response.body.dataTypes).toContain('StepCount');
        expect(response.body.dateRange.start).toBeDefined();
        expect(response.body.dateRange.end).toBeDefined();
      });

      it('should extract heart rate data correctly', async () => {
        const appleHealthXml = await fs.readFile(
          path.join(__dirname, '../fixtures/apple-health/export-small.xml'),
          'utf-8'
        );

        const response = await request(app)
          .post('/api/byod/import/apple-health')
          .attach('file', Buffer.from(appleHealthXml), 'export.xml')
          .expect(200);

        const heartRateRecords = response.body.preview.filter(
          (record: any) => record.type === 'HeartRate'
        );

        expect(heartRateRecords).toHaveLength(2);
        expect(heartRateRecords[0].value).toBe(72);
        expect(heartRateRecords[0].unit).toBe('count/min');
        expect(heartRateRecords[1].value).toBe(85);
      });

      it('should handle malformed Apple Health XML', async () => {
        const malformedXml = '<?xml version="1.0"?><invalid>broken</invalid>';

        const response = await request(app)
          .post('/api/byod/import/apple-health')
          .attach('file', Buffer.from(malformedXml), 'invalid.xml')
          .expect(400);

        expect(response.body.error).toContain('XML parsing');
      });
    });

    describe('Google Fit Import', () => {
      it('should parse Google Fit CSV export', async () => {
        const googleFitCsv = await fs.readFile(
          path.join(__dirname, '../fixtures/google-fit/activities.csv'),
          'utf-8'
        );

        const response = await request(app)
          .post('/api/byod/import/google-fit')
          .attach('file', Buffer.from(googleFitCsv), 'activities.csv')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.activitiesParsed).toBe(5);
        expect(response.body.activityTypes).toContain('Walking');
        expect(response.body.activityTypes).toContain('Running');
        expect(response.body.activityTypes).toContain('Cycling');
      });

      it('should handle CSV with missing headers', async () => {
        const invalidCsv = 'invalid,header,structure\n1,2,3';

        const response = await request(app)
          .post('/api/byod/import/google-fit')
          .attach('file', Buffer.from(invalidCsv), 'invalid.csv')
          .expect(400);

        expect(response.body.error).toContain('CSV headers');
      });
    });

    describe('Fitbit Import', () => {
      it('should parse Fitbit JSON export', async () => {
        const fitbitJson = await fs.readFile(
          path.join(__dirname, '../fixtures/fitbit/fitbit-export.json'),
          'utf-8'
        );

        const response = await request(app)
          .post('/api/byod/import/fitbit')
          .attach('file', Buffer.from(fitbitJson), 'fitbit-export.json')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.activities).toHaveLength(2);
        expect(response.body.heartRateData).toBeDefined();
        expect(response.body.sleepData).toBeDefined();
        expect(response.body.bodyData).toBeDefined();
      });

      it('should handle invalid JSON', async () => {
        const invalidJson = '{ invalid json structure';

        const response = await request(app)
          .post('/api/byod/import/fitbit')
          .attach('file', Buffer.from(invalidJson), 'invalid.json')
          .expect(400);

        expect(response.body.error).toContain('JSON parsing');
      });
    });

    describe('Garmin Import', () => {
      it('should parse Garmin CSV export', async () => {
        const garminCsv = await fs.readFile(
          path.join(__dirname, '../fixtures/garmin/activities.csv'),
          'utf-8'
        );

        const response = await request(app)
          .post('/api/byod/import/garmin')
          .attach('file', Buffer.from(garminCsv), 'activities.csv')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.activitiesParsed).toBe(3);
        expect(response.body.activityTypes).toContain('Running');
        expect(response.body.activityTypes).toContain('Walking');
        expect(response.body.activityTypes).toContain('Cycling');
      });
    });
  });

  describe('Data Preview and Mapping', () => {
    it('should generate normalized preview from Apple Health data', async () => {
      const appleHealthXml = await fs.readFile(
        path.join(__dirname, '../fixtures/apple-health/export-small.xml'),
        'utf-8'
      );

      // First import the data
      const importResponse = await request(app)
        .post('/api/byod/import/apple-health')
        .attach('file', Buffer.from(appleHealthXml), 'export.xml');

      const sessionId = importResponse.body.sessionId;

      // Then get the preview
      const previewResponse = await request(app)
        .get(`/api/byod/preview/${sessionId}`)
        .expect(200);

      expect(previewResponse.body.records).toBeInstanceOf(Array);
      expect(previewResponse.body.records.length).toBeGreaterThan(0);
      
      const heartRateRecord = previewResponse.body.records.find(
        (r: any) => r.type === 'HeartRate'
      );
      expect(heartRateRecord).toBeDefined();
      expect(heartRateRecord.value).toBeDefined();
      expect(heartRateRecord.timestamp).toBeDefined();
    });

    it('should provide FHIR mapping suggestions', async () => {
      const response = await request(app)
        .post('/api/byod/mapping-presets')
        .send({
          dataType: 'HeartRate',
          source: 'apple-health'
        })
        .expect(200);

      expect(response.body.fhirMapping).toBeDefined();
      expect(response.body.fhirMapping.resourceType).toBe('Observation');
      expect(response.body.fhirMapping.code.coding[0].system).toBe('http://loinc.org');
      expect(response.body.fhirMapping.code.coding[0].code).toBe('8867-4');
    });
  });

  describe('FHIR Mapping and Publishing', () => {
    it('should map Apple Health data to FHIR Observations', async () => {
      const sessionId = 'test-byod-session-001';
      
      // Mock import session data
      const mockData = [
        {
          type: 'HeartRate',
          value: 72,
          unit: 'count/min',
          timestamp: '2024-01-15T08:00:00Z',
          source: 'Apple Watch'
        }
      ];

      const response = await request(app)
        .post('/api/byod/map-to-fhir')
        .send({
          sessionId,
          data: mockData,
          patientReference: 'Patient/byod-patient-001'
        })
        .expect(200);

      expect(response.body.fhirResources).toBeInstanceOf(Array);
      expect(response.body.fhirResources).toHaveLength(1);
      
      const observation = response.body.fhirResources[0];
      expect(observation.resourceType).toBe('Observation');
      expect(observation.status).toBe('final');
      expect(observation.code.coding[0].code).toBe('8867-4');
      expect(observation.valueQuantity.value).toBe(72);
      expect(observation.subject.reference).toBe('Patient/byod-patient-001');
    });

    it('should batch publish FHIR observations with status tracking', async () => {
      // Mock successful FHIR server responses
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ resourceType: 'Observation', id: 'obs-001' })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ resourceType: 'Observation', id: 'obs-002' })
        });

      const observations = [
        {
          resourceType: 'Observation',
          status: 'final',
          code: { coding: [{ system: 'http://loinc.org', code: '8867-4' }] },
          valueQuantity: { value: 72, unit: 'beats/min' }
        },
        {
          resourceType: 'Observation',
          status: 'final',
          code: { coding: [{ system: 'http://loinc.org', code: '55423-8' }] },
          valueQuantity: { value: 10000, unit: 'steps' }
        }
      ];

      const response = await request(app)
        .post('/api/byod/publish')
        .send({
          sessionId: 'test-byod-session-002',
          observations,
          targetServer: 'http://localhost:8080/fhir'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.published).toBe(2);
      expect(response.body.failed).toBe(0);
      expect(response.body.results).toHaveLength(2);
      expect(response.body.results[0].status).toBe('success');
      expect(response.body.results[1].status).toBe('success');
    });

    it('should handle partial failures in batch publishing', async () => {
      // Mock mixed responses
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ resourceType: 'Observation', id: 'obs-001' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request'
        });

      const observations = [
        { resourceType: 'Observation', status: 'final' },
        { resourceType: 'Observation', status: 'invalid' }
      ];

      const response = await request(app)
        .post('/api/byod/publish')
        .send({
          sessionId: 'test-byod-session-003',
          observations,
          targetServer: 'http://localhost:8080/fhir'
        })
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.published).toBe(1);
      expect(response.body.failed).toBe(1);
      expect(response.body.results[0].status).toBe('success');
      expect(response.body.results[1].status).toBe('error');
    });

    it('should retry failed observations with exponential backoff', async () => {
      // Mock failure then success
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable'
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ resourceType: 'Observation', id: 'obs-retry' })
        });

      const response = await request(app)
        .post('/api/byod/publish')
        .send({
          sessionId: 'test-byod-session-004',
          observations: [{ resourceType: 'Observation', status: 'final' }],
          targetServer: 'http://localhost:8080/fhir',
          enableRetry: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.retryAttempts).toBeGreaterThan(0);
    });
  });

  describe('Safety Mode and Public Server Protection', () => {
    it('should block public server publishing without explicit consent', async () => {
      const response = await request(app)
        .post('/api/byod/publish')
        .send({
          sessionId: 'test-byod-session-005',
          observations: [{ resourceType: 'Observation', status: 'final' }],
          targetServer: 'https://hapi.fhir.org/baseR4',
          safetyMode: true
        })
        .expect(403);

      expect(response.body.error).toContain('Safety mode');
      expect(response.body.error).toContain('public server');
    });

    it('should allow public publishing with explicit consent', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ resourceType: 'Observation', id: 'obs-consent' })
      });

      const response = await request(app)
        .post('/api/byod/publish')
        .send({
          sessionId: 'test-byod-session-006',
          observations: [{ resourceType: 'Observation', status: 'final' }],
          targetServer: 'https://hapi.fhir.org/baseR4',
          safetyMode: false,
          explicitConsent: true,
          consentAcknowledgment: 'I understand this is synthetic data for testing'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should detect potential PHI in data and warn', async () => {
      const suspiciousData = [{
        type: 'PersonalInfo',
        value: 'John Doe',
        unit: 'text',
        timestamp: '2024-01-15T08:00:00Z',
        source: 'User Input'
      }];

      const response = await request(app)
        .post('/api/byod/validate-data')
        .send({
          data: suspiciousData,
          targetServer: 'https://hapi.fhir.org/baseR4'
        })
        .expect(200);

      expect(response.body.warnings).toBeDefined();
      expect(response.body.warnings.length).toBeGreaterThan(0);
      expect(response.body.warnings[0]).toContain('PHI');
    });

    it('should prefer local FHIR when available', async () => {
      process.env.USE_LOCAL_FHIR = 'true';

      const response = await request(app)
        .post('/api/byod/get-recommended-server')
        .send({
          sessionId: 'test-byod-session-007'
        })
        .expect(200);

      expect(response.body.recommendedServer).toContain('localhost:8080');
      expect(response.body.reason).toContain('local');
    });
  });

  describe('Artifact Generation', () => {
    it('should generate downloadable ZIP artifacts', async () => {
      const sessionId = 'test-byod-session-008';

      // Mock some session data
      await request(app)
        .post('/api/byod/store-session')
        .send({
          sessionId,
          rawData: [{ type: 'HeartRate', value: 72 }],
          fhirResources: [{ resourceType: 'Observation', id: 'test' }],
          metadata: { source: 'apple-health', imported: new Date() }
        });

      const response = await request(app)
        .get(`/api/byod/artifacts/${sessionId}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/zip');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain(`byod-artifacts-${sessionId}.zip`);
    });

    it('should include all relevant files in artifact ZIP', async () => {
      const sessionId = 'test-byod-session-009';

      const response = await request(app)
        .get(`/api/byod/artifacts-manifest/${sessionId}`)
        .expect(200);

      expect(response.body.files).toContain('raw-data.json');
      expect(response.body.files).toContain('fhir-observations.json');
      expect(response.body.files).toContain('mapping-report.json');
      expect(response.body.files).toContain('session-metadata.json');
    });
  });

  describe('Input Validation and Security', () => {
    it('should reject oversized file uploads', async () => {
      const largeFile = 'x'.repeat(50 * 1024 * 1024); // 50MB

      const response = await request(app)
        .post('/api/byod/import/apple-health')
        .attach('file', Buffer.from(largeFile), 'huge.xml')
        .expect(413);

      expect(response.body.error).toContain('file size');
    });

    it('should validate MIME types', async () => {
      const response = await request(app)
        .post('/api/byod/import/apple-health')
        .attach('file', Buffer.from('test'), 'test.exe')
        .expect(400);

      expect(response.body.error).toContain('file type');
    });

    it('should sanitize user inputs', async () => {
      const maliciousInput = {
        sessionId: '<script>alert("xss")</script>',
        observations: [{ resourceType: 'Observation' }]
      };

      const response = await request(app)
        .post('/api/byod/publish')
        .send(maliciousInput)
        .expect(400);

      expect(response.body.error).toContain('invalid characters');
    });
  });
});