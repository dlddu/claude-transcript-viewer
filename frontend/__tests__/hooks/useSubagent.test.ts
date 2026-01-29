import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSubagent } from '../../src/hooks/useSubagent';

describe('useSubagent hook', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('initial state', () => {
    it('should return loading state initially', () => {
      const sessionId = 'session-123';
      const agentId = 'agent-codebase-analyzer-456';

      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  json: async () => ({
                    agentId: agentId,
                    records: [],
                  }),
                }),
              100
            )
          )
      );

      const { result } = renderHook(() => useSubagent(sessionId, agentId));

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.subagent).toBeNull();
    });

    it('should provide refetch function', () => {
      const sessionId = 'session-123';
      const agentId = 'agent-explore-789';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          agentId: agentId,
          records: [],
        }),
      });

      const { result } = renderHook(() => useSubagent(sessionId, agentId));

      expect(result.current.refetch).toBeInstanceOf(Function);
    });
  });

  describe('successful data fetching', () => {
    it('should fetch subagent data from /api/transcripts/:sessionId/subagents/:agentId endpoint', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-codebase-analyzer-456';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          agentId: agentId,
          records: [],
        }),
      });
      global.fetch = mockFetch;

      renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/transcripts/${sessionId}/subagents/${agentId}`
        );
      });
    });

    it('should update state with fetched subagent data', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-explore-789';
      const mockResponse = {
        agentId: agentId,
        records: [
          {
            type: 'user',
            message: {
              role: 'user',
              content: [{ type: 'text', text: 'Explore the codebase' }],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'Found 3 files' }],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.subagent).toEqual({
          agentId: agentId,
          type: null,
          records: mockResponse.records,
        });
        expect(result.current.subagent?.records).toHaveLength(2);
      });
    });

    it('should handle empty records array', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-plan-111';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          agentId: agentId,
          records: [],
        }),
      });

      const { result } = renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.subagent?.records).toEqual([]);
        expect(result.current.subagent?.records).toHaveLength(0);
      });
    });

    it('should set loading to false after successful fetch', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-test-writer-222';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          agentId: agentId,
          records: [],
        }),
      });

      const { result } = renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('subagent type extraction', () => {
    it('should extract type from first record with type field', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-explore-789';
      const mockResponse = {
        agentId: agentId,
        records: [
          {
            type: 'Explore',
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'Starting exploration' }],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'Found files' }],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(result.current.subagent?.type).toBe('Explore');
      });
    });

    it('should extract codebase-analyzer type', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-codebase-analyzer-456';
      const mockResponse = {
        agentId: agentId,
        records: [
          {
            type: 'codebase-analyzer',
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'Analyzing codebase' }],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(result.current.subagent?.type).toBe('codebase-analyzer');
      });
    });

    it('should extract Plan type', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-plan-111';
      const mockResponse = {
        agentId: agentId,
        records: [
          {
            type: 'Plan',
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'Creating plan' }],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(result.current.subagent?.type).toBe('Plan');
      });
    });

    it('should return null type when first record has no type field', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-no-type-333';
      const mockResponse = {
        agentId: agentId,
        records: [
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'Response' }],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(result.current.subagent?.type).toBeNull();
      });
    });

    it('should return null type when records array is empty', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-empty-444';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          agentId: agentId,
          records: [],
        }),
      });

      const { result } = renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(result.current.subagent?.type).toBeNull();
      });
    });

    it('should handle custom subagent types', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-custom-555';
      const mockResponse = {
        agentId: agentId,
        records: [
          {
            type: 'CustomSubagent',
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'Custom operation' }],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(result.current.subagent?.type).toBe('CustomSubagent');
      });
    });
  });

  describe('complex subagent data', () => {
    it('should handle subagent with tool use blocks', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-explore-789';
      const mockResponse = {
        agentId: agentId,
        records: [
          {
            type: 'Explore',
            message: {
              role: 'assistant',
              content: [
                { type: 'text', text: 'Let me search for files' },
                {
                  type: 'tool_use',
                  id: 'tool-1',
                  name: 'Glob',
                  input: { pattern: '**/*.ts' },
                },
              ],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: 'tool-1',
                  content: 'Found 10 TypeScript files',
                },
              ],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(result.current.subagent?.records).toHaveLength(2);
        expect(
          (result.current.subagent?.records[0] as Record<string, any>)?.message
            ?.content
        ).toHaveLength(2);
      });
    });

    it('should handle multiple user-assistant exchanges', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-plan-111';
      const mockResponse = {
        agentId: agentId,
        records: [
          {
            type: 'Plan',
            message: {
              role: 'user',
              content: [{ type: 'text', text: 'Create a plan' }],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'Step 1: Analyze' }],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
          {
            type: 'user',
            message: {
              role: 'user',
              content: [{ type: 'text', text: 'Continue' }],
            },
            timestamp: '2024-01-29T10:00:02Z',
          },
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'Step 2: Implement' }],
            },
            timestamp: '2024-01-29T10:00:03Z',
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(result.current.subagent?.records).toHaveLength(4);
        expect(result.current.subagent?.type).toBe('Plan');
      });
    });
  });

  describe('error handling', () => {
    it('should handle HTTP 404 error response', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-not-found-999';

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const { result } = renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeTruthy();
        expect(result.current.subagent).toBeNull();
      });
    });

    it('should handle HTTP 500 error response', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-server-error-888';

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const { result } = renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeTruthy();
        expect(result.current.subagent).toBeNull();
      });
    });

    it('should handle network error', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-network-error-777';

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeTruthy();
        expect(result.current.subagent).toBeNull();
      });
    });

    it('should handle JSON parsing error', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-json-error-666';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const { result } = renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeTruthy();
        expect(result.current.subagent).toBeNull();
      });
    });

    it('should set loading to false even on error', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-fail-555';

      global.fetch = vi.fn().mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle malformed API response missing agentId', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-malformed-444';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          records: [],
          // agentId is missing
        }),
      });

      const { result } = renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeTruthy();
        expect(result.current.subagent).toBeNull();
      });
    });

    it('should handle malformed API response missing records', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-no-records-333';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          agentId: agentId,
          // records is missing
        }),
      });

      const { result } = renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeTruthy();
        expect(result.current.subagent).toBeNull();
      });
    });
  });

  describe('refetch functionality', () => {
    it('should refetch data when refetch is called', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-refetch-222';
      const initialResponse = {
        agentId: agentId,
        records: [
          {
            type: 'Explore',
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'Initial' }],
            },
            timestamp: '2024-01-29T10:00:00Z',
          },
        ],
      };
      const updatedResponse = {
        agentId: agentId,
        records: [
          ...initialResponse.records,
          {
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'Updated' }],
            },
            timestamp: '2024-01-29T10:00:01Z',
          },
        ],
      };

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => initialResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => updatedResponse,
        });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(result.current.subagent?.records).toHaveLength(1);
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(result.current.subagent?.records).toHaveLength(2);
      });
    });

    it('should set loading state during refetch', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-loading-111';

      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  json: async () => ({
                    agentId: agentId,
                    records: [],
                  }),
                }),
              50
            )
          )
      );

      const { result } = renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const refetchPromise = result.current.refetch();

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await refetchPromise;
    });

    it('should handle errors during refetch', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-refetch-error-000';

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            agentId: agentId,
            records: [
              {
                type: 'Explore',
                message: { role: 'assistant', content: [] },
                timestamp: '2024-01-29T10:00:00Z',
              },
            ],
          }),
        })
        .mockRejectedValueOnce(new Error('Refetch failed'));
      global.fetch = mockFetch;

      const { result } = renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(result.current.subagent?.records).toHaveLength(1);
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('hook lifecycle', () => {
    it('should fetch data on mount', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-mount-999';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          agentId: agentId,
          records: [],
        }),
      });
      global.fetch = mockFetch;

      renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should refetch when sessionId changes', async () => {
      const sessionId1 = 'session-123';
      const sessionId2 = 'session-456';
      const agentId = 'agent-888';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          agentId: agentId,
          records: [],
        }),
      });
      global.fetch = mockFetch;

      const { rerender } = renderHook(
        ({ sid, aid }) => useSubagent(sid, aid),
        { initialProps: { sid: sessionId1, aid: agentId } }
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/transcripts/${sessionId1}/subagents/${agentId}`
        );
      });

      rerender({ sid: sessionId2, aid: agentId });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/transcripts/${sessionId2}/subagents/${agentId}`
        );
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    it('should refetch when agentId changes', async () => {
      const sessionId = 'session-123';
      const agentId1 = 'agent-111';
      const agentId2 = 'agent-222';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          agentId: agentId1,
          records: [],
        }),
      });
      global.fetch = mockFetch;

      const { rerender } = renderHook(
        ({ sid, aid }) => useSubagent(sid, aid),
        { initialProps: { sid: sessionId, aid: agentId1 } }
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/transcripts/${sessionId}/subagents/${agentId1}`
        );
      });

      rerender({ sid: sessionId, aid: agentId2 });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/transcripts/${sessionId}/subagents/${agentId2}`
        );
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    it('should not fetch when parameters are unchanged on re-render', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-777';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          agentId: agentId,
          records: [],
        }),
      });
      global.fetch = mockFetch;

      const { rerender } = renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      rerender();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('parameter validation', () => {
    it('should handle empty sessionId', async () => {
      const sessionId = '';
      const agentId = 'agent-666';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          agentId: agentId,
          records: [],
        }),
      });

      renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/transcripts//subagents/${agentId}`
        );
      });
    });

    it('should handle empty agentId', async () => {
      const sessionId = 'session-123';
      const agentId = '';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          agentId: agentId,
          records: [],
        }),
      });

      renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/transcripts/${sessionId}/subagents/`
        );
      });
    });

    it('should handle special characters in sessionId', async () => {
      const sessionId = 'session-with-special-chars-123!@#';
      const agentId = 'agent-555';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          agentId: agentId,
          records: [],
        }),
      });
      global.fetch = mockFetch;

      renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/transcripts/${sessionId}/subagents/${agentId}`
        );
      });
    });

    it('should handle special characters in agentId', async () => {
      const sessionId = 'session-123';
      const agentId = 'agent-special_chars-v1.2.3-beta';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          agentId: agentId,
          records: [],
        }),
      });
      global.fetch = mockFetch;

      renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/transcripts/${sessionId}/subagents/${agentId}`
        );
      });
    });

    it('should handle UUID format agentId', async () => {
      const sessionId = 'session-123';
      const agentId = '550e8400-e29b-41d4-a716-446655440000';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          agentId: agentId,
          records: [],
        }),
      });
      global.fetch = mockFetch;

      renderHook(() => useSubagent(sessionId, agentId));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/transcripts/${sessionId}/subagents/${agentId}`
        );
      });
    });
  });
});
