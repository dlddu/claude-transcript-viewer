import { useState, useEffect, useCallback } from 'react';
import { get } from '../api/client';
import type { TranscriptRecord } from '../types';

interface UseTranscriptResult {
  loading: boolean;
  error: Error | null;
  transcript: TranscriptRecord[] | null;
  refetch: () => Promise<void>;
}

export function useTranscript(sessionId: string): UseTranscriptResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [transcript, setTranscript] = useState<TranscriptRecord[] | null>(null);

  const fetchTranscript = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ sessionId: string; records: TranscriptRecord[] }>(`/api/transcripts/${sessionId}`);
      setTranscript(response.records);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error loading transcript'));
      setTranscript(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchTranscript();
  }, [fetchTranscript]);

  return {
    loading,
    error,
    transcript,
    refetch: fetchTranscript,
  };
}
