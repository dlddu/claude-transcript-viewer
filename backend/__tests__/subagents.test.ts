// Mock @aws-sdk/client-s3 before any imports
const mockSend = jest.fn();
const MockS3Client = jest.fn().mockImplementation(() => ({
  send: mockSend,
  config: {
    region: jest.fn().mockResolvedValue('ap-northeast-2'),
  },
}));
const MockListObjectsV2Command = jest.fn().mockImplementation((input) => ({ input }));
const MockGetObjectCommand = jest.fn().mockImplementation((input) => ({ input }));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: MockS3Client,
  ListObjectsV2Command: MockListObjectsV2Command,
  GetObjectCommand: MockGetObjectCommand,
}));

import request from 'supertest';
import { app } from '../src/app';

describe('Subagents API Endpoints', () => {
  beforeEach(() => {
    // Reset mocks
    mockSend.mockReset();
    MockS3Client.mockClear();
    MockListObjectsV2Command.mockClear();
    MockGetObjectCommand.mockClear();
  });

  describe('GET /api/transcripts/:sessionId/subagents', () => {
    it('should return 200 OK when session has subagents', async () => {
      // Arrange
      const sessionId = 'test-session-123';
      const mockSubagentData = '{"type":"codebase-analyzer","timestamp":"2026-01-29T10:00:00Z"}';

      mockSend.mockResolvedValue({
        Contents: [
          { Key: `${sessionId}/subagents/agent-analyzer-001.jsonl` },
        ],
      });

      mockSend.mockResolvedValueOnce({
        Contents: [
          { Key: `${sessionId}/subagents/agent-analyzer-001.jsonl` },
        ],
      }).mockResolvedValueOnce({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockSubagentData),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents`);

      // Assert
      expect(response.status).toBe(200);
    });

    it('should return JSON content type', async () => {
      // Arrange
      const sessionId = 'test-session-123';

      mockSend.mockResolvedValue({
        Contents: [],
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents`);

      // Assert
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should return subagents array in response body', async () => {
      // Arrange
      const sessionId = 'test-session-123';

      mockSend.mockResolvedValue({
        Contents: [],
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents`);

      // Assert
      expect(response.body).toHaveProperty('subagents');
      expect(Array.isArray(response.body.subagents)).toBe(true);
    });

    it('should return empty array when session has no subagents', async () => {
      // Arrange
      const sessionId = 'empty-session';

      mockSend.mockResolvedValue({
        Contents: [],
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.subagents).toEqual([]);
    });

    it('should return subagents with agentId and type when files exist', async () => {
      // Arrange
      const sessionId = 'test-session-123';
      const mockSubagentData1 = '{"type":"codebase-analyzer","timestamp":"2026-01-29T10:00:00Z"}';
      const mockSubagentData2 = '{"type":"test-writer","timestamp":"2026-01-29T10:00:01Z"}';

      mockSend
        .mockResolvedValueOnce({
          Contents: [
            { Key: `${sessionId}/subagents/agent-analyzer-001.jsonl` },
            { Key: `${sessionId}/subagents/agent-writer-002.jsonl` },
          ],
        })
        .mockResolvedValueOnce({
          Body: {
            transformToString: jest.fn().mockResolvedValue(mockSubagentData1),
          },
        })
        .mockResolvedValueOnce({
          Body: {
            transformToString: jest.fn().mockResolvedValue(mockSubagentData2),
          },
        });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.subagents).toHaveLength(2);
      expect(response.body.subagents[0]).toHaveProperty('agentId');
      expect(response.body.subagents[0]).toHaveProperty('type');
      expect(response.body.subagents[1]).toHaveProperty('agentId');
      expect(response.body.subagents[1]).toHaveProperty('type');
    });

    it('should extract agentId from filename pattern agent-{agentId}.jsonl', async () => {
      // Arrange
      const sessionId = 'test-session';
      const mockSubagentData = '{"type":"codebase-analyzer","timestamp":"2026-01-29T10:00:00Z"}';

      mockSend
        .mockResolvedValueOnce({
          Contents: [
            { Key: `${sessionId}/subagents/agent-analyzer-001.jsonl` },
          ],
        })
        .mockResolvedValueOnce({
          Body: {
            transformToString: jest.fn().mockResolvedValue(mockSubagentData),
          },
        });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.subagents[0].agentId).toBe('analyzer-001');
    });

    it('should extract type from first JSONL line', async () => {
      // Arrange
      const sessionId = 'test-session';
      const mockSubagentData = '{"type":"codebase-analyzer","message":"test","timestamp":"2026-01-29T10:00:00Z"}\n{"type":"other","message":"ignore","timestamp":"2026-01-29T10:00:01Z"}';

      mockSend
        .mockResolvedValueOnce({
          Contents: [
            { Key: `${sessionId}/subagents/agent-analyzer-001.jsonl` },
          ],
        })
        .mockResolvedValueOnce({
          Body: {
            transformToString: jest.fn().mockResolvedValue(mockSubagentData),
          },
        });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.subagents[0].type).toBe('codebase-analyzer');
    });

    it('should call ListObjectsV2Command with correct prefix', async () => {
      // Arrange
      const sessionId = 'test-session-123';

      mockSend.mockResolvedValue({
        Contents: [],
      });

      // Act
      await request(app).get(`/api/transcripts/${sessionId}/subagents`);

      // Assert
      expect(MockListObjectsV2Command).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Prefix: `${sessionId}/subagents/`,
      });
    });

    it('should filter only files matching agent-*.jsonl pattern', async () => {
      // Arrange
      const sessionId = 'test-session';
      const mockSubagentData = '{"type":"test-writer","timestamp":"2026-01-29T10:00:00Z"}';

      mockSend
        .mockResolvedValueOnce({
          Contents: [
            { Key: `${sessionId}/subagents/agent-writer-001.jsonl` },
            { Key: `${sessionId}/subagents/other-file.txt` },
            { Key: `${sessionId}/subagents/readme.md` },
            { Key: `${sessionId}/subagents/notanagent.jsonl` },
          ],
        })
        .mockResolvedValueOnce({
          Body: {
            transformToString: jest.fn().mockResolvedValue(mockSubagentData),
          },
        });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.subagents).toHaveLength(1);
      expect(response.body.subagents[0].agentId).toBe('writer-001');
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
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents`);

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
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents`);

      // Assert
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should return 500 when S3 service is unavailable', async () => {
      // Arrange
      const sessionId = 'test-session';

      mockSend.mockRejectedValue(new Error('S3 service unavailable'));

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents`);

      // Assert
      expect(response.status).toBe(500);
    });

    it('should return error message when S3 fails', async () => {
      // Arrange
      const sessionId = 'test-session';

      mockSend.mockRejectedValue(new Error('S3 service unavailable'));

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents`);

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
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents`);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle network timeout errors gracefully', async () => {
      // Arrange
      const sessionId = 'test-session';

      mockSend.mockRejectedValue({
        name: 'TimeoutError',
        message: 'Request timed out',
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents`);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle empty JSONL file gracefully', async () => {
      // Arrange
      const sessionId = 'test-session';

      mockSend
        .mockResolvedValueOnce({
          Contents: [
            { Key: `${sessionId}/subagents/agent-empty-001.jsonl` },
          ],
        })
        .mockResolvedValueOnce({
          Body: {
            transformToString: jest.fn().mockResolvedValue(''),
          },
        });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents`);

      // Assert
      // Should either return 500 or handle gracefully
      expect([200, 500]).toContain(response.status);
    });

    it('should handle invalid JSON in first line gracefully', async () => {
      // Arrange
      const sessionId = 'test-session';

      mockSend
        .mockResolvedValueOnce({
          Contents: [
            { Key: `${sessionId}/subagents/agent-invalid-001.jsonl` },
          ],
        })
        .mockResolvedValueOnce({
          Body: {
            transformToString: jest.fn().mockResolvedValue('{invalid json}'),
          },
        });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents`);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle session IDs with special characters', async () => {
      // Arrange
      const sessionId = 'session-with-dashes_and_underscores.123';

      mockSend.mockResolvedValue({
        Contents: [],
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.subagents).toEqual([]);
    });

    it('should handle multiple subagents correctly', async () => {
      // Arrange
      const sessionId = 'multi-agent-session';
      const mockData1 = '{"type":"codebase-analyzer","timestamp":"2026-01-29T10:00:00Z"}';
      const mockData2 = '{"type":"test-writer","timestamp":"2026-01-29T10:00:01Z"}';
      const mockData3 = '{"type":"code-implementer","timestamp":"2026-01-29T10:00:02Z"}';

      mockSend
        .mockResolvedValueOnce({
          Contents: [
            { Key: `${sessionId}/subagents/agent-analyzer-001.jsonl` },
            { Key: `${sessionId}/subagents/agent-writer-002.jsonl` },
            { Key: `${sessionId}/subagents/agent-implementer-003.jsonl` },
          ],
        })
        .mockResolvedValueOnce({
          Body: {
            transformToString: jest.fn().mockResolvedValue(mockData1),
          },
        })
        .mockResolvedValueOnce({
          Body: {
            transformToString: jest.fn().mockResolvedValue(mockData2),
          },
        })
        .mockResolvedValueOnce({
          Body: {
            transformToString: jest.fn().mockResolvedValue(mockData3),
          },
        });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.subagents).toHaveLength(3);
      expect(response.body.subagents[0].type).toBe('codebase-analyzer');
      expect(response.body.subagents[1].type).toBe('test-writer');
      expect(response.body.subagents[2].type).toBe('code-implementer');
    });

    it('should not accept POST requests', async () => {
      // Arrange & Act
      const response = await request(app)
        .post('/api/transcripts/test-session/subagents')
        .send({ data: 'test' });

      // Assert
      expect(response.status).toBe(404);
    });

    it('should return proper CORS headers', async () => {
      // Arrange
      const sessionId = 'test-session';

      mockSend.mockResolvedValue({
        Contents: [],
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents`);

      // Assert
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('GET /api/transcripts/:sessionId/subagents/:agentId', () => {
    it('should return 200 OK when subagent exists', async () => {
      // Arrange
      const sessionId = 'test-session-123';
      const agentId = 'analyzer-001';
      const mockJsonl = '{"type":"request","message":"test","timestamp":"2026-01-29T10:00:00Z"}';

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents/${agentId}`);

      // Assert
      expect(response.status).toBe(200);
    });

    it('should return JSON content type', async () => {
      // Arrange
      const sessionId = 'test-session-123';
      const agentId = 'analyzer-001';
      const mockJsonl = '{"type":"request","message":"test","timestamp":"2026-01-29T10:00:00Z"}';

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents/${agentId}`);

      // Assert
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should return agentId and records in response body', async () => {
      // Arrange
      const sessionId = 'test-session-123';
      const agentId = 'analyzer-001';
      const mockJsonl = '{"type":"request","message":"test","timestamp":"2026-01-29T10:00:00Z"}';

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents/${agentId}`);

      // Assert
      expect(response.body).toHaveProperty('agentId');
      expect(response.body.agentId).toBe(agentId);
      expect(response.body).toHaveProperty('records');
      expect(Array.isArray(response.body.records)).toBe(true);
    });

    it('should parse single JSONL line correctly', async () => {
      // Arrange
      const sessionId = 'test-session';
      const agentId = 'writer-001';
      const mockRecord = {
        type: 'request',
        message: 'test message',
        timestamp: '2026-01-29T10:00:00Z',
      };
      const mockJsonl = JSON.stringify(mockRecord);

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents/${agentId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.records).toHaveLength(1);
      expect(response.body.records[0]).toEqual(mockRecord);
    });

    it('should parse multiple JSONL lines correctly', async () => {
      // Arrange
      const sessionId = 'test-session';
      const agentId = 'analyzer-001';
      const mockRecord1 = {
        type: 'request',
        message: 'first message',
        timestamp: '2026-01-29T10:00:00Z',
      };
      const mockRecord2 = {
        type: 'response',
        message: 'second message',
        timestamp: '2026-01-29T10:00:01Z',
      };
      const mockJsonl = `${JSON.stringify(mockRecord1)}\n${JSON.stringify(mockRecord2)}`;

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents/${agentId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.records).toHaveLength(2);
      expect(response.body.records[0]).toEqual(mockRecord1);
      expect(response.body.records[1]).toEqual(mockRecord2);
    });

    it('should handle empty JSONL file', async () => {
      // Arrange
      const sessionId = 'test-session';
      const agentId = 'empty-agent';

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(''),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents/${agentId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.records).toEqual([]);
    });

    it('should return 404 when subagent does not exist', async () => {
      // Arrange
      const sessionId = 'test-session';
      const agentId = 'nonexistent-agent';

      mockSend.mockRejectedValue({
        name: 'NoSuchKey',
        message: 'The specified key does not exist.',
        $metadata: {
          httpStatusCode: 404,
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents/${agentId}`);

      // Assert
      expect(response.status).toBe(404);
    });

    it('should return error message when subagent not found', async () => {
      // Arrange
      const sessionId = 'test-session';
      const agentId = 'nonexistent-agent';

      mockSend.mockRejectedValue({
        name: 'NoSuchKey',
        message: 'The specified key does not exist.',
        $metadata: {
          httpStatusCode: 404,
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents/${agentId}`);

      // Assert
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should return 500 when S3 service is unavailable', async () => {
      // Arrange
      const sessionId = 'test-session';
      const agentId = 'analyzer-001';

      mockSend.mockRejectedValue(new Error('S3 service unavailable'));

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents/${agentId}`);

      // Assert
      expect(response.status).toBe(500);
    });

    it('should return error message when S3 fails', async () => {
      // Arrange
      const sessionId = 'test-session';
      const agentId = 'analyzer-001';

      mockSend.mockRejectedValue(new Error('S3 service unavailable'));

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents/${agentId}`);

      // Assert
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should return 500 when S3 access is denied', async () => {
      // Arrange
      const sessionId = 'test-session';
      const agentId = 'analyzer-001';

      mockSend.mockRejectedValue({
        name: 'AccessDenied',
        message: 'Access Denied',
        $metadata: {
          httpStatusCode: 403,
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents/${agentId}`);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should call GetObjectCommand with correct parameters', async () => {
      // Arrange
      const sessionId = 'test-session-123';
      const agentId = 'analyzer-001';
      const mockJsonl = '{"type":"request","message":"test","timestamp":"2026-01-29T10:00:00Z"}';

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      await request(app).get(`/api/transcripts/${sessionId}/subagents/${agentId}`);

      // Assert
      expect(MockGetObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: `${sessionId}/subagents/agent-${agentId}.jsonl`,
      });
    });

    it('should handle JSONL with blank lines', async () => {
      // Arrange
      const sessionId = 'test-session';
      const agentId = 'analyzer-001';
      const mockRecord1 = {
        type: 'request',
        message: 'first',
        timestamp: '2026-01-29T10:00:00Z',
      };
      const mockRecord2 = {
        type: 'response',
        message: 'second',
        timestamp: '2026-01-29T10:00:01Z',
      };
      const mockJsonl = `${JSON.stringify(mockRecord1)}\n\n${JSON.stringify(mockRecord2)}\n`;

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents/${agentId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.records).toHaveLength(2);
      expect(response.body.records[0]).toEqual(mockRecord1);
      expect(response.body.records[1]).toEqual(mockRecord2);
    });

    it('should handle large JSONL files efficiently', async () => {
      // Arrange
      const sessionId = 'large-session';
      const agentId = 'analyzer-001';
      const mockRecords = Array.from({ length: 100 }, (_, i) => ({
        type: 'request',
        message: `Message ${i}`,
        timestamp: `2026-01-29T10:00:${String(i).padStart(2, '0')}Z`,
      }));
      const mockJsonl = mockRecords.map((r) => JSON.stringify(r)).join('\n');

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents/${agentId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.records).toHaveLength(100);
    });

    it('should preserve record structure with nested objects', async () => {
      // Arrange
      const sessionId = 'nested-session';
      const agentId = 'analyzer-001';
      const mockRecord = {
        type: 'request',
        message: {
          content: 'test',
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
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents/${agentId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.records).toHaveLength(1);
      expect(response.body.records[0]).toEqual(mockRecord);
    });

    it('should handle network timeout errors gracefully', async () => {
      // Arrange
      const sessionId = 'test-session';
      const agentId = 'analyzer-001';

      mockSend.mockRejectedValue({
        name: 'TimeoutError',
        message: 'Request timed out',
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents/${agentId}`);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle invalid JSON lines gracefully', async () => {
      // Arrange
      const sessionId = 'invalid-json-session';
      const agentId = 'analyzer-001';
      const mockJsonl = '{"type":"request","message":"valid","timestamp":"2026-01-29T10:00:00Z"}\n{invalid json}\n{"type":"response","message":"valid","timestamp":"2026-01-29T10:00:01Z"}';

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents/${agentId}`);

      // Assert
      // Should either return 500 or skip invalid lines and return valid ones
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        // If it skips invalid lines, should have 2 valid records
        expect(response.body.records.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should handle agentIds with special characters', async () => {
      // Arrange
      const sessionId = 'test-session';
      const agentId = 'agent-with-dashes_and_underscores.123';
      const mockJsonl = '{"type":"request","message":"test","timestamp":"2026-01-29T10:00:00Z"}';

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents/${agentId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.agentId).toBe(agentId);
    });

    it('should not accept POST requests', async () => {
      // Arrange & Act
      const response = await request(app)
        .post('/api/transcripts/test-session/subagents/analyzer-001')
        .send({ data: 'test' });

      // Assert
      expect(response.status).toBe(404);
    });

    it('should not accept PUT requests', async () => {
      // Arrange & Act
      const response = await request(app)
        .put('/api/transcripts/test-session/subagents/analyzer-001')
        .send({ data: 'test' });

      // Assert
      expect(response.status).toBe(404);
    });

    it('should not accept DELETE requests', async () => {
      // Arrange & Act
      const response = await request(app).delete('/api/transcripts/test-session/subagents/analyzer-001');

      // Assert
      expect(response.status).toBe(404);
    });

    it('should return proper CORS headers', async () => {
      // Arrange
      const sessionId = 'test-session';
      const agentId = 'analyzer-001';
      const mockJsonl = '{"type":"request","message":"test","timestamp":"2026-01-29T10:00:00Z"}';

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const response = await request(app).get(`/api/transcripts/${sessionId}/subagents/${agentId}`);

      // Assert
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
