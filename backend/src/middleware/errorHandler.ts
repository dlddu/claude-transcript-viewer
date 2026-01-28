import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types/transcript';

interface S3Error extends Error {
  name: string;
  $metadata?: {
    httpStatusCode?: number;
  };
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const s3Error = err as S3Error;

  let statusCode = 500;
  let errorType = 'InternalServerError';
  let message = 'An internal server error occurred';

  if (s3Error.name === 'NoSuchKey') {
    statusCode = 404;
    errorType = 'NotFound';
    message = 'The requested resource was not found';
  } else if (s3Error.name === 'AccessDenied') {
    statusCode = 500;
    errorType = 'InternalServerError';
    message = 'An internal server error occurred';
  } else if (s3Error.$metadata?.httpStatusCode) {
    statusCode = s3Error.$metadata.httpStatusCode;
  }

  const errorResponse: ApiError = {
    error: errorType,
    message: process.env.NODE_ENV === 'production' ? message : err.message || message,
    statusCode,
  };

  res.status(statusCode).json(errorResponse);
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
