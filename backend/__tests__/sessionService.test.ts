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

import { ListObjectsV2Command } from '@aws-sdk/client-s3';

describe('Session Service', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    process.env.TRANSCRIPT_BUCKET = 'test-bucket';
    process.env.AWS_REGION = 'ap-northeast-2';

    // Reset mocks
    mockSend.mockReset();
    MockS3Client.mockClear();
    MockListObjectsV2Command.mockClear();
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('listSessions', () => {
    it('should return empty array when no .jsonl files exist', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        Contents: [],
      });
      const { listSessions } = await import('../src/services/sessionService');

      // Act
      const result = await listSessions();

      // Assert
      expect(result).toEqual([]);
      expect(MockListObjectsV2Command).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Prefix: '',
      });
    });

    it('should return array with session id and lastModified when .jsonl files exist', async () => {
      // Arrange
      const mockDate1 = new Date('2026-01-27T10:00:00Z');
      const mockDate2 = new Date('2026-01-27T09:00:00Z');

      mockSend.mockResolvedValue({
        Contents: [
          { Key: 'abc123.jsonl', LastModified: mockDate1 },
          { Key: 'def456.jsonl', LastModified: mockDate2 },
        ],
      });
      const { listSessions } = await import('../src/services/sessionService');

      // Act
      const result = await listSessions();

      // Assert
      expect(result).toEqual([
        { id: 'abc123', lastModified: mockDate1.toISOString() },
        { id: 'def456', lastModified: mockDate2.toISOString() },
      ]);
    });

    it('should sort sessions by lastModified in descending order (newest first)', async () => {
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
      const { listSessions } = await import('../src/services/sessionService');

      // Act
      const result = await listSessions();

      // Assert
      expect(result).toEqual([
        { id: 'new', lastModified: newDate.toISOString() },
        { id: 'middle', lastModified: middleDate.toISOString() },
        { id: 'old', lastModified: oldDate.toISOString() },
      ]);
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
      const { listSessions } = await import('../src/services/sessionService');

      // Act
      const result = await listSessions();

      // Assert
      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { id: 'session1', lastModified: mockDate.toISOString() },
        { id: 'session2', lastModified: mockDate.toISOString() },
      ]);
    });

    it('should filter out files in subdirectories', async () => {
      // Arrange
      const mockDate = new Date('2026-01-27T10:00:00Z');

      mockSend.mockResolvedValue({
        Contents: [
          { Key: 'session1.jsonl', LastModified: mockDate },
          { Key: 'archive/old.jsonl', LastModified: mockDate },
          { Key: 'backup/session2.jsonl', LastModified: mockDate },
        ],
      });
      const { listSessions } = await import('../src/services/sessionService');

      // Act
      const result = await listSessions();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('session1');
    });

    it('should handle files without LastModified field', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        Contents: [
          { Key: 'session1.jsonl', LastModified: new Date('2026-01-27T10:00:00Z') },
          { Key: 'session2.jsonl' }, // Missing LastModified
        ],
      });
      const { listSessions } = await import('../src/services/sessionService');

      // Act
      const result = await listSessions();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('session1');
    });

    it('should handle files without Key field', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        Contents: [
          { Key: 'session1.jsonl', LastModified: new Date('2026-01-27T10:00:00Z') },
          { LastModified: new Date('2026-01-27T10:00:00Z') }, // Missing Key
        ],
      });
      const { listSessions } = await import('../src/services/sessionService');

      // Act
      const result = await listSessions();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('session1');
    });

    it('should throw error when S3 ListObjectsV2 fails', async () => {
      // Arrange
      const mockError = new Error('S3 service unavailable');
      mockSend.mockRejectedValue(mockError);
      const { listSessions } = await import('../src/services/sessionService');

      // Act & Assert
      await expect(listSessions()).rejects.toThrow('S3 service unavailable');
    });

    it('should handle S3 access denied error', async () => {
      // Arrange
      mockSend.mockRejectedValue({
        name: 'AccessDenied',
        message: 'Access Denied',
        $metadata: {
          httpStatusCode: 403,
        },
      });
      const { listSessions } = await import('../src/services/sessionService');

      // Act & Assert
      await expect(listSessions()).rejects.toMatchObject({
        name: 'AccessDenied',
      });
    });

    it('should handle S3 bucket not found error', async () => {
      // Arrange
      mockSend.mockRejectedValue({
        name: 'NoSuchBucket',
        message: 'The specified bucket does not exist',
        $metadata: {
          httpStatusCode: 404,
        },
      });
      const { listSessions } = await import('../src/services/sessionService');

      // Act & Assert
      await expect(listSessions()).rejects.toMatchObject({
        name: 'NoSuchBucket',
      });
    });

    it('should call ListObjectsV2Command with correct bucket name', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        Contents: [],
      });
      const { listSessions } = await import('../src/services/sessionService');

      // Act
      await listSessions();

      // Assert
      expect(MockListObjectsV2Command).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Prefix: '',
      });
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle undefined Contents in S3 response', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        // No Contents field
      });
      const { listSessions } = await import('../src/services/sessionService');

      // Act
      const result = await listSessions();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle null Contents in S3 response', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        Contents: null,
      });
      const { listSessions } = await import('../src/services/sessionService');

      // Act
      const result = await listSessions();

      // Assert
      expect(result).toEqual([]);
    });

    it('should correctly extract session id from filename', async () => {
      // Arrange
      const mockDate = new Date('2026-01-27T10:00:00Z');

      mockSend.mockResolvedValue({
        Contents: [
          { Key: 'simple.jsonl', LastModified: mockDate },
          { Key: 'with-dash.jsonl', LastModified: mockDate },
          { Key: 'with_underscore.jsonl', LastModified: mockDate },
          { Key: 'with.dots.jsonl', LastModified: mockDate },
        ],
      });
      const { listSessions } = await import('../src/services/sessionService');

      // Act
      const result = await listSessions();

      // Assert
      expect(result).toHaveLength(4);
      expect(result.map((s) => s.id)).toEqual([
        'simple',
        'with-dash',
        'with_underscore',
        'with.dots',
      ]);
    });

    it('should handle very long filenames', async () => {
      // Arrange
      const longId = 'a'.repeat(200);
      const mockDate = new Date('2026-01-27T10:00:00Z');

      mockSend.mockResolvedValue({
        Contents: [{ Key: `${longId}.jsonl`, LastModified: mockDate }],
      });
      const { listSessions } = await import('../src/services/sessionService');

      // Act
      const result = await listSessions();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(longId);
    });

    it('should preserve ISO 8601 format in lastModified field', async () => {
      // Arrange
      const mockDate = new Date('2026-01-27T10:30:45.123Z');

      mockSend.mockResolvedValue({
        Contents: [{ Key: 'session.jsonl', LastModified: mockDate }],
      });
      const { listSessions } = await import('../src/services/sessionService');

      // Act
      const result = await listSessions();

      // Assert
      expect(result[0].lastModified).toBe('2026-01-27T10:30:45.123Z');
      const parsedDate = new Date(result[0].lastModified);
      expect(parsedDate.toISOString()).toBe('2026-01-27T10:30:45.123Z');
    });

    it('should handle empty bucket (Contents is empty array)', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        Contents: [],
      });
      const { listSessions } = await import('../src/services/sessionService');

      // Act
      const result = await listSessions();

      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Session Service Type Safety', () => {
    it('should return array of objects with id and lastModified properties', async () => {
      // Arrange
      const mockDate = new Date('2026-01-27T10:00:00Z');

      mockSend.mockResolvedValue({
        Contents: [{ Key: 'session.jsonl', LastModified: mockDate }],
      });
      const { listSessions } = await import('../src/services/sessionService');

      // Act
      const result = await listSessions();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('lastModified');
      expect(typeof result[0].id).toBe('string');
      expect(typeof result[0].lastModified).toBe('string');
    });
  });
});
