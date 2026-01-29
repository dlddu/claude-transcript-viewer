import { useState } from 'react';

export interface FilterOptions {
  showUserOnly: boolean;
  showErrorsOnly: boolean;
  selectedTool: string | null;
  searchText: string;
}

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
  toolNames: string[];
}

function FilterBar({ onFilterChange, toolNames }: FilterBarProps) {
  const [searchText, setSearchText] = useState('');
  const [showUserOnly, setShowUserOnly] = useState(false);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  // Helper function to notify parent component of filter changes
  const notifyFilterChange = (updates: Partial<FilterOptions>) => {
    const newFilters: FilterOptions = {
      searchText,
      showUserOnly,
      showErrorsOnly,
      selectedTool,
      ...updates,
    };
    onFilterChange(newFilters);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    notifyFilterChange({ searchText: value });
  };

  const handleUserOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setShowUserOnly(checked);
    notifyFilterChange({ showUserOnly: checked });
  };

  const handleErrorsOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setShowErrorsOnly(checked);
    notifyFilterChange({ showErrorsOnly: checked });
  };

  const handleToolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const tool = value === '' ? null : value;
    setSelectedTool(tool);
    notifyFilterChange({ selectedTool: tool });
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <div className="space-y-4">
        {/* Search Input */}
        <div>
          <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            id="search-input"
            type="text"
            value={searchText}
            onChange={handleSearchChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search in transcript..."
            aria-label="Search"
          />
        </div>

        {/* Checkboxes */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center">
            <input
              id="user-messages-only"
              type="checkbox"
              checked={showUserOnly}
              onChange={handleUserOnlyChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              aria-label="User messages only"
            />
            <label htmlFor="user-messages-only" className="ml-2 text-sm text-gray-700">
              User messages only
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="errors-only"
              type="checkbox"
              checked={showErrorsOnly}
              onChange={handleErrorsOnlyChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              aria-label="Errors only"
            />
            <label htmlFor="errors-only" className="ml-2 text-sm text-gray-700">
              Errors only
            </label>
          </div>
        </div>

        {/* Tool Selection Dropdown */}
        <div>
          <label htmlFor="tool-select" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by tool
          </label>
          <select
            id="tool-select"
            value={selectedTool ?? ''}
            onChange={handleToolChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by tool"
          >
            <option value="">All tools</option>
            {toolNames.map((toolName) => (
              <option key={toolName} value={toolName}>
                {toolName}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default FilterBar;
