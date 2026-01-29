import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterBar from '../../src/components/FilterBar';

describe('FilterBar Component', () => {
  const mockOnFilterChange = vi.fn();
  const defaultToolNames = ['Read', 'Write', 'Bash', 'Grep', 'Glob'];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />
      );
      expect(container).toBeTruthy();
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render search input field', () => {
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      expect(searchInput).toBeInTheDocument();
    });

    it('should render user messages only checkbox', () => {
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const checkbox = screen.getByRole('checkbox', { name: /user messages only/i });
      expect(checkbox).toBeInTheDocument();
    });

    it('should render errors only checkbox', () => {
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const checkbox = screen.getByRole('checkbox', { name: /errors only/i });
      expect(checkbox).toBeInTheDocument();
    });

    it('should render tool selection dropdown', () => {
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const dropdown = screen.getByRole('combobox', { name: /filter by tool/i });
      expect(dropdown).toBeInTheDocument();
    });

    it('should render all tool names in dropdown', () => {
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      expect(screen.getByRole('combobox', { name: /filter by tool/i })).toBeInTheDocument();
      defaultToolNames.forEach((toolName) => {
        expect(screen.getByRole('option', { name: toolName })).toBeInTheDocument();
      });
    });

    it('should render "All tools" option in dropdown', () => {
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const allToolsOption = screen.getByRole('option', { name: /all tools/i });
      expect(allToolsOption).toBeInTheDocument();
    });
  });

  describe('Search Input Functionality', () => {
    it('should call onFilterChange when user types in search input', async () => {
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      await user.type(searchInput, 'test query');
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalled();
      });
    });

    it('should pass search text in filter options', async () => {
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      await user.type(searchInput, 'hello');
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            searchText: 'hello',
          })
        );
      });
    });

    it('should update search text as user types multiple characters', async () => {
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      await user.type(searchInput, 'abc');
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            searchText: 'abc',
          })
        );
      });
    });

    it('should handle empty search text', async () => {
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      
      // Use fireEvent.change for direct value change
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.change(searchInput, { target: { value: '' } });
      
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            searchText: '',
          })
        );
      });
    });

    it('should handle special characters in search text', async () => {
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      const specialText = '@#$%^&*()';
      await user.type(searchInput, specialText);
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            searchText: specialText,
          })
        );
      });
    });
  });

  describe('User Messages Only Checkbox Functionality', () => {
    it('should call onFilterChange when checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const checkbox = screen.getByRole('checkbox', { name: /user messages only/i });
      await user.click(checkbox);
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalled();
      });
    });

    it('should set showUserOnly to true when checkbox is checked', async () => {
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const checkbox = screen.getByRole('checkbox', { name: /user messages only/i });
      await user.click(checkbox);
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            showUserOnly: true,
          })
        );
      });
    });

    it('should set showUserOnly to false when checkbox is unchecked', async () => {
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const checkbox = screen.getByRole('checkbox', { name: /user messages only/i });
      await user.click(checkbox);
      await user.click(checkbox);
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            showUserOnly: false,
          })
        );
      });
    });

    it('should toggle checkbox state on multiple clicks', async () => {
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const checkbox = screen.getByRole('checkbox', { name: /user messages only/i });
      await user.click(checkbox);
      await user.click(checkbox);
      await user.click(checkbox);
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledTimes(3);
        expect(mockOnFilterChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            showUserOnly: true,
          })
        );
      });
    });
  });

  describe('Errors Only Checkbox Functionality', () => {
    it('should call onFilterChange when errors checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const checkbox = screen.getByRole('checkbox', { name: /errors only/i });
      await user.click(checkbox);
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalled();
      });
    });

    it('should set showErrorsOnly to true when checkbox is checked', async () => {
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const checkbox = screen.getByRole('checkbox', { name: /errors only/i });
      await user.click(checkbox);
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            showErrorsOnly: true,
          })
        );
      });
    });

    it('should set showErrorsOnly to false when checkbox is unchecked', async () => {
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const checkbox = screen.getByRole('checkbox', { name: /errors only/i });
      await user.click(checkbox);
      await user.click(checkbox);
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            showErrorsOnly: false,
          })
        );
      });
    });
  });

  describe('Tool Selection Dropdown Functionality', () => {
    it('should call onFilterChange when tool is selected', async () => {
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const dropdown = screen.getByRole('combobox', { name: /filter by tool/i });
      await user.selectOptions(dropdown, 'Read');
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalled();
      });
    });

    it('should set selectedTool to chosen tool name', async () => {
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const dropdown = screen.getByRole('combobox', { name: /filter by tool/i });
      await user.selectOptions(dropdown, 'Bash');
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            selectedTool: 'Bash',
          })
        );
      });
    });

    it('should set selectedTool to null when "All tools" is selected', async () => {
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const dropdown = screen.getByRole('combobox', { name: /filter by tool/i });
      await user.selectOptions(dropdown, 'Read');
      await user.selectOptions(dropdown, '');
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            selectedTool: null,
          })
        );
      });
    });

    it('should handle changing between different tools', async () => {
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const dropdown = screen.getByRole('combobox', { name: /filter by tool/i });
      await user.selectOptions(dropdown, 'Read');
      await user.selectOptions(dropdown, 'Write');
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledTimes(2);
        expect(mockOnFilterChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            selectedTool: 'Write',
          })
        );
      });
    });
  });

  describe('Combined Filter Changes', () => {
    it('should maintain all filter states when search text changes', async () => {
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      const userCheckbox = screen.getByRole('checkbox', { name: /user messages only/i });
      await user.click(userCheckbox);
      await user.type(searchInput, 'test');
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            showUserOnly: true,
            searchText: 'test',
            showErrorsOnly: false,
            selectedTool: null,
          })
        );
      });
    });

    it('should maintain all filter states when checkbox changes', async () => {
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      const errorCheckbox = screen.getByRole('checkbox', { name: /errors only/i });
      const dropdown = screen.getByRole('combobox', { name: /filter by tool/i });
      await user.type(searchInput, 'query');
      await user.selectOptions(dropdown, 'Grep');
      await user.click(errorCheckbox);
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            searchText: 'query',
            selectedTool: 'Grep',
            showErrorsOnly: true,
            showUserOnly: false,
          })
        );
      });
    });

    it('should maintain all filter states when tool selection changes', async () => {
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const userCheckbox = screen.getByRole('checkbox', { name: /user messages only/i });
      const errorCheckbox = screen.getByRole('checkbox', { name: /errors only/i });
      const dropdown = screen.getByRole('combobox', { name: /filter by tool/i });
      await user.click(userCheckbox);
      await user.click(errorCheckbox);
      await user.selectOptions(dropdown, 'Glob');
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            showUserOnly: true,
            showErrorsOnly: true,
            selectedTool: 'Glob',
            searchText: '',
          })
        );
      });
    });

    it('should handle all filters being active simultaneously', async () => {
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      const userCheckbox = screen.getByRole('checkbox', { name: /user messages only/i });
      const errorCheckbox = screen.getByRole('checkbox', { name: /errors only/i });
      const dropdown = screen.getByRole('combobox', { name: /filter by tool/i });
      await user.type(searchInput, 'error message');
      await user.click(userCheckbox);
      await user.click(errorCheckbox);
      await user.selectOptions(dropdown, 'Bash');
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenLastCalledWith({
          searchText: 'error message',
          showUserOnly: true,
          showErrorsOnly: true,
          selectedTool: 'Bash',
        });
      });
    });
  });

  describe('Initial State', () => {
    it('should initialize with empty search text', () => {
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const searchInput = screen.getByRole('textbox', { name: /search/i }) as HTMLInputElement;
      expect(searchInput.value).toBe('');
    });

    it('should initialize with user messages only unchecked', () => {
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const checkbox = screen.getByRole('checkbox', { name: /user messages only/i }) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it('should initialize with errors only unchecked', () => {
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const checkbox = screen.getByRole('checkbox', { name: /errors only/i }) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it('should initialize with "All tools" selected in dropdown', () => {
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const dropdown = screen.getByRole('combobox', { name: /filter by tool/i }) as HTMLSelectElement;
      expect(dropdown.value).toBe('');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label for search input', () => {
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
    });

    it('should have accessible label for user messages checkbox', () => {
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      expect(screen.getByLabelText(/user messages only/i)).toBeInTheDocument();
    });

    it('should have accessible label for errors only checkbox', () => {
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      expect(screen.getByLabelText(/errors only/i)).toBeInTheDocument();
    });

    it('should have accessible label for tool dropdown', () => {
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      expect(screen.getByLabelText(/filter by tool/i)).toBeInTheDocument();
    });

    it('should have proper ARIA roles for form elements', () => {
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getAllByRole('checkbox')).toHaveLength(2);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty toolNames array', () => {
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={[]} />);
      const dropdown = screen.getByRole('combobox', { name: /filter by tool/i });
      expect(dropdown).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /all tools/i })).toBeInTheDocument();
    });

    it('should handle very long search text', async () => {
      const user = userEvent.setup();
      const longText = 'a'.repeat(500);
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      await user.type(searchInput, longText);
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            searchText: longText,
          })
        );
      });
    });

    it('should handle tool names with special characters', () => {
      const specialToolNames = ['Tool@1', 'Tool#2', 'Tool$3'];
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={specialToolNames} />);
      specialToolNames.forEach((toolName) => {
        expect(screen.getByRole('option', { name: toolName })).toBeInTheDocument();
      });
    });

    it('should handle rapid filter changes', async () => {
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      const userCheckbox = screen.getByRole('checkbox', { name: /user messages only/i });
      const dropdown = screen.getByRole('combobox', { name: /filter by tool/i });
      await user.type(searchInput, 'q');
      await user.click(userCheckbox);
      await user.selectOptions(dropdown, 'Read');
      await user.type(searchInput, 'uery');
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalled();
        expect(mockOnFilterChange.mock.calls.length).toBeGreaterThan(3);
      });
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should accept valid FilterOptions interface', async () => {
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      await user.type(searchInput, 'test');
      await waitFor(() => {
        const lastCall = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1];
        const filterOptions = lastCall[0];
        expect(filterOptions).toHaveProperty('showUserOnly');
        expect(filterOptions).toHaveProperty('showErrorsOnly');
        expect(filterOptions).toHaveProperty('selectedTool');
        expect(filterOptions).toHaveProperty('searchText');
      });
    });

    it('should pass correct types for all filter properties', async () => {
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const searchInput = screen.getByRole('textbox', { name: /search/i });
      const userCheckbox = screen.getByRole('checkbox', { name: /user messages only/i });
      await user.type(searchInput, 'test');
      await user.click(userCheckbox);
      await waitFor(() => {
        const lastCall = mockOnFilterChange.mock.calls[mockOnFilterChange.mock.calls.length - 1];
        const filterOptions = lastCall[0];
        expect(typeof filterOptions.showUserOnly).toBe('boolean');
        expect(typeof filterOptions.showErrorsOnly).toBe('boolean');
        expect(typeof filterOptions.searchText).toBe('string');
        expect(filterOptions.selectedTool === null || typeof filterOptions.selectedTool === 'string').toBe(true);
      });
    });
  });

  describe('Callback Invocation', () => {
    it('should not call onFilterChange on initial render', () => {
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      expect(mockOnFilterChange).not.toHaveBeenCalled();
    });

    it('should call onFilterChange with current state on each interaction', async () => {
      const user = userEvent.setup();
      render(<FilterBar onFilterChange={mockOnFilterChange} toolNames={defaultToolNames} />);
      const userCheckbox = screen.getByRole('checkbox', { name: /user messages only/i });
      await user.click(userCheckbox);
      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledTimes(1);
        expect(mockOnFilterChange).toHaveBeenCalledWith({
          showUserOnly: true,
          showErrorsOnly: false,
          selectedTool: null,
          searchText: '',
        });
      });
    });
  });
});
