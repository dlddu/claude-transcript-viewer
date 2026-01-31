import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - DLD-240
 *
 * Basic tests to ensure the application is up and running.
 * These tests verify:
 * 1. Frontend is accessible
 * 2. Backend API is accessible
 * 3. Basic UI elements are present
 */

test.describe('Smoke Tests', () => {
  test.describe('Frontend Accessibility', () => {
    test('should load frontend page successfully', async ({ page }) => {
      // Arrange & Act
      const response = await page.goto('/');

      // Assert
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(/Claude Transcript Viewer/);
    });

    test('should display main UI elements on home page', async ({ page }) => {
      // Arrange & Act
      await page.goto('/');

      // Assert - Check for key UI elements
      const welcomeText = page.getByText('Welcome to Claude Transcript Viewer');
      await expect(welcomeText).toBeVisible();
    });

    test('should have valid HTML structure', async ({ page }) => {
      // Arrange & Act
      await page.goto('/');

      // Assert
      const root = page.locator('#root');
      await expect(root).toBeVisible();
    });
  });

  test.describe('Backend API Accessibility', () => {
    test('should access backend health endpoint', async ({ request }) => {
      // Arrange
      const backendUrl = 'http://localhost:3001';

      // Act
      const response = await request.get(`${backendUrl}/health`);

      // Assert
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('status', 'ok');
      expect(body).toHaveProperty('timestamp');
    });

    test('should have backend API responding', async ({ request }) => {
      // Arrange
      const backendUrl = 'http://localhost:3001';

      // Act
      const response = await request.get(`${backendUrl}/api/sessions`);

      // Assert
      // API should respond (200 or 500 depending on S3 setup)
      // We just want to ensure the endpoint is accessible
      expect([200, 500]).toContain(response.status());
    });
  });

  test.describe('Basic Functionality', () => {
    test('should navigate between pages', async ({ page }) => {
      // Arrange
      await page.goto('/');

      // Act - Try to navigate to a session page
      await page.goto('/session/test-session-id');

      // Assert
      await expect(page).toHaveURL(/\/session\/test-session-id/);
    });

    test('should load without console errors', async ({ page }) => {
      // Arrange
      const consoleErrors: string[] = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Act
      await page.goto('/');

      // Assert
      // Allow certain known errors (e.g., 404 for missing resources in dev)
      const criticalErrors = consoleErrors.filter(error =>
        !error.includes('404') && !error.includes('favicon')
      );

      expect(criticalErrors).toHaveLength(0);
    });

    test('should have responsive design', async ({ page }) => {
      // Arrange & Act
      await page.goto('/');

      // Assert - Check that page renders in mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      const root = page.locator('#root');
      await expect(root).toBeVisible();

      // Assert - Check that page renders in desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(root).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load page within acceptable time', async ({ page }) => {
      // Arrange
      const startTime = Date.now();

      // Act
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Assert - Page should load within 5 seconds
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000);
    });
  });
});
