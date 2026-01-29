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

import { listSubagents, getSubagent } from '../src/services/subagentService';

describe('Subagent Service', () => {
  beforeEach(() => {
    // Reset mocks
    mockSend.mockReset();
    MockS3Client.mockClear();
    MockListObjectsV2Command.mockClear();
    MockGetObjectCommand.mockClear();
  });

  describe('listSubagents', () => {
    it('should return empty array when no subagents exist', async () => {
      // Arrange
      const sessionId = 'empty-session';

      mockSend.mockResolvedValue({
        Contents: [],
      });

      // Act
      const result = await listSubagents(sessionId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when Contents is undefined', async () => {
      // Arrange
      const sessionId = 'no-contents-session';

      mockSend.mockResolvedValue({});

      // Act
      const result = await listSubagents(sessionId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should call ListObjectsV2Command with correct parameters', async () => {
      // Arrange
      const sessionId = 'test-session-123';

      mockSend.mockResolvedValue({
        Contents: [],
      });

      // Act
      await listSubagents(sessionId);

      // Assert
      expect(MockListObjectsV2Command).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Prefix: `${sessionId}/subagents/`,
      });
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
      const result = await listSubagents(sessionId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].agentId).toBe('analyzer-001');
    });

    it('should extract type from first JSONL line', async () => {
      // Arrange
      const sessionId = 'test-session';
      const mockSubagentData = '{"type":"test-writer","message":"test","timestamp":"2026-01-29T10:00:00Z"}\n{"type":"other","timestamp":"2026-01-29T10:00:01Z"}';

      mockSend
        .mockResolvedValueOnce({
          Contents: [
            { Key: `${sessionId}/subagents/agent-writer-001.jsonl` },
          ],
        })
        .mockResolvedValueOnce({
          Body: {
            transformToString: jest.fn().mockResolvedValue(mockSubagentData),
          },
        });

      // Act
      const result = await listSubagents(sessionId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('test-writer');
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
      const result = await listSubagents(sessionId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].agentId).toBe('writer-001');
    });

    it('should return multiple subagents with correct agentId and type', async () => {
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
      const result = await listSubagents(sessionId);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ agentId: 'analyzer-001', type: 'codebase-analyzer' });
      expect(result[1]).toEqual({ agentId: 'writer-002', type: 'test-writer' });
      expect(result[2]).toEqual({ agentId: 'implementer-003', type: 'code-implementer' });
    });

    it('should filter out files without Key property', async () => {
      // Arrange
      const sessionId = 'test-session';
      const mockSubagentData = '{"type":"test-writer","timestamp":"2026-01-29T10:00:00Z"}';

      mockSend
        .mockResolvedValueOnce({
          Contents: [
            { Key: `${sessionId}/subagents/agent-writer-001.jsonl` },
            { Key: undefined },
            { Key: null },
          ],
        })
        .mockResolvedValueOnce({
          Body: {
            transformToString: jest.fn().mockResolvedValue(mockSubagentData),
          },
        });

      // Act
      const result = await listSubagents(sessionId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].agentId).toBe('writer-001');
    });

    it('should throw error when S3 service is unavailable', async () => {
      // Arrange
      const sessionId = 'test-session';

      mockSend.mockRejectedValue(new Error('S3 service unavailable'));

      // Act & Assert
      await expect(listSubagents(sessionId)).rejects.toThrow('S3 service unavailable');
    });

    it('should throw error when S3 access is denied', async () => {
      // Arrange
      const sessionId = 'test-session';

      mockSend.mockRejectedValue({
        name: 'AccessDenied',
        message: 'Access Denied',
      });

      // Act & Assert
      await expect(listSubagents(sessionId)).rejects.toMatchObject({
        name: 'AccessDenied',
      });
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

      // Act & Assert
      // Should either skip the file or throw error
      await expect(listSubagents(sessionId)).rejects.toThrow();
    });

    it('should handle invalid JSON in first line', async () => {
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

      // Act & Assert
      await expect(listSubagents(sessionId)).rejects.toThrow();
    });

    it('should handle files with missing type field', async () => {
      // Arrange
      const sessionId = 'test-session';
      const mockSubagentData = '{"message":"test","timestamp":"2026-01-29T10:00:00Z"}';

      mockSend
        .mockResolvedValueOnce({
          Contents: [
            { Key: `${sessionId}/subagents/agent-notype-001.jsonl` },
          ],
        })
        .mockResolvedValueOnce({
          Body: {
            transformToString: jest.fn().mockResolvedValue(mockSubagentData),
          },
        });

      // Act & Assert
      // Should either handle gracefully or throw error
      await expect(listSubagents(sessionId)).rejects.toThrow();
    });

    it('should handle agentIds with special characters', async () => {
      // Arrange
      const sessionId = 'test-session';
      const mockSubagentData = '{"type":"custom-agent","timestamp":"2026-01-29T10:00:00Z"}';

      mockSend
        .mockResolvedValueOnce({
          Contents: [
            { Key: `${sessionId}/subagents/agent-custom_agent-001.jsonl` },
          ],
        })
        .mockResolvedValueOnce({
          Body: {
            transformToString: jest.fn().mockResolvedValue(mockSubagentData),
          },
        });

      // Act
      const result = await listSubagents(sessionId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].agentId).toBe('custom_agent-001');
    });

    it('should call GetObjectCommand for each subagent file', async () => {
      // Arrange
      const sessionId = 'test-session';
      const mockData1 = '{"type":"analyzer","timestamp":"2026-01-29T10:00:00Z"}';
      const mockData2 = '{"type":"writer","timestamp":"2026-01-29T10:00:01Z"}';

      mockSend
        .mockResolvedValueOnce({
          Contents: [
            { Key: `${sessionId}/subagents/agent-analyzer-001.jsonl` },
            { Key: `${sessionId}/subagents/agent-writer-002.jsonl` },
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
        });

      // Act
      await listSubagents(sessionId);

      // Assert
      expect(MockGetObjectCommand).toHaveBeenCalledTimes(2);
      expect(MockGetObjectCommand).toHaveBeenNthCalledWith(1, {
        Bucket: 'test-bucket',
        Key: `${sessionId}/subagents/agent-analyzer-001.jsonl`,
      });
      expect(MockGetObjectCommand).toHaveBeenNthCalledWith(2, {
        Bucket: 'test-bucket',
        Key: `${sessionId}/subagents/agent-writer-002.jsonl`,
      });
    });
  });

  describe('getSubagent', () => {
    it('should return empty array when JSONL file is empty', async () => {
      // Arrange
      const sessionId = 'test-session';
      const agentId = 'empty-agent';

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(''),
        },
      });

      // Act
      const result = await getSubagent(sessionId, agentId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when Body is undefined', async () => {
      // Arrange
      const sessionId = 'test-session';
      const agentId = 'no-body-agent';

      mockSend.mockResolvedValue({});

      // Act
      const result = await getSubagent(sessionId, agentId);

      // Assert
      expect(result).toEqual([]);
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
      await getSubagent(sessionId, agentId);

      // Assert
      expect(MockGetObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: `${sessionId}/subagents/agent-${agentId}.jsonl`,
      });
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
      const result = await getSubagent(sessionId, agentId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockRecord);
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
      const result = await getSubagent(sessionId, agentId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockRecord1);
      expect(result[1]).toEqual(mockRecord2);
    });

    it('should skip blank lines in JSONL', async () => {
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
      const mockJsonl = `${JSON.stringify(mockRecord1)}\n\n\n${JSON.stringify(mockRecord2)}\n`;

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const result = await getSubagent(sessionId, agentId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockRecord1);
      expect(result[1]).toEqual(mockRecord2);
    });

    it('should throw error when JSON line is invalid', async () => {
      // Arrange
      const sessionId = 'invalid-json-session';
      const agentId = 'analyzer-001';
      const mockJsonl = '{"type":"request","message":"valid","timestamp":"2026-01-29T10:00:00Z"}\n{invalid json}';

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act & Assert
      await expect(getSubagent(sessionId, agentId)).rejects.toThrow();
    });

    it('should throw error when subagent does not exist', async () => {
      // Arrange
      const sessionId = 'test-session';
      const agentId = 'nonexistent-agent';

      mockSend.mockRejectedValue({
        name: 'NoSuchKey',
        message: 'The specified key does not exist.',
      });

      // Act & Assert
      await expect(getSubagent(sessionId, agentId)).rejects.toMatchObject({
        name: 'NoSuchKey',
      });
    });

    it('should throw error when S3 service is unavailable', async () => {
      // Arrange
      const sessionId = 'test-session';
      const agentId = 'analyzer-001';

      mockSend.mockRejectedValue(new Error('S3 service unavailable'));

      // Act & Assert
      await expect(getSubagent(sessionId, agentId)).rejects.toThrow('S3 service unavailable');
    });

    it('should throw error when S3 access is denied', async () => {
      // Arrange
      const sessionId = 'test-session';
      const agentId = 'analyzer-001';

      mockSend.mockRejectedValue({
        name: 'AccessDenied',
        message: 'Access Denied',
      });

      // Act & Assert
      await expect(getSubagent(sessionId, agentId)).rejects.toMatchObject({
        name: 'AccessDenied',
      });
    });

    it('should preserve nested object structure in records', async () => {
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
      const result = await getSubagent(sessionId, agentId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockRecord);
      expect(result[0].message.metadata).toEqual({
        source: 'web',
        version: '1.0',
        tags: ['important', 'urgent'],
      });
    });

    it('should handle large number of records efficiently', async () => {
      // Arrange
      const sessionId = 'large-session';
      const agentId = 'analyzer-001';
      const mockRecords = Array.from({ length: 1000 }, (_, i) => ({
        type: 'request',
        message: `Message ${i}`,
        timestamp: `2026-01-29T10:00:${String(i % 60).padStart(2, '0')}Z`,
      }));
      const mockJsonl = mockRecords.map((r) => JSON.stringify(r)).join('\n');

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const result = await getSubagent(sessionId, agentId);

      // Assert
      expect(result).toHaveLength(1000);
      expect(result[0].message).toBe('Message 0');
      expect(result[999].message).toBe('Message 999');
    });

    it('should handle records with all primitive types', async () => {
      // Arrange
      const sessionId = 'types-session';
      const agentId = 'analyzer-001';
      const mockRecord = {
        type: 'request',
        stringField: 'test',
        numberField: 42,
        booleanField: true,
        nullField: null,
        arrayField: [1, 2, 3],
        objectField: { key: 'value' },
        timestamp: '2026-01-29T10:00:00Z',
      };
      const mockJsonl = JSON.stringify(mockRecord);

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const result = await getSubagent(sessionId, agentId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockRecord);
      expect(typeof result[0].stringField).toBe('string');
      expect(typeof result[0].numberField).toBe('number');
      expect(typeof result[0].booleanField).toBe('boolean');
      expect(result[0].nullField).toBeNull();
      expect(Array.isArray(result[0].arrayField)).toBe(true);
      expect(typeof result[0].objectField).toBe('object');
    });

    it('should handle Unicode characters in JSONL', async () => {
      // Arrange
      const sessionId = 'unicode-session';
      const agentId = 'analyzer-001';
      const mockRecord = {
        type: 'request',
        message: 'Hello 世界 🌍',
        timestamp: '2026-01-29T10:00:00Z',
      };
      const mockJsonl = JSON.stringify(mockRecord);

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const result = await getSubagent(sessionId, agentId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].message).toBe('Hello 世界 🌍');
    });

    it('should handle records with dynamic fields', async () => {
      // Arrange
      const sessionId = 'dynamic-session';
      const agentId = 'analyzer-001';
      const mockRecord = {
        type: 'request',
        timestamp: '2026-01-29T10:00:00Z',
        customField1: 'value1',
        customField2: 'value2',
        nested: {
          customField3: 'value3',
        },
      };
      const mockJsonl = JSON.stringify(mockRecord);

      mockSend.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(mockJsonl),
        },
      });

      // Act
      const result = await getSubagent(sessionId, agentId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockRecord);
    });
  });
});
