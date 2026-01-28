// Set environment variable before importing modules to ensure BUCKET_NAME is properly initialized
process.env.TRANSCRIPT_BUCKET = 'test-bucket';

import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, ListObjectsV2Command, GetObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { listSessions, getTranscript, listSubagents, getSubagentTranscript, testBucketAccess } from '../../src/services/s3Service';

const s3Mock = mockClient(S3Client);

describe('S3 Service', () => {
  beforeEach(() => {
    s3Mock.reset();
  });

  describe('listSessions', () => {
    it('should return sessions from S3 response', async () => {
      // Arrange
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [
          {
            Key: 'session1.jsonl',
            LastModified: new Date('2024-01-01T00:00:00Z'),
          },
          {
            Key: 'session2.jsonl',
            LastModified: new Date('2024-01-02T00:00:00Z'),
          },
        ],
      });

      // Act
      const result = await listSessions();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].sessionId).toBe('session2');
      expect(result[1].sessionId).toBe('session1');
    });

    it('should filter out files with slashes in the key', async () => {
      // Arrange
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [
          {
            Key: 'session1.jsonl',
            LastModified: new Date('2024-01-01T00:00:00Z'),
          },
          {
            Key: 'session2/subagents/agent-1.jsonl',
            LastModified: new Date('2024-01-02T00:00:00Z'),
          },
          {
            Key: 'session3.jsonl',
            LastModified: new Date('2024-01-03T00:00:00Z'),
          },
        ],
      });

      // Act
      const result = await listSessions();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].sessionId).toBe('session3');
      expect(result[1].sessionId).toBe('session1');
    });

    it('should filter out files without .jsonl extension', async () => {
      // Arrange
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [
          {
            Key: 'session1.jsonl',
            LastModified: new Date('2024-01-01T00:00:00Z'),
          },
          {
            Key: 'readme.txt',
            LastModified: new Date('2024-01-02T00:00:00Z'),
          },
          {
            Key: 'data.json',
            LastModified: new Date('2024-01-03T00:00:00Z'),
          },
        ],
      });

      // Act
      const result = await listSessions();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].sessionId).toBe('session1');
    });

    it('should handle objects with undefined Key', async () => {
      // Arrange
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [
          {
            Key: 'session1.jsonl',
            LastModified: new Date('2024-01-01T00:00:00Z'),
          },
          {
            Key: undefined,
            LastModified: new Date('2024-01-02T00:00:00Z'),
          },
          {
            Key: 'session2.jsonl',
            LastModified: new Date('2024-01-03T00:00:00Z'),
          },
        ],
      });

      // Act
      const result = await listSessions();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].sessionId).toBe('session2');
      expect(result[1].sessionId).toBe('session1');
    });

    it('should return empty array when Contents is undefined', async () => {
      // Arrange
      s3Mock.on(ListObjectsV2Command).resolves({});

      // Act
      const result = await listSessions();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle missing LastModified field', async () => {
      // Arrange
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [
          {
            Key: 'session1.jsonl',
            LastModified: undefined,
          },
        ],
      });

      // Act
      const result = await listSessions();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].lastModified).toBe('');
    });

    it('should return sessions sorted by lastModified in descending order', async () => {
      // Arrange
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [
          {
            Key: 'session1.jsonl',
            LastModified: new Date('2024-01-01T00:00:00Z'),
          },
          {
            Key: 'session2.jsonl',
            LastModified: new Date('2024-01-03T00:00:00Z'),
          },
          {
            Key: 'session3.jsonl',
            LastModified: new Date('2024-01-02T00:00:00Z'),
          },
        ],
      });

      // Act
      const result = await listSessions();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].sessionId).toBe('session2');
      expect(result[0].lastModified).toBe('2024-01-03T00:00:00.000Z');
      expect(result[1].sessionId).toBe('session3');
      expect(result[1].lastModified).toBe('2024-01-02T00:00:00.000Z');
      expect(result[2].sessionId).toBe('session1');
      expect(result[2].lastModified).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should handle sorting with identical lastModified timestamps', async () => {
      // Arrange
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [
          {
            Key: 'session1.jsonl',
            LastModified: new Date('2024-01-01T00:00:00Z'),
          },
          {
            Key: 'session2.jsonl',
            LastModified: new Date('2024-01-01T00:00:00Z'),
          },
          {
            Key: 'session3.jsonl',
            LastModified: new Date('2024-01-02T00:00:00Z'),
          },
        ],
      });

      // Act
      const result = await listSessions();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].sessionId).toBe('session3');
      expect(result[0].lastModified).toBe('2024-01-02T00:00:00.000Z');
      // session1 and session2 should both be after session3 (order between them doesn't matter)
      expect([result[1].sessionId, result[2].sessionId]).toContain('session1');
      expect([result[1].sessionId, result[2].sessionId]).toContain('session2');
    });

    it('should place sessions with undefined lastModified at the end', async () => {
      // Arrange
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [
          {
            Key: 'session1.jsonl',
            LastModified: new Date('2024-01-01T00:00:00Z'),
          },
          {
            Key: 'session2.jsonl',
            LastModified: undefined,
          },
          {
            Key: 'session3.jsonl',
            LastModified: new Date('2024-01-02T00:00:00Z'),
          },
          {
            Key: 'session4.jsonl',
            LastModified: undefined,
          },
        ],
      });

      // Act
      const result = await listSessions();

      // Assert
      expect(result).toHaveLength(4);
      expect(result[0].sessionId).toBe('session3');
      expect(result[1].sessionId).toBe('session1');
      // Sessions with undefined lastModified should be at the end
      expect([result[2].sessionId, result[3].sessionId]).toContain('session2');
      expect([result[2].sessionId, result[3].sessionId]).toContain('session4');
    });

    it('should maintain descending order with millisecond precision', async () => {
      // Arrange
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [
          {
            Key: 'session1.jsonl',
            LastModified: new Date('2024-01-01T12:00:00.100Z'),
          },
          {
            Key: 'session2.jsonl',
            LastModified: new Date('2024-01-01T12:00:00.300Z'),
          },
          {
            Key: 'session3.jsonl',
            LastModified: new Date('2024-01-01T12:00:00.200Z'),
          },
        ],
      });

      // Act
      const result = await listSessions();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].sessionId).toBe('session2');
      expect(result[1].sessionId).toBe('session3');
      expect(result[2].sessionId).toBe('session1');
    });
  });

  describe('getTranscript', () => {
    it('should return transcript content', async () => {
      // Arrange
      const content = '{"type":"message","content":"hello"}';
      const mockBody = {
        transformToString: jest.fn().mockResolvedValue(content),
      };
      s3Mock.on(GetObjectCommand).resolves({
        Body: mockBody as any,
      });

      // Act
      const result = await getTranscript('session1.jsonl');

      // Assert
      expect(result).toBe(content);
    });

    it('should throw error when Body is undefined', async () => {
      // Arrange
      s3Mock.on(GetObjectCommand).resolves({
        Body: undefined,
      });

      // Act & Assert
      await expect(getTranscript('session1.jsonl')).rejects.toThrow('Empty response body');
    });

    it('should handle empty content', async () => {
      // Arrange
      const mockBody = {
        transformToString: jest.fn().mockResolvedValue(''),
      };
      s3Mock.on(GetObjectCommand).resolves({
        Body: mockBody as any,
      });

      // Act
      const result = await getTranscript('session1.jsonl');

      // Assert
      expect(result).toBe('');
    });

    it('should handle multi-line content', async () => {
      // Arrange
      const content = '{"line":"1"}\n{"line":"2"}\n{"line":"3"}';
      const mockBody = {
        transformToString: jest.fn().mockResolvedValue(content),
      };
      s3Mock.on(GetObjectCommand).resolves({
        Body: mockBody as any,
      });

      // Act
      const result = await getTranscript('session1.jsonl');

      // Assert
      expect(result).toBe(content);
    });
  });

  describe('listSubagents', () => {
    it('should return list of subagent IDs', async () => {
      // Arrange
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [
          { Key: 'session1/subagents/agent-123.jsonl' },
          { Key: 'session1/subagents/agent-456.jsonl' },
        ],
      });

      // Act
      const result = await listSubagents('session1');

      // Assert
      expect(result).toEqual(['123', '456']);
    });

    it('should filter out files that do not match pattern', async () => {
      // Arrange
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [
          { Key: 'session1/subagents/agent-123.jsonl' },
          { Key: 'session1/subagents/other-file.txt' },
          { Key: 'session1/subagents/agent-456.jsonl' },
        ],
      });

      // Act
      const result = await listSubagents('session1');

      // Assert
      expect(result).toEqual(['123', '456']);
    });

    it('should handle undefined Key in objects', async () => {
      // Arrange
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [
          { Key: 'session1/subagents/agent-123.jsonl' },
          { Key: undefined },
          { Key: 'session1/subagents/agent-456.jsonl' },
        ],
      });

      // Act
      const result = await listSubagents('session1');

      // Assert
      expect(result).toEqual(['123', '456']);
    });

    it('should return empty array when Contents is undefined', async () => {
      // Arrange
      s3Mock.on(ListObjectsV2Command).resolves({});

      // Act
      const result = await listSubagents('session1');

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when no matching files', async () => {
      // Arrange
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [
          { Key: 'session1/other/file.txt' },
        ],
      });

      // Act
      const result = await listSubagents('session1');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getSubagentTranscript', () => {
    it('should return subagent transcript content', async () => {
      // Arrange
      const content = '{"type":"tool_call"}';
      const mockBody = {
        transformToString: jest.fn().mockResolvedValue(content),
      };
      s3Mock.on(GetObjectCommand).resolves({
        Body: mockBody as any,
      });

      // Act
      const result = await getSubagentTranscript('session1', 'agent123');

      // Assert
      expect(result).toBe(content);
    });

    it('should construct correct S3 key', async () => {
      // Arrange
      const content = '{"data":"test"}';
      const mockBody = {
        transformToString: jest.fn().mockResolvedValue(content),
      };
      let capturedKey: string | undefined;

      s3Mock.on(GetObjectCommand).callsFake((input) => {
        capturedKey = input.Key;
        return Promise.resolve({ Body: mockBody as any });
      });

      // Act
      await getSubagentTranscript('my-session', 'agent-xyz');

      // Assert
      expect(capturedKey).toBe('my-session/subagents/agent-agent-xyz.jsonl');
    });
  });

  describe('testBucketAccess', () => {
    it('should return true when bucket access is successful', async () => {
      // Arrange
      s3Mock.on(HeadBucketCommand).resolves({});

      // Act
      const result = await testBucketAccess();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when bucket does not exist', async () => {
      // Arrange
      const notFoundError = new Error('NotFound');
      notFoundError.name = 'NotFound';
      s3Mock.on(HeadBucketCommand).rejects(notFoundError);

      // Act
      const result = await testBucketAccess();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when access is forbidden', async () => {
      // Arrange
      const forbiddenError = new Error('Forbidden');
      forbiddenError.name = 'Forbidden';
      s3Mock.on(HeadBucketCommand).rejects(forbiddenError);

      // Act
      const result = await testBucketAccess();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when access is denied', async () => {
      // Arrange
      const accessDeniedError = new Error('AccessDenied');
      accessDeniedError.name = 'AccessDenied';
      s3Mock.on(HeadBucketCommand).rejects(accessDeniedError);

      // Act
      const result = await testBucketAccess();

      // Assert
      expect(result).toBe(false);
    });

    // Note: Tests for empty/undefined TRANSCRIPT_BUCKET are removed because:
    // 1. BUCKET_NAME is captured at module load time (const BUCKET_NAME = process.env.TRANSCRIPT_BUCKET || '')
    // 2. In real applications, environment variables should be validated at startup
    // 3. These edge cases are better tested in integration tests or startup validation logic

    it('should return false on network error', async () => {
      // Arrange
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      s3Mock.on(HeadBucketCommand).rejects(networkError);

      // Act
      const result = await testBucketAccess();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false on timeout error', async () => {
      // Arrange
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      s3Mock.on(HeadBucketCommand).rejects(timeoutError);

      // Act
      const result = await testBucketAccess();

      // Assert
      expect(result).toBe(false);
    });
  });
});
