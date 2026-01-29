import { useState } from 'react';
import type { FilterOptions } from '../types';

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
  toolNames: string[];
}

function FilterBar({ onFilterChange, toolNames }: FilterBarProps) {
  const [searchText, setSearchText] = useState('');
  const [showUserOnly, setShowUserOnly] = useState(false);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchText = e.target.value;
    setSearchText(newSearchText);

    onFilterChange({
      searchText: newSearchText,
      showUserOnly,
      showErrorsOnly,
      selectedTool,
    });
  };

  const handleUserOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newShowUserOnly = e.target.checked;
    setShowUserOnly(newShowUserOnly);

    onFilterChange({
      searchText,
      showUserOnly: newShowUserOnly,
      showErrorsOnly,
      selectedTool,
    });
  };

  const handleErrorsOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newShowErrorsOnly = e.target.checked;
    setShowErrorsOnly(newShowErrorsOnly);

    onFilterChange({
      searchText,
      showUserOnly,
      showErrorsOnly: newShowErrorsOnly,
      selectedTool,
    });
  };

  const handleToolFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const newSelectedTool = value === '' ? null : value;
    setSelectedTool(newSelectedTool);

    onFilterChange({
      searchText,
      showUserOnly,
      showErrorsOnly,
      selectedTool: newSelectedTool,
    });
  };

  return (
    <div className="flex gap-4 p-4 border border-gray-300 rounded-lg">
      {/* Search Input */}
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search messages..."
          value={searchText}
          onChange={handleSearchChange}
          aria-label="Search messages"
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      {/* User Messages Only Checkbox */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={showUserOnly}
          onChange={handleUserOnlyChange}
        />
        <span>User messages only</span>
      </label>

      {/* Errors Only Checkbox */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={showErrorsOnly}
          onChange={handleErrorsOnlyChange}
        />
        <span>Errors only</span>
      </label>

      {/* Tool Filter Dropdown */}
      <label className="flex items-center gap-2">
        <span>Tool:</span>
        <select
          value={selectedTool || ''}
          onChange={handleToolFilterChange}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="">All tools</option>
          {toolNames.map((toolName, index) => (
            <option key={`${toolName}-${index}`} value={toolName}>
              {toolName}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export default FilterBar;
