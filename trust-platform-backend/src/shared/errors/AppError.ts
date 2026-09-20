/**
 * Base application error class.
 * All domain and application errors extend this class.
 * Provides structured error responses for the API.
 */
export abstract class AppError extends Error {
  /** HTTP status code for this error */
  abstract readonly statusCode: number;
  /** Machine-readable error code */
  abstract readonly code: string;
  /** Whether this is an expected, operational error (vs a programmer bug) */
  abstract readonly isOperational: boolean;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serializes the error for API response.
   * @returns Structured error object
   */
  toJSON(): Record<string, unknown> {
    return {
      error: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

/**
 * Resource not found error (404).
 */
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND';
  readonly isOperational = true;

  /**
   * @param entity - The type of entity that was not found
   * @param id - The identifier that was looked up
   */
  constructor(entity: string, id: string) {
    super(`${entity} with ID '${id}' not found`);
  }
}

/**
 * Validation error for invalid input (400).
 */
export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;

  constructor(message: string) {
    super(message);
  }
}

/**
 * Unauthorized access error (401).
 */
export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  readonly code = 'UNAUTHORIZED';
  readonly isOperational = true;

  constructor(message: string = 'Authentication required') {
    super(message);
  }
}

/**
 * Forbidden access error (403).
 */
export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly code = 'FORBIDDEN';
  readonly isOperational = true;

  constructor(message: string = 'Insufficient permissions') {
    super(message);
  }
}

/**
 * Conflict error for duplicate operations (409).
 */
export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = 'CONFLICT';
  readonly isOperational = true;

  constructor(message: string) {
    super(message);
  }
}

/**
 * Concurrency error when optimistic locking fails (409).
 */
export class ConcurrencyError extends AppError {
  readonly statusCode = 409;
  readonly code = 'CONCURRENCY_CONFLICT';
  readonly isOperational = true;

  constructor(message: string) {
    super(message);
  }
}

/**
 * Illegal state transition error for state machines (422).
 */
export class IllegalStateTransitionError extends AppError {
  readonly statusCode = 422;
  readonly code = 'ILLEGAL_STATE_TRANSITION';
  readonly isOperational = true;

  constructor(from: string, to: string) {
    super(`Cannot transition from '${from}' to '${to}'`);
  }
}

/**
 * Insufficient funds error for wallet operations (422).
 */
export class InsufficientFundsError extends AppError {
  readonly statusCode = 422;
  readonly code = 'INSUFFICIENT_FUNDS';
  readonly isOperational = true;

  /**
   * @param available - Current available balance in paise
   * @param required - Required amount in paise
   */
  constructor(available: number, required: number) {
    super(
      `Insufficient funds: available ${available} paise, required ${required} paise`,
    );
  }
}

/**
 * Invalid amount error for monetary operations (422).
 */
export class InvalidAmountError extends AppError {
  readonly statusCode = 422;
  readonly code = 'INVALID_AMOUNT';
  readonly isOperational = true;

  constructor(amount: number) {
    super(`Invalid amount: ${amount}. Amount must be a positive integer (paise)`);
  }
}

/**
 * Missing idempotency key error (400).
 */
export class MissingIdempotencyKeyError extends AppError {
  readonly statusCode = 400;
  readonly code = 'MISSING_IDEMPOTENCY_KEY';
  readonly isOperational = true;

  constructor() {
    super('Idempotency-Key header is required for mutation requests');
  }
}

/**
 * Database operation error (500).
 */
export class DatabaseError extends AppError {
  readonly statusCode = 500;
  readonly code = 'DATABASE_ERROR';
  readonly isOperational = false;

  /**
   * @param operation - The database operation that failed
   * @param cause - The underlying error from the database driver
   */
  constructor(operation: string, cause: unknown) {
    super(`Database error during '${operation}': ${String(cause)}`);
  }
}

/**
 * External service error (502).
 */
export class ExternalServiceError extends AppError {
  readonly statusCode = 502;
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  readonly isOperational = true;

  /**
   * @param service - Name of the external service
   * @param message - Error description
   */
  constructor(service: string, message: string) {
    super(`External service '${service}' error: ${message}`);
  }
}
