import request from 'supertest';
import { app } from '../../src/app';
import * as s3Service from '../../src/services/s3Service';

// Mock the s3Service module
jest.mock('../../src/services/s3Service');
const mockedS3Service = s3Service as jest.Mocked<typeof s3Service>;

describe('Transcript API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/sessions', () => {
    it('should return 200 with list of sessions', async () => {
      // Arrange
      mockedS3Service.listSessions.mockResolvedValue([
        { sessionId: 'session1', lastModified: '2024-01-01T00:00:00.000Z' },
        { sessionId: 'session2', lastModified: '2024-01-02T00:00:00.000Z' },
      ]);

      // Act
      const response = await request(app).get('/api/sessions');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sessions');
      expect(Array.isArray(response.body.sessions)).toBe(true);
      expect(response.body.sessions).toHaveLength(2);
    });

    it('should return sessions with correct structure', async () => {
      // Arrange
      mockedS3Service.listSessions.mockResolvedValue([
        { sessionId: 'test-session', lastModified: '2024-01-01T00:00:00.000Z' },
      ]);

      // Act
      const response = await request(app).get('/api/sessions');

      // Assert
      expect(response.body.sessions[0]).toHaveProperty('sessionId');
      expect(response.body.sessions[0]).toHaveProperty('lastModified');
    });

    it('should return empty array when no sessions exist', async () => {
      // Arrange
      mockedS3Service.listSessions.mockResolvedValue([]);

      // Act
      const response = await request(app).get('/api/sessions');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.sessions).toEqual([]);
    });

    it('should return 500 when S3 request fails', async () => {
      // Arrange
      const s3Error = new Error('S3 connection failed');
      (s3Error as Error & { name: string }).name = 'ServiceException';
      mockedS3Service.listSessions.mockRejectedValue(s3Error);

      // Act
      const response = await request(app).get('/api/sessions');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/transcripts/:sessionId', () => {
    it('should return 200 with transcript data', async () => {
      // Arrange
      const jsonlContent = '{"type":"message","content":"hello"}\n{"type":"message","content":"world"}';
      mockedS3Service.getTranscript.mockResolvedValue(jsonlContent);
      mockedS3Service.listSubagents.mockResolvedValue(['agent1']);

      // Act
      const response = await request(app).get('/api/transcripts/session123');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sessionId', 'session123');
      expect(response.body).toHaveProperty('records');
      expect(response.body).toHaveProperty('subagentIds');
    });

    it('should parse JSONL records correctly', async () => {
      // Arrange
      const jsonlContent = '{"type":"message","content":"hello"}\n{"type":"message","content":"world"}';
      mockedS3Service.getTranscript.mockResolvedValue(jsonlContent);
      mockedS3Service.listSubagents.mockResolvedValue([]);

      // Act
      const response = await request(app).get('/api/transcripts/session123');

      // Assert
      expect(response.body.records).toHaveLength(2);
      expect(response.body.records[0]).toEqual({ type: 'message', content: 'hello' });
    });

    it('should include subagent IDs when subagents exist', async () => {
      // Arrange
      mockedS3Service.getTranscript.mockResolvedValue('{"data":"test"}');
      mockedS3Service.listSubagents.mockResolvedValue(['agent1', 'agent2']);

      // Act
      const response = await request(app).get('/api/transcripts/session123');

      // Assert
      expect(response.body.subagentIds).toEqual(['agent1', 'agent2']);
    });

    it('should return 404 when session does not exist', async () => {
      // Arrange
      const notFoundError = new Error('Not found');
      (notFoundError as Error & { name: string }).name = 'NoSuchKey';
      mockedS3Service.getTranscript.mockRejectedValue(notFoundError);

      // Act
      const response = await request(app).get('/api/transcripts/nonexistent');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'NotFound');
    });

    it('should return 400 for invalid session ID format', async () => {
      // Act
      const response = await request(app).get('/api/transcripts/../etc/passwd');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'BadRequest');
    });

    it('should handle empty transcript file', async () => {
      // Arrange
      mockedS3Service.getTranscript.mockResolvedValue('');
      mockedS3Service.listSubagents.mockResolvedValue([]);

      // Act
      const response = await request(app).get('/api/transcripts/empty-session');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.records).toEqual([]);
    });

    it('should handle malformed JSONL gracefully', async () => {
      // Arrange
      const malformedContent = '{"valid":"json"}\ninvalid json line\n{"also":"valid"}';
      mockedS3Service.getTranscript.mockResolvedValue(malformedContent);
      mockedS3Service.listSubagents.mockResolvedValue([]);

      // Act
      const response = await request(app).get('/api/transcripts/session123');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.records).toHaveLength(2);
    });
  });

  describe('GET /api/transcripts/:sessionId/subagents', () => {
    it('should return 200 with list of subagent IDs', async () => {
      // Arrange
      mockedS3Service.listSubagents.mockResolvedValue(['agent1', 'agent2']);

      // Act
      const response = await request(app).get('/api/transcripts/session123/subagents');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sessionId', 'session123');
      expect(response.body).toHaveProperty('subagentIds');
      expect(response.body.subagentIds).toEqual(['agent1', 'agent2']);
    });

    it('should return empty array when no subagents exist', async () => {
      // Arrange
      mockedS3Service.listSubagents.mockResolvedValue([]);

      // Act
      const response = await request(app).get('/api/transcripts/session123/subagents');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.subagentIds).toEqual([]);
    });

    it('should return 400 for invalid session ID', async () => {
      // Act
      const response = await request(app).get('/api/transcripts/../hack/subagents');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'BadRequest');
    });

    it('should return 500 when S3 request fails', async () => {
      // Arrange
      const s3Error = new Error('S3 error');
      mockedS3Service.listSubagents.mockRejectedValue(s3Error);

      // Act
      const response = await request(app).get('/api/transcripts/session123/subagents');

      // Assert
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/transcripts/:sessionId/subagents/:agentId', () => {
    it('should return 200 with subagent transcript data', async () => {
      // Arrange
      const jsonlContent = '{"type":"tool_call","name":"read_file"}';
      mockedS3Service.getSubagentTranscript.mockResolvedValue(jsonlContent);

      // Act
      const response = await request(app).get('/api/transcripts/session123/subagents/agent1');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sessionId', 'session123');
      expect(response.body).toHaveProperty('agentId', 'agent1');
      expect(response.body).toHaveProperty('records');
    });

    it('should parse subagent JSONL records correctly', async () => {
      // Arrange
      const jsonlContent = '{"type":"tool_call"}\n{"type":"result"}';
      mockedS3Service.getSubagentTranscript.mockResolvedValue(jsonlContent);

      // Act
      const response = await request(app).get('/api/transcripts/session123/subagents/agent1');

      // Assert
      expect(response.body.records).toHaveLength(2);
    });

    it('should return 404 when subagent transcript does not exist', async () => {
      // Arrange
      const notFoundError = new Error('Not found');
      (notFoundError as Error & { name: string }).name = 'NoSuchKey';
      mockedS3Service.getSubagentTranscript.mockRejectedValue(notFoundError);

      // Act
      const response = await request(app).get('/api/transcripts/session123/subagents/nonexistent');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'NotFound');
    });

    it('should return 400 for invalid session ID', async () => {
      // Act
      const response = await request(app).get('/api/transcripts/../hack/subagents/agent1');

      // Assert
      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid agent ID', async () => {
      // Act
      const response = await request(app).get('/api/transcripts/session123/subagents/../passwd');

      // Assert
      expect(response.status).toBe(400);
    });

    it('should handle empty subagent transcript', async () => {
      // Arrange
      mockedS3Service.getSubagentTranscript.mockResolvedValue('');

      // Act
      const response = await request(app).get('/api/transcripts/session123/subagents/agent1');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.records).toEqual([]);
    });
  });
});
