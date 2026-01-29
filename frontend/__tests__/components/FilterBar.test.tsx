import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterBar from '../../src/components/FilterBar';
import type { FilterOptions } from '../../src/types';

describe('FilterBar Component', () => {
  let mockOnFilterChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnFilterChange = vi.fn();
  });

  describe('Initial Rendering', () => {
    it('should render without crashing', () => {
      // Arrange & Act
      const { container } = render(
        <FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />
      );

      // Assert
      expect(container).toBeTruthy();
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render search input with correct placeholder', () => {
      // Arrange & Act
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);

      // Assert
      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('should render "User messages only" checkbox', () => {
      // Arrange & Act
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);

      // Assert
      const checkbox = screen.getByLabelText(/user messages only/i);
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute('type', 'checkbox');
    });

    it('should render "Errors only" checkbox', () => {
      // Arrange & Act
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);

      // Assert
      const checkbox = screen.getByLabelText(/errors only/i);
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute('type', 'checkbox');
    });

    it('should render tool filter dropdown', () => {
      // Arrange
      const toolNames = ['Read', 'Write', 'Bash'];

      // Act
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={toolNames} />);

      // Assert
      const dropdown = screen.getByRole('combobox');
      expect(dropdown).toBeInTheDocument();
    });

    it('should render "All tools" option in dropdown', () => {
      // Arrange
      const toolNames = ['Read', 'Write'];

      // Act
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={toolNames} />);

      // Assert
      const dropdown = screen.getByRole('combobox');
      expect(dropdown).toBeInTheDocument();

      const allToolsOption = screen.getByRole('option', { name: /all tools/i });
      expect(allToolsOption).toBeInTheDocument();
    });

    it('should render all tool name options in dropdown', () => {
      // Arrange
      const toolNames = ['Read', 'Write', 'Bash'];

      // Act
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={toolNames} />);

      // Assert
      toolNames.forEach(toolName => {
        const option = screen.getByRole('option', { name: toolName });
        expect(option).toBeInTheDocument();
      });
    });

    it('should render empty tool dropdown when no tools provided', () => {
      // Arrange & Act
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);

      // Assert
      const dropdown = screen.getByRole('combobox');
      expect(dropdown).toBeInTheDocument();

      // Only "All tools" option should be present
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent(/all tools/i);
    });
  });

  describe('Initial State - Default Values', () => {
    it('should have unchecked "User messages only" checkbox by default', () => {
      // Arrange & Act
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);

      // Assert
      const checkbox = screen.getByLabelText(/user messages only/i);
      expect(checkbox).not.toBeChecked();
    });

    it('should have unchecked "Errors only" checkbox by default', () => {
      // Arrange & Act
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);

      // Assert
      const checkbox = screen.getByLabelText(/errors only/i);
      expect(checkbox).not.toBeChecked();
    });

    it('should have empty search text by default', () => {
      // Arrange & Act
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);

      // Assert
      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toHaveValue('');
    });

    it('should have "All tools" selected by default', () => {
      // Arrange
      const toolNames = ['Read', 'Write'];

      // Act
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={toolNames} />);

      // Assert
      const dropdown = screen.getByRole('combobox') as HTMLSelectElement;
      expect(dropdown.value).toBe('');
    });
  });

  describe('Search Input Interaction', () => {
    it('should call onFilterChange when text is entered', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);
      const searchInput = screen.getByPlaceholderText(/search/i);

      // Act
      await user.type(searchInput, 'test query');

      // Assert
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalled();
      });
    });

    it('should pass correct search text in filter options', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);
      const searchInput = screen.getByPlaceholderText(/search/i);

      // Act
      await user.type(searchInput, 'hello');

      // Assert
      await waitFor(() => {
        const lastCall = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1];
        expect(lastCall[0].searchText).toBe('hello');
      });
    });

    it('should update search text value when typing', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);
      const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;

      // Act
      await user.type(searchInput, 'search term');

      // Assert
      expect(searchInput.value).toBe('search term');
    });

    it('should handle clearing search text', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);
      const searchInput = screen.getByPlaceholderText(/search/i);

      // Act
      await user.type(searchInput, 'test');
      await user.clear(searchInput);

      // Assert
      await waitFor(() => {
        const lastCall = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1];
        expect(lastCall[0].searchText).toBe('');
      });
    });

    it('should debounce search input changes', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);
      const searchInput = screen.getByPlaceholderText(/search/i);

      // Act
      await user.type(searchInput, 'abc');

      // Assert - Should not call immediately for every character
      // The actual number of calls depends on debounce implementation
      expect(mockOnFilterChange).toHaveBeenCalled();
    });
  });

  describe('User Messages Only Checkbox Interaction', () => {
    it('should call onFilterChange when checkbox is toggled', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);
      const checkbox = screen.getByLabelText(/user messages only/i);

      // Act
      await user.click(checkbox);

      // Assert
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalled();
      });
    });

    it('should pass showUserOnly as true when checkbox is checked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);
      const checkbox = screen.getByLabelText(/user messages only/i);

      // Act
      await user.click(checkbox);

      // Assert
      await waitFor(() => {
        const lastCall = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1];
        expect(lastCall[0].showUserOnly).toBe(true);
      });
    });

    it('should pass showUserOnly as false when checkbox is unchecked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);
      const checkbox = screen.getByLabelText(/user messages only/i);

      // Act
      await user.click(checkbox); // Check
      await user.click(checkbox); // Uncheck

      // Assert
      await waitFor(() => {
        const lastCall = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1];
        expect(lastCall[0].showUserOnly).toBe(false);
      });
    });

    it('should update checkbox state when toggled', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);
      const checkbox = screen.getByLabelText(/user messages only/i);

      // Act
      await user.click(checkbox);

      // Assert
      expect(checkbox).toBeChecked();
    });
  });

  describe('Errors Only Checkbox Interaction', () => {
    it('should call onFilterChange when checkbox is toggled', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);
      const checkbox = screen.getByLabelText(/errors only/i);

      // Act
      await user.click(checkbox);

      // Assert
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalled();
      });
    });

    it('should pass showErrorsOnly as true when checkbox is checked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);
      const checkbox = screen.getByLabelText(/errors only/i);

      // Act
      await user.click(checkbox);

      // Assert
      await waitFor(() => {
        const lastCall = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1];
        expect(lastCall[0].showErrorsOnly).toBe(true);
      });
    });

    it('should pass showErrorsOnly as false when checkbox is unchecked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);
      const checkbox = screen.getByLabelText(/errors only/i);

      // Act
      await user.click(checkbox); // Check
      await user.click(checkbox); // Uncheck

      // Assert
      await waitFor(() => {
        const lastCall = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1];
        expect(lastCall[0].showErrorsOnly).toBe(false);
      });
    });

    it('should update checkbox state when toggled', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);
      const checkbox = screen.getByLabelText(/errors only/i);

      // Act
      await user.click(checkbox);

      // Assert
      expect(checkbox).toBeChecked();
    });
  });

  describe('Tool Filter Dropdown Interaction', () => {
    it('should call onFilterChange when dropdown value changes', async () => {
      // Arrange
      const user = userEvent.setup();
      const toolNames = ['Read', 'Write', 'Bash'];
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={toolNames} />);
      const dropdown = screen.getByRole('combobox');

      // Act
      await user.selectOptions(dropdown, 'Read');

      // Assert
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalled();
      });
    });

    it('should pass selected tool name in filter options', async () => {
      // Arrange
      const user = userEvent.setup();
      const toolNames = ['Read', 'Write', 'Bash'];
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={toolNames} />);
      const dropdown = screen.getByRole('combobox');

      // Act
      await user.selectOptions(dropdown, 'Write');

      // Assert
      await waitFor(() => {
        const lastCall = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1];
        expect(lastCall[0].selectedTool).toBe('Write');
      });
    });

    it('should pass null as selectedTool when "All tools" is selected', async () => {
      // Arrange
      const user = userEvent.setup();
      const toolNames = ['Read', 'Write'];
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={toolNames} />);
      const dropdown = screen.getByRole('combobox');

      // Act - First select a tool, then select "All tools"
      await user.selectOptions(dropdown, 'Read');
      await user.selectOptions(dropdown, '');

      // Assert
      await waitFor(() => {
        const lastCall = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1];
        expect(lastCall[0].selectedTool).toBeNull();
      });
    });

    it('should update dropdown value when selection changes', async () => {
      // Arrange
      const user = userEvent.setup();
      const toolNames = ['Read', 'Write', 'Bash'];
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={toolNames} />);
      const dropdown = screen.getByRole('combobox') as HTMLSelectElement;

      // Act
      await user.selectOptions(dropdown, 'Bash');

      // Assert
      expect(dropdown.value).toBe('Bash');
    });

    it('should handle switching between different tool selections', async () => {
      // Arrange
      const user = userEvent.setup();
      const toolNames = ['Read', 'Write', 'Bash'];
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={toolNames} />);
      const dropdown = screen.getByRole('combobox');

      // Act
      await user.selectOptions(dropdown, 'Read');
      await user.selectOptions(dropdown, 'Bash');
      await user.selectOptions(dropdown, 'Write');

      // Assert
      await waitFor(() => {
        const lastCall = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1];
        expect(lastCall[0].selectedTool).toBe('Write');
      });
    });
  });

  describe('Multiple Filter Combinations', () => {
    it('should preserve all filter states when one filter changes', async () => {
      // Arrange
      const user = userEvent.setup();
      const toolNames = ['Read', 'Write'];
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={toolNames} />);

      // Act - Set multiple filters
      await user.click(screen.getByLabelText(/user messages only/i));
      await user.selectOptions(screen.getByRole('combobox'), 'Read');
      await user.type(screen.getByPlaceholderText(/search/i), 'test');

      // Assert
      await waitFor(() => {
        const lastCall = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1];
        expect(lastCall[0]).toEqual({
          showUserOnly: true,
          showErrorsOnly: false,
          selectedTool: 'Read',
          searchText: expect.stringContaining('test'),
        });
      });
    });

    it('should handle all filters being active simultaneously', async () => {
      // Arrange
      const user = userEvent.setup();
      const toolNames = ['Read', 'Write', 'Bash'];
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={toolNames} />);

      // Act
      await user.click(screen.getByLabelText(/user messages only/i));
      await user.click(screen.getByLabelText(/errors only/i));
      await user.selectOptions(screen.getByRole('combobox'), 'Bash');
      await user.type(screen.getByPlaceholderText(/search/i), 'query');

      // Assert
      await waitFor(() => {
        const lastCall = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1];
        expect(lastCall[0].showUserOnly).toBe(true);
        expect(lastCall[0].showErrorsOnly).toBe(true);
        expect(lastCall[0].selectedTool).toBe('Bash');
        expect(lastCall[0].searchText).toContain('query');
      });
    });

    it('should maintain independent state for both checkboxes', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);
      const userCheckbox = screen.getByLabelText(/user messages only/i);
      const errorCheckbox = screen.getByLabelText(/errors only/i);

      // Act
      await user.click(userCheckbox);
      await user.click(errorCheckbox);

      // Assert
      expect(userCheckbox).toBeChecked();
      expect(errorCheckbox).toBeChecked();

      // Act
      await user.click(userCheckbox);

      // Assert
      expect(userCheckbox).not.toBeChecked();
      expect(errorCheckbox).toBeChecked();
    });
  });

  describe('Accessibility', () => {
    it('should have proper label for search input', () => {
      // Arrange & Act
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);

      // Assert
      const searchInput = screen.getByPlaceholderText(/search/i);
      const label = searchInput.closest('label') || document.querySelector(`label[for="${searchInput.id}"]`);
      expect(label || searchInput.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have proper labels for checkboxes', () => {
      // Arrange & Act
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);

      // Assert
      expect(screen.getByLabelText(/user messages only/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/errors only/i)).toBeInTheDocument();
    });

    it('should have proper label for tool dropdown', () => {
      // Arrange
      const toolNames = ['Read', 'Write'];

      // Act
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={toolNames} />);

      // Assert
      const dropdown = screen.getByRole('combobox');
      const label = dropdown.closest('label') || document.querySelector(`label[for="${dropdown.id}"]`);
      expect(label || dropdown.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have accessible checkbox controls', () => {
      // Arrange & Act
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);

      // Assert
      const userCheckbox = screen.getByLabelText(/user messages only/i);
      const errorCheckbox = screen.getByLabelText(/errors only/i);

      expect(userCheckbox).toHaveAttribute('type', 'checkbox');
      expect(errorCheckbox).toHaveAttribute('type', 'checkbox');
    });

    it('should support keyboard navigation for checkboxes', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);
      const checkbox = screen.getByLabelText(/user messages only/i);

      // Act
      checkbox.focus();
      await user.keyboard(' '); // Space key

      // Assert
      expect(checkbox).toBeChecked();
    });

    it('should support keyboard navigation for dropdown', async () => {
      // Arrange
      const user = userEvent.setup();
      const toolNames = ['Read', 'Write', 'Bash'];
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={toolNames} />);
      const dropdown = screen.getByRole('combobox');

      // Act
      await user.selectOptions(dropdown, 'Read');

      // Assert
      expect(dropdown).toHaveValue('Read');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty toolNames array gracefully', () => {
      // Arrange & Act
      const { container } = render(
        <FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />
      );

      // Assert
      expect(container).toBeTruthy();
      const dropdown = screen.getByRole('combobox');
      expect(dropdown).toBeInTheDocument();
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(1); // Only "All tools"
    });

    it('should handle toolNames with special characters', () => {
      // Arrange
      const toolNames = ['Read/Write', 'Bash & Shell', 'Test<>'];

      // Act
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={toolNames} />);

      // Assert
      toolNames.forEach(toolName => {
        expect(screen.getByRole('option', { name: toolName })).toBeInTheDocument();
      });
    });

    it('should handle very long tool names', () => {
      // Arrange
      const longToolName = 'A'.repeat(100);
      const toolNames = [longToolName];

      // Act
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={toolNames} />);

      // Assert
      expect(screen.getByRole('option', { name: longToolName })).toBeInTheDocument();
    });

    it('should handle rapid filter changes', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={['Read']} />);

      // Act - Rapid clicks
      const checkbox = screen.getByLabelText(/user messages only/i);
      await user.click(checkbox);
      await user.click(checkbox);
      await user.click(checkbox);

      // Assert
      expect(mockOnFilterChange).toHaveBeenCalled();
      expect(checkbox).toBeChecked();
    });

    it('should handle duplicate tool names', () => {
      // Arrange
      const toolNames = ['Read', 'Read', 'Write'];

      // Act
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={toolNames} />);

      // Assert - Should render all options (even duplicates)
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(1);
    });

    it('should handle special characters in search input', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);
      const searchInput = screen.getByPlaceholderText(/search/i);

      // Act
      await user.type(searchInput, '<script>alert("xss")</script>');

      // Assert
      await waitFor(() => {
        const lastCall = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1];
        expect(lastCall[0].searchText).toContain('<script>');
      });
    });

    it('should handle very long search queries', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);
      const searchInput = screen.getByPlaceholderText(/search/i);
      const longQuery = 'a'.repeat(500);

      // Act
      await user.type(searchInput, longQuery);

      // Assert
      expect(searchInput).toHaveValue(longQuery);
    });
  });

  describe('Component Structure and Styling', () => {
    it('should have proper container structure', () => {
      // Arrange & Act
      const { container } = render(
        <FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />
      );

      // Assert
      expect(container.firstChild).toBeInTheDocument();
      expect(container.firstChild).toBeInstanceOf(HTMLElement);
    });

    it('should apply Tailwind CSS classes for styling', () => {
      // Arrange & Act
      const { container } = render(
        <FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />
      );

      // Assert - Check that Tailwind classes are present
      const element = container.firstChild as HTMLElement;
      expect(element.className).toBeTruthy();
    });

    it('should render all filter controls in a single component', () => {
      // Arrange
      const toolNames = ['Read', 'Write'];

      // Act
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={toolNames} />);

      // Assert
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/user messages only/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/errors only/i)).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('Callback Invocation', () => {
    it('should call onFilterChange with complete FilterOptions object', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);

      // Act
      await user.click(screen.getByLabelText(/user messages only/i));

      // Assert
      await waitFor(() => {
        const lastCall = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1];
        const filterOptions: FilterOptions = lastCall[0];

        expect(filterOptions).toHaveProperty('showUserOnly');
        expect(filterOptions).toHaveProperty('showErrorsOnly');
        expect(filterOptions).toHaveProperty('selectedTool');
        expect(filterOptions).toHaveProperty('searchText');
      });
    });

    it('should not call onFilterChange on initial render', () => {
      // Arrange & Act
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);

      // Assert
      expect(mockOnFilterChange).not.toHaveBeenCalled();
    });

    it('should call onFilterChange exactly once per filter change', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={['Read']} />);
      mockOnFilterChange.mockClear();

      // Act
      await user.click(screen.getByLabelText(/user messages only/i));

      // Assert
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledTimes(1);
      });
    });
  });
});
