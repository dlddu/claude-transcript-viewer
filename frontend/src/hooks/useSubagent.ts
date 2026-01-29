import { useState, useEffect, useCallback } from 'react';
import { get } from '../api/client';

interface SubagentData {
  agentId: string;
  type: string | null;
  records: unknown[];
}

interface UseSubagentResult {
  loading: boolean;
  error: Error | null;
  subagent: SubagentData | null;
  refetch: () => Promise<void>;
}

interface ApiResponse {
  agentId: string;
  records: unknown[];
}

export function useSubagent(sessionId: string, agentId: string): UseSubagentResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [subagent, setSubagent] = useState<SubagentData | null>(null);

  const fetchSubagent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await get<ApiResponse>(`/api/transcripts/${sessionId}/subagents/${agentId}`);

      // API 응답 검증
      if (!data.agentId || !Array.isArray(data.records)) {
        throw new Error('Invalid API response: missing agentId or records');
      }

      // type 추출: records[0]?.type에서 가져오되, "user" 또는 "assistant"가 아닌 경우만
      let type: string | null = null;
      if (data.records.length > 0) {
        const firstRecord = data.records[0] as Record<string, unknown>;
        const recordType = firstRecord?.type;
        if (typeof recordType === 'string' && recordType !== 'user' && recordType !== 'assistant') {
          type = recordType;
        }
      }

      setSubagent({
        agentId: data.agentId,
        type,
        records: data.records,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setSubagent(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId, agentId]);

  useEffect(() => {
    fetchSubagent();
  }, [fetchSubagent]);

  return {
    loading,
    error,
    subagent,
    refetch: fetchSubagent,
  };
}
