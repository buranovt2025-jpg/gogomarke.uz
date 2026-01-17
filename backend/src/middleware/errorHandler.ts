import { Request, Response, NextFunction } from 'express';
import { AppError as NewAppError, ErrorCode, ErrorMessages } from '../utils/errorCodes';

// Legacy AppError for backwards compatibility
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: ErrorCode;
  details?: Record<string, unknown>;

  constructor(message: string, statusCode: number, code?: ErrorCode, details?: Record<string, unknown>) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError | NewAppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error with request context
  console.error('Error:', {
    message: err.message,
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  // Handle NewAppError (from errorCodes.ts)
  if (err instanceof NewAppError) {
    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  // Handle legacy AppError
  if (err instanceof AppError) {
    const response: Record<string, unknown> = {
      success: false,
      error: err.message,
    };
    if (err.code) {
      response.code = err.code;
    }
    if (err.details) {
      response.details = err.details;
    }
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    res.status(400).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: ErrorMessages[ErrorCode.VALIDATION_ERROR],
        details: (err as unknown as { errors: Array<{ message: string; path: string }> }).errors.map((e) => ({
          field: e.path,
          message: e.message,
        })),
      },
    });
    return;
  }

  // Handle Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    res.status(409).json({
      success: false,
      error: {
        code: ErrorCode.ALREADY_EXISTS,
        message: ErrorMessages[ErrorCode.ALREADY_EXISTS],
      },
    });
    return;
  }

  // Handle Sequelize database errors
  if (err.name === 'SequelizeDatabaseError') {
    res.status(500).json({
      success: false,
      error: {
        code: ErrorCode.DATABASE_ERROR,
        message: process.env.NODE_ENV === 'production' 
          ? ErrorMessages[ErrorCode.DATABASE_ERROR]
          : err.message,
      },
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: {
        code: ErrorCode.INVALID_TOKEN,
        message: ErrorMessages[ErrorCode.INVALID_TOKEN],
      },
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        code: ErrorCode.TOKEN_EXPIRED,
        message: ErrorMessages[ErrorCode.TOKEN_EXPIRED],
      },
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: process.env.NODE_ENV === 'production' 
        ? ErrorMessages[ErrorCode.INTERNAL_ERROR]
        : err.message,
    },
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      code: ErrorCode.NOT_FOUND,
      message: `Route ${req.originalUrl} not found`,
    },
  });
};
