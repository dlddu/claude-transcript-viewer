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
  ListObjectsV2Command: jest.fn(),
}));

import { s3Client, BUCKET_NAME, testS3Connection } from '../src/services/s3Client';

describe('S3Client Service', () => {
  beforeEach(() => {
    // Reset mocks
    mockSend.mockReset();
    MockHeadBucketCommand.mockClear();
  });

  describe('S3Client initialization', () => {
    it('should create S3Client instance', () => {
      // Assert
      expect(s3Client).toBeDefined();
      expect(s3Client.send).toBeDefined();
      // S3Client is created once when the module is first loaded (in setup.ts)
      // So we just verify that s3Client has the expected properties
      expect(typeof s3Client.send).toBe('function');
    });

    it('should export BUCKET_NAME constant', () => {
      // Assert
      expect(BUCKET_NAME).toBe('test-bucket');
    });
  });

  describe('testS3Connection', () => {
    it('should call HeadBucketCommand with correct bucket name', async () => {
      // Arrange
      mockSend.mockResolvedValue({});

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

      // Act
      const result = await testS3Connection();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when bucket does not exist', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSend.mockRejectedValue({
        name: 'NotFound',
        message: 'The specified bucket does not exist',
        $metadata: {
          httpStatusCode: 404,
        },
      });

      // Act
      const result = await testS3Connection();

      // Assert
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'S3 connection test failed:',
        expect.any(Object)
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should return false when access is denied', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSend.mockRejectedValue({
        name: 'Forbidden',
        message: 'Access Denied',
        $metadata: {
          httpStatusCode: 403,
        },
      });

      // Act
      const result = await testS3Connection();

      // Assert
      expect(result).toBe(false);

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should return false on network error', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSend.mockRejectedValue({
        name: 'NetworkError',
        message: 'Network connection failed',
      });

      // Act
      const result = await testS3Connection();

      // Assert
      expect(result).toBe(false);

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });

});
