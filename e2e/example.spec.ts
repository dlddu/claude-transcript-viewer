import { test, expect } from '@playwright/test';

test.describe('Playwright Setup Verification', () => {
  test.describe('Homepage', () => {
    test('should load the homepage successfully', async ({ page }) => {
      // Arrange & Act
      await page.goto('/');

      // Assert - Check page is loaded
      await expect(page).toHaveURL('/');
    });

    test('should display the homepage title', async ({ page }) => {
      // Arrange & Act
      await page.goto('/');

      // Assert - Check for "Home" heading
      const heading = page.getByRole('heading', { name: 'Home' });
      await expect(heading).toBeVisible();
    });

    test('should display the welcome message', async ({ page }) => {
      // Arrange & Act
      await page.goto('/');

      // Assert - Check for welcome text
      const welcomeText = page.getByText('Welcome to Claude Transcript Viewer');
      await expect(welcomeText).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should have a valid document title', async ({ page }) => {
      // Arrange & Act
      await page.goto('/');

      // Assert - Check document title exists
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });

    test('should navigate to homepage from root path', async ({ page }) => {
      // Arrange & Act
      await page.goto('/');

      // Assert - Verify we can access the page without errors
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Basic Functionality', () => {
    test('should render without JavaScript errors', async ({ page }) => {
      // Arrange
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      // Act
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Assert - No JavaScript errors occurred
      expect(errors).toHaveLength(0);
    });

    test('should have responsive layout', async ({ page }) => {
      // Arrange & Act
      await page.goto('/');

      // Assert - Check main container exists
      const container = page.locator('.max-w-4xl');
      await expect(container).toBeVisible();
    });
  });
});
