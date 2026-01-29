import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { get } from '../../src/api/client';

describe('API Client', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Save original fetch
    originalFetch = global.fetch;
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  describe('get function', () => {
    describe('successful requests', () => {
      it('should make GET request with correct URL', async () => {
        // Arrange
        const mockResponse = { data: 'test data' };
        const mockFetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });
        global.fetch = mockFetch;

        // Act
        await get('/api/test');

        // Assert
        expect(mockFetch).toHaveBeenCalledWith('/api/test');
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it('should return parsed JSON response on success', async () => {
        // Arrange
        const mockResponse = { id: '123', name: 'Test Session' };
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        // Act
        const result = await get('/api/sessions');

        // Assert
        expect(result).toEqual(mockResponse);
      });

      it('should handle empty response body', async () => {
        // Arrange
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 204,
          json: async () => ({}),
        });

        // Act
        const result = await get('/api/resource');

        // Assert
        expect(result).toEqual({});
      });
    });

    describe('error handling', () => {
      it('should throw error when response is not ok (HTTP 404)', async () => {
        // Arrange
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => ({}),
        });

        // Act & Assert
        await expect(get('/api/nonexistent')).rejects.toThrow();
      });

      it('should throw error when response is not ok (HTTP 500)', async () => {
        // Arrange
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({}),
        });

        // Act & Assert
        await expect(get('/api/error')).rejects.toThrow();
      });

      it('should throw error on network failure', async () => {
        // Arrange
        global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

        // Act & Assert
        await expect(get('/api/test')).rejects.toThrow('Network error');
      });

      it('should throw error when JSON parsing fails', async () => {
        // Arrange
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => {
            throw new Error('Invalid JSON');
          },
        });

        // Act & Assert
        await expect(get('/api/invalid')).rejects.toThrow('Invalid JSON');
      });
    });

    describe('type safety', () => {
      it('should return typed response for Session type', async () => {
        // Arrange
        interface Session {
          id: string;
          lastModified: string;
        }

        const mockSession: Session = {
          id: 'session-123',
          lastModified: '2024-01-29T10:00:00Z',
        };

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockSession,
        });

        // Act
        const result = await get<Session>('/api/sessions/123');

        // Assert
        expect(result.id).toBe('session-123');
        expect(result.lastModified).toBe('2024-01-29T10:00:00Z');
      });

      it('should return typed response for array of Sessions', async () => {
        // Arrange
        interface Session {
          id: string;
          lastModified: string;
        }

        const mockSessions: Session[] = [
          { id: '1', lastModified: '2024-01-29T10:00:00Z' },
          { id: '2', lastModified: '2024-01-29T11:00:00Z' },
        ];

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockSessions,
        });

        // Act
        const result = await get<Session[]>('/api/sessions');

        // Assert
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('1');
      });
    });

    describe('edge cases', () => {
      it('should handle URL with query parameters', async () => {
        // Arrange
        const mockResponse = { data: 'filtered' };
        const mockFetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });
        global.fetch = mockFetch;

        // Act
        await get('/api/sessions?limit=10&offset=5');

        // Assert
        expect(mockFetch).toHaveBeenCalledWith('/api/sessions?limit=10&offset=5');
      });

      it('should handle absolute URLs', async () => {
        // Arrange
        const mockResponse = { data: 'external' };
        const mockFetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });
        global.fetch = mockFetch;

        // Act
        await get('https://api.example.com/data');

        // Assert
        expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/data');
      });
    });
  });
});
