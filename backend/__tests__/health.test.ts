// Mock @aws-sdk/client-s3 before any imports
const mockSend = jest.fn();
const MockS3Client = jest.fn().mockImplementation(() => ({
  send: mockSend,
  config: {
    region: jest.fn().mockResolvedValue('ap-northeast-2'),
  },
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: MockS3Client,
  ListObjectsV2Command: jest.fn(),
  HeadBucketCommand: jest.fn(),
}));

import request from 'supertest';
import { app } from '../src/app';

describe('Health Check Endpoint', () => {
  describe('GET /health', () => {
    it('should return 200 OK', async () => {
      // Arrange & Act
      const response = await request(app).get('/health');

      // Assert
      expect(response.status).toBe(200);
    });

    it('should return JSON content type', async () => {
      // Arrange & Act
      const response = await request(app).get('/health');

      // Assert
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should return status "ok"', async () => {
      // Arrange & Act
      const response = await request(app).get('/health');

      // Assert
      expect(response.body).toHaveProperty('status', 'ok');
    });

    it('should return timestamp', async () => {
      // Arrange & Act
      const response = await request(app).get('/health');

      // Assert
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('string');
    });

    it('should return valid ISO 8601 timestamp', async () => {
      // Arrange & Act
      const response = await request(app).get('/health');

      // Assert
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });
  });
});
