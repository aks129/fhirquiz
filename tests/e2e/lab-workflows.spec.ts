import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';

test.describe('Lab Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete Day 1 lab workflow', async ({ page }) => {
    // Navigate to Day 1 lab
    await page.click('[data-testid="nav-day1-lab"]');
    await expect(page).toHaveURL(/day1-lab/);
    
    // Check lab overview is visible
    await expect(page.locator('[data-testid="lab-overview"]')).toBeVisible();
    await expect(page.getByText('FHIR Data Ingestion')).toBeVisible();
    
    // Step 1: Connect to FHIR Server
    await page.click('[data-testid="step-1-start"]');
    await expect(page.locator('[data-testid="fhir-connection-panel"]')).toBeVisible();
    
    // Select local FHIR server
    await page.click('[data-testid="select-local-fhir"]');
    
    // Test connection
    await page.click('[data-testid="button-test-connection"]');
    await expect(page.locator('[data-testid="connection-status"]')).toHaveText(/Connected|Success/i);
    
    // Mark step as complete
    await page.click('[data-testid="button-complete-step-1"]');
    await expect(page.locator('[data-testid="step-1-completed"]')).toBeVisible();
    
    // Step 2: Upload FHIR Bundle
    await page.click('[data-testid="step-2-start"]');
    await expect(page.locator('[data-testid="bundle-upload-panel"]')).toBeVisible();
    
    // Use sample bundle
    await page.click('[data-testid="button-use-sample-bundle"]');
    await expect(page.locator('[data-testid="bundle-preview"]')).toBeVisible();
    
    // Upload bundle
    await page.click('[data-testid="button-upload-bundle"]');
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
    
    // Step 3: Verify Data
    await page.click('[data-testid="step-3-start"]');
    await expect(page.locator('[data-testid="data-verification-panel"]')).toBeVisible();
    
    // Run verification queries
    await page.click('[data-testid="button-verify-patients"]');
    await expect(page.locator('[data-testid="patient-count"]')).toContainText(/\d+/);
    
    await page.click('[data-testid="button-verify-observations"]');
    await expect(page.locator('[data-testid="observation-count"]')).toContainText(/\d+/);
    
    // Complete lab
    await page.click('[data-testid="button-complete-lab"]');
    await expect(page.locator('[data-testid="lab-completion-message"]')).toBeVisible();
  });

  test('should track lab progress across sessions', async ({ page }) => {
    // Start Day 1 lab and complete first step
    await page.click('[data-testid="nav-day1-lab"]');
    await page.click('[data-testid="step-1-start"]');
    await page.click('[data-testid="select-local-fhir"]');
    await page.click('[data-testid="button-test-connection"]');
    await page.click('[data-testid="button-complete-step-1"]');
    
    // Navigate away and back
    await page.click('[data-testid="nav-home"]');
    await page.click('[data-testid="nav-day1-lab"]');
    
    // Verify step 1 is still marked as completed
    await expect(page.locator('[data-testid="step-1-completed"]')).toBeVisible();
    await expect(page.locator('[data-testid="step-2-start"]')).not.toBeDisabled();
  });

  test('should show error handling in FHIR operations', async ({ page }) => {
    await page.click('[data-testid="nav-day1-lab"]');
    await page.click('[data-testid="step-1-start"]');
    
    // Try connecting to invalid server
    await page.fill('[data-testid="input-fhir-url"]', 'https://invalid-server.com/fhir');
    await page.click('[data-testid="button-test-connection"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="connection-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="connection-error"]')).toContainText(/error|failed|unable/i);
  });

  test('should handle Day 2 SQL analytics workflow', async ({ page }) => {
    // Navigate to Day 2 lab
    await page.click('[data-testid="nav-day2-lab"]');
    await expect(page).toHaveURL(/day2-lab/);
    
    // Check if Day 2 is accessible (may require Day 1 completion)
    const lockedMessage = page.locator('[data-testid="lab-locked-message"]');
    if (await lockedMessage.isVisible()) {
      // If locked, complete Day 1 first
      await page.click('[data-testid="nav-day1-lab"]');
      // ... complete Day 1 steps quickly ...
      await page.click('[data-testid="nav-day2-lab"]');
    }
    
    // SQL Analytics step
    await page.click('[data-testid="step-sql-analytics"]');
    await expect(page.locator('[data-testid="sql-editor"]')).toBeVisible();
    
    // Execute sample query
    await page.click('[data-testid="button-run-sample-query"]');
    await expect(page.locator('[data-testid="query-results"]')).toBeVisible();
    
    // Verify results table
    const resultsTable = page.locator('[data-testid="results-table"]');
    await expect(resultsTable).toBeVisible();
    
    // Risk calculation step
    await page.click('[data-testid="step-risk-calculation"]');
    await expect(page.locator('[data-testid="risk-calculator"]')).toBeVisible();
    
    // Run risk assessment
    await page.click('[data-testid="button-calculate-risks"]');
    await expect(page.locator('[data-testid="risk-results"]')).toBeVisible();
  });

  test('should complete Day 3 operationalization workflow', async ({ page }) => {
    await page.click('[data-testid="nav-day3-lab"]');
    
    // Observation publishing step
    await page.click('[data-testid="step-publish-observations"]');
    await expect(page.locator('[data-testid="observation-publisher"]')).toBeVisible();
    
    // Configure observation template
    await page.fill('[data-testid="input-observation-code"]', '72133-2');
    await page.fill('[data-testid="input-observation-value"]', '75');
    
    // Publish observation
    await page.click('[data-testid="button-publish-observation"]');
    await expect(page.locator('[data-testid="publish-success"]')).toBeVisible();
    
    // Verify observation in FHIR server
    await page.click('[data-testid="button-verify-published"]');
    await expect(page.locator('[data-testid="verification-results"]')).toContainText(/successfully published/i);
  });

  test('should generate and download artifacts', async ({ page }) => {
    await page.click('[data-testid="nav-day1-lab"]');
    
    // Complete a simple workflow to generate artifacts
    await page.click('[data-testid="step-1-start"]');
    await page.click('[data-testid="button-use-sample-bundle"]');
    await page.click('[data-testid="button-upload-bundle"]');
    
    // Navigate to artifacts section
    await page.click('[data-testid="nav-artifacts"]');
    await expect(page.locator('[data-testid="artifacts-list"]')).toBeVisible();
    
    // Should see generated artifacts
    const artifactItems = page.locator('[data-testid^="artifact-item-"]');
    await expect(artifactItems.first()).toBeVisible();
    
    // Download first artifact
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid^="button-download-artifact-"]');
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/\.(zip|json|csv)$/);
  });

  test('should be accessible', async ({ page }) => {
    await injectAxe(page);
    
    // Test Day 1 lab accessibility
    await page.click('[data-testid="nav-day1-lab"]');
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
    
    // Test FHIR connection panel
    await page.click('[data-testid="step-1-start"]');
    await checkA11y(page, '[data-testid="fhir-connection-panel"]', {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });
});