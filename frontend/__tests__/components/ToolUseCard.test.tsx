import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToolUseCard from '../../src/components/ToolUseCard';

describe('ToolUseCard Component', () => {

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      // Arrange
      const props = {
        toolName: 'Read',
        input: { file_path: '/tmp/test.txt' },
        output: 'File content here',
        isError: false,
      };

      // Act
      const { container } = render(<ToolUseCard {...props} />);

      // Assert
      expect(container).toBeTruthy();
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should display tool name in header', () => {
      // Arrange
      const props = {
        toolName: 'Bash',
        input: { command: 'ls -la' },
        output: null,
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);

      // Assert
      expect(screen.getByText('Bash')).toBeInTheDocument();
    });

    it('should render with minimal props', () => {
      // Arrange
      const props = {
        toolName: 'Write',
        input: {},
        output: null,
        isError: false,
      };

      // Act
      const { container } = render(<ToolUseCard {...props} />);

      // Assert
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.getByText('Write')).toBeInTheDocument();
    });
  });

  describe('Success/Error Badge Display', () => {
    it('should display success badge when isError is false', () => {
      // Arrange
      const props = {
        toolName: 'Read',
        input: { file_path: '/test.txt' },
        output: 'Success',
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);

      // Assert
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });

    it('should display error badge when isError is true', () => {
      // Arrange
      const props = {
        toolName: 'Read',
        input: { file_path: '/invalid.txt' },
        output: 'File not found',
        isError: true,
      };

      // Act
      render(<ToolUseCard {...props} />);

      // Assert
      expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
    });

    it('should apply error styling when isError is true', () => {
      // Arrange
      const props = {
        toolName: 'Write',
        input: { file_path: '/readonly.txt' },
        output: 'Permission denied',
        isError: true,
      };

      // Act
      const { container } = render(<ToolUseCard {...props} />);
      const errorElement = container.querySelector('.text-red-500, .bg-red-100, .border-red-500');

      // Assert
      expect(errorElement).toBeInTheDocument();
    });

    it('should apply success styling when isError is false', () => {
      // Arrange
      const props = {
        toolName: 'Edit',
        input: { file_path: '/test.txt', old_string: 'old', new_string: 'new' },
        output: 'Edit successful',
        isError: false,
      };

      // Act
      const { container } = render(<ToolUseCard {...props} />);
      const successElement = container.querySelector('.text-green-500, .bg-green-100');

      // Assert
      expect(successElement).toBeInTheDocument();
    });
  });

  describe('Toggle Functionality', () => {
    it('should start in collapsed state by default', () => {
      // Arrange
      const props = {
        toolName: 'Bash',
        input: { command: 'echo test' },
        output: 'test',
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);

      // Assert - content should not be in the DOM when collapsed
      expect(screen.queryByTestId('tool-use-content')).not.toBeInTheDocument();
    });

    it('should expand when header is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        toolName: 'Read',
        input: { file_path: '/tmp/test.txt' },
        output: 'File content',
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);
      const header = screen.getByText('Read').closest('button') || screen.getByRole('button');
      await user.click(header);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('tool-use-content')).toBeInTheDocument();
      });
      const inputSection = screen.getByTestId('input-section');
      expect(inputSection.textContent).toContain('file_path');
    });

    it('should collapse when clicked again', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        toolName: 'Write',
        input: { file_path: '/tmp/new.txt', content: 'Hello World' },
        output: null,
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);
      const header = screen.getByText('Write').closest('button') || screen.getByRole('button');

      await user.click(header); // Expand
      await waitFor(() => {
        expect(screen.getByTestId('tool-use-content')).toBeInTheDocument();
      });

      await user.click(header); // Collapse

      // Assert
      await waitFor(() => {
        expect(screen.queryByTestId('tool-use-content')).not.toBeInTheDocument();
      });
    });

    it('should toggle multiple times correctly', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        toolName: 'Edit',
        input: { file_path: '/test.txt', old_string: 'a', new_string: 'b' },
        output: 'Success',
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);
      const header = screen.getByText('Edit').closest('button') || screen.getByRole('button');

      // Assert - Multiple toggles
      await user.click(header);
      await waitFor(() => {
        expect(screen.getByTestId('tool-use-content')).toBeInTheDocument();
      });

      await user.click(header);
      await waitFor(() => {
        expect(screen.queryByTestId('tool-use-content')).not.toBeInTheDocument();
      });

      await user.click(header);
      await waitFor(() => {
        expect(screen.getByTestId('tool-use-content')).toBeInTheDocument();
      });
    });
  });

  describe('Input Parameters Display', () => {
    it('should display input parameters in JSON format when expanded', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        toolName: 'Read',
        input: { file_path: '/tmp/test.txt', offset: 0, limit: 100 },
        output: 'Content',
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);
      const header = screen.getByText('Read').closest('button') || screen.getByRole('button');
      await user.click(header);

      // Assert
      await waitFor(() => {
        const inputSection = screen.getByTestId('input-section');
        expect(inputSection.textContent).toContain('file_path');
        expect(inputSection.textContent).toContain('/tmp/test.txt');
      });
    });

    it('should display empty object when input is empty', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        toolName: 'Bash',
        input: {},
        output: 'Result',
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);
      const header = screen.getByText('Bash').closest('button') || screen.getByRole('button');
      await user.click(header);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/\{\}/)).toBeInTheDocument();
      });
    });

    it('should handle complex nested input objects', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        toolName: 'Grep',
        input: {
          pattern: 'test',
          path: '/tmp',
          options: {
            case_insensitive: true,
            multiline: false,
          },
        },
        output: 'Match found',
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);
      const header = screen.getByText('Grep').closest('button') || screen.getByRole('button');
      await user.click(header);

      // Assert
      await waitFor(() => {
        const inputSection = screen.getByTestId('input-section');
        expect(inputSection.textContent).toContain('pattern');
        expect(inputSection.textContent).toContain('options');
      });
    });

    it('should properly format JSON with indentation', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        toolName: 'Write',
        input: { file_path: '/test.txt', content: 'Hello' },
        output: null,
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);
      const header = screen.getByText('Write').closest('button') || screen.getByRole('button');
      await user.click(header);

      // Assert
      await waitFor(() => {
        const inputSection = screen.getByTestId('input-section');
        expect(inputSection.textContent).toContain('file_path');
      });
    });
  });

  describe('Output Display', () => {
    it('should display output text when provided', async () => {
      // Arrange
      const user = userEvent.setup();
      const outputText = 'This is the tool execution result';
      const props = {
        toolName: 'Bash',
        input: { command: 'echo test' },
        output: outputText,
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);
      const header = screen.getByText('Bash').closest('button') || screen.getByRole('button');
      await user.click(header);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(outputText)).toBeInTheDocument();
      });
    });

    it('should display error message when isError is true', async () => {
      // Arrange
      const user = userEvent.setup();
      const errorMessage = 'Error: File not found';
      const props = {
        toolName: 'Read',
        input: { file_path: '/invalid.txt' },
        output: errorMessage,
        isError: true,
      };

      // Act
      render(<ToolUseCard {...props} />);
      const header = screen.getByText('Read').closest('button') || screen.getByRole('button');
      await user.click(header);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should handle null output gracefully', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        toolName: 'Write',
        input: { file_path: '/test.txt', content: 'data' },
        output: null,
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);
      const header = screen.getByText('Write').closest('button') || screen.getByRole('button');
      await user.click(header);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/no output|empty/i)).toBeInTheDocument();
      });
    });

    it('should display long output text', async () => {
      // Arrange
      const user = userEvent.setup();
      const longOutput = 'Lorem ipsum dolor sit amet. '.repeat(50);
      const props = {
        toolName: 'Bash',
        input: { command: 'cat largefile.txt' },
        output: longOutput,
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);
      const header = screen.getByText('Bash').closest('button') || screen.getByRole('button');
      await user.click(header);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(new RegExp(longOutput.substring(0, 20)))).toBeInTheDocument();
      });
    });

    it('should preserve multiline output formatting', async () => {
      // Arrange
      const user = userEvent.setup();
      const multilineOutput = 'Line 1\nLine 2\nLine 3';
      const props = {
        toolName: 'Bash',
        input: { command: 'ls' },
        output: multilineOutput,
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);
      const header = screen.getByText('Bash').closest('button') || screen.getByRole('button');
      await user.click(header);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Line 1/)).toBeInTheDocument();
        expect(screen.getByText(/Line 2/)).toBeInTheDocument();
      });
    });
  });

  describe('Tool-Specific Color Themes', () => {
    it('should apply green theme for Bash tool', () => {
      // Arrange
      const props = {
        toolName: 'Bash',
        input: { command: 'ls' },
        output: 'result',
        isError: false,
      };

      // Act
      const { container } = render(<ToolUseCard {...props} />);
      const greenElement = container.querySelector('.bg-green-500, .text-green-600, .border-green-500');

      // Assert
      expect(greenElement).toBeInTheDocument();
    });

    it('should apply blue theme for Read tool', () => {
      // Arrange
      const props = {
        toolName: 'Read',
        input: { file_path: '/test.txt' },
        output: 'content',
        isError: false,
      };

      // Act
      const { container } = render(<ToolUseCard {...props} />);
      const blueElement = container.querySelector('.bg-blue-500, .text-blue-600, .border-blue-500');

      // Assert
      expect(blueElement).toBeInTheDocument();
    });

    it('should apply orange theme for Write tool', () => {
      // Arrange
      const props = {
        toolName: 'Write',
        input: { file_path: '/new.txt' },
        output: null,
        isError: false,
      };

      // Act
      const { container } = render(<ToolUseCard {...props} />);
      const orangeElement = container.querySelector('.bg-orange-500, .text-orange-600, .border-orange-500');

      // Assert
      expect(orangeElement).toBeInTheDocument();
    });

    it('should apply purple theme for Edit tool', () => {
      // Arrange
      const props = {
        toolName: 'Edit',
        input: { file_path: '/test.txt', old_string: 'a', new_string: 'b' },
        output: 'success',
        isError: false,
      };

      // Act
      const { container } = render(<ToolUseCard {...props} />);
      const purpleElement = container.querySelector('.bg-purple-500, .text-purple-600, .border-purple-500');

      // Assert
      expect(purpleElement).toBeInTheDocument();
    });

    it('should apply gray theme for unknown tools', () => {
      // Arrange
      const props = {
        toolName: 'CustomTool',
        input: { param: 'value' },
        output: 'result',
        isError: false,
      };

      // Act
      const { container } = render(<ToolUseCard {...props} />);
      const grayElement = container.querySelector('.bg-gray-500, .text-gray-600, .border-gray-500');

      // Assert
      expect(grayElement).toBeInTheDocument();
    });

    it('should maintain tool color theme even when error occurs', () => {
      // Arrange
      const props = {
        toolName: 'Read',
        input: { file_path: '/invalid.txt' },
        output: 'File not found',
        isError: true,
      };

      // Act
      const { container } = render(<ToolUseCard {...props} />);
      const blueElement = container.querySelector('.text-blue-700, .border-blue-200');

      // Assert
      expect(blueElement).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have button role for clickable header', () => {
      // Arrange
      const props = {
        toolName: 'Read',
        input: { file_path: '/test.txt' },
        output: 'content',
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);

      // Assert
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have aria-expanded attribute', () => {
      // Arrange
      const props = {
        toolName: 'Write',
        input: { file_path: '/test.txt' },
        output: null,
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);
      const button = screen.getByRole('button');

      // Assert
      expect(button).toHaveAttribute('aria-expanded');
    });

    it('should update aria-expanded when toggled', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        toolName: 'Bash',
        input: { command: 'ls' },
        output: 'result',
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);
      const button = screen.getByRole('button');
      const initialExpanded = button.getAttribute('aria-expanded');

      await user.click(button);
      
      // Assert
      await waitFor(() => {
        const expandedState = button.getAttribute('aria-expanded');
        expect(initialExpanded).not.toBe(expandedState);
      });
    });

    it('should have descriptive aria-label for toggle button', () => {
      // Arrange
      const props = {
        toolName: 'Edit',
        input: { file_path: '/test.txt' },
        output: 'success',
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);
      const button = screen.getByRole('button');

      // Assert
      expect(button).toHaveAttribute('aria-label');
      expect(button.getAttribute('aria-label')).toContain('Edit');
    });

    it('should be keyboard accessible', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        toolName: 'Read',
        input: { file_path: '/test.txt' },
        output: 'content',
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);
      const button = screen.getByRole('button');
      button.focus();

      // Assert
      expect(button).toHaveFocus();

      // Act - Press Enter to toggle
      await user.keyboard('{Enter}');

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('tool-use-content')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in tool name', () => {
      // Arrange
      const props = {
        toolName: 'Tool-Name_123',
        input: { param: 'value' },
        output: 'result',
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);

      // Assert
      expect(screen.getByText('Tool-Name_123')).toBeInTheDocument();
    });

    it('should handle empty string output', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        toolName: 'Bash',
        input: { command: 'echo' },
        output: '',
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);
      const header = screen.getByText('Bash').closest('button') || screen.getByRole('button');
      await user.click(header);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/empty|no output/i)).toBeInTheDocument();
      });
    });

    it('should handle very long tool names', () => {
      // Arrange
      const longToolName = 'VeryLongToolNameThatExceedsNormalLength';
      const props = {
        toolName: longToolName,
        input: { param: 'value' },
        output: 'result',
        isError: false,
      };

      // Act
      const { container } = render(<ToolUseCard {...props} />);

      // Assert
      expect(screen.getByText(longToolName)).toBeInTheDocument();
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle input with special characters', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        toolName: 'Bash',
        input: { command: 'echo "Hello <>&"' },
        output: 'Hello <>&',
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);
      const header = screen.getByText('Bash').closest('button') || screen.getByRole('button');
      await user.click(header);

      // Assert
      await waitFor(() => {
        const outputSection = screen.getByTestId('output-section');
        expect(outputSection.textContent).toContain('Hello <>&');
      });
    });

    it('should handle undefined values in input object', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        toolName: 'Read',
        input: { file_path: '/test.txt', optional_param: undefined },
        output: 'content',
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);
      const header = screen.getByText('Read').closest('button') || screen.getByRole('button');
      await user.click(header);

      // Assert
      await waitFor(() => {
        const inputSection = screen.getByTestId('input-section');
        expect(inputSection.textContent).toContain('file_path');
      });
    });

    it('should handle array values in input', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        toolName: 'CustomTool',
        input: { files: ['/file1.txt', '/file2.txt'], options: ['--verbose', '--force'] },
        output: 'success',
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);
      const header = screen.getByText('CustomTool').closest('button') || screen.getByRole('button');
      await user.click(header);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/file1\.txt/)).toBeInTheDocument();
        expect(screen.getByText(/file2\.txt/)).toBeInTheDocument();
      });
    });

    it('should handle numeric values in input', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        toolName: 'Read',
        input: { file_path: '/test.txt', offset: 100, limit: 500 },
        output: 'content',
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);
      const header = screen.getByText('Read').closest('button') || screen.getByRole('button');
      await user.click(header);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/100/)).toBeInTheDocument();
        expect(screen.getByText(/500/)).toBeInTheDocument();
      });
    });

    it('should handle boolean values in input', async () => {
      // Arrange
      const user = userEvent.setup();
      const props = {
        toolName: 'Grep',
        input: { pattern: 'test', case_insensitive: true, multiline: false },
        output: 'match found',
        isError: false,
      };

      // Act
      render(<ToolUseCard {...props} />);
      const header = screen.getByText('Grep').closest('button') || screen.getByRole('button');
      await user.click(header);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/true/i)).toBeInTheDocument();
        expect(screen.getByText(/false/i)).toBeInTheDocument();
      });
    });
  });

  describe('Component State Management', () => {
    it('should maintain collapsed state across re-renders', () => {
      // Arrange
      const props = {
        toolName: 'Read',
        input: { file_path: '/test.txt' },
        output: 'content',
        isError: false,
      };

      // Act
      const { rerender } = render(<ToolUseCard {...props} />);
      expect(screen.queryByTestId('tool-use-content')).not.toBeInTheDocument();

      rerender(<ToolUseCard {...props} />);

      // Assert
      expect(screen.queryByTestId('tool-use-content')).not.toBeInTheDocument();
    });

    it('should update display when props change', async () => {
      // Arrange
      const user = userEvent.setup();
      const initialProps = {
        toolName: 'Read',
        input: { file_path: '/test1.txt' },
        output: 'content 1',
        isError: false,
      };

      // Act
      const { rerender } = render(<ToolUseCard {...initialProps} />);
      const header = screen.getByText('Read').closest('button') || screen.getByRole('button');
      await user.click(header);

      await waitFor(() => {
        expect(screen.getByText(/test1\.txt/)).toBeInTheDocument();
      });

      const updatedProps = {
        toolName: 'Read',
        input: { file_path: '/test2.txt' },
        output: 'content 2',
        isError: false,
      };

      rerender(<ToolUseCard {...updatedProps} />);

      // Assert
      expect(screen.getByText(/test2\.txt/)).toBeInTheDocument();
      expect(screen.queryByText(/test1\.txt/)).not.toBeInTheDocument();
    });

    it('should update error state when isError prop changes', () => {
      // Arrange
      const initialProps = {
        toolName: 'Write',
        input: { file_path: '/test.txt' },
        output: 'success',
        isError: false,
      };

      // Act
      const { rerender, container } = render(<ToolUseCard {...initialProps} />);
      let errorElement = container.querySelector('.text-red-500, .bg-red-100');
      expect(errorElement).not.toBeInTheDocument();

      const errorProps = {
        ...initialProps,
        output: 'Permission denied',
        isError: true,
      };

      rerender(<ToolUseCard {...errorProps} />);

      // Assert
      errorElement = container.querySelector('.text-red-500, .bg-red-100, .border-red-500');
      expect(errorElement).toBeInTheDocument();
    });
  });
});
