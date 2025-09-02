import { describe, it, expect, vi, beforeEach } from 'vitest';
import { config, getCurrentFhirBaseUrl, checkLocalFhirHealth } from '../server/config';

// Mock fetch for FHIR server health checks
global.fetch = vi.fn();

describe('FHIR Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset config to defaults
    config.USE_LOCAL_FHIR = false;
    config.LOCAL_FHIR_URL = 'http://localhost:8080/fhir';
  });

  describe('getCurrentFhirBaseUrl', () => {
    it('should return local FHIR URL when USE_LOCAL_FHIR is true', () => {
      config.USE_LOCAL_FHIR = true;
      const baseUrl = getCurrentFhirBaseUrl();
      expect(baseUrl).toBe('http://localhost:8080/fhir');
    });

    it('should return public FHIR URL when USE_LOCAL_FHIR is false', () => {
      config.USE_LOCAL_FHIR = false;
      const baseUrl = getCurrentFhirBaseUrl();
      expect(baseUrl).toBe('https://hapi.fhir.org/baseR4');
    });

    it('should handle custom local FHIR URL', () => {
      config.USE_LOCAL_FHIR = true;
      config.LOCAL_FHIR_URL = 'http://custom-fhir:9000/fhir';
      const baseUrl = getCurrentFhirBaseUrl();
      expect(baseUrl).toBe('http://custom-fhir:9000/fhir');
    });
  });

  describe('checkLocalFhirHealth - Happy Path', () => {
    it('should return healthy status when local FHIR responds', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ resourceType: 'CapabilityStatement' })
      };
      (fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await checkLocalFhirHealth();

      expect(result.ok).toBe(true);
      expect(result.status).toBe(200);
      expect(result.elapsedMs).toBeGreaterThan(0);
      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/fhir/metadata', {
        method: 'GET',
        headers: { 'Accept': 'application/fhir+json' },
        signal: expect.any(AbortSignal)
      });
    });

    it('should measure response time accurately', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => new Promise(resolve => 
          setTimeout(() => resolve({ resourceType: 'CapabilityStatement' }), 100)
        )
      };
      (fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await checkLocalFhirHealth();

      expect(result.elapsedMs).toBeGreaterThan(90);
      expect(result.elapsedMs).toBeLessThan(200);
    });
  });

  describe('checkLocalFhirHealth - Failure Path', () => {
    it('should handle network errors gracefully', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const result = await checkLocalFhirHealth();

      expect(result.ok).toBe(false);
      expect(result.status).toBe(0);
      expect(result.error).toBe('ECONNREFUSED');
      expect(result.elapsedMs).toBeGreaterThan(0);
    });

    it('should handle HTTP error responses', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      };
      (fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await checkLocalFhirHealth();

      expect(result.ok).toBe(false);
      expect(result.status).toBe(500);
      expect(result.error).toContain('500');
    });

    it('should handle timeout errors', async () => {
      (fetch as any).mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      const result = await checkLocalFhirHealth();

      expect(result.ok).toBe(false);
      expect(result.status).toBe(0);
      expect(result.error).toBe('Request timeout');
    });

    it('should handle malformed responses', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON'))
      };
      (fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await checkLocalFhirHealth();

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });
  });
});