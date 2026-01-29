import { useSessions } from '../hooks/useSessions';
import type { Session } from '../types';

interface SessionListProps {
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
}

function SessionList({ currentSessionId, onSessionSelect }: SessionListProps) {
  const { loading, error, sessions } = useSessions();

  const handleSessionClick = (sessionId: string) => {
    onSessionSelect(sessionId);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    sessionId: string
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSessionSelect(sessionId);
    }
  };

  const sortedSessions = sessions
    ? [...sessions].sort((a, b) => {
        const dateA = new Date(a.lastModified).getTime();
        const dateB = new Date(b.lastModified).getTime();
        return dateB - dateA; // Descending order (latest first)
      })
    : [];

  return (
    <div>
      <h2 className="text-xl font-bold p-4">Sessions</h2>

      {loading && (
        <div className="p-4 text-gray-600">Loading sessions...</div>
      )}

      {error && (
        <div className="p-4 text-red-600">
          Error loading sessions: {error.message}
        </div>
      )}

      {!loading && !error && sessions && sessions.length === 0 && (
        <div className="p-4 text-gray-600">No sessions available</div>
      )}

      {!loading && !error && sessions && sessions.length > 0 && (
        <ul role="list" className="space-y-1">
          {sortedSessions.map((session: Session) => {
            const isCurrent = session.id === currentSessionId;
            return (
              <li key={session.id} role="listitem">
                <button
                  onClick={() => handleSessionClick(session.id)}
                  onKeyDown={(e) => handleKeyDown(e, session.id)}
                  aria-label={`Select session ${session.id}`}
                  aria-current={isCurrent ? 'true' : undefined}
                  className={`w-full text-left px-4 py-2 cursor-pointer transition-colors ${
                    isCurrent
                      ? 'bg-blue-100 border-l-4 border-blue-500'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {session.id}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default SessionList;
