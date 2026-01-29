// Mock @aws-sdk/client-s3 before any imports
const mockSend = jest.fn();
const MockS3Client = jest.fn().mockImplementation(() => ({
  send: mockSend,
  config: {
    region: jest.fn().mockResolvedValue('ap-northeast-2'),
  },
}));
const MockGetObjectCommand = jest.fn().mockImplementation((input) => ({ input }));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: MockS3Client,
  GetObjectCommand: MockGetObjectCommand,
}));

import request from 'supertest';
import { app } from '../src/app';

describe('Transcripts API Endpoint', () => {
  beforeEach(() => {
    // Reset mocks
    mockSend.mockReset();
    MockS3Client.mockClear();
    MockGetObjectCommand.mockClear();
  });

  describe('GET /api/transcripts/:sessionId', () => {
    it('should return 200 OK when session exists', async () => {
      // Arrange
      const sessionId = 'test-session-123';
      const mockJsonl = '{"type":"request","message":{"role":"user","content":"Hello"},"timestamp":"2026-01-29T10:00:00Z"}';

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}`);

      // Assert
      expect(response.status).toBe(200);
    });

    it('should return JSON content type', async () => {
      // Arrange
      const sessionId = 'test-session-123';
      const mockJsonl = '{"type":"request","message":{"role":"user","content":"Hello"},"timestamp":"2026-01-29T10:00:00Z"}';

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}`);

      // Assert
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should return sessionId and records in response body', async () => {
      // Arrange
      const sessionId = 'test-session-123';
      const mockJsonl = '{"type":"request","message":{"role":"user","content":"Hello"},"timestamp":"2026-01-29T10:00:00Z"}';

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}`);

      // Assert
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body.sessionId).toBe(sessionId);
      expect(response.body).toHaveProperty('records');
      expect(Array.isArray(response.body.records)).toBe(true);
    });

    it('should parse single JSONL line correctly', async () => {
      // Arrange
      const sessionId = 'test-session-123';
      const mockRecord = {
        type: 'request',
        message: { role: 'user', content: 'Hello' },
        timestamp: '2026-01-29T10:00:00Z',
      };
      const mockJsonl = JSON.stringify(mockRecord);

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.records).toHaveLength(1);
      expect(response.body.records[0]).toEqual(mockRecord);
    });

    it('should parse multiple JSONL lines correctly', async () => {
      // Arrange
      const sessionId = 'test-session-123';
      const mockRecord1 = {
        type: 'request',
        message: { role: 'user', content: 'Hello' },
        timestamp: '2026-01-29T10:00:00Z',
      };
      const mockRecord2 = {
        type: 'response',
        message: { role: 'assistant', content: 'Hi there!' },
        timestamp: '2026-01-29T10:00:01Z',
      };
      const mockJsonl = `${JSON.stringify(mockRecord1)}\n${JSON.stringify(mockRecord2)}`;

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.records).toHaveLength(2);
      expect(response.body.records[0]).toEqual(mockRecord1);
      expect(response.body.records[1]).toEqual(mockRecord2);
    });

    it('should handle empty JSONL file', async () => {
      // Arrange
      const sessionId = 'empty-session';

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(''),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.records).toEqual([]);
    });

    it('should return 404 when session does not exist', async () => {
      // Arrange
      const sessionId = 'nonexistent-session';

      mockSend.mockRejectedValue({
        name: 'NoSuchKey',
        message: 'The specified key does not exist.',
        $metadata: {
          httpStatusCode: 404,
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}`);

      // Assert
      expect(response.status).toBe(404);
    });

    it('should return error message when session not found', async () => {
      // Arrange
      const sessionId = 'nonexistent-session';

      mockSend.mockRejectedValue({
        name: 'NoSuchKey',
        message: 'The specified key does not exist.',
        $metadata: {
          httpStatusCode: 404,
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}`);

      // Assert
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should return 500 when S3 service is unavailable', async () => {
      // Arrange
      const sessionId = 'test-session';

      mockSend.mockRejectedValue(new Error('S3 service unavailable'));

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}`);

      // Assert
      expect(response.status).toBe(500);
    });

    it('should return error message when S3 fails', async () => {
      // Arrange
      const sessionId = 'test-session';

      mockSend.mockRejectedValue(new Error('S3 service unavailable'));

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}`);

      // Assert
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should return 500 when S3 access is denied', async () => {
      // Arrange
      const sessionId = 'test-session';

      mockSend.mockRejectedValue({
        name: 'AccessDenied',
        message: 'Access Denied',
        $metadata: {
          httpStatusCode: 403,
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}`);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should call GetObjectCommand with correct parameters', async () => {
      // Arrange
      const sessionId = 'test-session-123';
      const mockJsonl = '{"type":"request","message":{},"timestamp":"2026-01-29T10:00:00Z"}';

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      await request(app).get(`/api/transcripts/${sessionId}`);

      // Assert
      expect(MockGetObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: `${sessionId}.jsonl`,
      });
    });

    it('should handle JSONL with blank lines', async () => {
      // Arrange
      const sessionId = 'test-session';
      const mockRecord1 = {
        type: 'request',
        message: { role: 'user', content: 'Hello' },
        timestamp: '2026-01-29T10:00:00Z',
      };
      const mockRecord2 = {
        type: 'response',
        message: { role: 'assistant', content: 'Hi!' },
        timestamp: '2026-01-29T10:00:01Z',
      };
      const mockJsonl = `${JSON.stringify(mockRecord1)}\n\n${JSON.stringify(mockRecord2)}\n`;

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.records).toHaveLength(2);
      expect(response.body.records[0]).toEqual(mockRecord1);
      expect(response.body.records[1]).toEqual(mockRecord2);
    });

    it('should handle large JSONL files efficiently', async () => {
      // Arrange
      const sessionId = 'large-session';
      const mockRecords = Array.from({ length: 100 }, (_, i) => ({
        type: 'request',
        message: { role: 'user', content: `Message ${i}` },
        timestamp: `2026-01-29T10:00:${String(i).padStart(2, '0')}Z`,
      }));
      const mockJsonl = mockRecords.map((r) => JSON.stringify(r)).join('\n');

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.records).toHaveLength(100);
    });

    it('should preserve record structure with nested objects', async () => {
      // Arrange
      const sessionId = 'nested-session';
      const mockRecord = {
        type: 'request',
        message: {
          role: 'user',
          content: 'Hello',
          metadata: {
            source: 'web',
            version: '1.0',
            tags: ['important', 'urgent'],
          },
        },
        timestamp: '2026-01-29T10:00:00Z',
      };
      const mockJsonl = JSON.stringify(mockRecord);

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.records).toHaveLength(1);
      expect(response.body.records[0]).toEqual(mockRecord);
      expect(response.body.records[0].message.metadata).toEqual({
        source: 'web',
        version: '1.0',
        tags: ['important', 'urgent'],
      });
    });

    it('should handle session IDs with special characters', async () => {
      // Arrange
      const sessionId = 'session-with-dashes_and_underscores.123';
      const mockJsonl = '{"type":"request","message":{},"timestamp":"2026-01-29T10:00:00Z"}';

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.sessionId).toBe(sessionId);
    });

    it('should not accept POST requests', async () => {
      // Arrange & Act
      const response = await request(app)
        .post('/api/transcripts/test-session')
        .send({ data: 'test' });

      // Assert
      expect(response.status).toBe(404);
    });

    it('should not accept PUT requests', async () => {
      // Arrange & Act
      const response = await request(app)
        .put('/api/transcripts/test-session')
        .send({ data: 'test' });

      // Assert
      expect(response.status).toBe(404);
    });

    it('should not accept DELETE requests', async () => {
      // Arrange & Act
      const response = await request(app).delete('/api/transcripts/test-session');

      // Assert
      expect(response.status).toBe(404);
    });

    it('should return proper CORS headers', async () => {
      // Arrange
      const sessionId = 'test-session';
      const mockJsonl = '{"type":"request","message":{},"timestamp":"2026-01-29T10:00:00Z"}';

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}`);

      // Assert
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle network timeout errors gracefully', async () => {
      // Arrange
      const sessionId = 'test-session';

      mockSend.mockRejectedValue({
        name: 'TimeoutError',
        message: 'Request timed out',
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}`);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle invalid JSON lines gracefully', async () => {
      // Arrange
      const sessionId = 'invalid-json-session';
      const mockJsonl = '{"type":"request","message":{},"timestamp":"2026-01-29T10:00:00Z"}\n{invalid json}\n{"type":"response","message":{},"timestamp":"2026-01-29T10:00:01Z"}';

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}`);

      // Assert
      // Should either return 500 or skip invalid lines and return valid ones
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        // If it skips invalid lines, should have 2 valid records
        expect(response.body.records.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should handle concurrent requests for different sessions', async () => {
      // Arrange
      const sessionId1 = 'session-1';
      const sessionId2 = 'session-2';
      const mockJsonl1 = '{"type":"request","message":{"id":1},"timestamp":"2026-01-29T10:00:00Z"}';
      const mockJsonl2 = '{"type":"request","message":{"id":2},"timestamp":"2026-01-29T10:00:00Z"}';

      mockSend
        .mockResolvedValueOnce({
          Body: {
            transformToString: jest.fn().mockResolvedValue(mockJsonl1),
          },
        })
        .mockResolvedValueOnce({
          Body: {
            transformToString: jest.fn().mockResolvedValue(mockJsonl2),
          },
        });

      // Act
      const [response1, response2] = await Promise.all([
        request(app).get(`/api/transcripts/${sessionId1}`),
        request(app).get(`/api/transcripts/${sessionId2}`),
      ]);

      // Assert
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.sessionId).toBe(sessionId1);
      expect(response2.body.sessionId).toBe(sessionId2);
    });

    it('should handle records with all required fields', async () => {
      // Arrange
      const sessionId = 'complete-record-session';
      const mockRecord = {
        type: 'request',
        message: {
          role: 'user',
          content: 'Test message',
        },
        timestamp: '2026-01-29T10:00:00Z',
      };
      const mockJsonl = JSON.stringify(mockRecord);

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.records[0]).toHaveProperty('type');
      expect(response.body.records[0]).toHaveProperty('message');
      expect(response.body.records[0]).toHaveProperty('timestamp');
      expect(typeof response.body.records[0].type).toBe('string');
      expect(typeof response.body.records[0].message).toBe('object');
      expect(typeof response.body.records[0].timestamp).toBe('string');
    });
  });
});
