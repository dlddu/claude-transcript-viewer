import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageBubble from '../../src/components/MessageBubble';

describe('MessageBubble Component', () => {

  describe('User Message Styling', () => {
    it('should apply blue background for user messages', () => {
      // Arrange
      const props = {
        type: 'user' as const,
        content: 'Hello, assistant!',
        timestamp: '2024-01-29T10:30:00Z',
      };

      // Act
      const { container } = render(<MessageBubble {...props} />);
      const messageElement = container.querySelector('.bg-blue-500');

      // Assert
      expect(messageElement).toBeInTheDocument();
    });

    it('should apply white text color for user messages', () => {
      // Arrange
      const props = {
        type: 'user' as const,
        content: 'This is a user message',
        timestamp: '2024-01-29T10:30:00Z',
      };

      // Act
      const { container } = render(<MessageBubble {...props} />);
      const messageElement = container.querySelector('.text-white');

      // Assert
      expect(messageElement).toBeInTheDocument();
    });

    it('should apply left margin auto for user messages (right alignment)', () => {
      // Arrange
      const props = {
        type: 'user' as const,
        content: 'User message',
        timestamp: '2024-01-29T10:30:00Z',
      };

      // Act
      const { container } = render(<MessageBubble {...props} />);
      const messageElement = container.querySelector('.ml-auto');

      // Assert
      expect(messageElement).toBeInTheDocument();
    });
  });

  describe('Assistant Message Styling', () => {
    it('should apply gray background for assistant messages', () => {
      // Arrange
      const props = {
        type: 'assistant' as const,
        content: 'Hello! How can I help you?',
        timestamp: '2024-01-29T10:30:05Z',
      };

      // Act
      const { container } = render(<MessageBubble {...props} />);
      const messageElement = container.querySelector('.bg-gray-100');

      // Assert
      expect(messageElement).toBeInTheDocument();
    });

    it('should apply dark text color for assistant messages', () => {
      // Arrange
      const props = {
        type: 'assistant' as const,
        content: 'This is an assistant response',
        timestamp: '2024-01-29T10:30:05Z',
      };

      // Act
      const { container } = render(<MessageBubble {...props} />);
      const messageElement = container.querySelector('.text-gray-900');

      // Assert
      expect(messageElement).toBeInTheDocument();
    });

    it('should apply right margin auto for assistant messages (left alignment)', () => {
      // Arrange
      const props = {
        type: 'assistant' as const,
        content: 'Assistant message',
        timestamp: '2024-01-29T10:30:05Z',
      };

      // Act
      const { container } = render(<MessageBubble {...props} />);
      const messageElement = container.querySelector('.mr-auto');

      // Assert
      expect(messageElement).toBeInTheDocument();
    });
  });

  describe('Content Rendering', () => {
    it('should render text content correctly', () => {
      // Arrange
      const testContent = 'This is a test message content';
      const props = {
        type: 'user' as const,
        content: testContent,
        timestamp: '2024-01-29T10:30:00Z',
      };

      // Act
      render(<MessageBubble {...props} />);

      // Assert
      expect(screen.getByText(testContent)).toBeInTheDocument();
    });

    it('should render long text content', () => {
      // Arrange
      const longContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10);
      const props = {
        type: 'assistant' as const,
        content: longContent,
        timestamp: '2024-01-29T10:30:00Z',
      };

      // Act
      render(<MessageBubble {...props} />);

      // Assert
      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it('should render empty content gracefully', () => {
      // Arrange
      const props = {
        type: 'user' as const,
        content: '',
        timestamp: '2024-01-29T10:30:00Z',
      };

      // Act
      const { container } = render(<MessageBubble {...props} />);

      // Assert
      expect(container).toBeTruthy();
    });
  });

  describe('Timestamp Display', () => {
    it('should display timestamp for user messages', () => {
      // Arrange
      const timestamp = '2024-01-29T10:30:00Z';
      const props = {
        type: 'user' as const,
        content: 'Message with timestamp',
        timestamp,
      };

      // Act
      render(<MessageBubble {...props} />);

      // Assert
      expect(screen.getByText(new RegExp(timestamp))).toBeInTheDocument();
    });

    it('should display timestamp for assistant messages', () => {
      // Arrange
      const timestamp = '2024-01-29T10:35:00Z';
      const props = {
        type: 'assistant' as const,
        content: 'Assistant message with timestamp',
        timestamp,
      };

      // Act
      render(<MessageBubble {...props} />);

      // Assert
      expect(screen.getByText(new RegExp(timestamp))).toBeInTheDocument();
    });

    it('should handle different timestamp formats', () => {
      // Arrange
      const timestamp = '2024-01-29 10:30:00';
      const props = {
        type: 'user' as const,
        content: 'Message',
        timestamp,
      };

      // Act
      render(<MessageBubble {...props} />);

      // Assert
      expect(screen.getByText(new RegExp(timestamp))).toBeInTheDocument();
    });
  });

  describe('Width Constraints', () => {
    it('should apply maximum width constraint of 80%', () => {
      // Arrange
      const props = {
        type: 'user' as const,
        content: 'Message with width constraint',
        timestamp: '2024-01-29T10:30:00Z',
      };

      // Act
      const { container } = render(<MessageBubble {...props} />);
      const messageElement = container.querySelector('[class*="max-w"]');

      // Assert
      expect(messageElement).toBeInTheDocument();
      expect(messageElement?.className).toMatch(/max-w-\[80%\]/);
    });

    it('should apply width constraint to both message types', () => {
      // Arrange
      const userProps = {
        type: 'user' as const,
        content: 'User message',
        timestamp: '2024-01-29T10:30:00Z',
      };
      const assistantProps = {
        type: 'assistant' as const,
        content: 'Assistant message',
        timestamp: '2024-01-29T10:30:05Z',
      };

      // Act
      const { container: userContainer } = render(<MessageBubble {...userProps} />);
      const { container: assistantContainer } = render(<MessageBubble {...assistantProps} />);

      // Assert
      const userElement = userContainer.querySelector('[class*="max-w"]');
      const assistantElement = assistantContainer.querySelector('[class*="max-w"]');

      expect(userElement?.className).toMatch(/max-w-\[80%\]/);
      expect(assistantElement?.className).toMatch(/max-w-\[80%\]/);
    });
  });

  describe('Component Structure', () => {
    it('should render without crashing', () => {
      // Arrange
      const props = {
        type: 'user' as const,
        content: 'Test message',
        timestamp: '2024-01-29T10:30:00Z',
      };

      // Act
      const { container } = render(<MessageBubble {...props} />);

      // Assert
      expect(container).toBeTruthy();
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle type changes', () => {
      // Arrange
      const userProps = {
        type: 'user' as const,
        content: 'User message',
        timestamp: '2024-01-29T10:30:00Z',
      };

      // Act
      const { unmount, container: userContainer } = render(<MessageBubble {...userProps} />);
      const userElement = userContainer.querySelector('.bg-blue-500');

      // Assert
      expect(userElement).toBeInTheDocument();

      // Cleanup
      unmount();

      // Arrange
      const assistantProps = {
        type: 'assistant' as const,
        content: 'Assistant message',
        timestamp: '2024-01-29T10:30:05Z',
      };

      // Act
      const { container: assistantContainer } = render(<MessageBubble {...assistantProps} />);
      const assistantElement = assistantContainer.querySelector('.bg-gray-100');

      // Assert
      expect(assistantElement).toBeInTheDocument();
    });

    it('should maintain proper semantic structure', () => {
      // Arrange
      const props = {
        type: 'user' as const,
        content: 'Semantic test',
        timestamp: '2024-01-29T10:30:00Z',
      };

      // Act
      const { container } = render(<MessageBubble {...props} />);

      // Assert
      expect(container.firstChild).toBeTruthy();
      expect(container.firstChild?.nodeName).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in content', () => {
      // Arrange
      const specialContent = 'Hello! @#$%^&*() <script>alert("test")</script>';
      const props = {
        type: 'user' as const,
        content: specialContent,
        timestamp: '2024-01-29T10:30:00Z',
      };

      // Act
      render(<MessageBubble {...props} />);

      // Assert
      expect(screen.getByText(new RegExp(specialContent.substring(0, 20)))).toBeInTheDocument();
    });

    it('should handle multiline content', () => {
      // Arrange
      const multilineContent = 'Line 1\nLine 2\nLine 3';
      const props = {
        type: 'assistant' as const,
        content: multilineContent,
        timestamp: '2024-01-29T10:30:00Z',
      };

      // Act
      render(<MessageBubble {...props} />);

      // Assert
      expect(screen.getByText(new RegExp('Line 1'))).toBeInTheDocument();
    });

    it('should handle very long single word', () => {
      // Arrange
      const longWord = 'a'.repeat(200);
      const props = {
        type: 'user' as const,
        content: longWord,
        timestamp: '2024-01-29T10:30:00Z',
      };

      // Act
      const { container } = render(<MessageBubble {...props} />);

      // Assert
      expect(container).toBeTruthy();
      expect(screen.getByText(longWord)).toBeInTheDocument();
    });
  });
});
