import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as path from 'path';

test.describe('BYOD Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should upload and process Apple Health data', async ({ page }) => {
    // Navigate to BYOD page
    await page.click('[data-testid="nav-byod"]');
    await expect(page).toHaveURL(/byod/);
    
    // Check BYOD overview
    await expect(page.locator('[data-testid="byod-overview"]')).toBeVisible();
    await expect(page.getByText('Bring Your Own Data')).toBeVisible();
    
    // Select Apple Health option
    await page.click('[data-testid="select-apple-health"]');
    await expect(page.locator('[data-testid="apple-health-uploader"]')).toBeVisible();
    
    // Upload test file
    const testFile = path.join(__dirname, '../fixtures/apple-health/export-small.xml');
    await page.locator('[data-testid="file-input-apple-health"]').setInputFiles(testFile);
    
    // Start processing
    await page.click('[data-testid="button-process-apple-health"]');
    
    // Wait for processing to complete
    await expect(page.locator('[data-testid="processing-status"]')).toContainText(/processing|analyzing/i);
    await expect(page.locator('[data-testid="processing-complete"]')).toBeVisible({ timeout: 30000 });
    
    // Verify data preview
    await expect(page.locator('[data-testid="data-preview"]')).toBeVisible();
    const heartRateRows = page.locator('[data-testid^="preview-row-HeartRate"]');
    await expect(heartRateRows.first()).toBeVisible();
    
    // Check summary statistics
    await expect(page.locator('[data-testid="summary-records-count"]')).toContainText(/\d+/);
    await expect(page.locator('[data-testid="summary-date-range"]')).toBeVisible();
  });

  test('should map data to FHIR observations', async ({ page }) => {
    await page.click('[data-testid="nav-byod"]');
    
    // Upload and process data first (using simplified flow)
    await page.click('[data-testid="select-apple-health"]');
    const testFile = path.join(__dirname, '../fixtures/apple-health/export-small.xml');
    await page.locator('[data-testid="file-input-apple-health"]').setInputFiles(testFile);
    await page.click('[data-testid="button-process-apple-health"]');
    await expect(page.locator('[data-testid="processing-complete"]')).toBeVisible({ timeout: 30000 });
    
    // Navigate to mapping step
    await page.click('[data-testid="step-fhir-mapping"]');
    await expect(page.locator('[data-testid="fhir-mapping-panel"]')).toBeVisible();
    
    // Heart rate should be automatically mapped to LOINC 8867-4
    const heartRateMapping = page.locator('[data-testid="mapping-HeartRate"]');
    await expect(heartRateMapping).toBeVisible();
    await expect(heartRateMapping.locator('[data-testid="loinc-code"]')).toContainText('8867-4');
    
    // Generate FHIR observations
    await page.click('[data-testid="button-generate-fhir"]');
    await expect(page.locator('[data-testid="fhir-generation-complete"]')).toBeVisible();
    
    // Preview generated observations
    await expect(page.locator('[data-testid="fhir-preview"]')).toBeVisible();
    const observationItems = page.locator('[data-testid^="fhir-observation-"]');
    await expect(observationItems.first()).toBeVisible();
    
    // Verify observation structure
    await page.click('[data-testid^="button-expand-observation-"]');
    await expect(page.locator('[data-testid="observation-resource-type"]')).toContainText('Observation');
    await expect(page.locator('[data-testid="observation-status"]')).toContainText('final');
  });

  test('should handle safety mode for public FHIR servers', async ({ page }) => {
    await page.click('[data-testid="nav-byod"]');
    
    // Process some test data
    await page.click('[data-testid="select-apple-health"]');
    const testFile = path.join(__dirname, '../fixtures/apple-health/export-small.xml');
    await page.locator('[data-testid="file-input-apple-health"]').setInputFiles(testFile);
    await page.click('[data-testid="button-process-apple-health"]');
    await expect(page.locator('[data-testid="processing-complete"]')).toBeVisible({ timeout: 30000 });
    
    // Navigate to publishing step
    await page.click('[data-testid="step-publish-data"]');
    await expect(page.locator('[data-testid="publish-panel"]')).toBeVisible();
    
    // Try to select public FHIR server
    await page.selectOption('[data-testid="select-fhir-server"]', 'https://hapi.fhir.org/baseR4');
    
    // Should show safety warning
    await expect(page.locator('[data-testid="safety-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="safety-warning"]')).toContainText(/public server/i);
    
    // Consent checkbox should be required
    const publishButton = page.locator('[data-testid="button-publish-to-fhir"]');
    await expect(publishButton).toBeDisabled();
    
    // Enable consent
    await page.check('[data-testid="checkbox-safety-consent"]');
    await expect(publishButton).toBeEnabled();
  });

  test('should prefer local FHIR server when available', async ({ page }) => {
    await page.click('[data-testid="nav-byod"]');
    await page.click('[data-testid="step-publish-data"]');
    
    // Local server should be pre-selected or recommended
    const serverSelect = page.locator('[data-testid="select-fhir-server"]');
    const selectedValue = await serverSelect.inputValue();
    expect(selectedValue).toContain('localhost');
    
    // Should show local server recommendation
    await expect(page.locator('[data-testid="local-server-recommendation"]')).toBeVisible();
  });

  test('should handle multiple data format imports', async ({ page }) => {
    await page.click('[data-testid="nav-byod"]');
    
    // Test Google Fit import
    await page.click('[data-testid="select-google-fit"]');
    const googleFitFile = path.join(__dirname, '../fixtures/google-fit/activities.csv');
    await page.locator('[data-testid="file-input-google-fit"]').setInputFiles(googleFitFile);
    await page.click('[data-testid="button-process-google-fit"]');
    await expect(page.locator('[data-testid="processing-complete"]')).toBeVisible({ timeout: 30000 });
    
    // Verify Google Fit specific data
    await expect(page.locator('[data-testid="data-preview"]')).toBeVisible();
    const activityRows = page.locator('[data-testid^="preview-row-Activity"]');
    await expect(activityRows.first()).toBeVisible();
    
    // Test Fitbit import (new session)
    await page.reload();
    await page.click('[data-testid="select-fitbit"]');
    const fitbitFile = path.join(__dirname, '../fixtures/fitbit/fitbit-export.json');
    await page.locator('[data-testid="file-input-fitbit"]').setInputFiles(fitbitFile);
    await page.click('[data-testid="button-process-fitbit"]');
    await expect(page.locator('[data-testid="processing-complete"]')).toBeVisible({ timeout: 30000 });
    
    // Verify Fitbit specific data
    await expect(page.locator('[data-testid="summary-activities"]')).toContainText('2');
    await expect(page.locator('[data-testid="summary-sleep-records"]')).toContainText('1');
  });

  test('should generate downloadable artifacts', async ({ page }) => {
    await page.click('[data-testid="nav-byod"]');
    
    // Process some data
    await page.click('[data-testid="select-apple-health"]');
    const testFile = path.join(__dirname, '../fixtures/apple-health/export-small.xml');
    await page.locator('[data-testid="file-input-apple-health"]').setInputFiles(testFile);
    await page.click('[data-testid="button-process-apple-health"]');
    await expect(page.locator('[data-testid="processing-complete"]')).toBeVisible({ timeout: 30000 });
    
    // Generate FHIR observations
    await page.click('[data-testid="step-fhir-mapping"]');
    await page.click('[data-testid="button-generate-fhir"]');
    await expect(page.locator('[data-testid="fhir-generation-complete"]')).toBeVisible();
    
    // Navigate to artifacts section
    await page.click('[data-testid="step-download-artifacts"]');
    await expect(page.locator('[data-testid="artifacts-panel"]')).toBeVisible();
    
    // Should see available downloads
    await expect(page.locator('[data-testid="download-raw-data"]')).toBeVisible();
    await expect(page.locator('[data-testid="download-fhir-bundle"]')).toBeVisible();
    await expect(page.locator('[data-testid="download-mapping-report"]')).toBeVisible();
    
    // Test ZIP download
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-all-artifacts"]');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toMatch(/byod-artifacts.*\.zip$/);
  });

  test('should validate file sizes and types', async ({ page }) => {
    await page.click('[data-testid="nav-byod"]');
    await page.click('[data-testid="select-apple-health"]');
    
    // Test invalid file type
    const invalidFile = path.join(__dirname, '../fixtures/invalid/test.txt');
    
    // Create a fake invalid file for testing
    await page.evaluate(() => {
      const dt = new DataTransfer();
      const file = new File(['invalid content'], 'test.exe', { type: 'application/x-executable' });
      dt.items.add(file);
      const input = document.querySelector('[data-testid="file-input-apple-health"]') as HTMLInputElement;
      if (input) input.files = dt.files;
    });
    
    await page.click('[data-testid="button-process-apple-health"]');
    
    // Should show error for invalid file type
    await expect(page.locator('[data-testid="file-type-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-type-error"]')).toContainText(/file type/i);
  });

  test('should show progress indicators during processing', async ({ page }) => {
    await page.click('[data-testid="nav-byod"]');
    await page.click('[data-testid="select-apple-health"]');
    
    const testFile = path.join(__dirname, '../fixtures/apple-health/export-small.xml');
    await page.locator('[data-testid="file-input-apple-health"]').setInputFiles(testFile);
    await page.click('[data-testid="button-process-apple-health"]');
    
    // Should show progress indicators
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="processing-stage"]')).toBeVisible();
    
    // Progress should update
    const initialStage = await page.locator('[data-testid="processing-stage"]').textContent();
    await page.waitForTimeout(2000);
    const updatedStage = await page.locator('[data-testid="processing-stage"]').textContent();
    
    // Stage should change or processing should complete
    const processingComplete = await page.locator('[data-testid="processing-complete"]').isVisible();
    if (!processingComplete) {
      expect(updatedStage).not.toBe(initialStage);
    }
  });

  test('should be accessible', async ({ page }) => {
    // Accessibility testing with AxeBuilder
    
    // Test BYOD main page
    await page.click('[data-testid="nav-byod"]');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
    
    // Test file upload interface
    await page.click('[data-testid="select-apple-health"]');
    const uploadResults = await new AxeBuilder({ page })
      .include('[data-testid="apple-health-uploader"]')
      .analyze();
    expect(uploadResults.violations).toEqual([]);
  });
});