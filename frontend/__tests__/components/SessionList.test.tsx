import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SessionList from '../../src/components/SessionList';
import type { Session } from '../../src/types';
import { useSessions } from '../../src/hooks/useSessions';

// Mock the useSessions hook
vi.mock('../../src/hooks/useSessions');

describe('SessionList Component', () => {
  let mockOnSessionSelect: ReturnType<typeof vi.fn>;
  const mockUseSessions = vi.fn();

  beforeEach(() => {
    mockOnSessionSelect = vi.fn();
    vi.clearAllMocks();

    // Default mock implementation
    vi.mocked(useSessions).mockImplementation(mockUseSessions);
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      // Arrange
      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: [],
        refetch: vi.fn(),
      });

      // Act
      const { container } = render(
        <SessionList onSessionSelect={mockOnSessionSelect} />
      );

      // Assert
      expect(container).toBeTruthy();
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render "Sessions" header', () => {
      // Arrange
      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: [],
        refetch: vi.fn(),
      });

      // Act
      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      expect(screen.getByText('Sessions')).toBeInTheDocument();
    });

    it('should render session list when sessions are provided', () => {
      // Arrange
      const mockSessions: Session[] = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
        { id: 'session-2', lastModified: '2024-01-29T11:00:00Z' },
        { id: 'session-3', lastModified: '2024-01-29T12:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      // Act
      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      expect(screen.getByText('session-1')).toBeInTheDocument();
      expect(screen.getByText('session-2')).toBeInTheDocument();
      expect(screen.getByText('session-3')).toBeInTheDocument();
    });
  });

  describe('Session Click Interaction', () => {
    it('should call onSessionSelect when session is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockSessions: Session[] = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Act
      const sessionElement = screen.getByText('session-1');
      await user.click(sessionElement);

      // Assert
      await waitFor(() => {
        expect(mockOnSessionSelect).toHaveBeenCalled();
      });
    });

    it('should call onSessionSelect with correct sessionId', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockSessions: Session[] = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
        { id: 'session-2', lastModified: '2024-01-29T11:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Act
      await user.click(screen.getByText('session-2'));

      // Assert
      await waitFor(() => {
        expect(mockOnSessionSelect).toHaveBeenCalledWith('session-2');
      });
    });

    it('should handle multiple session clicks', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockSessions: Session[] = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
        { id: 'session-2', lastModified: '2024-01-29T11:00:00Z' },
        { id: 'session-3', lastModified: '2024-01-29T12:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Act
      await user.click(screen.getByText('session-1'));
      await user.click(screen.getByText('session-3'));
      await user.click(screen.getByText('session-2'));

      // Assert
      expect(mockOnSessionSelect).toHaveBeenCalledTimes(3);
      expect(mockOnSessionSelect).toHaveBeenNthCalledWith(1, 'session-1');
      expect(mockOnSessionSelect).toHaveBeenNthCalledWith(2, 'session-3');
      expect(mockOnSessionSelect).toHaveBeenNthCalledWith(3, 'session-2');
    });
  });

  describe('Current Session Highlight', () => {
    it('should highlight current session with bg-blue-100 class', () => {
      // Arrange
      const mockSessions: Session[] = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
        { id: 'session-2', lastModified: '2024-01-29T11:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      // Act
      render(
        <SessionList
          currentSessionId="session-1"
          onSessionSelect={mockOnSessionSelect}
        />
      );

      // Assert
      const currentSession = screen.getByText('session-1').closest('button');
      expect(currentSession).toHaveClass('bg-blue-100');
    });

    it('should highlight current session with border-l-4 border-blue-500 classes', () => {
      // Arrange
      const mockSessions: Session[] = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
        { id: 'session-2', lastModified: '2024-01-29T11:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      // Act
      render(
        <SessionList
          currentSessionId="session-2"
          onSessionSelect={mockOnSessionSelect}
        />
      );

      // Assert
      const currentSession = screen.getByText('session-2').closest('button');
      expect(currentSession).toHaveClass('border-l-4', 'border-blue-500');
    });

    it('should not highlight non-current sessions', () => {
      // Arrange
      const mockSessions: Session[] = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
        { id: 'session-2', lastModified: '2024-01-29T11:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      // Act
      render(
        <SessionList
          currentSessionId="session-1"
          onSessionSelect={mockOnSessionSelect}
        />
      );

      // Assert
      const nonCurrentSession = screen.getByText('session-2').closest('button');
      expect(nonCurrentSession).not.toHaveClass('bg-blue-100');
      expect(nonCurrentSession).not.toHaveClass('border-l-4');
    });

    it('should update highlight when currentSessionId changes', () => {
      // Arrange
      const mockSessions: Session[] = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
        { id: 'session-2', lastModified: '2024-01-29T11:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      // Act
      const { rerender } = render(
        <SessionList
          currentSessionId="session-1"
          onSessionSelect={mockOnSessionSelect}
        />
      );

      const firstHighlight = screen.getByText('session-1').closest('button');
      expect(firstHighlight).toHaveClass('bg-blue-100');

      // Rerender with new currentSessionId
      rerender(
        <SessionList
          currentSessionId="session-2"
          onSessionSelect={mockOnSessionSelect}
        />
      );

      // Assert
      const oldSession = screen.getByText('session-1').closest('button');
      const newSession = screen.getByText('session-2').closest('button');

      expect(oldSession).not.toHaveClass('bg-blue-100');
      expect(newSession).toHaveClass('bg-blue-100');
    });

    it('should handle no currentSessionId provided', () => {
      // Arrange
      const mockSessions: Session[] = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      // Act
      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      const session = screen.getByText('session-1').closest('button');
      expect(session).not.toHaveClass('bg-blue-100');
    });
  });

  describe('Hover Effects', () => {
    it('should apply hover:bg-gray-100 class to session items', () => {
      // Arrange
      const mockSessions: Session[] = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      // Act
      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      const sessionElement = screen.getByText('session-1').closest('button');
      expect(sessionElement).toHaveClass('hover:bg-gray-100');
    });

    it('should apply hover class to all session items', () => {
      // Arrange
      const mockSessions: Session[] = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
        { id: 'session-2', lastModified: '2024-01-29T11:00:00Z' },
        { id: 'session-3', lastModified: '2024-01-29T12:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      // Act
      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      mockSessions.forEach((session) => {
        const element = screen.getByText(session.id).closest('button');
        expect(element).toHaveClass('hover:bg-gray-100');
      });
    });
  });

  describe('Loading State', () => {
    it('should display loading UI when loading is true', () => {
      // Arrange
      mockUseSessions.mockReturnValue({
        loading: true,
        error: null,
        sessions: null,
        refetch: vi.fn(),
      });

      // Act
      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should not display sessions while loading', () => {
      // Arrange
      mockUseSessions.mockReturnValue({
        loading: true,
        error: null,
        sessions: null,
        refetch: vi.fn(),
      });

      // Act
      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      expect(screen.queryByText('session-1')).not.toBeInTheDocument();
    });

    it('should hide loading UI after loading completes', () => {
      // Arrange
      const mockSessions: Session[] = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: true,
        error: null,
        sessions: null,
        refetch: vi.fn(),
      });

      const { rerender } = render(
        <SessionList onSessionSelect={mockOnSessionSelect} />
      );

      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Act - Update to loaded state
      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      rerender(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      expect(screen.getByText('session-1')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error occurs', () => {
      // Arrange
      const mockError = new Error('Failed to fetch sessions');

      mockUseSessions.mockReturnValue({
        loading: false,
        error: mockError,
        sessions: null,
        refetch: vi.fn(),
      });

      // Act
      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    it('should display error details in error message', () => {
      // Arrange
      const mockError = new Error('Network connection failed');

      mockUseSessions.mockReturnValue({
        loading: false,
        error: mockError,
        sessions: null,
        refetch: vi.fn(),
      });

      // Act
      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      expect(
        screen.getByText(/network connection failed/i)
      ).toBeInTheDocument();
    });

    it('should not display sessions when error occurs', () => {
      // Arrange
      mockUseSessions.mockReturnValue({
        loading: false,
        error: new Error('Failed'),
        sessions: null,
        refetch: vi.fn(),
      });

      // Act
      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      expect(screen.queryByText('session-1')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state message when sessions array is empty', () => {
      // Arrange
      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: [],
        refetch: vi.fn(),
      });

      // Act
      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      expect(screen.getByText(/no sessions/i)).toBeInTheDocument();
    });

    it('should not display session items when empty', () => {
      // Arrange
      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: [],
        refetch: vi.fn(),
      });

      // Act
      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      const sessionItems = screen.queryAllByRole('button');
      expect(sessionItems).toHaveLength(0);
    });

    it('should still show Sessions header when empty', () => {
      // Arrange
      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: [],
        refetch: vi.fn(),
      });

      // Act
      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      expect(screen.getByText('Sessions')).toBeInTheDocument();
    });
  });

  describe('Session Sorting - Latest First', () => {
    it('should display sessions in descending order by lastModified', () => {
      // Arrange
      const mockSessions: Session[] = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
        { id: 'session-2', lastModified: '2024-01-29T12:00:00Z' },
        { id: 'session-3', lastModified: '2024-01-29T11:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      // Act
      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      const sessionElements = screen.getAllByRole('button');
      expect(sessionElements[0]).toHaveTextContent('session-2'); // 12:00
      expect(sessionElements[1]).toHaveTextContent('session-3'); // 11:00
      expect(sessionElements[2]).toHaveTextContent('session-1'); // 10:00
    });

    it('should handle sessions with same lastModified timestamp', () => {
      // Arrange
      const mockSessions: Session[] = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
        { id: 'session-2', lastModified: '2024-01-29T10:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      // Act
      const { container } = render(
        <SessionList onSessionSelect={mockOnSessionSelect} />
      );

      // Assert
      expect(container).toBeTruthy();
      expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    it('should maintain sort order when new session is added', () => {
      // Arrange
      const initialSessions: Session[] = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
        { id: 'session-2', lastModified: '2024-01-29T11:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: initialSessions,
        refetch: vi.fn(),
      });

      const { rerender } = render(
        <SessionList onSessionSelect={mockOnSessionSelect} />
      );

      // Act - Add new session with latest timestamp
      const updatedSessions: Session[] = [
        ...initialSessions,
        { id: 'session-3', lastModified: '2024-01-29T13:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: updatedSessions,
        refetch: vi.fn(),
      });

      rerender(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      const sessionElements = screen.getAllByRole('button');
      expect(sessionElements[0]).toHaveTextContent('session-3');
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate aria-labels for session items', () => {
      // Arrange
      const mockSessions: Session[] = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      // Act
      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      const sessionElement = screen.getByText('session-1').closest('button');
      expect(
        sessionElement?.getAttribute('aria-label') ||
          sessionElement?.textContent
      ).toBeTruthy();
    });

    it('should mark current session with aria-current', () => {
      // Arrange
      const mockSessions: Session[] = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
        { id: 'session-2', lastModified: '2024-01-29T11:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      // Act
      render(
        <SessionList
          currentSessionId="session-1"
          onSessionSelect={mockOnSessionSelect}
        />
      );

      // Assert
      const currentSession = screen.getByText('session-1').closest('button');
      expect(currentSession).toHaveAttribute('aria-current', 'true');
    });

    it('should support keyboard navigation with Enter key', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockSessions: Session[] = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Act
      const sessionButton = screen.getByText('session-1').closest('button');
      sessionButton?.focus();
      await user.keyboard('{Enter}');

      // Assert
      expect(mockOnSessionSelect).toHaveBeenCalledWith('session-1');
    });

    it('should support keyboard navigation with Space key', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockSessions: Session[] = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Act
      const sessionButton = screen.getByText('session-1').closest('button');
      sessionButton?.focus();
      await user.keyboard(' ');

      // Assert
      expect(mockOnSessionSelect).toHaveBeenCalledWith('session-1');
    });

    it('should have proper role for session list container', () => {
      // Arrange
      const mockSessions: Session[] = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      // Act
      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      const listContainer = screen.getByRole('list');
      expect(listContainer).toBeInTheDocument();
    });

    it('should have proper role for session items', () => {
      // Arrange
      const mockSessions: Session[] = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
        { id: 'session-2', lastModified: '2024-01-29T11:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      // Act
      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      const sessionButtons = screen.getAllByRole('button');
      expect(sessionButtons).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle session with very long id', () => {
      // Arrange
      const longId = 'a'.repeat(200);
      const mockSessions: Session[] = [
        { id: longId, lastModified: '2024-01-29T10:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      // Act
      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      expect(screen.getByText(longId)).toBeInTheDocument();
    });

    it('should handle session with special characters in id', () => {
      // Arrange
      const specialId = 'session-<script>alert("xss")</script>';
      const mockSessions: Session[] = [
        { id: specialId, lastModified: '2024-01-29T10:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      // Act
      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      expect(screen.getByText(specialId)).toBeInTheDocument();
    });

    it('should handle invalid lastModified date format', () => {
      // Arrange
      const mockSessions: Session[] = [
        { id: 'session-1', lastModified: 'invalid-date' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      // Act
      const { container } = render(
        <SessionList onSessionSelect={mockOnSessionSelect} />
      );

      // Assert
      expect(container).toBeTruthy();
      expect(screen.getByText('session-1')).toBeInTheDocument();
    });

    it('should handle rapid clicks on same session', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockSessions: Session[] = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Act
      const sessionElement = screen.getByText('session-1');
      await user.click(sessionElement);
      await user.click(sessionElement);
      await user.click(sessionElement);

      // Assert
      expect(mockOnSessionSelect).toHaveBeenCalledTimes(3);
      expect(mockOnSessionSelect).toHaveBeenCalledWith('session-1');
    });

    it('should handle transition from error to success state', () => {
      // Arrange
      mockUseSessions.mockReturnValue({
        loading: false,
        error: new Error('Failed'),
        sessions: null,
        refetch: vi.fn(),
      });

      const { rerender } = render(
        <SessionList onSessionSelect={mockOnSessionSelect} />
      );

      expect(screen.getByText(/error/i)).toBeInTheDocument();

      // Act
      const mockSessions: Session[] = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      rerender(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      expect(screen.getByText('session-1')).toBeInTheDocument();
    });

    it('should handle large number of sessions', () => {
      // Arrange
      const mockSessions: Session[] = Array.from({ length: 100 }, (_, i) => ({
        id: `session-${i}`,
        lastModified: `2024-01-29T${String(i % 24).padStart(2, '0')}:00:00Z`,
      }));

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      // Act
      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      const sessionButtons = screen.getAllByRole('button');
      expect(sessionButtons).toHaveLength(100);
    });
  });

  describe('Component Props Validation', () => {
    it('should require onSessionSelect prop', () => {
      // Arrange
      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: [],
        refetch: vi.fn(),
      });

      // Act & Assert
      // TypeScript should enforce this at compile time
      // At runtime, the component should still render but might not function correctly
      expect(() => {
        render(<SessionList onSessionSelect={mockOnSessionSelect} />);
      }).not.toThrow();
    });

    it('should accept optional currentSessionId prop', () => {
      // Arrange
      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: [],
        refetch: vi.fn(),
      });

      // Act & Assert
      expect(() => {
        render(<SessionList onSessionSelect={mockOnSessionSelect} />);
      }).not.toThrow();

      expect(() => {
        render(
          <SessionList
            currentSessionId="session-1"
            onSessionSelect={mockOnSessionSelect}
          />
        );
      }).not.toThrow();
    });
  });

  describe('UseSessions Hook Integration', () => {
    it('should call useSessions hook on mount', () => {
      // Arrange
      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: [],
        refetch: vi.fn(),
      });

      // Act
      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      expect(mockUseSessions).toHaveBeenCalled();
    });

    it('should use sessions data from useSessions hook', () => {
      // Arrange
      const mockSessions: Session[] = [
        { id: 'session-from-hook', lastModified: '2024-01-29T10:00:00Z' },
      ];

      mockUseSessions.mockReturnValue({
        loading: false,
        error: null,
        sessions: mockSessions,
        refetch: vi.fn(),
      });

      // Act
      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      expect(screen.getByText('session-from-hook')).toBeInTheDocument();
    });

    it('should respect loading state from useSessions hook', () => {
      // Arrange
      mockUseSessions.mockReturnValue({
        loading: true,
        error: null,
        sessions: null,
        refetch: vi.fn(),
      });

      // Act
      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should respect error state from useSessions hook', () => {
      // Arrange
      mockUseSessions.mockReturnValue({
        loading: false,
        error: new Error('Hook error'),
        sessions: null,
        refetch: vi.fn(),
      });

      // Act
      render(<SessionList onSessionSelect={mockOnSessionSelect} />);

      // Assert
      expect(screen.getByText(/hook error/i)).toBeInTheDocument();
    });
  });
});
