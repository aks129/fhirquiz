/**
 * Certificates and Badges UI Tests
 * 
 * Tests certificate appearance after course completion,
 * badge and points UI updates, and verification flows.
 */

import { test, expect } from '@playwright/test';

test.describe('Certificates and Badges UI', () => {

  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'test_token',
        user: { id: 'test-user-123', email: 'student@test.com' }
      }));
    });

    // Mock user profile
    await page.route('**/api/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user-123',
          email: 'student@test.com',
          full_name: 'Test Student',
          role: 'student',
          fhir_points: 275
        })
      });
    });
  });

  test('Certificate appears after completing course', async ({ page }) => {
    // Mock course enrollment with completion
    await page.route('**/api/enrollments', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'enrollment-123',
            user_id: 'test-user-123',
            course_slug: 'health-data-bootcamp',
            progress: {
              total_steps: 15,
              completed_steps: 15
            },
            completed: true,
            completed_at: '2024-01-20T15:30:00Z',
            certificate_url: 'https://cdn.app.com/certificates/cert_enrollment-123.pdf'
          }
        ])
      });
    });

    // Mock course data
    await page.route('**/api/courses/health-data-bootcamp', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          slug: 'health-data-bootcamp',
          title: '3-Day Health Data Bootcamp',
          summary: 'Complete hands-on FHIR training'
        })
      });
    });

    await page.goto('/courses/health-data-bootcamp');

    // Should show course completed status
    const completedBanner = page.locator('[data-testid="banner-course-completed"]');
    await expect(completedBanner).toBeVisible();
    await expect(completedBanner).toContainText('Congratulations! You have completed this course');

    // Should show certificate download section
    const certificateSection = page.locator('[data-testid="section-certificate"]');
    await expect(certificateSection).toBeVisible();

    // Certificate download button should be present
    const downloadButton = page.locator('[data-testid="button-download-certificate"]');
    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).toContainText('Download Certificate');

    // Certificate preview should be shown
    const certificatePreview = page.locator('[data-testid="img-certificate-preview"]');
    await expect(certificatePreview).toBeVisible();

    // Should show completion date
    const completionDate = page.locator('[data-testid="text-completion-date"]');
    await expect(completionDate).toBeVisible();
    await expect(completionDate).toContainText('January 20, 2024');
  });

  test('Certificate not shown for incomplete course', async ({ page }) => {
    // Mock incomplete enrollment
    await page.route('**/api/enrollments', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'enrollment-456',
            user_id: 'test-user-123',
            course_slug: 'health-data-bootcamp',
            progress: {
              total_steps: 15,
              completed_steps: 8
            },
            completed: false,
            completed_at: null,
            certificate_url: null
          }
        ])
      });
    });

    await page.goto('/courses/health-data-bootcamp');

    // Should show progress instead of certificate
    const progressSection = page.locator('[data-testid="section-progress"]');
    await expect(progressSection).toBeVisible();

    // Certificate section should not exist
    const certificateSection = page.locator('[data-testid="section-certificate"]');
    await expect(certificateSection).not.toBeVisible();

    // Should show progress bar
    const progressBar = page.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toBeVisible();
    
    // Progress should show 8/15 completion
    const progressText = page.locator('[data-testid="text-progress"]');
    await expect(progressText).toContainText('8 of 15 steps completed');
  });

  test('Badge appears in user profile after earning', async ({ page }) => {
    // Mock user badges
    await page.route('**/api/user/badges', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'FHIR_LOOP_CLOSER',
            name: 'FHIR Loop Closer',
            description: 'Successfully completed full FHIR data lifecycle',
            points_value: 75,
            earned_at: '2024-01-20T16:00:00Z'
          },
          {
            id: 'QUIZ_MASTER',
            name: 'Quiz Master',
            description: 'Achieved perfect scores on all quizzes',
            points_value: 25,
            earned_at: '2024-01-18T14:30:00Z'
          }
        ])
      });
    });

    await page.goto('/profile');

    // Should show badges section
    const badgesSection = page.locator('[data-testid="section-badges"]');
    await expect(badgesSection).toBeVisible();

    // Should display earned badges
    const badge1 = page.locator('[data-testid="badge-FHIR_LOOP_CLOSER"]');
    await expect(badge1).toBeVisible();
    await expect(badge1).toContainText('FHIR Loop Closer');

    const badge2 = page.locator('[data-testid="badge-QUIZ_MASTER"]');
    await expect(badge2).toBeVisible();
    await expect(badge2).toContainText('Quiz Master');

    // Should show badge points values
    const badge1Points = badge1.locator('[data-testid="text-badge-points"]');
    await expect(badge1Points).toContainText('75 points');

    // Should show earned dates
    const badge1Date = badge1.locator('[data-testid="text-earned-date"]');
    await expect(badge1Date).toContainText('January 20, 2024');
  });

  test('Points balance updates after earning badge', async ({ page }) => {
    // Initial points state
    let currentPoints = 200;

    // Mock points balance API with dynamic updates
    await page.route('**/api/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user-123',
          email: 'student@test.com',
          full_name: 'Test Student',
          role: 'student',
          fhir_points: currentPoints
        })
      });
    });

    await page.goto('/profile');

    // Check initial points display
    const pointsDisplay = page.locator('[data-testid="text-points-balance"]');
    await expect(pointsDisplay).toContainText('200');

    // Mock badge earning event (simulating real-time update)
    await page.route('**/api/lab/complete-step', async (route) => {
      currentPoints += 50; // Badge worth 50 points
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          badge_earned: {
            id: 'BYOD_CHAMP',
            name: 'BYOD Champion',
            points_value: 50
          },
          new_points_balance: currentPoints
        })
      });
    });

    // Simulate completing a step that earns a badge
    await page.goto('/lab/day1/step5');
    const completeButton = page.locator('[data-testid="button-complete-step"]');
    await completeButton.click();

    // Should show badge earned notification
    const badgeNotification = page.locator('[data-testid="notification-badge-earned"]');
    await expect(badgeNotification).toBeVisible();
    await expect(badgeNotification).toContainText('Badge Earned: BYOD Champion');
    await expect(badgeNotification).toContainText('+50 points');

    // Points should update in header/profile
    await page.goto('/profile');
    await expect(pointsDisplay).toContainText('250');
  });

  test('Certificate verification page works', async ({ page }) => {
    // Mock certificate verification API
    await page.route('**/api/verify/cert_enrollment-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: true,
          certificate_id: 'cert_enrollment-123',
          user_name: 'Test Student',
          course_title: '3-Day Health Data Bootcamp',
          completion_date: '2024-01-20',
          issued_at: '2024-01-20T15:30:00Z',
          verification_timestamp: new Date().toISOString()
        })
      });
    });

    await page.goto('/verify/cert_enrollment-123');

    // Should show verification page
    const verificationPage = page.locator('[data-testid="page-certificate-verification"]');
    await expect(verificationPage).toBeVisible();

    // Should show certificate details
    const certificateValid = page.locator('[data-testid="text-certificate-valid"]');
    await expect(certificateValid).toBeVisible();
    await expect(certificateValid).toContainText('This certificate is valid');

    const studentName = page.locator('[data-testid="text-student-name"]');
    await expect(studentName).toContainText('Test Student');

    const courseTitle = page.locator('[data-testid="text-course-title"]');
    await expect(courseTitle).toContainText('3-Day Health Data Bootcamp');

    const completionDate = page.locator('[data-testid="text-completion-date"]');
    await expect(completionDate).toContainText('January 20, 2024');

    // Should show verification timestamp
    const verificationTime = page.locator('[data-testid="text-verification-time"]');
    await expect(verificationTime).toBeVisible();
  });

  test('Invalid certificate verification shows error', async ({ page }) => {
    // Mock invalid certificate
    await page.route('**/api/verify/cert_invalid-123', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: false,
          error: 'Certificate not found'
        })
      });
    });

    await page.goto('/verify/cert_invalid-123');

    // Should show error message
    const errorMessage = page.locator('[data-testid="text-verification-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Certificate not found');

    // Should show invalid status
    const invalidStatus = page.locator('[data-testid="text-certificate-invalid"]');
    await expect(invalidStatus).toBeVisible();
    await expect(invalidStatus).toContainText('This certificate is not valid');
  });

  test('Badge collection page shows all earned badges', async ({ page }) => {
    // Mock comprehensive badge collection
    await page.route('**/api/user/badges', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'FHIR_LOOP_CLOSER',
            name: 'FHIR Loop Closer',
            description: 'Successfully completed full FHIR data lifecycle',
            points_value: 75,
            earned_at: '2024-01-20T16:00:00Z'
          },
          {
            id: 'QUIZ_MASTER',
            name: 'Quiz Master',
            description: 'Achieved perfect scores on all quizzes',
            points_value: 25,
            earned_at: '2024-01-18T14:30:00Z'
          },
          {
            id: 'BYOD_CHAMP',
            name: 'BYOD Champion',
            description: 'Successfully integrated personal device data',
            points_value: 50,
            earned_at: '2024-01-15T11:45:00Z'
          }
        ])
      });
    });

    await page.goto('/badges');

    // Should show badges collection page
    const badgeCollection = page.locator('[data-testid="page-badge-collection"]');
    await expect(badgeCollection).toBeVisible();

    // Should show total badges count
    const badgeCount = page.locator('[data-testid="text-badges-earned"]');
    await expect(badgeCount).toContainText('3 badges earned');

    // Should show total points from badges
    const totalPoints = page.locator('[data-testid="text-badge-points-total"]');
    await expect(totalPoints).toContainText('150 points from badges');

    // Should display all badges in grid
    const badgeGrid = page.locator('[data-testid="grid-badges"]');
    const badges = badgeGrid.locator('[data-testid^="badge-"]');
    await expect(badges).toHaveCount(3);

    // Should be able to view badge details
    const firstBadge = page.locator('[data-testid="badge-FHIR_LOOP_CLOSER"]');
    await firstBadge.click();

    const badgeModal = page.locator('[data-testid="modal-badge-details"]');
    await expect(badgeModal).toBeVisible();
    await expect(badgeModal).toContainText('FHIR Loop Closer');
    await expect(badgeModal).toContainText('75 points');
  });

  test('Certificate download generates PDF', async ({ page }) => {
    await page.goto('/courses/health-data-bootcamp');

    // Mock PDF download
    const downloadPromise = page.waitForEvent('download');
    
    const downloadButton = page.locator('[data-testid="button-download-certificate"]');
    await downloadButton.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('certificate');
    expect(download.suggestedFilename()).toContain('.pdf');
  });
});