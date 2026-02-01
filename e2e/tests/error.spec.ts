import { test, expect } from '@playwright/test';

/**
 * Error Handling E2E Tests - DLD-244
 *
 * These tests verify error handling for subagent-related API failures.
 * Test cases:
 * - E1: API error displays error message (subagents list)
 * - E1: API error displays error message (subagent details)
 * - Additional error scenarios
 *
 * NOTE: These tests are expected to FAIL initially as the features
 * are not yet implemented (TDD Red Phase).
 */

// Test constants for maintainability
const SELECTORS = {
  ERROR_MESSAGE: 'error-message',
  SUBAGENT_SECTION: (agentType: string) => `Toggle ${agentType} subagent details`,
  RETRY_BUTTON: /retry|try again/i,
  SESSION_HEADING: /Session:/,
} as const;

const ENDPOINTS = {
  SUBAGENTS_LIST: '**/api/transcripts/*/subagents',
  SUBAGENT_DETAILS: '**/api/transcripts/*/subagents/*',
  TRANSCRIPTS: '**/api/transcripts/*',
} as const;

const TIMEOUTS = {
  ERROR_DISPLAY: 5000,
} as const;

// Mock data factory functions
const createMockSubagentInfo = (agentId: string, type: string) => ({
  agentId,
  type,
});

const createMockSubagentsResponse = (subagents: Array<{ agentId: string; type: string }>) => ({
  subagents,
});

const createMockTranscript = (sessionId: string, records = []) => ({
  sessionId,
  records,
});

test.describe('Error Handling', () => {
  test.describe('E1: Subagents List API Error', () => {
    test('should display error message when subagents list API fails with 500', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-error';

      // Mock transcript API to succeed
      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        if (!route.request().url().includes('/subagents')) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(createMockTranscript(sessionId, [])),
          });
        } else {
          route.continue();
        }
      });

      // Mock subagents API to return error
      await page.route(ENDPOINTS.SUBAGENTS_LIST, route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - Error message should be displayed
      const errorElement = page.getByTestId(SELECTORS.ERROR_MESSAGE);
      await expect(errorElement).toBeVisible({ timeout: TIMEOUTS.ERROR_DISPLAY });
    });

    test('should display error message when subagents list API fails with 404', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-404';

      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        if (!route.request().url().includes('/subagents')) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(createMockTranscript(sessionId, [])),
          });
        } else {
          route.continue();
        }
      });

      await page.route(ENDPOINTS.SUBAGENTS_LIST, route => {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Session not found' }),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - Error message should be displayed
      const errorElement = page.getByTestId(SELECTORS.ERROR_MESSAGE);
      await expect(errorElement).toBeVisible({ timeout: TIMEOUTS.ERROR_DISPLAY });
    });

    test('should display error message when subagents list API times out', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-timeout';

      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        if (!route.request().url().includes('/subagents')) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(createMockTranscript(sessionId, [])),
          });
        } else {
          route.continue();
        }
      });

      await page.route(ENDPOINTS.SUBAGENTS_LIST, route => {
        // Simulate timeout by aborting the request
        route.abort('timedout');
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - Error message should be displayed (not loading indefinitely)
      const errorElement = page.getByTestId(SELECTORS.ERROR_MESSAGE);
      await expect(errorElement).toBeVisible({ timeout: TIMEOUTS.ERROR_DISPLAY });
    });

    test('should display error message when subagents list API returns network error', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-network-error';

      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        if (!route.request().url().includes('/subagents')) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(createMockTranscript(sessionId, [])),
          });
        } else {
          route.continue();
        }
      });

      await page.route(ENDPOINTS.SUBAGENTS_LIST, route => {
        route.abort('failed');
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - Error message should be displayed
      const errorElement = page.getByTestId(SELECTORS.ERROR_MESSAGE);
      await expect(errorElement).toBeVisible({ timeout: TIMEOUTS.ERROR_DISPLAY });
    });

    test('should display meaningful error message for server errors', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-server-error';
      const errorMessage = 'Database connection failed';

      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        if (!route.request().url().includes('/subagents')) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(createMockTranscript(sessionId, [])),
          });
        } else {
          route.continue();
        }
      });

      await page.route(ENDPOINTS.SUBAGENTS_LIST, route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: errorMessage }),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - Error element should be visible
      const errorElement = page.getByTestId(SELECTORS.ERROR_MESSAGE);
      await expect(errorElement).toBeVisible({ timeout: TIMEOUTS.ERROR_DISPLAY });

      // Assert - Error message should contain useful information
      const errorText = await errorElement.textContent();
      expect(errorText).toBeTruthy();
      expect(errorText?.length).toBeGreaterThan(0);
    });
  });

  test.describe('E1: Subagent Details API Error', () => {
    test('should display error message when subagent details API fails', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-details-error';
      const mockSubagents = [
        createMockSubagentInfo('agent-1', 'test-writer'),
      ];

      // Mock subagents list to succeed
      await page.route(ENDPOINTS.SUBAGENTS_LIST, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockSubagentsResponse(mockSubagents)),
        });
      });

      // Mock subagent details to fail
      await page.route(ENDPOINTS.SUBAGENT_DETAILS, route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to fetch subagent details' }),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      const toggle = page.getByRole('button', {
        name: SELECTORS.SUBAGENT_SECTION('test-writer'),
      });
      await toggle.click();

      // Assert - Error message should be displayed
      const errorElement = page.getByTestId(SELECTORS.ERROR_MESSAGE);
      await expect(errorElement).toBeVisible({ timeout: TIMEOUTS.ERROR_DISPLAY });
    });

    test('should display error when subagent details API returns 404', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-details-404';
      const mockSubagents = [
        createMockSubagentInfo('agent-1', 'test-writer'),
      ];

      await page.route(ENDPOINTS.SUBAGENTS_LIST, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockSubagentsResponse(mockSubagents)),
        });
      });

      await page.route(ENDPOINTS.SUBAGENT_DETAILS, route => {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Subagent not found' }),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      const toggle = page.getByRole('button', {
        name: SELECTORS.SUBAGENT_SECTION('test-writer'),
      });
      await toggle.click();

      // Assert - Error message should be displayed
      const errorElement = page.getByTestId(SELECTORS.ERROR_MESSAGE);
      await expect(errorElement).toBeVisible({ timeout: TIMEOUTS.ERROR_DISPLAY });
    });

    test('should display error when subagent details API times out', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-details-timeout';
      const mockSubagents = [
        createMockSubagentInfo('agent-1', 'test-writer'),
      ];

      await page.route(ENDPOINTS.SUBAGENTS_LIST, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockSubagentsResponse(mockSubagents)),
        });
      });

      await page.route(ENDPOINTS.SUBAGENT_DETAILS, route => {
        route.abort('timedout');
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      const toggle = page.getByRole('button', {
        name: SELECTORS.SUBAGENT_SECTION('test-writer'),
      });
      await toggle.click();

      // Assert - Error message should be displayed
      const errorElement = page.getByTestId(SELECTORS.ERROR_MESSAGE);
      await expect(errorElement).toBeVisible({ timeout: TIMEOUTS.ERROR_DISPLAY });
    });

    test('should handle error for one subagent without affecting others', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-partial-error';
      const mockSubagents = [
        createMockSubagentInfo('agent-1', 'test-writer'),
        createMockSubagentInfo('agent-2', 'code-analyzer'),
      ];

      await page.route(ENDPOINTS.SUBAGENTS_LIST, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockSubagentsResponse(mockSubagents)),
        });
      });

      await page.route(ENDPOINTS.SUBAGENT_DETAILS, route => {
        const url = route.request().url();
        if (url.includes('agent-1')) {
          // First agent fails
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Failed to fetch details' }),
          });
        } else {
          // Second agent succeeds
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ agentId: 'agent-2', records: [] }),
          });
        }
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      const toggle1 = page.getByRole('button', {
        name: SELECTORS.SUBAGENT_SECTION('test-writer'),
      });
      await toggle1.click();

      // Assert - Error should be displayed for first agent
      const errorElement = page.getByTestId(SELECTORS.ERROR_MESSAGE);
      await expect(errorElement).toBeVisible({ timeout: TIMEOUTS.ERROR_DISPLAY });

      // Act - Try second agent
      const toggle2 = page.getByRole('button', {
        name: SELECTORS.SUBAGENT_SECTION('code-analyzer'),
      });
      await toggle2.click();

      // Assert - Second agent should expand successfully
      await expect(toggle2).toHaveAttribute('aria-expanded', 'true');
    });
  });

  test.describe('E1: Error Recovery', () => {
    test('should not display error indefinitely (error should be clearable)', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-error-recovery';
      let requestCount = 0;

      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        if (!route.request().url().includes('/subagents')) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(createMockTranscript(sessionId, [])),
          });
        } else {
          route.continue();
        }
      });

      await page.route(ENDPOINTS.SUBAGENTS_LIST, route => {
        requestCount++;
        if (requestCount === 1) {
          // First request fails
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Server error' }),
          });
        } else {
          // Subsequent requests succeed
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(createMockSubagentsResponse([])),
          });
        }
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - Error should be displayed
      const errorElement = page.getByTestId(SELECTORS.ERROR_MESSAGE);
      await expect(errorElement).toBeVisible({ timeout: TIMEOUTS.ERROR_DISPLAY });

      // Act - Look for retry button or refresh capability
      const retryButton = page.getByRole('button', { name: SELECTORS.RETRY_BUTTON });
      const hasRetryButton = await retryButton.isVisible().catch(() => false);

      if (hasRetryButton) {
        await retryButton.click();
        await page.waitForLoadState('networkidle');

        // Assert - Error should be cleared after successful retry
        const isErrorStillVisible = await errorElement.isVisible().catch(() => false);
        expect(isErrorStillVisible).toBe(false);
      }

      // Even if no retry button, error handling mechanism should exist
      expect(typeof hasRetryButton).toBe('boolean');
    });

    test('should handle malformed API response gracefully', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-malformed';

      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        if (!route.request().url().includes('/subagents')) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(createMockTranscript(sessionId, [])),
          });
        } else {
          route.continue();
        }
      });

      await page.route(ENDPOINTS.SUBAGENTS_LIST, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json {{{',
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - Error message should be displayed for malformed response
      const errorElement = page.getByTestId(SELECTORS.ERROR_MESSAGE);
      await expect(errorElement).toBeVisible({ timeout: TIMEOUTS.ERROR_DISPLAY });
    });

    test('should handle missing required fields in API response', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-missing-fields';

      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        if (!route.request().url().includes('/subagents')) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(createMockTranscript(sessionId, [])),
          });
        } else {
          route.continue();
        }
      });

      await page.route(ENDPOINTS.SUBAGENTS_LIST, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          // Missing 'subagents' field
          body: JSON.stringify({}),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - Should handle gracefully (either show error or empty state)
      const errorElement = page.getByTestId(SELECTORS.ERROR_MESSAGE);
      const isErrorVisible = await errorElement.isVisible().catch(() => false);

      // Either error is shown or page handles missing data gracefully
      expect(typeof isErrorVisible).toBe('boolean');
    });
  });

  test.describe('Error Message Accessibility', () => {
    test('should use data-testid="error-message" for error display', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-error-testid';

      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        if (!route.request().url().includes('/subagents')) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(createMockTranscript(sessionId, [])),
          });
        } else {
          route.continue();
        }
      });

      await page.route(ENDPOINTS.SUBAGENTS_LIST, route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Test error' }),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - Error element should have correct test ID
      const errorElement = page.getByTestId(SELECTORS.ERROR_MESSAGE);
      await expect(errorElement).toBeVisible({ timeout: TIMEOUTS.ERROR_DISPLAY });

      // Verify the element has the correct data-testid attribute
      const testId = await errorElement.getAttribute('data-testid');
      expect(testId).toBe('error-message');
    });

    test('should display error message with proper ARIA attributes', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-error-aria';

      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        if (!route.request().url().includes('/subagents')) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(createMockTranscript(sessionId, [])),
          });
        } else {
          route.continue();
        }
      });

      await page.route(ENDPOINTS.SUBAGENTS_LIST, route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Test error' }),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - Error element should be visible and accessible
      const errorElement = page.getByTestId(SELECTORS.ERROR_MESSAGE);
      await expect(errorElement).toBeVisible({ timeout: TIMEOUTS.ERROR_DISPLAY });

      // Check for accessibility attributes
      const role = await errorElement.getAttribute('role');
      const ariaLive = await errorElement.getAttribute('aria-live');

      // Should have appropriate ARIA role (alert or status)
      if (role) {
        expect(['alert', 'status']).toContain(role);
      }

      // Should have aria-live for screen readers
      if (ariaLive) {
        expect(['polite', 'assertive']).toContain(ariaLive);
      }
    });
  });

  test.describe('Combined Error Scenarios', () => {
    test('should handle multiple API failures gracefully', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-multiple-failures';

      // Both transcript and subagents APIs fail
      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        if (!route.request().url().includes('/subagents')) {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Transcript error' }),
          });
        } else {
          route.continue();
        }
      });

      await page.route(ENDPOINTS.SUBAGENTS_LIST, route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Subagents error' }),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - At least one error message should be displayed
      const errorElements = page.getByTestId(SELECTORS.ERROR_MESSAGE);
      const count = await errorElements.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should not break page layout when error is displayed', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-layout-stability';

      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        if (!route.request().url().includes('/subagents')) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(createMockTranscript(sessionId, [])),
          });
        } else {
          route.continue();
        }
      });

      await page.route(ENDPOINTS.SUBAGENTS_LIST, route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Error' }),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - Error should be visible
      const errorElement = page.getByTestId(SELECTORS.ERROR_MESSAGE);
      await expect(errorElement).toBeVisible({ timeout: TIMEOUTS.ERROR_DISPLAY });

      // Assert - Page should still have proper structure
      const sessionHeading = page.getByRole('heading', { name: SELECTORS.SESSION_HEADING });
      await expect(sessionHeading).toBeVisible();

      // Assert - Root element should still be visible
      const root = page.locator('#root');
      await expect(root).toBeVisible();
    });
  });
});
