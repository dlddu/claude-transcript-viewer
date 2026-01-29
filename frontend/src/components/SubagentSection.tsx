import { useState } from 'react';

interface SubagentSectionProps {
  sessionId: string;
  agentId: string;
  agentType: string;
  children?: React.ReactNode;
}

function SubagentSection({ sessionId: _sessionId, agentId: _agentId, agentType, children }: SubagentSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className="ml-4 bg-purple-50 border-l-4 border-purple-300 rounded">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-label={`Toggle ${agentType} subagent details`}
      >
        <div className="flex items-center gap-3">
          {/* Subagent Icon */}
          <svg
            className="w-6 h-6 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
            />
          </svg>
          <span className="font-semibold text-purple-700">Subagent</span>
          <span className="text-purple-600">{agentType}</span>
        </div>

        {/* Toggle Icon */}
        <svg
          className={`w-5 h-5 text-purple-600 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content */}
      {isExpanded && children && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
}

export default SubagentSection;
