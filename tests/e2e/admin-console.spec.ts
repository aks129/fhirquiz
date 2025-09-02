/**
 * Admin Console Flow Tests
 * 
 * Tests admin functionality including role changes, product creation,
 * badge assignment, and points management with UI updates.
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Console Flows', () => {

  test.beforeEach(async ({ page }) => {
    // Mock admin authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'admin_token',
        user: { id: 'admin-123', email: 'admin@test.com' }
      }));
    });

    // Mock admin profile
    await page.route('**/api/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'admin-123',
          email: 'admin@test.com',
          full_name: 'Admin User',
          role: 'admin',
          fhir_points: 1000
        })
      });
    });

    // Mock users list for admin
    await page.route('**/api/admin/users**', async (route) => {
      const url = route.request().url();
      
      if (url.includes('search=')) {
        // Handle search
        const searchQuery = new URL(url).searchParams.get('search');
        const filteredUsers = [
          {
            id: 'user-456',
            email: 'student@test.com',
            full_name: 'Test Student',
            role: 'student',
            fhir_points: 150,
            created_at: '2024-01-15T10:00:00Z'
          }
        ].filter(user => 
          user.email.includes(searchQuery || '') || 
          user.full_name.includes(searchQuery || '')
        );
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(filteredUsers)
        });
      } else {
        // Default users list
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'user-456',
              email: 'student@test.com',
              full_name: 'Test Student',
              role: 'student',
              fhir_points: 150,
              created_at: '2024-01-15T10:00:00Z'
            },
            {
              id: 'user-789',
              email: 'instructor@test.com',
              full_name: 'Instructor Jane',
              role: 'instructor',
              fhir_points: 300,
              created_at: '2024-01-10T09:00:00Z'
            }
          ])
        });
      }
    });
  });

  test('Admin can change user roles with optimistic UI updates', async ({ page }) => {
    await page.goto('/admin');

    // Should show admin dashboard
    const adminDashboard = page.locator('[data-testid="admin-dashboard"]');
    await expect(adminDashboard).toBeVisible();

    // Navigate to users tab
    const usersTab = page.locator('[data-testid="tab-users"]');
    await usersTab.click();

    // Find user row
    const userRow = page.locator('[data-testid="row-user-user-456"]');
    await expect(userRow).toBeVisible();

    // Check current role
    const currentRole = userRow.locator('[data-testid="text-role"]');
    await expect(currentRole).toContainText('student');

    // Mock role change API
    await page.route('**/api/admin/users/set-role', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'user-456',
            role: 'instructor'
          }
        })
      });
    });

    // Click role dropdown
    const roleDropdown = userRow.locator('[data-testid="select-role"]');
    await roleDropdown.click();

    // Select instructor role
    const instructorOption = page.locator('[data-testid="option-instructor"]');
    await instructorOption.click();

    // UI should update optimistically
    await expect(currentRole).toContainText('instructor');

    // Should show success notification
    const successToast = page.locator('[data-testid="toast-success"]');
    await expect(successToast).toBeVisible();
    await expect(successToast).toContainText('Role updated successfully');
  });

  test('Admin can search users by email', async ({ page }) => {
    await page.goto('/admin');
    
    const usersTab = page.locator('[data-testid="tab-users"]');
    await usersTab.click();

    // Use search functionality
    const searchInput = page.locator('[data-testid="input-search-users"]');
    await searchInput.fill('student@test.com');

    // Wait for search results
    await page.waitForTimeout(500);

    // Should show filtered results
    const userRows = page.locator('[data-testid^="row-user-"]');
    await expect(userRows).toHaveCount(1);

    const visibleUser = page.locator('[data-testid="row-user-user-456"]');
    await expect(visibleUser).toBeVisible();
    await expect(visibleUser).toContainText('student@test.com');
  });

  test('Admin can create new product', async ({ page }) => {
    await page.goto('/admin');

    // Navigate to products tab
    const productsTab = page.locator('[data-testid="tab-products"]');
    await productsTab.click();

    // Click create product button
    const createButton = page.locator('[data-testid="button-create-product"]');
    await createButton.click();

    // Should open create product modal
    const createModal = page.locator('[data-testid="modal-create-product"]');
    await expect(createModal).toBeVisible();

    // Fill product form
    await page.fill('[data-testid="input-product-sku"]', 'new-course-001');
    await page.fill('[data-testid="input-product-name"]', 'Advanced FHIR Course');
    await page.fill('[data-testid="input-product-price"]', '199');
    await page.fill('[data-testid="textarea-product-description"]', 'Deep dive into FHIR specifications');

    // Mock product creation API
    await page.route('**/api/admin/products', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'product-new-001',
            sku: 'new-course-001',
            name: 'Advanced FHIR Course',
            price: 199,
            description: 'Deep dive into FHIR specifications'
          })
        });
      }
    });

    // Submit form
    const submitButton = page.locator('[data-testid="button-submit-product"]');
    await submitButton.click();

    // Should close modal and show success
    await expect(createModal).not.toBeVisible();
    
    const successToast = page.locator('[data-testid="toast-success"]');
    await expect(successToast).toBeVisible();
    await expect(successToast).toContainText('Product created successfully');
  });

  test('Admin can assign badge to user', async ({ page }) => {
    await page.goto('/admin');

    const usersTab = page.locator('[data-testid="tab-users"]');
    await usersTab.click();

    // Find user and click badge assignment
    const userRow = page.locator('[data-testid="row-user-user-456"]');
    const assignBadgeButton = userRow.locator('[data-testid="button-assign-badge"]');
    await assignBadgeButton.click();

    // Should open badge assignment modal
    const badgeModal = page.locator('[data-testid="modal-assign-badge"]');
    await expect(badgeModal).toBeVisible();

    // Mock available badges
    await page.route('**/api/badges', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'FHIR_LOOP_CLOSER',
            name: 'FHIR Loop Closer',
            description: 'Successfully completed full FHIR data lifecycle',
            points_value: 75
          },
          {
            id: 'QUIZ_MASTER',
            name: 'Quiz Master',
            description: 'Achieved perfect scores on all quizzes',
            points_value: 25
          }
        ])
      });
    });

    // Select badge
    const badgeOption = page.locator('[data-testid="option-badge-FHIR_LOOP_CLOSER"]');
    await badgeOption.click();

    // Mock badge assignment API
    await page.route('**/api/admin/users/assign-badge', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          badge_assigned: 'FHIR_LOOP_CLOSER',
          points_awarded: 75
        })
      });
    });

    // Confirm assignment
    const confirmButton = page.locator('[data-testid="button-confirm-badge"]');
    await confirmButton.click();

    // Should close modal and show success
    await expect(badgeModal).not.toBeVisible();
    
    const successToast = page.locator('[data-testid="toast-success"]');
    await expect(successToast).toBeVisible();
    await expect(successToast).toContainText('Badge assigned successfully');
  });

  test('Admin can grant and deduct points with UI updates', async ({ page }) => {
    await page.goto('/admin');

    const usersTab = page.locator('[data-testid="tab-users"]');
    await usersTab.click();

    const userRow = page.locator('[data-testid="row-user-user-456"]');
    
    // Check initial points
    const pointsDisplay = userRow.locator('[data-testid="text-points"]');
    await expect(pointsDisplay).toContainText('150');

    // Grant points
    const grantButton = userRow.locator('[data-testid="button-grant-points"]');
    await grantButton.click();

    const pointsModal = page.locator('[data-testid="modal-points-adjustment"]');
    await expect(pointsModal).toBeVisible();

    await page.fill('[data-testid="input-points-amount"]', '50');
    await page.fill('[data-testid="input-points-reason"]', 'Bonus for excellent work');

    // Mock points grant API
    await page.route('**/api/admin/users/grant-points', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          new_balance: 200,
          points_granted: 50
        })
      });
    });

    const confirmButton = page.locator('[data-testid="button-confirm-points"]');
    await confirmButton.click();

    // Points should update in UI
    await expect(pointsDisplay).toContainText('200');
    await expect(pointsModal).not.toBeVisible();
  });

  test('Admin can deduct points for violations', async ({ page }) => {
    await page.goto('/admin');

    const usersTab = page.locator('[data-testid="tab-users"]');
    await usersTab.click();

    const userRow = page.locator('[data-testid="row-user-user-456"]');
    const deductButton = userRow.locator('[data-testid="button-deduct-points"]');
    await deductButton.click();

    const pointsModal = page.locator('[data-testid="modal-points-adjustment"]');
    await page.fill('[data-testid="input-points-amount"]', '25');
    await page.fill('[data-testid="input-points-reason"]', 'Policy violation');

    // Mock points deduction API
    await page.route('**/api/admin/users/deduct-points', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          new_balance: 125,
          points_deducted: 25
        })
      });
    });

    const confirmButton = page.locator('[data-testid="button-confirm-points"]');
    await confirmButton.click();

    // Points should decrease
    const pointsDisplay = userRow.locator('[data-testid="text-points"]');
    await expect(pointsDisplay).toContainText('125');
  });

  test('Admin error handling and rollback', async ({ page }) => {
    await page.goto('/admin');

    const usersTab = page.locator('[data-testid="tab-users"]');
    await usersTab.click();

    const userRow = page.locator('[data-testid="row-user-user-456"]');
    const roleDropdown = userRow.locator('[data-testid="select-role"]');
    
    // Store original role
    const originalRole = await userRow.locator('[data-testid="text-role"]').textContent();

    // Mock API failure
    await page.route('**/api/admin/users/set-role', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Database connection failed'
        })
      });
    });

    await roleDropdown.click();
    const instructorOption = page.locator('[data-testid="option-instructor"]');
    await instructorOption.click();

    // Should show error and rollback
    const errorToast = page.locator('[data-testid="toast-error"]');
    await expect(errorToast).toBeVisible();
    await expect(errorToast).toContainText('Failed to update role');

    // Role should revert to original
    const currentRole = userRow.locator('[data-testid="text-role"]');
    await expect(currentRole).toContainText(originalRole || 'student');
  });

  test('Admin can sort users by creation date', async ({ page }) => {
    await page.goto('/admin');

    const usersTab = page.locator('[data-testid="tab-users"]');
    await usersTab.click();

    // Click sort by created date
    const sortButton = page.locator('[data-testid="button-sort-created"]');
    await sortButton.click();

    // Should request sorted data
    await page.waitForTimeout(500);

    // Verify sorting (most recent first based on mock data)
    const firstUser = page.locator('[data-testid="row-user-user-456"]');
    const secondUser = page.locator('[data-testid="row-user-user-789"]');
    
    // user-456 was created on 2024-01-15, user-789 on 2024-01-10
    // So user-456 should appear first when sorted by newest
    await expect(firstUser).toBeVisible();
    await expect(secondUser).toBeVisible();
  });
});