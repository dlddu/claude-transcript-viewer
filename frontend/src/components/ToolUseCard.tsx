import { useState } from 'react';

interface ToolUseCardProps {
  toolName: string;
  input: Record<string, unknown>;
  output: string | null;
  isError: boolean;
}

function ToolUseCard({ toolName, input, output, isError }: ToolUseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 도구별 색상 테마 결정
  const getToolTheme = () => {
    switch (toolName) {
      case 'Bash':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          iconBg: 'bg-green-500',
          iconText: 'text-white',
          badgeSuccess: 'bg-green-100 text-green-500',
          badgeError: 'bg-red-100 text-red-500',
        };
      case 'Read':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          iconBg: 'bg-blue-500',
          iconText: 'text-white',
          badgeSuccess: 'bg-green-100 text-green-500',
          badgeError: 'bg-red-100 text-red-500',
        };
      case 'Write':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-700',
          iconBg: 'bg-orange-500',
          iconText: 'text-white',
          badgeSuccess: 'bg-green-100 text-green-500',
          badgeError: 'bg-red-100 text-red-500',
        };
      case 'Edit':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-700',
          iconBg: 'bg-purple-500',
          iconText: 'text-white',
          badgeSuccess: 'bg-green-100 text-green-500',
          badgeError: 'bg-red-100 text-red-500',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          iconBg: 'bg-gray-500',
          iconText: 'text-white',
          badgeSuccess: 'bg-green-100 text-green-500',
          badgeError: 'bg-red-100 text-red-500',
        };
    }
  };

  const theme = getToolTheme();

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  // output이 null 또는 빈 문자열인지 확인
  const hasOutput = output !== null && output !== '';

  return (
    <div
      className={`border ${theme.border} rounded-lg overflow-hidden ${theme.bg}`}
      data-testid="tool-use-card"
    >
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-label={`Toggle ${toolName} tool details`}
        data-testid="tool-use-card-header"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded ${theme.iconBg} ${theme.iconText} flex items-center justify-center font-bold text-sm`}>
            {toolName.charAt(0).toUpperCase()}
          </div>
          <span className={`font-semibold ${theme.text}`} data-testid="tool-name">
            {toolName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              isError ? theme.badgeError : theme.badgeSuccess
            }`}
            data-testid="status-badge"
          >
            {isError ? 'Error' : 'Success'}
          </span>
          <svg
            className={`w-5 h-5 ${theme.text} transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3" data-testid="tool-use-content">
          {/* Input Section */}
          <div data-testid="input-section">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Input Parameters:</h4>
            <pre className="bg-white border border-gray-200 rounded p-3 text-xs overflow-x-auto">
              <code>{JSON.stringify(input, null, 2)}</code>
            </pre>
          </div>

          {/* Output Section */}
          <div data-testid="output-section">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              {isError ? 'Error Message:' : 'Output:'}
            </h4>
            <pre className={`bg-white border rounded p-3 text-xs overflow-x-auto whitespace-pre-wrap break-words ${
              isError ? 'border-red-300 text-red-700' : 'border-gray-200 text-gray-700'
            }`}>
              {hasOutput ? output : 'No output'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default ToolUseCard;
