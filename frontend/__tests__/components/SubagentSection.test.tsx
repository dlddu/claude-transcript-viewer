import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubagentSection from '../../src/components/SubagentSection';

describe('SubagentSection Component', () => {

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      // Arrange
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Explore',
        children: null,
      };

      // Act
      const { container } = render(<SubagentSection {...props} />);

      // Assert
      expect(container).toBeTruthy();
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should display agent type in header', () => {
      // Arrange
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Plan',
        children: null,
      };

      // Act
      render(<SubagentSection {...props} />);

      // Assert
      expect(screen.getByText('Plan')).toBeInTheDocument();
    });

    it('should render with minimal props', () => {
      // Arrange
      const props = {
        sessionId: 'session-1',
        agentId: 'agent-1',
        agentType: 'Explore',
        children: null,
      };

      // Act
      const { container } = render(<SubagentSection {...props} />);

      // Assert
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.getByText('Explore')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply purple background color (bg-purple-50)', () => {
      // Arrange
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Explore',
        children: null,
      };

      // Act
      const { container } = render(<SubagentSection {...props} />);
      const purpleElement = container.querySelector('.bg-purple-50');

      // Assert
      expect(purpleElement).toBeInTheDocument();
    });

    it('should apply left border with purple color (border-l-4 border-purple-300)', () => {
      // Arrange
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Plan',
        children: null,
      };

      // Act
      const { container } = render(<SubagentSection {...props} />);
      const borderElement = container.querySelector('.border-l-4.border-purple-300');

      // Assert
      expect(borderElement).toBeInTheDocument();
    });

    it('should apply left margin for indentation (ml-4)', () => {
      // Arrange
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Explore',
        children: null,
      };

      // Act
      const { container } = render(<SubagentSection {...props} />);
      const indentedElement = container.querySelector('.ml-4');

      // Assert
      expect(indentedElement).toBeInTheDocument();
    });

    it('should combine all styling classes correctly', () => {
      // Arrange
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Explore',
        children: null,
      };

      // Act
      const { container } = render(<SubagentSection {...props} />);
      const styledElement = container.querySelector('.ml-4.bg-purple-50.border-l-4.border-purple-300');

      // Assert
      expect(styledElement).toBeInTheDocument();
    });
  });

  describe('Header Content', () => {
    it('should display Subagent icon in header', () => {
      // Arrange
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Explore',
        children: null,
      };

      // Act
      render(<SubagentSection {...props} />);

      // Assert - Looking for Subagent icon representation (could be text, emoji, or SVG)
      const header = screen.getByRole('button');
      expect(header.textContent).toMatch(/Subagent|🤖|Agent/i);
    });

    it('should display agent type in header', () => {
      // Arrange
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Plan',
        children: null,
      };

      // Act
      render(<SubagentSection {...props} />);

      // Assert
      expect(screen.getByText('Plan')).toBeInTheDocument();
    });

    it('should display toggle button in header', () => {
      // Arrange
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Explore',
        children: null,
      };

      // Act
      render(<SubagentSection {...props} />);
      const button = screen.getByRole('button');

      // Assert
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded');
    });

    it('should display different agent types correctly', () => {
      // Arrange & Act & Assert
      const agentTypes = ['Explore', 'Plan', 'Execute', 'Review'];

      agentTypes.forEach((type) => {
        const props = {
          sessionId: 'session-123',
          agentId: `agent-${type}`,
          agentType: type,
          children: null,
        };

        const { unmount } = render(<SubagentSection {...props} />);
        expect(screen.getByText(type)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Toggle Functionality', () => {
    it('should start in collapsed state by default', () => {
      // Arrange
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Explore',
        children: <div data-testid="child-content">Child Content</div>,
      };

      // Act
      render(<SubagentSection {...props} />);

      // Assert - content should not be visible when collapsed
      expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
    });

    it('should expand when header is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Explore',
        children: <div data-testid="child-content">Child Content</div>,
      };

      // Act
      render(<SubagentSection {...props} />);
      const header = screen.getByRole('button');
      await user.click(header);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
      });
    });

    it('should collapse when clicked again', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Plan',
        children: <div data-testid="child-content">Test Content</div>,
      };

      // Act
      render(<SubagentSection {...props} />);
      const header = screen.getByRole('button');

      await user.click(header); // Expand
      await waitFor(() => {
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
      });

      await user.click(header); // Collapse

      // Assert
      await waitFor(() => {
        expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
      });
    });

    it('should toggle multiple times correctly', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Execute',
        children: <div data-testid="child-content">Content</div>,
      };

      // Act
      render(<SubagentSection {...props} />);
      const header = screen.getByRole('button');

      // Assert - Multiple toggles
      await user.click(header);
      await waitFor(() => {
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
      });

      await user.click(header);
      await waitFor(() => {
        expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
      });

      await user.click(header);
      await waitFor(() => {
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
      });
    });

    it('should update toggle icon when expanded/collapsed', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Explore',
        children: <div>Content</div>,
      };

      // Act
      render(<SubagentSection {...props} />);
      const button = screen.getByRole('button');

      // Check collapsed state icon
      const collapsedIcon = button.querySelector('svg');
      expect(collapsedIcon).toBeInTheDocument();

      await user.click(button);

      // Assert - Icon should still be there but possibly rotated
      await waitFor(() => {
        const expandedIcon = button.querySelector('svg');
        expect(expandedIcon).toBeInTheDocument();
      });
    });
  });

  describe('Children Rendering', () => {
    it('should render children when expanded', async () => {
      // Arrange
      const user = userEvent.setup();
      const childContent = 'This is child content';
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Explore',
        children: <div>{childContent}</div>,
      };

      // Act
      render(<SubagentSection {...props} />);
      const header = screen.getByRole('button');
      await user.click(header);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(childContent)).toBeInTheDocument();
      });
    });

    it('should handle null children gracefully', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Plan',
        children: null,
      };

      // Act
      render(<SubagentSection {...props} />);
      const header = screen.getByRole('button');
      await user.click(header);

      // Assert - Should not crash
      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button.getAttribute('aria-expanded')).toBe('true');
      });
    });

    it('should render multiple nested children', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Explore',
        children: (
          <>
            <div data-testid="child-1">Child 1</div>
            <div data-testid="child-2">Child 2</div>
            <div data-testid="child-3">Child 3</div>
          </>
        ),
      };

      // Act
      render(<SubagentSection {...props} />);
      const header = screen.getByRole('button');
      await user.click(header);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('child-1')).toBeInTheDocument();
        expect(screen.getByTestId('child-2')).toBeInTheDocument();
        expect(screen.getByTestId('child-3')).toBeInTheDocument();
      });
    });

    it('should support recursive rendering with nested SubagentSections', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Explore',
        children: (
          <SubagentSection
            sessionId="session-123"
            agentId="agent-789"
            agentType="Plan"
          >
            <div data-testid="nested-content">Nested Content</div>
          </SubagentSection>
        ),
      };

      // Act
      render(<SubagentSection {...props} />);
      const parentHeader = screen.getByText('Explore').closest('button');
      await user.click(parentHeader!);

      await waitFor(() => {
        expect(screen.getByText('Plan')).toBeInTheDocument();
      });

      const childHeader = screen.getByText('Plan').closest('button');
      await user.click(childHeader!);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('nested-content')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have button role for clickable header', () => {
      // Arrange
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Explore',
        children: null,
      };

      // Act
      render(<SubagentSection {...props} />);

      // Assert
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have aria-expanded attribute', () => {
      // Arrange
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Plan',
        children: null,
      };

      // Act
      render(<SubagentSection {...props} />);
      const button = screen.getByRole('button');

      // Assert
      expect(button).toHaveAttribute('aria-expanded');
    });

    it('should update aria-expanded when toggled', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Explore',
        children: <div>Content</div>,
      };

      // Act
      render(<SubagentSection {...props} />);
      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-expanded')).toBe('false');

      await user.click(button);

      // Assert
      await waitFor(() => {
        expect(button.getAttribute('aria-expanded')).toBe('true');
      });
    });

    it('should have descriptive aria-label for toggle button', () => {
      // Arrange
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Execute',
        children: null,
      };

      // Act
      render(<SubagentSection {...props} />);
      const button = screen.getByRole('button');

      // Assert
      expect(button).toHaveAttribute('aria-label');
      expect(button.getAttribute('aria-label')).toContain('Execute');
    });

    it('should be keyboard accessible with Enter key', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Explore',
        children: <div data-testid="content">Content</div>,
      };

      // Act
      render(<SubagentSection {...props} />);
      const button = screen.getByRole('button');
      button.focus();

      // Assert
      expect(button).toHaveFocus();

      // Act - Press Enter to toggle
      await user.keyboard('{Enter}');

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      });
    });

    it('should be keyboard accessible with Space key', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Plan',
        children: <div data-testid="content">Content</div>,
      };

      // Act
      render(<SubagentSection {...props} />);
      const button = screen.getByRole('button');
      button.focus();

      // Act - Press Space to toggle
      await user.keyboard(' ');

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      });
    });

    it('should not trigger on other keyboard keys', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Explore',
        children: <div data-testid="content">Content</div>,
      };

      // Act
      render(<SubagentSection {...props} />);
      const button = screen.getByRole('button');
      button.focus();

      // Press random keys
      await user.keyboard('a');
      await user.keyboard('b');
      await user.keyboard('{Escape}');

      // Assert - Should still be collapsed
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
      expect(button.getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in agent type', () => {
      // Arrange
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Custom-Type_123',
        children: null,
      };

      // Act
      render(<SubagentSection {...props} />);

      // Assert
      expect(screen.getByText('Custom-Type_123')).toBeInTheDocument();
    });

    it('should handle very long agent types', () => {
      // Arrange
      const longAgentType = 'VeryLongAgentTypeThatExceedsNormalLength';
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: longAgentType,
        children: null,
      };

      // Act
      const { container } = render(<SubagentSection {...props} />);

      // Assert
      expect(screen.getByText(longAgentType)).toBeInTheDocument();
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle empty sessionId', () => {
      // Arrange
      const props = {
        sessionId: '',
        agentId: 'agent-456',
        agentType: 'Explore',
        children: null,
      };

      // Act
      const { container } = render(<SubagentSection {...props} />);

      // Assert
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle empty agentId', () => {
      // Arrange
      const props = {
        sessionId: 'session-123',
        agentId: '',
        agentType: 'Plan',
        children: null,
      };

      // Act
      const { container } = render(<SubagentSection {...props} />);

      // Assert
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle empty agent type gracefully', () => {
      // Arrange
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: '',
        children: null,
      };

      // Act
      const { container } = render(<SubagentSection {...props} />);

      // Assert
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle complex nested component trees', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Explore',
        children: (
          <div>
            <SubagentSection sessionId="session-123" agentId="agent-789" agentType="Plan">
              <SubagentSection sessionId="session-123" agentId="agent-101" agentType="Execute">
                <div data-testid="deep-nested">Deep Nested Content</div>
              </SubagentSection>
            </SubagentSection>
          </div>
        ),
      };

      // Act
      render(<SubagentSection {...props} />);

      // Expand first level
      const level1 = screen.getByText('Explore').closest('button');
      await user.click(level1!);

      await waitFor(() => {
        expect(screen.getByText('Plan')).toBeInTheDocument();
      });

      // Expand second level
      const level2 = screen.getByText('Plan').closest('button');
      await user.click(level2!);

      await waitFor(() => {
        expect(screen.getByText('Execute')).toBeInTheDocument();
      });

      // Expand third level
      const level3 = screen.getByText('Execute').closest('button');
      await user.click(level3!);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('deep-nested')).toBeInTheDocument();
      });
    });
  });

  describe('Component State Management', () => {
    it('should maintain collapsed state across re-renders', () => {
      // Arrange
      const props = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Explore',
        children: <div data-testid="content">Content</div>,
      };

      // Act
      const { rerender } = render(<SubagentSection {...props} />);
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();

      rerender(<SubagentSection {...props} />);

      // Assert
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('should update display when props change', async () => {
      // Arrange
      const user = userEvent.setup();
      const initialProps = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Explore',
        children: <div data-testid="content-1">Content 1</div>,
      };

      // Act
      const { rerender } = render(<SubagentSection {...initialProps} />);
      const header = screen.getByRole('button');
      await user.click(header);

      await waitFor(() => {
        expect(screen.getByTestId('content-1')).toBeInTheDocument();
      });

      const updatedProps = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Plan',
        children: <div data-testid="content-2">Content 2</div>,
      };

      rerender(<SubagentSection {...updatedProps} />);

      // Assert
      expect(screen.getByText('Plan')).toBeInTheDocument();
      expect(screen.queryByText('Explore')).not.toBeInTheDocument();
    });

    it('should maintain expanded state when children change', async () => {
      // Arrange
      const user = userEvent.setup();
      const initialProps = {
        sessionId: 'session-123',
        agentId: 'agent-456',
        agentType: 'Explore',
        children: <div data-testid="content-1">Content 1</div>,
      };

      // Act
      const { rerender } = render(<SubagentSection {...initialProps} />);
      const header = screen.getByRole('button');
      await user.click(header);

      await waitFor(() => {
        expect(screen.getByTestId('content-1')).toBeInTheDocument();
      });

      const updatedProps = {
        ...initialProps,
        children: <div data-testid="content-2">Content 2</div>,
      };

      rerender(<SubagentSection {...updatedProps} />);

      // Assert - Should still be expanded
      await waitFor(() => {
        expect(screen.getByTestId('content-2')).toBeInTheDocument();
      });
    });
  });
});
