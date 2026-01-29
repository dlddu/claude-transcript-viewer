// Mock @aws-sdk/client-s3 before any imports
const mockSend = jest.fn();
const MockS3Client = jest.fn().mockImplementation(() => ({
  send: mockSend,
  config: {
    region: jest.fn().mockResolvedValue('ap-northeast-2'),
  },
}));
const MockListObjectsV2Command = jest.fn().mockImplementation((input) => ({ input }));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: MockS3Client,
  ListObjectsV2Command: MockListObjectsV2Command,
  HeadBucketCommand: jest.fn(),
}));

import request from 'supertest';
import { app } from '../src/app';

describe('Sessions API Endpoint', () => {
  beforeEach(() => {
    // Reset mocks
    mockSend.mockReset();
    MockS3Client.mockClear();
    MockListObjectsV2Command.mockClear();
  });

  describe('GET /api/sessions', () => {
    it('should return 200 OK', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        Contents: [],
      });

      // Act
      const response = await request(app).get('/api/sessions');

      // Assert
      expect(response.status).toBe(200);
    });

    it('should return JSON content type', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        Contents: [],
      });

      // Act
      const response = await request(app).get('/api/sessions');

      // Assert
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should return sessions array in response body', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        Contents: [],
      });

      // Act
      const response = await request(app).get('/api/sessions');

      // Assert
      expect(response.body).toHaveProperty('sessions');
      expect(Array.isArray(response.body.sessions)).toBe(true);
    });

    it('should return empty sessions array when no .jsonl files exist', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        Contents: [],
      });

      // Act
      const response = await request(app).get('/api/sessions');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.sessions).toEqual([]);
    });

    it('should return sessions with id and lastModified when .jsonl files exist', async () => {
      // Arrange
      const mockDate1 = new Date('2026-01-27T10:00:00Z');
      const mockDate2 = new Date('2026-01-27T09:00:00Z');

      mockSend.mockResolvedValue({
        Contents: [
          { Key: 'abc123.jsonl', LastModified: mockDate1 },
          { Key: 'def456.jsonl', LastModified: mockDate2 },
        ],
      });

      // Act
      const response = await request(app).get('/api/sessions');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.sessions).toHaveLength(2);
      expect(response.body.sessions[0]).toHaveProperty('id');
      expect(response.body.sessions[0]).toHaveProperty('lastModified');
      expect(response.body.sessions[1]).toHaveProperty('id');
      expect(response.body.sessions[1]).toHaveProperty('lastModified');
    });

    it('should return sessions sorted by lastModified in descending order', async () => {
      // Arrange
      const oldDate = new Date('2026-01-25T10:00:00Z');
      const middleDate = new Date('2026-01-26T10:00:00Z');
      const newDate = new Date('2026-01-27T10:00:00Z');

      mockSend.mockResolvedValue({
        Contents: [
          { Key: 'old.jsonl', LastModified: oldDate },
          { Key: 'new.jsonl', LastModified: newDate },
          { Key: 'middle.jsonl', LastModified: middleDate },
        ],
      });

      // Act
      const response = await request(app).get('/api/sessions');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.sessions).toHaveLength(3);
      expect(response.body.sessions[0].id).toBe('new');
      expect(response.body.sessions[1].id).toBe('middle');
      expect(response.body.sessions[2].id).toBe('old');
    });

    it('should return 500 when S3 service is unavailable', async () => {
      // Arrange
      mockSend.mockRejectedValue(new Error('S3 service unavailable'));

      // Act
      const response = await request(app).get('/api/sessions');

      // Assert
      expect(response.status).toBe(500);
    });

    it('should return error message when S3 fails', async () => {
      // Arrange
      mockSend.mockRejectedValue(new Error('S3 service unavailable'));

      // Act
      const response = await request(app).get('/api/sessions');

      // Assert
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should return 500 when S3 access is denied', async () => {
      // Arrange
      mockSend.mockRejectedValue({
        name: 'AccessDenied',
        message: 'Access Denied',
        $metadata: {
          httpStatusCode: 403,
        },
      });

      // Act
      const response = await request(app).get('/api/sessions');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 500 when S3 bucket does not exist', async () => {
      // Arrange
      mockSend.mockRejectedValue({
        name: 'NoSuchBucket',
        message: 'The specified bucket does not exist',
        $metadata: {
          httpStatusCode: 404,
        },
      });

      // Act
      const response = await request(app).get('/api/sessions');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle network timeout errors gracefully', async () => {
      // Arrange
      mockSend.mockRejectedValue({
        name: 'TimeoutError',
        message: 'Request timed out',
      });

      // Act
      const response = await request(app).get('/api/sessions');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should return correct session IDs extracted from filenames', async () => {
      // Arrange
      const mockDate = new Date('2026-01-27T10:00:00Z');

      mockSend.mockResolvedValue({
        Contents: [
          { Key: 'session-123.jsonl', LastModified: mockDate },
          { Key: 'test_session.jsonl', LastModified: mockDate },
        ],
      });

      // Act
      const response = await request(app).get('/api/sessions');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.sessions[0].id).toBe('session-123');
      expect(response.body.sessions[1].id).toBe('test_session');
    });

    it('should return lastModified in ISO 8601 format', async () => {
      // Arrange
      const mockDate = new Date('2026-01-27T10:30:45.123Z');

      mockSend.mockResolvedValue({
        Contents: [{ Key: 'session.jsonl', LastModified: mockDate }],
      });

      // Act
      const response = await request(app).get('/api/sessions');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.sessions[0].lastModified).toBe('2026-01-27T10:30:45.123Z');
      const parsedDate = new Date(response.body.sessions[0].lastModified);
      expect(parsedDate.toISOString()).toBe('2026-01-27T10:30:45.123Z');
    });

    it('should filter out non-.jsonl files', async () => {
      // Arrange
      const mockDate = new Date('2026-01-27T10:00:00Z');

      mockSend.mockResolvedValue({
        Contents: [
          { Key: 'session1.jsonl', LastModified: mockDate },
          { Key: 'readme.txt', LastModified: mockDate },
          { Key: 'data.json', LastModified: mockDate },
          { Key: 'session2.jsonl', LastModified: mockDate },
        ],
      });

      // Act
      const response = await request(app).get('/api/sessions');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.sessions).toHaveLength(2);
      expect(response.body.sessions[0].id).toBe('session1');
      expect(response.body.sessions[1].id).toBe('session2');
    });

    it('should only return root-level .jsonl files, not from subdirectories', async () => {
      // Arrange
      const mockDate = new Date('2026-01-27T10:00:00Z');

      mockSend.mockResolvedValue({
        Contents: [
          { Key: 'session1.jsonl', LastModified: mockDate },
          { Key: 'archive/old.jsonl', LastModified: mockDate },
          { Key: 'backup/session2.jsonl', LastModified: mockDate },
        ],
      });

      // Act
      const response = await request(app).get('/api/sessions');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.sessions).toHaveLength(1);
      expect(response.body.sessions[0].id).toBe('session1');
    });

    it('should handle large number of sessions efficiently', async () => {
      // Arrange
      const mockDate = new Date('2026-01-27T10:00:00Z');
      const largeSessions = Array.from({ length: 100 }, (_, i) => ({
        Key: `session${i}.jsonl`,
        LastModified: new Date(mockDate.getTime() - i * 1000),
      }));

      mockSend.mockResolvedValue({
        Contents: largeSessions,
      });

      // Act
      const response = await request(app).get('/api/sessions');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.sessions).toHaveLength(100);
    });

    it('should handle special characters in session IDs', async () => {
      // Arrange
      const mockDate = new Date('2026-01-27T10:00:00Z');

      mockSend.mockResolvedValue({
        Contents: [
          { Key: 'session-with-dashes.jsonl', LastModified: mockDate },
          { Key: 'session_with_underscores.jsonl', LastModified: mockDate },
          { Key: 'session.with.dots.jsonl', LastModified: mockDate },
        ],
      });

      // Act
      const response = await request(app).get('/api/sessions');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.sessions).toHaveLength(3);
      expect(response.body.sessions.map((s: any) => s.id)).toEqual([
        'session-with-dashes',
        'session_with_underscores',
        'session.with.dots',
      ]);
    });

    it('should not accept POST requests', async () => {
      // Arrange & Act
      const response = await request(app)
        .post('/api/sessions')
        .send({ data: 'test' });

      // Assert
      expect(response.status).toBe(404);
    });

    it('should not accept PUT requests', async () => {
      // Arrange & Act
      const response = await request(app)
        .put('/api/sessions')
        .send({ data: 'test' });

      // Assert
      expect(response.status).toBe(404);
    });

    it('should not accept DELETE requests', async () => {
      // Arrange & Act
      const response = await request(app).delete('/api/sessions');

      // Assert
      expect(response.status).toBe(404);
    });

    it('should handle concurrent requests correctly', async () => {
      // Arrange
      const mockDate = new Date('2026-01-27T10:00:00Z');

      mockSend.mockResolvedValue({
        Contents: [{ Key: 'session.jsonl', LastModified: mockDate }],
      });

      // Act
      const [response1, response2, response3] = await Promise.all([
        request(app).get('/api/sessions'),
        request(app).get('/api/sessions'),
        request(app).get('/api/sessions'),
      ]);

      // Assert
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response3.status).toBe(200);
      expect(response1.body.sessions).toEqual(response2.body.sessions);
      expect(response2.body.sessions).toEqual(response3.body.sessions);
    });

    it('should return proper CORS headers', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        Contents: [],
      });

      // Act
      const response = await request(app).get('/api/sessions');

      // Assert
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
