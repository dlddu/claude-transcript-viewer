import { useState, useEffect } from 'react';
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

  const fetchTranscript = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await get<TranscriptRecord[]>(`/api/transcripts/${sessionId}`);
      setTranscript(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setTranscript(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTranscript();
  }, [sessionId]);

  return {
    loading,
    error,
    transcript,
    refetch: fetchTranscript,
  };
}
