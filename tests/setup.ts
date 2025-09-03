// Global test setup
import { vi, beforeEach, afterEach } from 'vitest';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.USE_LOCAL_FHIR = 'false';
process.env.LOCAL_FHIR_URL = 'http://localhost:8080/fhir';

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeEach(() => {
  // Reset environment for each test
  process.env.USE_LOCAL_FHIR = 'false';
  process.env.LOCAL_FHIR_URL = 'http://localhost:8080/fhir';
  
  // Mock console methods to avoid noise
  console.error = vi.fn();
  console.log = vi.fn();
});

afterEach(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});