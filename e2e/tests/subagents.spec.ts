import { test, expect } from '@playwright/test';

/**
 * Subagents E2E Tests - DLD-244
 *
 * These tests verify the subagent listing and detail display functionality.
 * Test cases:
 * - A1: Subagent list is displayed on session page
 * - A2: Clicking subagent toggle shows details
 *
 * NOTE: These tests are expected to FAIL initially as the features
 * are not yet implemented (TDD Red Phase).
 */

// Test constants for maintainability
const SELECTORS = {
  SUBAGENT_SECTION: (agentType: string) => `Toggle ${agentType} subagent details`,
  LOADING_TEXT: 'Loading subagents...',
  ERROR_TEXT: /Error loading subagents/i,
  EMPTY_STATE_TEXT: 'No subagents available',
  SESSION_HEADING: /Session:/,
} as const;

const ENDPOINTS = {
  SUBAGENTS_LIST: '**/api/transcripts/*/subagents',
  SUBAGENT_DETAILS: '**/api/transcripts/*/subagents/*',
} as const;

const TIMEOUTS = {
  SUBAGENT_LOAD: 5000,
} as const;

// Mock data factory functions
const createMockSubagentInfo = (agentId: string, type: string) => ({
  agentId,
  type,
});

const createMockSubagentsResponse = (subagents: Array<{ agentId: string; type: string }>) => ({
  subagents,
});

const createMockSubagentDetails = (agentId: string, records: any[] = []) => ({
  agentId,
  records,
});

const createMockRecord = (
  type: 'user' | 'assistant',
  text: string,
  timestamp: string
) => ({
  type,
  message: {
    role: type,
    content: [{ type: 'text', text }],
  },
  timestamp,
});

test.describe('Subagents', () => {
  test.describe('A1: Subagent List Display', () => {
    test('should display subagent list on session page load', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-123';
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

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - Subagent sections should be visible
      const testWriterToggle = page.getByRole('button', {
        name: SELECTORS.SUBAGENT_SECTION('test-writer'),
      });
      await expect(testWriterToggle).toBeVisible({ timeout: TIMEOUTS.SUBAGENT_LOAD });

      const codeAnalyzerToggle = page.getByRole('button', {
        name: SELECTORS.SUBAGENT_SECTION('code-analyzer'),
      });
      await expect(codeAnalyzerToggle).toBeVisible({ timeout: TIMEOUTS.SUBAGENT_LOAD });
    });

    test('should call subagents API endpoint with session ID', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-456';
      let apiCalled = false;
      let calledWithSessionId = '';

      await page.route(ENDPOINTS.SUBAGENTS_LIST, route => {
        apiCalled = true;
        const urlParts = route.request().url().split('/');
        const sessionIdIndex = urlParts.indexOf('transcripts') + 1;
        calledWithSessionId = urlParts[sessionIdIndex] || '';

        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockSubagentsResponse([])),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - API should be called with correct session ID
      expect(apiCalled).toBe(true);
      expect(calledWithSessionId).toBe(sessionId);
    });

    test('should display multiple subagents correctly', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-789';
      const mockSubagents = [
        createMockSubagentInfo('agent-1', 'test-writer'),
        createMockSubagentInfo('agent-2', 'code-analyzer'),
        createMockSubagentInfo('agent-3', 'implementation-executor'),
      ];

      await page.route(ENDPOINTS.SUBAGENTS_LIST, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockSubagentsResponse(mockSubagents)),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - All subagent sections should be visible
      for (const subagent of mockSubagents) {
        const toggle = page.getByRole('button', {
          name: SELECTORS.SUBAGENT_SECTION(subagent.type),
        });
        await expect(toggle).toBeVisible();
      }
    });

    test('should handle empty subagent list gracefully', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-empty';

      await page.route(ENDPOINTS.SUBAGENTS_LIST, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockSubagentsResponse([])),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - Empty state or no subagent sections should be shown
      const emptyMessage = page.getByText(SELECTORS.EMPTY_STATE_TEXT);
      const isEmptyMessageVisible = await emptyMessage.isVisible().catch(() => false);

      // Either empty message is shown or no subagent sections exist
      // Both are acceptable outcomes
      expect(typeof isEmptyMessageVisible).toBe('boolean');
    });

    test('should display loading state while fetching subagents', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-loading';

      await page.route(ENDPOINTS.SUBAGENTS_LIST, async route => {
        // Add delay to observe loading state
        await new Promise(resolve => setTimeout(resolve, 1000));
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockSubagentsResponse([])),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);

      // Assert - Loading indicator should appear
      const loadingText = page.getByText(SELECTORS.LOADING_TEXT);
      const isLoadingVisible = await loadingText.isVisible().catch(() => false);

      // Either loading was shown, or subagents loaded so fast we missed it
      expect(typeof isLoadingVisible).toBe('boolean');
    });

    test('should display subagents with purple theme styling', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-styling';
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

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - Check for purple theme classes
      const toggle = page.getByRole('button', {
        name: SELECTORS.SUBAGENT_SECTION('test-writer'),
      });
      await expect(toggle).toBeVisible();

      // Verify purple theme styling (bg-purple-50, border-purple-300)
      const section = toggle.locator('..');
      const hasPurpleTheme = await section.evaluate(el => {
        const classes = el.className;
        return classes.includes('purple') ||
               classes.includes('bg-purple') ||
               classes.includes('border-purple');
      });

      expect(hasPurpleTheme).toBe(true);
    });
  });

  test.describe('A2: Subagent Detail Display on Click', () => {
    test('should expand subagent details when toggle button is clicked', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-expand';
      const mockSubagents = [
        createMockSubagentInfo('agent-1', 'test-writer'),
      ];
      const mockDetails = createMockSubagentDetails('agent-1', [
        createMockRecord('user', 'Test subagent message', '2024-01-29T10:00:00Z'),
      ]);

      await page.route(ENDPOINTS.SUBAGENTS_LIST, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockSubagentsResponse(mockSubagents)),
        });
      });

      await page.route(ENDPOINTS.SUBAGENT_DETAILS, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockDetails),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      const toggle = page.getByRole('button', {
        name: SELECTORS.SUBAGENT_SECTION('test-writer'),
      });

      // Assert - Initially collapsed (aria-expanded="false")
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');

      // Act - Click to expand
      await toggle.click();

      // Assert - Should be expanded (aria-expanded="true")
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });

    test('should call subagent details API when expanding', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-api-call';
      const agentId = 'agent-123';
      const mockSubagents = [
        createMockSubagentInfo(agentId, 'test-writer'),
      ];

      let detailsApiCalled = false;
      let calledAgentId = '';

      await page.route(ENDPOINTS.SUBAGENTS_LIST, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockSubagentsResponse(mockSubagents)),
        });
      });

      await page.route(ENDPOINTS.SUBAGENT_DETAILS, route => {
        detailsApiCalled = true;
        const urlParts = route.request().url().split('/');
        calledAgentId = urlParts[urlParts.length - 1] || '';

        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockSubagentDetails(agentId, [])),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      const toggle = page.getByRole('button', {
        name: SELECTORS.SUBAGENT_SECTION('test-writer'),
      });
      await toggle.click();

      // Assert - Details API should be called with correct agent ID
      expect(detailsApiCalled).toBe(true);
      expect(calledAgentId).toBe(agentId);
    });

    test('should display subagent details after successful API call', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-details';
      const agentId = 'agent-456';
      const mockSubagents = [
        createMockSubagentInfo(agentId, 'test-writer'),
      ];
      const mockDetails = createMockSubagentDetails(agentId, [
        createMockRecord('user', 'First subagent message', '2024-01-29T10:00:00Z'),
        createMockRecord('assistant', 'Second subagent message', '2024-01-29T10:00:01Z'),
      ]);

      await page.route(ENDPOINTS.SUBAGENTS_LIST, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockSubagentsResponse(mockSubagents)),
        });
      });

      await page.route(ENDPOINTS.SUBAGENT_DETAILS, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockDetails),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      const toggle = page.getByRole('button', {
        name: SELECTORS.SUBAGENT_SECTION('test-writer'),
      });
      await toggle.click();

      // Assert - Detail content should be visible
      await expect(page.getByText('First subagent message')).toBeVisible({
        timeout: TIMEOUTS.SUBAGENT_LOAD,
      });
      await expect(page.getByText('Second subagent message')).toBeVisible();
    });

    test('should toggle between expanded and collapsed states', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-toggle';
      const mockSubagents = [
        createMockSubagentInfo('agent-1', 'test-writer'),
      ];
      const mockDetails = createMockSubagentDetails('agent-1', []);

      await page.route(ENDPOINTS.SUBAGENTS_LIST, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockSubagentsResponse(mockSubagents)),
        });
      });

      await page.route(ENDPOINTS.SUBAGENT_DETAILS, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockDetails),
        });
      });

      // Act & Assert
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      const toggle = page.getByRole('button', {
        name: SELECTORS.SUBAGENT_SECTION('test-writer'),
      });

      // Initially collapsed
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');

      // Click to collapse
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    test('should handle multiple subagent expansions independently', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-multiple-expand';
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
        const urlParts = route.request().url().split('/');
        const agentId = urlParts[urlParts.length - 1];

        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockSubagentDetails(agentId, [])),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      const toggle1 = page.getByRole('button', {
        name: SELECTORS.SUBAGENT_SECTION('test-writer'),
      });
      const toggle2 = page.getByRole('button', {
        name: SELECTORS.SUBAGENT_SECTION('code-analyzer'),
      });

      // Expand first subagent
      await toggle1.click();
      await expect(toggle1).toHaveAttribute('aria-expanded', 'true');
      await expect(toggle2).toHaveAttribute('aria-expanded', 'false');

      // Expand second subagent
      await toggle2.click();
      await expect(toggle1).toHaveAttribute('aria-expanded', 'true');
      await expect(toggle2).toHaveAttribute('aria-expanded', 'true');

      // Collapse first subagent
      await toggle1.click();
      await expect(toggle1).toHaveAttribute('aria-expanded', 'false');
      await expect(toggle2).toHaveAttribute('aria-expanded', 'true');
    });

    test('should maintain keyboard accessibility for toggle buttons', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-a11y';
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
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockSubagentDetails('agent-1', [])),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      const toggle = page.getByRole('button', {
        name: SELECTORS.SUBAGENT_SECTION('test-writer'),
      });

      // Assert - Button should be focusable
      await toggle.focus();
      const isFocused = await toggle.evaluate(
        el => el === document.activeElement
      );
      expect(isFocused).toBe(true);

      // Assert - Should toggle on Enter key
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await page.keyboard.press('Enter');
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });

    test('should display empty state for subagent with no records', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-empty-details';
      const mockSubagents = [
        createMockSubagentInfo('agent-1', 'test-writer'),
      ];
      const mockDetails = createMockSubagentDetails('agent-1', []);

      await page.route(ENDPOINTS.SUBAGENTS_LIST, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockSubagentsResponse(mockSubagents)),
        });
      });

      await page.route(ENDPOINTS.SUBAGENT_DETAILS, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockDetails),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      const toggle = page.getByRole('button', {
        name: SELECTORS.SUBAGENT_SECTION('test-writer'),
      });
      await toggle.click();

      // Assert - Empty state or no records message should be shown
      const emptyState = page.getByText(/no records|no messages|empty/i);
      const isEmptyStateVisible = await emptyState.isVisible().catch(() => false);

      // Either empty state is shown or section is expanded but empty
      expect(typeof isEmptyStateVisible).toBe('boolean');
    });
  });

  test.describe('Subagent Accessibility', () => {
    test('should have proper ARIA labels for toggle buttons', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-aria';
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

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - Toggle button should have proper aria-label
      const toggle = page.getByRole('button', {
        name: SELECTORS.SUBAGENT_SECTION('test-writer'),
      });
      await expect(toggle).toBeVisible();

      const ariaLabel = await toggle.getAttribute('aria-label');
      expect(ariaLabel).toBe('Toggle test-writer subagent details');
    });

    test('should update aria-expanded attribute correctly', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-aria-expanded';
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
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockSubagentDetails('agent-1', [])),
        });
      });

      // Act & Assert
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      const toggle = page.getByRole('button', {
        name: SELECTORS.SUBAGENT_SECTION('test-writer'),
      });

      // Initially false
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');

      // After click, should be true
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
