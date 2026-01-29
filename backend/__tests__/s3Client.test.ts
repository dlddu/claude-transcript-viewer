// Mock @aws-sdk/client-s3 before any imports
const mockSend = jest.fn();
const MockS3Client = jest.fn().mockImplementation(() => ({
  send: mockSend,
  config: {
    region: jest.fn().mockResolvedValue('ap-northeast-2'),
  },
}));
const MockHeadBucketCommand = jest.fn().mockImplementation((input) => ({ input }));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: MockS3Client,
  HeadBucketCommand: MockHeadBucketCommand,
}));

import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

describe('S3Client Service', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Reset mocks
    mockSend.mockReset();
    MockS3Client.mockClear();
    MockHeadBucketCommand.mockClear();
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('S3Client initialization', () => {
    it('should create S3Client with TRANSCRIPT_BUCKET environment variable', async () => {
      // Arrange
      process.env.TRANSCRIPT_BUCKET = 'test-bucket';
      process.env.AWS_REGION = 'us-east-1';

      // Act
      const { s3Client } = await import('../src/services/s3Client');

      // Assert
      expect(s3Client).toBeDefined();
      expect(s3Client.send).toBeDefined();
      expect(MockS3Client).toHaveBeenCalled();
    });

    it('should use default region ap-northeast-2 when AWS_REGION is not set', async () => {
      // Arrange
      process.env.TRANSCRIPT_BUCKET = 'test-bucket';
      delete process.env.AWS_REGION;

      // Mock the config.region function
      const mockRegion = jest.fn().mockResolvedValue('ap-northeast-2');
      MockS3Client.mockImplementation(() => ({
        send: mockSend,
        config: {
          region: mockRegion,
        },
      }));

      // Act
      const { s3Client } = await import('../src/services/s3Client');
      const config = s3Client.config;

      // Assert
      expect(s3Client).toBeDefined();
      expect(s3Client.send).toBeDefined();
      expect(MockS3Client).toHaveBeenCalledWith({
        region: 'ap-northeast-2',
      });
    });

    it('should use AWS_REGION when provided', async () => {
      // Arrange
      process.env.TRANSCRIPT_BUCKET = 'test-bucket';
      process.env.AWS_REGION = 'us-west-2';

      // Mock the config.region function
      const mockRegion = jest.fn().mockResolvedValue('us-west-2');
      MockS3Client.mockImplementation(() => ({
        send: mockSend,
        config: {
          region: mockRegion,
        },
      }));

      // Act
      const { s3Client } = await import('../src/services/s3Client');

      // Assert
      expect(MockS3Client).toHaveBeenCalledWith({
        region: 'us-west-2',
      });
    });

    it('should throw error when TRANSCRIPT_BUCKET is not set', async () => {
      // Arrange
      delete process.env.TRANSCRIPT_BUCKET;
      process.env.AWS_REGION = 'us-east-1';

      // Act & Assert
      await expect(async () => {
        await import('../src/services/s3Client');
      }).rejects.toThrow('TRANSCRIPT_BUCKET environment variable is required');
    });

    it('should throw error when TRANSCRIPT_BUCKET is empty string', async () => {
      // Arrange
      process.env.TRANSCRIPT_BUCKET = '';
      process.env.AWS_REGION = 'us-east-1';

      // Act & Assert
      await expect(async () => {
        await import('../src/services/s3Client');
      }).rejects.toThrow('TRANSCRIPT_BUCKET environment variable is required');
    });

    it('should export BUCKET_NAME constant', async () => {
      // Arrange
      const expectedBucketName = 'my-transcript-bucket';
      process.env.TRANSCRIPT_BUCKET = expectedBucketName;

      // Act
      const { BUCKET_NAME } = await import('../src/services/s3Client');

      // Assert
      expect(BUCKET_NAME).toBe(expectedBucketName);
    });
  });

  describe('testS3Connection', () => {
    beforeEach(() => {
      process.env.TRANSCRIPT_BUCKET = 'test-bucket';
      process.env.AWS_REGION = 'ap-northeast-2';
    });

    it('should call HeadBucketCommand with correct bucket name', async () => {
      // Arrange
      mockSend.mockResolvedValue({});
      const { testS3Connection } = await import('../src/services/s3Client');

      // Act
      await testS3Connection();

      // Assert
      expect(MockHeadBucketCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
      });
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should return true when bucket is accessible', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        $metadata: {
          httpStatusCode: 200,
        },
      });
      const { testS3Connection } = await import('../src/services/s3Client');

      // Act
      const result = await testS3Connection();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when bucket does not exist', async () => {
      // Arrange
      mockSend.mockRejectedValue({
        name: 'NotFound',
        message: 'The specified bucket does not exist',
        $metadata: {
          httpStatusCode: 404,
        },
      });
      const { testS3Connection } = await import('../src/services/s3Client');

      // Act
      const result = await testS3Connection();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when access is denied', async () => {
      // Arrange
      mockSend.mockRejectedValue({
        name: 'Forbidden',
        message: 'Access Denied',
        $metadata: {
          httpStatusCode: 403,
        },
      });
      const { testS3Connection } = await import('../src/services/s3Client');

      // Act
      const result = await testS3Connection();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      // Arrange
      mockSend.mockRejectedValue({
        name: 'NetworkError',
        message: 'Network connection failed',
      });
      const { testS3Connection } = await import('../src/services/s3Client');

      // Act
      const result = await testS3Connection();

      // Assert
      expect(result).toBe(false);
    });

    it('should call HeadBucketCommand exactly once', async () => {
      // Arrange
      mockSend.mockResolvedValue({});
      const { testS3Connection } = await import('../src/services/s3Client');

      // Act
      await testS3Connection();

      // Assert
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('S3Client singleton pattern', () => {
    it('should return the same instance on multiple imports', async () => {
      // Arrange
      process.env.TRANSCRIPT_BUCKET = 'test-bucket';
      process.env.AWS_REGION = 'ap-northeast-2';

      // Act
      const module1 = await import('../src/services/s3Client');
      const module2 = await import('../src/services/s3Client');

      // Assert
      expect(module1.s3Client).toBe(module2.s3Client);
    });
  });

  describe('Edge cases', () => {
    it('should handle TRANSCRIPT_BUCKET with whitespace', async () => {
      // Arrange
      process.env.TRANSCRIPT_BUCKET = '  test-bucket  ';
      process.env.AWS_REGION = 'ap-northeast-2';

      // Act
      const { BUCKET_NAME } = await import('../src/services/s3Client');

      // Assert
      expect(BUCKET_NAME).toBe('test-bucket');
    });

    it('should handle AWS_REGION with whitespace', async () => {
      // Arrange
      process.env.TRANSCRIPT_BUCKET = 'test-bucket';
      process.env.AWS_REGION = '  us-east-1  ';

      // Act
      const { s3Client } = await import('../src/services/s3Client');

      // Assert
      expect(MockS3Client).toHaveBeenCalledWith({
        region: 'us-east-1',
      });
    });

    it('should handle TRANSCRIPT_BUCKET with special characters', async () => {
      // Arrange
      const bucketName = 'test-bucket-123.backup';
      process.env.TRANSCRIPT_BUCKET = bucketName;
      process.env.AWS_REGION = 'ap-northeast-2';

      // Act
      const { BUCKET_NAME } = await import('../src/services/s3Client');

      // Assert
      expect(BUCKET_NAME).toBe(bucketName);
    });
  });
});
