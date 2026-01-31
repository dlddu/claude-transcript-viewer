import { test, expect } from '@playwright/test';

test.describe('Claude Transcript Viewer E2E', () => {
  test('should load home page successfully', async ({ page }) => {
    // Arrange & Act
    await page.goto('/');

    // Assert
    await expect(page).toHaveTitle(/Claude Transcript Viewer/);
  });

  test('should display welcome message on home page', async ({ page }) => {
    // Arrange & Act
    await page.goto('/');

    // Assert
    const welcomeText = page.getByText('Welcome to Claude Transcript Viewer');
    await expect(welcomeText).toBeVisible();
  });

  test('should display Home heading on home page', async ({ page }) => {
    // Arrange & Act
    await page.goto('/');

    // Assert
    const heading = page.getByRole('heading', { name: 'Home' });
    await expect(heading).toBeVisible();
  });

  test('should navigate to session page', async ({ page }) => {
    // Arrange
    await page.goto('/');

    // Act
    await page.goto('/session/test-session-123');

    // Assert
    await expect(page).toHaveURL(/\/session\/test-session-123/);
  });
});
