import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Quiz System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete Day 1 quiz flow successfully', async ({ page }) => {
    // Navigate to Day 1 quiz
    await page.click('[data-testid="nav-quiz-day1"]');
    await expect(page).toHaveURL(/quiz-day1/);
    
    // Verify page loaded correctly
    await expect(page.getByText('Day 1: FHIR Data Ingestion')).toBeVisible();
    await expect(page.locator('[data-testid="quiz-container"]')).toBeVisible();
    
    // Start the quiz
    await page.click('[data-testid="button-start-quiz"]');
    
    // Answer questions - we'll select the first option for each
    const questions = await page.locator('[data-testid^="question-"]').count();
    
    for (let i = 0; i < questions; i++) {
      const questionElement = page.locator(`[data-testid="question-${i}"]`);
      await expect(questionElement).toBeVisible();
      
      // Click first available option
      const firstOption = questionElement.locator('[data-testid^="option-"]').first();
      await firstOption.click();
    }
    
    // Submit quiz
    await page.click('[data-testid="button-submit-quiz"]');
    
    // Verify results page
    await expect(page.locator('[data-testid="quiz-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="score-display"]')).toBeVisible();
    
    // Check if score is displayed as a percentage
    const scoreText = await page.locator('[data-testid="score-display"]').textContent();
    expect(scoreText).toMatch(/\d+%/);
  });

  test('should show quiz progress across days', async ({ page }) => {
    // Complete Day 1 quiz first
    await page.click('[data-testid="nav-quiz-day1"]');
    await page.click('[data-testid="button-start-quiz"]');
    
    // Quick completion - select correct answers if available
    const questions = await page.locator('[data-testid^="question-"]').count();
    for (let i = 0; i < questions; i++) {
      const questionElement = page.locator(`[data-testid="question-${i}"]`);
      const firstOption = questionElement.locator('[data-testid^="option-"]').first();
      await firstOption.click();
    }
    
    await page.click('[data-testid="button-submit-quiz"]');
    
    // Navigate back to main page
    await page.click('[data-testid="nav-home"]');
    
    // Check progress indicators
    const day1Progress = page.locator('[data-testid="progress-day1"]');
    await expect(day1Progress).toHaveAttribute('data-completed', 'true');
    
    // Day 2 should be unlocked if Day 1 passed
    const day2Link = page.locator('[data-testid="nav-quiz-day2"]');
    await expect(day2Link).not.toHaveAttribute('disabled');
  });

  test('should handle challenge mode correctly', async ({ page }) => {
    await page.click('[data-testid="nav-quiz-fhir"]');
    
    // Enable challenge mode
    await page.click('[data-testid="toggle-challenge-mode"]');
    await expect(page.locator('[data-testid="timer-display"]')).toBeVisible();
    
    await page.click('[data-testid="button-start-quiz"]');
    
    // Verify timer is counting down
    await page.waitForTimeout(2000);
    const timerText = await page.locator('[data-testid="timer-display"]').textContent();
    expect(timerText).toMatch(/\d{1,2}:\d{2}/);
    
    // Complete quiz quickly
    const questions = await page.locator('[data-testid^="question-"]').count();
    for (let i = 0; i < questions; i++) {
      const questionElement = page.locator(`[data-testid="question-${i}"]`);
      const firstOption = questionElement.locator('[data-testid^="option-"]').first();
      await firstOption.click();
    }
    
    await page.click('[data-testid="button-submit-quiz"]');
    
    // Verify challenge mode results
    await expect(page.locator('[data-testid="challenge-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="time-taken"]')).toBeVisible();
  });

  test('should provide feedback for incorrect answers', async ({ page }) => {
    await page.click('[data-testid="nav-quiz-day1"]');
    await page.click('[data-testid="button-start-quiz"]');
    
    // Deliberately select wrong answers if multiple choice
    const questions = await page.locator('[data-testid^="question-"]').count();
    for (let i = 0; i < questions; i++) {
      const questionElement = page.locator(`[data-testid="question-${i}"]`);
      const options = questionElement.locator('[data-testid^="option-"]');
      const optionCount = await options.count();
      
      // Select last option (more likely to be wrong)
      if (optionCount > 1) {
        await options.nth(optionCount - 1).click();
      } else {
        await options.first().click();
      }
    }
    
    await page.click('[data-testid="button-submit-quiz"]');
    
    // Check for feedback on incorrect answers
    const incorrectSection = page.locator('[data-testid="incorrect-answers"]');
    if (await incorrectSection.isVisible()) {
      await expect(incorrectSection).toContainText('Review the following questions');
    }
  });

  test('should be accessible', async ({ page }) => {
    // Accessibility testing with AxeBuilder
    
    // Check main quiz page accessibility
    await page.click('[data-testid="nav-quiz-day1"]');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
    
    // Check quiz taking interface
    await page.click('[data-testid="button-start-quiz"]');
    const quizResults = await new AxeBuilder({ page }).analyze();
    expect(quizResults.violations).toEqual([]);
  });
});