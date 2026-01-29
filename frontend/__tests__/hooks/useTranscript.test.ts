import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTranscript } from '../../src/hooks/useTranscript';

describe('useTranscript hook', () => {
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
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  json: async () => [],
                }),
              100
            )
          )
      );

      const { result } = renderHook(() => useTranscript(sessionId));

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.transcript).toBeNull();
    });

    it('should provide refetch function', () => {
      const sessionId = 'session-123';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      });

      const { result } = renderHook(() => useTranscript(sessionId));

      expect(result.current.refetch).toBeInstanceOf(Function);
    });
  });

  describe('successful data fetching', () => {
    it('should fetch transcript from /api/transcripts/:sessionId endpoint', async () => {
      const sessionId = 'session-123';
      const mockTranscript = [
        {
          type: 'user',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Hello' }],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockTranscript,
      });
      global.fetch = mockFetch;

      renderHook(() => useTranscript(sessionId));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(`/api/transcripts/${sessionId}`);
      });
    });

    it('should update state with fetched transcript', async () => {
      const sessionId = 'session-123';
      const mockTranscript = [
        {
          type: 'user',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Hello' }],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'Hi there!' }],
          },
          timestamp: '2024-01-29T10:00:01Z',
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockTranscript,
      });

      const { result } = renderHook(() => useTranscript(sessionId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.transcript).toEqual(mockTranscript);
        expect(result.current.transcript).toHaveLength(2);
      });
    });

    it('should handle empty transcript array', async () => {
      const sessionId = 'session-123';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      });

      const { result } = renderHook(() => useTranscript(sessionId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.transcript).toEqual([]);
        expect(result.current.transcript).toHaveLength(0);
      });
    });

    it('should handle complex transcript with tool use blocks', async () => {
      const sessionId = 'session-123';
      const mockTranscript = [
        {
          type: 'user',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Read a file' }],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'text', text: 'I will read the file' },
              {
                type: 'tool_use',
                id: 'tool-1',
                name: 'read_file',
                input: { path: '/test.txt' },
              },
            ],
          },
          timestamp: '2024-01-29T10:00:01Z',
        },
        {
          type: 'user',
          message: {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: 'tool-1',
                content: 'File contents',
              },
            ],
          },
          timestamp: '2024-01-29T10:00:02Z',
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockTranscript,
      });

      const { result } = renderHook(() => useTranscript(sessionId));

      await waitFor(() => {
        expect(result.current.transcript).toHaveLength(3);
        expect(result.current.transcript[1].message.content).toHaveLength(2);
      });
    });

    it('should set loading to false after successful fetch', async () => {
      const sessionId = 'session-123';
      const mockTranscript = [
        {
          type: 'user',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Hello' }],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockTranscript,
      });

      const { result } = renderHook(() => useTranscript(sessionId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('error handling', () => {
    it('should handle HTTP error response', async () => {
      const sessionId = 'session-123';
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const { result } = renderHook(() => useTranscript(sessionId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeTruthy();
        expect(result.current.transcript).toBeNull();
      });
    });

    it('should handle network error', async () => {
      const sessionId = 'session-123';
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useTranscript(sessionId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeTruthy();
        expect(result.current.transcript).toBeNull();
      });
    });

    it('should handle JSON parsing error', async () => {
      const sessionId = 'session-123';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const { result } = renderHook(() => useTranscript(sessionId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeTruthy();
        expect(result.current.transcript).toBeNull();
      });
    });

    it('should set loading to false even on error', async () => {
      const sessionId = 'session-123';
      global.fetch = vi.fn().mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useTranscript(sessionId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('refetch functionality', () => {
    it('should refetch data when refetch is called', async () => {
      const sessionId = 'session-123';
      const initialTranscript = [
        {
          type: 'user',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Hello' }],
          },
          timestamp: '2024-01-29T10:00:00Z',
        },
      ];
      const updatedTranscript = [
        ...initialTranscript,
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'Hi!' }],
          },
          timestamp: '2024-01-29T10:00:01Z',
        },
      ];

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => initialTranscript,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => updatedTranscript,
        });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useTranscript(sessionId));

      await waitFor(() => {
        expect(result.current.transcript).toHaveLength(1);
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(result.current.transcript).toHaveLength(2);
      });
    });

    it('should set loading state during refetch', async () => {
      const sessionId = 'session-123';
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  json: async () => [],
                }),
              50
            )
          )
      );

      const { result } = renderHook(() => useTranscript(sessionId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const refetchPromise = result.current.refetch();

      expect(result.current.loading).toBe(true);

      await refetchPromise;
    });

    it('should handle errors during refetch', async () => {
      const sessionId = 'session-123';
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [
            {
              type: 'user',
              message: { role: 'user', content: [] },
              timestamp: '2024-01-29T10:00:00Z',
            },
          ],
        })
        .mockRejectedValueOnce(new Error('Refetch failed'));
      global.fetch = mockFetch;

      const { result } = renderHook(() => useTranscript(sessionId));

      await waitFor(() => {
        expect(result.current.transcript).toHaveLength(1);
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
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      });
      global.fetch = mockFetch;

      renderHook(() => useTranscript(sessionId));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should refetch when sessionId changes', async () => {
      const sessionId1 = 'session-123';
      const sessionId2 = 'session-456';
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      });
      global.fetch = mockFetch;

      const { rerender } = renderHook(
        ({ id }) => useTranscript(id),
        { initialProps: { id: sessionId1 } }
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(`/api/transcripts/${sessionId1}`);
      });

      rerender({ id: sessionId2 });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(`/api/transcripts/${sessionId2}`);
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    it('should not fetch when sessionId is unchanged on re-render', async () => {
      const sessionId = 'session-123';
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      });
      global.fetch = mockFetch;

      const { rerender } = renderHook(() => useTranscript(sessionId));

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
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      });

      renderHook(() => useTranscript(sessionId));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/transcripts/');
      });
    });

    it('should handle special characters in sessionId', async () => {
      const sessionId = 'session-with-special-chars-123!@#';
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      });
      global.fetch = mockFetch;

      renderHook(() => useTranscript(sessionId));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/transcripts/${sessionId}`
        );
      });
    });
  });
});
