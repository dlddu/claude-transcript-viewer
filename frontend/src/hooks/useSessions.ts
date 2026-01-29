import { useState, useEffect } from 'react';
import { get } from '../api/client';
import type { Session } from '../types';

interface UseSessionsResult {
  loading: boolean;
  error: Error | null;
  sessions: Session[] | null;
  refetch: () => Promise<void>;
}

export function useSessions(): UseSessionsResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [sessions, setSessions] = useState<Session[] | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await get<Session[]>('/api/sessions');
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setSessions(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return {
    loading,
    error,
    sessions,
    refetch: fetchSessions,
  };
}
