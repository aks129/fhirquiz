/**
 * Frontend Authentication Flow Tests
 * 
 * Tests Google sign-in with mocked Supabase session injection
 * and authentication state management.
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock Supabase auth response
    await page.route('**/auth/v1/**', async (route) => {
      const url = route.request().url();
      
      if (url.includes('session')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              session: {
                access_token: 'mock_access_token',
                refresh_token: 'mock_refresh_token',
                user: {
                  id: 'test-user-123',
                  email: 'student@test.com',
                  user_metadata: {
                    full_name: 'Test Student',
                    avatar_url: 'https://example.com/avatar.jpg'
                  }
                }
              },
              user: {
                id: 'test-user-123',
                email: 'student@test.com'
              }
            }
          })
        });
      } else {
        await route.continue();
      }
    });

    // Mock user profile API
    await page.route('**/api/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user-123',
          email: 'student@test.com',
          full_name: 'Test Student',
          role: 'student',
          fhir_points: 150,
          avatar_url: 'https://example.com/avatar.jpg'
        })
      });
    });
  });

  test('Google sign-in with mocked session injection', async ({ page }) => {
    // Navigate to login page
    await page.goto('/');
    
    // Should see login button for unauthenticated users
    const loginButton = page.locator('[data-testid="button-google-signin"]');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toContainText('Sign in with Google');
    
    // Mock successful Google OAuth redirect
    await page.route('**/auth/v1/authorize**', async (route) => {
      // Simulate successful OAuth callback
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/#access_token=mock_token&token_type=bearer&expires_in=3600'
        }
      });
    });
    
    // Click login button
    await loginButton.click();
    
    // Wait for authentication state to update
    await page.waitForTimeout(1000);
    
    // Should redirect to dashboard for authenticated users
    await expect(page).toHaveURL('/dashboard');
    
    // Should show user profile info
    const userProfile = page.locator('[data-testid="user-profile"]');
    await expect(userProfile).toBeVisible();
    await expect(userProfile).toContainText('Test Student');
    
    // Should show points balance
    const pointsDisplay = page.locator('[data-testid="points-balance"]');
    await expect(pointsDisplay).toBeVisible();
    await expect(pointsDisplay).toContainText('150');
  });

  test('Logout functionality clears session', async ({ page }) => {
    // Start with authenticated state
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock_token',
        user: { id: 'test-user-123', email: 'student@test.com' }
      }));
    });
    
    await page.goto('/dashboard');
    
    // Should be on dashboard
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    
    // Click logout button
    const logoutButton = page.locator('[data-testid="button-logout"]');
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();
    
    // Should redirect to landing page
    await expect(page).toHaveURL('/');
    
    // Should show login button again
    const loginButton = page.locator('[data-testid="button-google-signin"]');
    await expect(loginButton).toBeVisible();
    
    // Session should be cleared
    const storage = await page.evaluate(() => {
      return window.localStorage.getItem('supabase.auth.token');
    });
    expect(storage).toBeNull();
  });

  test('Protected routes redirect to login', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/admin');
    
    // Should redirect to landing page
    await expect(page).toHaveURL('/');
    
    // Should show unauthorized message
    const message = page.locator('[data-testid="text-unauthorized"]');
    await expect(message).toBeVisible();
    await expect(message).toContainText('Please sign in to access this page');
  });

  test('Role-based access control for admin routes', async ({ page }) => {
    // Mock student user trying to access admin
    await page.route('**/api/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'student-user',
          email: 'student@test.com',
          role: 'student'
        })
      });
    });
    
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'student_token',
        user: { id: 'student-user', email: 'student@test.com' }
      }));
    });
    
    await page.goto('/admin');
    
    // Should show access denied message
    const accessDenied = page.locator('[data-testid="text-access-denied"]');
    await expect(accessDenied).toBeVisible();
    await expect(accessDenied).toContainText('Admin access required');
  });

  test('Session persistence across page reloads', async ({ page }) => {
    // Set authenticated session
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'persistent_token',
        refresh_token: 'refresh_token',
        user: { id: 'test-user-123', email: 'student@test.com' }
      }));
    });
    
    await page.goto('/dashboard');
    
    // Verify authenticated state
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    
    // Reload page
    await page.reload();
    
    // Should still be authenticated
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    await expect(page).toHaveURL('/dashboard');
  });
});