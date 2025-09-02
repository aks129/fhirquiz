/**
 * Course Gating Tests
 * 
 * Tests free course accessibility, paid course blocking until checkout,
 * and trial unlock with expiration handling.
 */

import { test, expect } from '@playwright/test';

test.describe('Course Gating System', () => {

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
          fhir_points: 100
        })
      });
    });

    // Mock courses API
    await page.route('**/api/courses', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            slug: 'fhir-101',
            title: 'FHIR Fundamentals',
            is_free: true,
            requires_product_sku: null
          },
          {
            slug: 'health-data-bootcamp',
            title: '3-Day Health Data Bootcamp',
            is_free: false,
            requires_product_sku: 'bootcamp_basic'
          },
          {
            slug: 'fhir-deep-dive',
            title: 'FHIR Deep Dive',
            is_free: false,
            requires_product_sku: 'bootcamp_plus'
          }
        ])
      });
    });
  });

  test('Free course is accessible without purchase', async ({ page }) => {
    // Mock user purchases (no purchases)
    await page.route('**/api/purchases', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/courses');

    // Find free course card
    const freeCourse = page.locator('[data-testid="card-course-fhir-101"]');
    await expect(freeCourse).toBeVisible();
    
    // Should show "Start Course" button
    const startButton = freeCourse.locator('[data-testid="button-start-course"]');
    await expect(startButton).toBeVisible();
    await expect(startButton).toContainText('Start Course');
    
    // Should not show purchase requirement
    const purchaseRequired = freeCourse.locator('[data-testid="text-purchase-required"]');
    await expect(purchaseRequired).not.toBeVisible();

    // Click to start course
    await startButton.click();
    
    // Should navigate to course content
    await expect(page).toHaveURL('/courses/fhir-101');
    
    // Should show course content
    const courseContent = page.locator('[data-testid="course-content"]');
    await expect(courseContent).toBeVisible();
  });

  test('Paid course blocked until checkout', async ({ page }) => {
    // Mock user with no purchases
    await page.route('**/api/purchases', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/courses');

    // Find paid course card
    const paidCourse = page.locator('[data-testid="card-course-health-data-bootcamp"]');
    await expect(paidCourse).toBeVisible();
    
    // Should show purchase requirement
    const purchaseRequired = paidCourse.locator('[data-testid="text-purchase-required"]');
    await expect(purchaseRequired).toBeVisible();
    await expect(purchaseRequired).toContainText('Requires: Basic Bootcamp');
    
    // Should show "Buy Now" button
    const buyButton = paidCourse.locator('[data-testid="button-buy-course"]');
    await expect(buyButton).toBeVisible();
    await expect(buyButton).toContainText('Buy Now');

    // Try to access course directly
    await page.goto('/courses/health-data-bootcamp');
    
    // Should show access blocked message
    const blockedMessage = page.locator('[data-testid="text-course-blocked"]');
    await expect(blockedMessage).toBeVisible();
    await expect(blockedMessage).toContainText('This course requires a purchase');
    
    // Should show checkout button
    const checkoutButton = page.locator('[data-testid="button-checkout-course"]');
    await expect(checkoutButton).toBeVisible();
  });

  test('Course accessible after purchase', async ({ page }) => {
    // Mock user with active purchase
    await page.route('**/api/purchases', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'purchase-123',
            user_id: 'test-user-123',
            product_sku: 'bootcamp_basic',
            status: 'active',
            purchased_at: new Date().toISOString()
          }
        ])
      });
    });

    await page.goto('/courses');

    // Find paid course that user has purchased
    const paidCourse = page.locator('[data-testid="card-course-health-data-bootcamp"]');
    await expect(paidCourse).toBeVisible();
    
    // Should show "Continue Course" button
    const continueButton = paidCourse.locator('[data-testid="button-continue-course"]');
    await expect(continueButton).toBeVisible();
    await expect(continueButton).toContainText('Continue Course');
    
    // Should show purchased indicator
    const purchasedBadge = paidCourse.locator('[data-testid="badge-purchased"]');
    await expect(purchasedBadge).toBeVisible();

    // Click to continue course
    await continueButton.click();
    
    // Should navigate to course content
    await expect(page).toHaveURL('/courses/health-data-bootcamp');
    
    // Should show course content
    const courseContent = page.locator('[data-testid="course-content"]');
    await expect(courseContent).toBeVisible();
  });

  test('Trial subscription unlocks course temporarily', async ({ page }) => {
    // Mock user with trialing subscription
    const trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    
    await page.route('**/api/purchases', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'subscription-456',
            user_id: 'test-user-123',
            product_sku: 'bootcamp_plus',
            status: 'trialing',
            trial_ends_at: trialEndDate.toISOString(),
            purchased_at: new Date().toISOString()
          }
        ])
      });
    });

    await page.goto('/courses');

    // Find premium course
    const premiumCourse = page.locator('[data-testid="card-course-fhir-deep-dive"]');
    await expect(premiumCourse).toBeVisible();
    
    // Should show trial access indicator
    const trialBadge = premiumCourse.locator('[data-testid="badge-trial-access"]');
    await expect(trialBadge).toBeVisible();
    await expect(trialBadge).toContainText('Trial Access');
    
    // Should show trial expiration date
    const trialExpiry = premiumCourse.locator('[data-testid="text-trial-expires"]');
    await expect(trialExpiry).toBeVisible();
    await expect(trialExpiry).toContainText('Trial expires');

    // Should be able to access course
    const accessButton = premiumCourse.locator('[data-testid="button-start-trial-course"]');
    await expect(accessButton).toBeVisible();
    await accessButton.click();
    
    await expect(page).toHaveURL('/courses/fhir-deep-dive');
    
    // Should show trial warning banner
    const trialWarning = page.locator('[data-testid="banner-trial-warning"]');
    await expect(trialWarning).toBeVisible();
    await expect(trialWarning).toContainText('You are accessing this course with trial access');
  });

  test('Expired trial blocks course access', async ({ page }) => {
    // Mock user with expired trial
    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    
    await page.route('**/api/purchases', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'subscription-expired',
            user_id: 'test-user-123',
            product_sku: 'bootcamp_plus',
            status: 'past_due',
            trial_ends_at: expiredDate.toISOString(),
            purchased_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        ])
      });
    });

    await page.goto('/courses/fhir-deep-dive');
    
    // Should show expired trial message
    const expiredMessage = page.locator('[data-testid="text-trial-expired"]');
    await expect(expiredMessage).toBeVisible();
    await expect(expiredMessage).toContainText('Your trial has expired');
    
    // Should show upgrade options
    const upgradeButton = page.locator('[data-testid="button-upgrade-subscription"]');
    await expect(upgradeButton).toBeVisible();
    await expect(upgradeButton).toContainText('Upgrade to Full Access');
  });

  test('Course gating respects product hierarchy', async ({ page }) => {
    // Mock user with basic bootcamp purchase
    await page.route('**/api/purchases', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'purchase-basic',
            user_id: 'test-user-123',
            product_sku: 'bootcamp_basic',
            status: 'active'
          }
        ])
      });
    });

    await page.goto('/courses');

    // Basic bootcamp course should be accessible
    const basicCourse = page.locator('[data-testid="card-course-health-data-bootcamp"]');
    const basicButton = basicCourse.locator('[data-testid="button-continue-course"]');
    await expect(basicButton).toBeVisible();

    // Premium course should still require upgrade
    const premiumCourse = page.locator('[data-testid="card-course-fhir-deep-dive"]');
    const upgradeRequired = premiumCourse.locator('[data-testid="text-upgrade-required"]');
    await expect(upgradeRequired).toBeVisible();
    await expect(upgradeRequired).toContainText('Requires: Plus Bootcamp');
  });

  test('Checkout flow integration', async ({ page }) => {
    await page.goto('/courses');

    const paidCourse = page.locator('[data-testid="card-course-health-data-bootcamp"]');
    const buyButton = paidCourse.locator('[data-testid="button-buy-course"]');
    
    // Mock Stripe checkout session creation
    await page.route('**/api/checkout/create-session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          checkout_url: 'https://checkout.stripe.com/pay/test-session'
        })
      });
    });

    await buyButton.click();
    
    // Should redirect to Stripe checkout
    await page.waitForURL('https://checkout.stripe.com/**');
    expect(page.url()).toContain('checkout.stripe.com');
  });
});