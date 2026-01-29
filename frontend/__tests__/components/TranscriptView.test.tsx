import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import TranscriptView from '../../src/components/TranscriptView';
import { useTranscript } from '../../src/hooks/useTranscript';
import type { TranscriptRecord } from '../../src/types';

// Mock the useTranscript hook
vi.mock('../../src/hooks/useTranscript');

// Mock MessageBubble component
vi.mock('../../src/components/MessageBubble', () => ({
  default: ({ type, content, timestamp }: { type: string; content: string; timestamp: string }) => (
    <div data-testid={`message-bubble-${type}`} data-timestamp={timestamp}>
      {content}
    </div>
  ),
}));

describe('TranscriptView Component', () => {
  const mockUseTranscript = vi.mocked(useTranscript);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Loading State', () => {
    it('should display spinner when loading', () => {
      // Arrange
      mockUseTranscript.mockReturnValue({
        loading: true,
        error: null,
        transcript: null,
        refetch: vi.fn(),
      });

      // Act
      render(<TranscriptView sessionId="session-123" />);

      // Assert
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should display "Loading transcript..." message when loading', () => {
      // Arrange
      mockUseTranscript.mockReturnValue({
        loading: true,
        error: null,
        transcript: null,
        refetch: vi.fn(),
      });

      // Act
      render(<TranscriptView sessionId="session-123" />);

      // Assert
      expect(screen.getByText('Loading transcript...')).toBeInTheDocument();
    });

    it('should not display messages while loading', () => {
      // Arrange
      mockUseTranscript.mockReturnValue({
        loading: true,
        error: null,
        transcript: null,
        refetch: vi.fn(),
      });

      // Act
      render(<TranscriptView sessionId="session-123" />);

      // Assert
      expect(screen.queryByTestId(/message-bubble/)).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error occurs', () => {
      // Arrange
      const errorMessage = 'Failed to load transcript';
      mockUseTranscript.mockReturnValue({
        loading: false,
        error: new Error(errorMessage),
        transcript: null,
        refetch: vi.fn(),
      });

      // Act
      render(<TranscriptView sessionId="session-123" />);

      // Assert
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should display error in red box with proper styling', () => {
      // Arrange
      mockUseTranscript.mockReturnValue({
        loading: false,
        error: new Error('Network error'),
        transcript: null,
        refetch: vi.fn(),
      });

      // Act
      const { container } = render(<TranscriptView sessionId="session-123" />);

      // Assert
      const errorBox = container.querySelector('.bg-red-50');
      expect(errorBox).toBeInTheDocument();
      expect(errorBox?.className).toContain('border-red-200');
    });

    it('should display error text in red color', () => {
      // Arrange
      mockUseTranscript.mockReturnValue({
        loading: false,
        error: new Error('Error occurred'),
        transcript: null,
        refetch: vi.fn(),
      });

      // Act
      const { container } = render(<TranscriptView sessionId="session-123" />);

      // Assert
      const errorText = container.querySelector('.text-red-700');
      expect(errorText).toBeInTheDocument();
    });

    it('should not display messages when error occurs', () => {
      // Arrange
      mockUseTranscript.mockReturnValue({
        loading: false,
        error: new Error('Error'),
        transcript: null,
        refetch: vi.fn(),
      });

      // Act
      render(<TranscriptView sessionId="session-123" />);

      // Assert
      expect(screen.queryByTestId(/message-bubble/)).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty message when transcript is null', () => {
      // Arrange
      mockUseTranscript.mockReturnValue({
        loading: false,
        error: null,
        transcript: null,
        refetch: vi.fn(),
      });

      // Act
      render(<TranscriptView sessionId="" />);

      // Assert
      expect(screen.getByText('Select a session to view transcript')).toBeInTheDocument();
    });

    it('should display empty message when transcript is empty array', () => {
      // Arrange
      mockUseTranscript.mockReturnValue({
        loading: false,
        error: null,
        transcript: [],
        refetch: vi.fn(),
      });

      // Act
      render(<TranscriptView sessionId="session-123" />);

      // Assert
      expect(screen.getByText('Select a session to view transcript')).toBeInTheDocument();
    });

    it('should not display messages in empty state', () => {
      // Arrange
      mockUseTranscript.mockReturnValue({
        loading: false,
        error: null,
        transcript: [],
        refetch: vi.fn(),
      });

      // Act
      render(<TranscriptView sessionId="session-123" />);

      // Assert
      expect(screen.queryByTestId(/message-bubble/)).not.toBeInTheDocument();
    });
  });

  describe('Success State - Message Rendering', () => {
    it('should render messages when transcript has data', () => {
      // Arrange
      const mockTranscript: TranscriptRecord[] = [
        {
          type: 'user',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Hello' }],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'Hi there!' }],
          },
          timestamp: '2024-01-29T10:00:01Z',
        },
      ];

      mockUseTranscript.mockReturnValue({
        loading: false,
        error: null,
        transcript: mockTranscript,
        refetch: vi.fn(),
      });

      // Act
      render(<TranscriptView sessionId="session-123" />);

      // Assert
      expect(screen.getByTestId('message-bubble-user')).toBeInTheDocument();
      expect(screen.getByTestId('message-bubble-assistant')).toBeInTheDocument();
    });

    it('should render all transcript records in order', () => {
      // Arrange
      const mockTranscript: TranscriptRecord[] = [
        {
          type: 'user',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'First message' }],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'Second message' }],
          },
          timestamp: '2024-01-29T10:00:01Z',
        },
        {
          type: 'user',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Third message' }],
          },
          timestamp: '2024-01-29T10:00:02Z',
        },
      ];

      mockUseTranscript.mockReturnValue({
        loading: false,
        error: null,
        transcript: mockTranscript,
        refetch: vi.fn(),
      });

      // Act
      render(<TranscriptView sessionId="session-123" />);

      // Assert
      const messages = screen.getAllByTestId(/message-bubble/);
      expect(messages).toHaveLength(3);
    });

    it('should pass correct props to MessageBubble components', () => {
      // Arrange
      const mockTranscript: TranscriptRecord[] = [
        {
          type: 'user',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Test content' }],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      mockUseTranscript.mockReturnValue({
        loading: false,
        error: null,
        transcript: mockTranscript,
        refetch: vi.fn(),
      });

      // Act
      render(<TranscriptView sessionId="session-123" />);

      // Assert
      const messageBubble = screen.getByTestId('message-bubble-user');
      expect(messageBubble).toHaveTextContent('Test content');
      expect(messageBubble).toHaveAttribute('data-timestamp', '2024-01-29T10:00:00Z');
    });
  });

  describe('Content Extraction - TextBlock Only', () => {
    it('should extract text content from TextBlock', () => {
      // Arrange
      const mockTranscript: TranscriptRecord[] = [
        {
          type: 'user',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Pure text message' }],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      mockUseTranscript.mockReturnValue({
        loading: false,
        error: null,
        transcript: mockTranscript,
        refetch: vi.fn(),
      });

      // Act
      render(<TranscriptView sessionId="session-123" />);

      // Assert
      expect(screen.getByText('Pure text message')).toBeInTheDocument();
    });

    it('should extract only TextBlock from mixed content blocks', () => {
      // Arrange
      const mockTranscript: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'text', text: 'I will use a tool' },
              {
                type: 'tool_use',
                id: 'tool-1',
                name: 'read_file',
                input: { path: '/test.txt' },
              },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      mockUseTranscript.mockReturnValue({
        loading: false,
        error: null,
        transcript: mockTranscript,
        refetch: vi.fn(),
      });

      // Act
      render(<TranscriptView sessionId="session-123" />);

      // Assert
      expect(screen.getByText('I will use a tool')).toBeInTheDocument();
      expect(screen.queryByText(/tool_use/)).not.toBeInTheDocument();
    });

    it('should concatenate multiple TextBlocks with newlines', () => {
      // Arrange
      const mockTranscript: TranscriptRecord[] = [
        {
          type: 'user',
          message: {
            role: 'user',
            content: [
              { type: 'text', text: 'First paragraph' },
              { type: 'text', text: 'Second paragraph' },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      mockUseTranscript.mockReturnValue({
        loading: false,
        error: null,
        transcript: mockTranscript,
        refetch: vi.fn(),
      });

      // Act
      render(<TranscriptView sessionId="session-123" />);

      // Assert - Use getByTestId to avoid multiple matching elements
      const expectedContent = 'First paragraph\nSecond paragraph';
      const messageBubble = screen.getByTestId('message-bubble-user');
      expect(messageBubble.textContent).toBe(expectedContent);
    });

    it('should handle message with no TextBlock gracefully', () => {
      // Arrange
      const mockTranscript: TranscriptRecord[] = [
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: 'tool-1',
                name: 'read_file',
                input: { path: '/test.txt' },
              },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      mockUseTranscript.mockReturnValue({
        loading: false,
        error: null,
        transcript: mockTranscript,
        refetch: vi.fn(),
      });

      // Act
      const { container } = render(<TranscriptView sessionId="session-123" />);

      // Assert
      expect(container).toBeTruthy();
      const messageBubble = screen.getByTestId('message-bubble-assistant');
      expect(messageBubble).toHaveTextContent('');
    });

    it('should filter out ToolResultBlock and only show TextBlock', () => {
      // Arrange
      const mockTranscript: TranscriptRecord[] = [
        {
          type: 'user',
          message: {
            role: 'user',
            content: [
              { type: 'text', text: 'Here is the result' },
              {
                type: 'tool_result',
                tool_use_id: 'tool-1',
                content: 'Tool output content',
              },
            ],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      mockUseTranscript.mockReturnValue({
        loading: false,
        error: null,
        transcript: mockTranscript,
        refetch: vi.fn(),
      });

      // Act
      render(<TranscriptView sessionId="session-123" />);

      // Assert
      expect(screen.getByText('Here is the result')).toBeInTheDocument();
      expect(screen.queryByText('Tool output content')).not.toBeInTheDocument();
    });
  });

  describe('Hook Integration', () => {
    it('should call useTranscript with provided sessionId', () => {
      // Arrange
      const sessionId = 'session-123';
      mockUseTranscript.mockReturnValue({
        loading: false,
        error: null,
        transcript: [],
        refetch: vi.fn(),
      });

      // Act
      render(<TranscriptView sessionId={sessionId} />);

      // Assert
      expect(mockUseTranscript).toHaveBeenCalledWith(sessionId);
    });

    it('should call useTranscript with empty string when sessionId is empty', () => {
      // Arrange
      mockUseTranscript.mockReturnValue({
        loading: false,
        error: null,
        transcript: null,
        refetch: vi.fn(),
      });

      // Act
      render(<TranscriptView sessionId="" />);

      // Assert
      expect(mockUseTranscript).toHaveBeenCalledWith('');
    });

    it('should call useTranscript only once per render', () => {
      // Arrange
      mockUseTranscript.mockReturnValue({
        loading: false,
        error: null,
        transcript: [],
        refetch: vi.fn(),
      });

      // Act
      render(<TranscriptView sessionId="session-123" />);

      // Assert
      expect(mockUseTranscript).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Structure and Layout', () => {
    it('should render without crashing', () => {
      // Arrange
      mockUseTranscript.mockReturnValue({
        loading: false,
        error: null,
        transcript: [],
        refetch: vi.fn(),
      });

      // Act
      const { container } = render(<TranscriptView sessionId="session-123" />);

      // Assert
      expect(container).toBeTruthy();
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have proper container structure', () => {
      // Arrange
      mockUseTranscript.mockReturnValue({
        loading: false,
        error: null,
        transcript: [],
        refetch: vi.fn(),
      });

      // Act
      const { container } = render(<TranscriptView sessionId="session-123" />);

      // Assert
      expect(container.firstChild).toHaveClass('flex', 'flex-col');
    });

    it('should apply spacing between messages', () => {
      // Arrange
      const mockTranscript: TranscriptRecord[] = [
        {
          type: 'user',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Message 1' }],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'Message 2' }],
          },
          timestamp: '2024-01-29T10:00:01Z',
        },
      ];

      mockUseTranscript.mockReturnValue({
        loading: false,
        error: null,
        transcript: mockTranscript,
        refetch: vi.fn(),
      });

      // Act
      const { container } = render(<TranscriptView sessionId="session-123" />);

      // Assert
      const messageContainer = container.querySelector('.space-y-4');
      expect(messageContainer).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle transcript with single message', () => {
      // Arrange
      const mockTranscript: TranscriptRecord[] = [
        {
          type: 'user',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Only message' }],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      mockUseTranscript.mockReturnValue({
        loading: false,
        error: null,
        transcript: mockTranscript,
        refetch: vi.fn(),
      });

      // Act
      render(<TranscriptView sessionId="session-123" />);

      // Assert
      expect(screen.getAllByTestId(/message-bubble/)).toHaveLength(1);
    });

    it('should handle very long transcript', () => {
      // Arrange
      const mockTranscript: TranscriptRecord[] = Array.from({ length: 100 }, (_, i) => ({
        type: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        message: {
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: [{ type: 'text' as const, text: `Message ${i}` }],
        },
        timestamp: `2024-01-29T10:00:${String(i).padStart(2, '0')}Z`,
      }));

      mockUseTranscript.mockReturnValue({
        loading: false,
        error: null,
        transcript: mockTranscript,
        refetch: vi.fn(),
      });

      // Act
      render(<TranscriptView sessionId="session-123" />);

      // Assert
      expect(screen.getAllByTestId(/message-bubble/)).toHaveLength(100);
    });

    it('should handle empty text in TextBlock', () => {
      // Arrange
      const mockTranscript: TranscriptRecord[] = [
        {
          type: 'user',
          message: {
            role: 'user',
            content: [{ type: 'text', text: '' }],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      mockUseTranscript.mockReturnValue({
        loading: false,
        error: null,
        transcript: mockTranscript,
        refetch: vi.fn(),
      });

      // Act
      const { container } = render(<TranscriptView sessionId="session-123" />);

      // Assert
      expect(container).toBeTruthy();
      const messageBubble = screen.getByTestId('message-bubble-user');
      expect(messageBubble).toHaveTextContent('');
    });

    it('should handle special characters in text content', () => {
      // Arrange
      const specialContent = 'Special chars: <>&"\'@#$%^&*()';
      const mockTranscript: TranscriptRecord[] = [
        {
          type: 'user',
          message: {
            role: 'user',
            content: [{ type: 'text', text: specialContent }],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      mockUseTranscript.mockReturnValue({
        loading: false,
        error: null,
        transcript: mockTranscript,
        refetch: vi.fn(),
      });

      // Act
      render(<TranscriptView sessionId="session-123" />);

      // Assert
      expect(screen.getByText(specialContent)).toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    it('should transition from loading to success', async () => {
      // Arrange
      const mockTranscript: TranscriptRecord[] = [
        {
          type: 'user',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Hello' }],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      mockUseTranscript.mockReturnValueOnce({
        loading: true,
        error: null,
        transcript: null,
        refetch: vi.fn(),
      });

      // Act
      const { rerender } = render(<TranscriptView sessionId="session-123" />);

      // Assert - Loading state
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Arrange - Update to success state
      mockUseTranscript.mockReturnValueOnce({
        loading: false,
        error: null,
        transcript: mockTranscript,
        refetch: vi.fn(),
      });

      // Act
      rerender(<TranscriptView sessionId="session-123" />);

      // Assert - Success state
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(screen.getByTestId('message-bubble-user')).toBeInTheDocument();
      });
    });

    it('should transition from loading to error', async () => {
      // Arrange
      mockUseTranscript.mockReturnValueOnce({
        loading: true,
        error: null,
        transcript: null,
        refetch: vi.fn(),
      });

      // Act
      const { rerender } = render(<TranscriptView sessionId="session-123" />);

      // Assert - Loading state
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Arrange - Update to error state
      mockUseTranscript.mockReturnValueOnce({
        loading: false,
        error: new Error('Failed'),
        transcript: null,
        refetch: vi.fn(),
      });

      // Act
      rerender(<TranscriptView sessionId="session-123" />);

      // Assert - Error state
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(screen.getByText('Failed')).toBeInTheDocument();
      });
    });
  });
});
