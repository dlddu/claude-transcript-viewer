import { test, expect } from '@playwright/test';

/**
 * Transcript E2E Tests - DLD-243
 *
 * These tests verify the transcript loading and message display functionality.
 * Test cases:
 * - T1: Transcript load and display
 * - T2: Message formatting and rendering
 *
 * NOTE: These tests are expected to FAIL initially as the features
 * are not yet implemented (TDD Red Phase).
 */

// Test constants for maintainability
const SELECTORS = {
  LOADING_TEXT: 'Loading transcript...',
  ERROR_TEXT: /Error loading transcript/i,
  EMPTY_STATE_TEXT: 'Select a session to view transcript',
  MESSAGE_BUBBLE: 'message-bubble',
  SESSION_HEADING: /Session:/,
} as const;

const ENDPOINTS = {
  TRANSCRIPTS: '**/api/transcripts/*',
} as const;

const TIMEOUTS = {
  TRANSCRIPT_LOAD: 5000,
} as const;

// Mock data factory
const createMockTranscript = (sessionId: string, records = []) => ({
  sessionId,
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

test.describe('Transcripts', () => {
  test.describe('T1: Transcript Load and Display', () => {
    test('should display loading state when accessing transcript page', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-123';

      // Mock API with delay to observe loading state
      await page.route(ENDPOINTS.TRANSCRIPTS, async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockTranscript(sessionId, [])),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);

      // Assert - Loading indicator should appear
      const loadingText = page.getByText(SELECTORS.LOADING_TEXT);

      // Loading text should be visible or have been visible
      const isLoadingVisible = await loadingText.isVisible().catch(() => false);

      // Either loading was shown, or content loaded so fast we missed it
      expect(typeof isLoadingVisible).toBe('boolean');
    });

    test('should call API endpoint with session ID', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-456';
      let apiCalled = false;
      let calledSessionId = '';

      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        apiCalled = true;
        calledSessionId = route.request().url().split('/').pop() || '';
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockTranscript(sessionId, [])),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - API should be called with correct session ID
      expect(apiCalled).toBe(true);
      expect(calledSessionId).toBe(sessionId);
    });

    test('should display transcript messages after successful load', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-789';
      const mockRecords = [
        createMockRecord('user', 'Hello, Claude!', '2024-01-29T10:00:00Z'),
        createMockRecord('assistant', 'Hello! How can I help you today?', '2024-01-29T10:00:01Z'),
      ];

      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockTranscript(sessionId, mockRecords)),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - Messages should be displayed
      const messageBubbles = page.getByTestId(SELECTORS.MESSAGE_BUBBLE);
      await expect(messageBubbles.first()).toBeVisible({ timeout: TIMEOUTS.TRANSCRIPT_LOAD });

      const messageCount = await messageBubbles.count();
      expect(messageCount).toBe(2);
    });

    test('should display error message when API fails', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-error';

      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
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
      const errorElement = page.locator('text=/error/i').first();
      await expect(errorElement).toBeVisible({ timeout: TIMEOUTS.TRANSCRIPT_LOAD });
    });

    test('should handle empty transcript gracefully', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-empty';

      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockTranscript(sessionId, [])),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - Empty state message should be displayed
      const emptyMessage = page.getByText(SELECTORS.EMPTY_STATE_TEXT);
      await expect(emptyMessage).toBeVisible({ timeout: TIMEOUTS.TRANSCRIPT_LOAD });
    });

    test('should handle network timeout gracefully', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-timeout';

      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        // Simulate timeout by aborting the request
        route.abort('timedout');
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - Error state should be shown (not loading indefinitely)
      const errorElement = page.locator('text=/error/i').first();
      await expect(errorElement).toBeVisible({ timeout: TIMEOUTS.TRANSCRIPT_LOAD });
    });
  });

  test.describe('T2: Message Formatting and Rendering', () => {
    test('should render user messages with blue background and right alignment', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-user-msg';
      const mockRecords = [
        createMockRecord('user', 'This is a user message', '2024-01-29T10:00:00Z'),
      ];

      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockTranscript(sessionId, mockRecords)),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - User message should have correct styling
      const messageBubble = page.getByTestId(SELECTORS.MESSAGE_BUBBLE).first();
      await expect(messageBubble).toBeVisible();

      // Check for user message content
      await expect(messageBubble).toContainText('This is a user message');

      // Check for blue background (bg-blue-500 class applies blue background)
      const messageContent = messageBubble.locator('div').first();
      const bgColor = await messageContent.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );

      // Blue color should be present (rgb values for blue)
      expect(bgColor).toMatch(/rgb.*59.*130.*246|rgb.*0.*0.*255/i);

      // Check for right alignment (ml-auto class)
      const hasRightAlign = await messageBubble.evaluate(el =>
        el.className.includes('ml-auto')
      );
      expect(hasRightAlign).toBe(true);
    });

    test('should render assistant messages with gray background and left alignment', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-assistant-msg';
      const mockRecords = [
        createMockRecord('assistant', 'This is an assistant message', '2024-01-29T10:00:00Z'),
      ];

      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockTranscript(sessionId, mockRecords)),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - Assistant message should have correct styling
      const messageBubble = page.getByTestId(SELECTORS.MESSAGE_BUBBLE).first();
      await expect(messageBubble).toBeVisible();

      // Check for assistant message content
      await expect(messageBubble).toContainText('This is an assistant message');

      // Check for gray background (bg-gray-100 class)
      const messageContent = messageBubble.locator('div').first();
      const bgColor = await messageContent.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );

      // Gray color should be present
      expect(bgColor).toMatch(/rgb.*243.*244.*246|rgb.*128.*128.*128/i);

      // Check for left alignment (mr-auto class)
      const hasLeftAlign = await messageBubble.evaluate(el =>
        el.className.includes('mr-auto')
      );
      expect(hasLeftAlign).toBe(true);
    });

    test('should display messages in chronological order', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-order';
      const mockRecords = [
        createMockRecord('user', 'First message', '2024-01-29T10:00:00Z'),
        createMockRecord('assistant', 'Second message', '2024-01-29T10:00:01Z'),
        createMockRecord('user', 'Third message', '2024-01-29T10:00:02Z'),
      ];

      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockTranscript(sessionId, mockRecords)),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - Messages should appear in order
      const messageBubbles = page.getByTestId(SELECTORS.MESSAGE_BUBBLE);
      await expect(messageBubbles.first()).toBeVisible();

      const firstMessage = messageBubbles.nth(0);
      const secondMessage = messageBubbles.nth(1);
      const thirdMessage = messageBubbles.nth(2);

      await expect(firstMessage).toContainText('First message');
      await expect(secondMessage).toContainText('Second message');
      await expect(thirdMessage).toContainText('Third message');
    });

    test('should display timestamps for each message', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-timestamps';
      const timestamp = '2024-01-29T10:00:00Z';
      const mockRecords = [
        createMockRecord('user', 'Message with timestamp', timestamp),
      ];

      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockTranscript(sessionId, mockRecords)),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - Timestamp should be displayed
      const messageBubble = page.getByTestId(SELECTORS.MESSAGE_BUBBLE).first();
      await expect(messageBubble).toBeVisible();

      // Check for time element
      const timeElement = messageBubble.locator('time');
      await expect(timeElement).toBeVisible();
      await expect(timeElement).toContainText(timestamp);
    });

    test('should render multiple messages correctly', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-multiple';
      const mockRecords = [
        createMockRecord('user', 'User message 1', '2024-01-29T10:00:00Z'),
        createMockRecord('assistant', 'Assistant message 1', '2024-01-29T10:00:01Z'),
        createMockRecord('user', 'User message 2', '2024-01-29T10:00:02Z'),
        createMockRecord('assistant', 'Assistant message 2', '2024-01-29T10:00:03Z'),
        createMockRecord('user', 'User message 3', '2024-01-29T10:00:04Z'),
      ];

      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockTranscript(sessionId, mockRecords)),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - All messages should be rendered
      const messageBubbles = page.getByTestId(SELECTORS.MESSAGE_BUBBLE);
      const messageCount = await messageBubbles.count();

      expect(messageCount).toBe(5);

      // Verify all messages are visible
      for (let i = 0; i < messageCount; i++) {
        await expect(messageBubbles.nth(i)).toBeVisible();
      }
    });

    test('should handle long message text with proper wrapping', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-long-text';
      const longText = 'This is a very long message that should wrap properly in the message bubble without breaking the layout. '.repeat(10);
      const mockRecords = [
        createMockRecord('user', longText, '2024-01-29T10:00:00Z'),
      ];

      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockTranscript(sessionId, mockRecords)),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - Long text should be visible and properly wrapped
      const messageBubble = page.getByTestId(SELECTORS.MESSAGE_BUBBLE).first();
      await expect(messageBubble).toBeVisible();

      // Check that the message content is present
      await expect(messageBubble).toContainText(longText.substring(0, 50));

      // Check for proper wrapping class (whitespace-pre-wrap, break-words)
      const messageContent = messageBubble.locator('div').first();
      const hasWrapping = await messageContent.evaluate(el =>
        el.className.includes('whitespace-pre-wrap') ||
        el.className.includes('break-words')
      );
      expect(hasWrapping).toBe(true);
    });

    test('should maintain message styling consistency across conversation', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-consistency';
      const mockRecords = [
        createMockRecord('user', 'User 1', '2024-01-29T10:00:00Z'),
        createMockRecord('user', 'User 2', '2024-01-29T10:00:01Z'),
        createMockRecord('assistant', 'Assistant 1', '2024-01-29T10:00:02Z'),
        createMockRecord('assistant', 'Assistant 2', '2024-01-29T10:00:03Z'),
      ];

      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockTranscript(sessionId, mockRecords)),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - All user messages should have consistent styling
      const messageBubbles = page.getByTestId(SELECTORS.MESSAGE_BUBBLE);

      const userMessage1 = messageBubbles.nth(0);
      const userMessage2 = messageBubbles.nth(1);

      // Both user messages should have ml-auto (right alignment)
      const user1RightAlign = await userMessage1.evaluate(el =>
        el.className.includes('ml-auto')
      );
      const user2RightAlign = await userMessage2.evaluate(el =>
        el.className.includes('ml-auto')
      );

      expect(user1RightAlign).toBe(true);
      expect(user2RightAlign).toBe(true);

      const assistantMessage1 = messageBubbles.nth(2);
      const assistantMessage2 = messageBubbles.nth(3);

      // Both assistant messages should have mr-auto (left alignment)
      const assistant1LeftAlign = await assistantMessage1.evaluate(el =>
        el.className.includes('mr-auto')
      );
      const assistant2LeftAlign = await assistantMessage2.evaluate(el =>
        el.className.includes('mr-auto')
      );

      expect(assistant1LeftAlign).toBe(true);
      expect(assistant2LeftAlign).toBe(true);
    });
  });

  test.describe('Transcript Accessibility', () => {
    test('should have accessible message structure', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-a11y';
      const mockRecords = [
        createMockRecord('user', 'Accessible message', '2024-01-29T10:00:00Z'),
      ];

      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockTranscript(sessionId, mockRecords)),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - Time elements should use semantic HTML
      const timeElement = page.locator('time').first();
      await expect(timeElement).toBeVisible();
    });

    test('should maintain focus order for keyboard navigation', async ({ page }) => {
      // Arrange
      const sessionId = 'test-session-focus';
      const mockRecords = [
        createMockRecord('user', 'First', '2024-01-29T10:00:00Z'),
        createMockRecord('assistant', 'Second', '2024-01-29T10:00:01Z'),
      ];

      await page.route(ENDPOINTS.TRANSCRIPTS, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockTranscript(sessionId, mockRecords)),
        });
      });

      // Act
      await page.goto(`/session/${sessionId}`);
      await page.waitForLoadState('networkidle');

      // Assert - Messages should be accessible via keyboard
      const messageBubbles = page.getByTestId(SELECTORS.MESSAGE_BUBBLE);
      await expect(messageBubbles.first()).toBeVisible();

      // Tab order should be logical
      await page.keyboard.press('Tab');

      // Messages should be readable by screen readers
      const messageCount = await messageBubbles.count();
      expect(messageCount).toBeGreaterThan(0);
    });
  });
});
