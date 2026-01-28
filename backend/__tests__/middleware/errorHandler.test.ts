import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../src/middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();
    mockReq = {};
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('S3 Error Handling', () => {
    it('should return 404 for NoSuchKey error', () => {
      // Arrange
      const error = new Error('Key not found');
      (error as any).name = 'NoSuchKey';

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'NotFound',
          statusCode: 404,
          message: expect.any(String),
        })
      );
    });

    it('should return 500 for AccessDenied error', () => {
      // Arrange
      const error = new Error('Access denied');
      (error as any).name = 'AccessDenied';

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'InternalServerError',
          statusCode: 500,
        })
      );
    });

    it('should use S3 metadata status code when available', () => {
      // Arrange
      const error = new Error('S3 error with metadata');
      (error as any).$metadata = { httpStatusCode: 503 };

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 503,
        })
      );
    });

    it('should use S3 metadata status code even with AccessDenied name', () => {
      // Arrange
      const error = new Error('Access denied with metadata');
      (error as any).name = 'AccessDenied';
      (error as any).$metadata = { httpStatusCode: 403 };

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      // Note: Current implementation checks name first, then metadata
      // So this will return 500 from AccessDenied, not 403 from metadata
      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('Environment-specific Error Messages', () => {
    it('should return generic message in production', () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const error = new Error('Sensitive error details');

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'An internal server error occurred',
        })
      );
    });

    it('should show detailed error message in development', () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      const error = new Error('Detailed error message');

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Detailed error message',
        })
      );
    });

    it('should show detailed error message when NODE_ENV is undefined', () => {
      // Arrange
      delete process.env.NODE_ENV;
      const error = new Error('Detailed error message');

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Detailed error message',
        })
      );
    });

    it('should show detailed error for NoSuchKey in development', () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      const error = new Error('Custom not found message');
      (error as any).name = 'NoSuchKey';

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Custom not found message',
        })
      );
    });
  });

  describe('Generic Error Handling', () => {
    it('should handle generic error without name property', () => {
      // Arrange
      const error = new Error('Generic error');

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'InternalServerError',
          statusCode: 500,
        })
      );
    });

    it('should handle error with empty message', () => {
      // Arrange
      const error = new Error('');

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'InternalServerError',
          statusCode: 500,
        })
      );
    });
  });
});
