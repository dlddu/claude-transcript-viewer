import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSessions } from '../../src/hooks/useSessions';

describe('useSessions hook', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('initial state', () => {
    it('should return loading state initially', () => {
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

      const { result } = renderHook(() => useSessions());

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.sessions).toBeNull();
    });

    it('should provide refetch function', () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      });

      const { result } = renderHook(() => useSessions());

      expect(result.current.refetch).toBeInstanceOf(Function);
    });
  });

  describe('successful data fetching', () => {
    it('should fetch sessions from /api/sessions endpoint', async () => {
      const mockSessions = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
        { id: 'session-2', lastModified: '2024-01-29T11:00:00Z' },
      ];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockSessions,
      });
      global.fetch = mockFetch;

      renderHook(() => useSessions());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/sessions');
      });
    });

    it('should update state with fetched sessions', async () => {
      const mockSessions = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
        { id: 'session-2', lastModified: '2024-01-29T11:00:00Z' },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockSessions,
      });

      const { result } = renderHook(() => useSessions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.sessions).toEqual(mockSessions);
        expect(result.current.sessions).toHaveLength(2);
      });
    });

    it('should handle empty sessions array', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      });

      const { result } = renderHook(() => useSessions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.sessions).toEqual([]);
        expect(result.current.sessions).toHaveLength(0);
      });
    });

    it('should set loading to false after successful fetch', async () => {
      const mockSessions = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockSessions,
      });

      const { result } = renderHook(() => useSessions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('error handling', () => {
    it('should handle HTTP error response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const { result } = renderHook(() => useSessions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeTruthy();
        expect(result.current.sessions).toBeNull();
      });
    });

    it('should handle network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSessions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeTruthy();
        expect(result.current.sessions).toBeNull();
      });
    });

    it('should handle JSON parsing error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const { result } = renderHook(() => useSessions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeTruthy();
        expect(result.current.sessions).toBeNull();
      });
    });

    it('should set loading to false even on error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useSessions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('refetch functionality', () => {
    it('should refetch data when refetch is called', async () => {
      const initialSessions = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
      ];
      const updatedSessions = [
        { id: 'session-1', lastModified: '2024-01-29T10:00:00Z' },
        { id: 'session-2', lastModified: '2024-01-29T11:00:00Z' },
      ];

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => initialSessions,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => updatedSessions,
        });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useSessions());

      await waitFor(() => {
        expect(result.current.sessions).toHaveLength(1);
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(result.current.sessions).toHaveLength(2);
      });
    });

    it('should set loading state during refetch', async () => {
      let resolveFirstFetch: (value: Response) => void;
      let resolveSecondFetch: (value: Response) => void;

      const firstFetchPromise = new Promise((resolve) => {
        resolveFirstFetch = resolve;
      });

      const secondFetchPromise = new Promise((resolve) => {
        resolveSecondFetch = resolve;
      });

      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return firstFetchPromise;
        }
        return secondFetchPromise;
      });

      const { result } = renderHook(() => useSessions());

      // Initial loading should be true
      expect(result.current.loading).toBe(true);

      // Resolve first fetch
      resolveFirstFetch!({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start refetch
      const refetchPromise = result.current.refetch();

      // Loading should become true during refetch
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Resolve second fetch
      resolveSecondFetch!({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response);

      await refetchPromise;

      // Loading should be false after refetch completes
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle errors during refetch', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [{ id: 'session-1', lastModified: '2024-01-29T10:00:00Z' }],
        })
        .mockRejectedValueOnce(new Error('Refetch failed'));
      global.fetch = mockFetch;

      const { result } = renderHook(() => useSessions());

      await waitFor(() => {
        expect(result.current.sessions).toHaveLength(1);
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
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      });
      global.fetch = mockFetch;

      renderHook(() => useSessions());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should not fetch data on re-render', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      });
      global.fetch = mockFetch;

      const { rerender } = renderHook(() => useSessions());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      rerender();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
