/**
 * Standardized error codes for GoGoMarket API
 */

export enum ErrorCode {
  // Authentication errors (1xxx)
  UNAUTHORIZED = 'E1001',
  INVALID_TOKEN = 'E1002',
  TOKEN_EXPIRED = 'E1003',
  FORBIDDEN = 'E1004',
  INVALID_CREDENTIALS = 'E1005',
  
  // Validation errors (2xxx)
  VALIDATION_ERROR = 'E2001',
  INVALID_INPUT = 'E2002',
  MISSING_FIELD = 'E2003',
  INVALID_FORMAT = 'E2004',
  
  // Resource errors (3xxx)
  NOT_FOUND = 'E3001',
  ALREADY_EXISTS = 'E3002',
  RESOURCE_CONFLICT = 'E3003',
  
  // Business logic errors (4xxx)
  INSUFFICIENT_STOCK = 'E4001',
  ORDER_NOT_MODIFIABLE = 'E4002',
  INVALID_ORDER_STATUS = 'E4003',
  INVALID_QR_CODE = 'E4004',
  QR_CODE_EXPIRED = 'E4005',
  PAYMENT_FAILED = 'E4006',
  CART_EMPTY = 'E4007',
  PRODUCT_UNAVAILABLE = 'E4008',
  
  // Server errors (5xxx)
  INTERNAL_ERROR = 'E5001',
  DATABASE_ERROR = 'E5002',
  EXTERNAL_SERVICE_ERROR = 'E5003',
}

export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.UNAUTHORIZED]: 'Authentication required',
  [ErrorCode.INVALID_TOKEN]: 'Invalid authentication token',
  [ErrorCode.TOKEN_EXPIRED]: 'Authentication token has expired',
  [ErrorCode.FORBIDDEN]: 'Access denied',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid credentials',
  
  [ErrorCode.VALIDATION_ERROR]: 'Validation error',
  [ErrorCode.INVALID_INPUT]: 'Invalid input provided',
  [ErrorCode.MISSING_FIELD]: 'Required field is missing',
  [ErrorCode.INVALID_FORMAT]: 'Invalid format',
  
  [ErrorCode.NOT_FOUND]: 'Resource not found',
  [ErrorCode.ALREADY_EXISTS]: 'Resource already exists',
  [ErrorCode.RESOURCE_CONFLICT]: 'Resource conflict',
  
  [ErrorCode.INSUFFICIENT_STOCK]: 'Insufficient stock',
  [ErrorCode.ORDER_NOT_MODIFIABLE]: 'Order cannot be modified',
  [ErrorCode.INVALID_ORDER_STATUS]: 'Invalid order status transition',
  [ErrorCode.INVALID_QR_CODE]: 'Invalid QR code',
  [ErrorCode.QR_CODE_EXPIRED]: 'QR code has expired',
  [ErrorCode.PAYMENT_FAILED]: 'Payment processing failed',
  [ErrorCode.CART_EMPTY]: 'Cart is empty',
  [ErrorCode.PRODUCT_UNAVAILABLE]: 'Product is unavailable',
  
  [ErrorCode.INTERNAL_ERROR]: 'Internal server error',
  [ErrorCode.DATABASE_ERROR]: 'Database error',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service error',
};

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message?: string,
    statusCode: number = 400,
    details?: Record<string, unknown>
  ) {
    super(message || ErrorMessages[code]);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

// Helper functions to create common errors
export const createNotFoundError = (resource: string) =>
  new AppError(ErrorCode.NOT_FOUND, `${resource} not found`, 404);

export const createUnauthorizedError = (message?: string) =>
  new AppError(ErrorCode.UNAUTHORIZED, message, 401);

export const createForbiddenError = (message?: string) =>
  new AppError(ErrorCode.FORBIDDEN, message, 403);

export const createValidationError = (message: string, details?: Record<string, unknown>) =>
  new AppError(ErrorCode.VALIDATION_ERROR, message, 400, details);

export const createConflictError = (message: string) =>
  new AppError(ErrorCode.RESOURCE_CONFLICT, message, 409);
