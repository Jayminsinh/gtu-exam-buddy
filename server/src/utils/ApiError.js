/**
 * @file Custom API Error Class
 * @description Extends the native Error class to carry HTTP-specific metadata
 *              (status code, structured validation errors, operational flag).
 *              Every error thrown in controllers / services should be an ApiError
 *              so the global error-handling middleware can format a consistent
 *              JSON response.
 *
 * Usage:
 *   import ApiError from '../utils/ApiError.js';
 *
 *   // Simple — just a status code and message
 *   throw new ApiError(404, 'User not found');
 *
 *   // With validation errors array (e.g. from Zod)
 *   throw new ApiError(400, 'Validation failed', [
 *     { field: 'email', message: 'Invalid email format' },
 *     { field: 'password', message: 'Must be at least 8 characters' },
 *   ]);
 */

class ApiError extends Error {
  /**
   * @param {number}   statusCode - HTTP status code (e.g. 400, 401, 404, 500)
   * @param {string}   message    - Human-readable error description
   * @param {Array}    errors     - Optional array of granular error details
   *                                (validation issues, field-level messages, etc.)
   * @param {string}   stack      - Optional pre-existing stack trace to preserve
   */
  constructor(
    statusCode,
    message = 'Something went wrong',
    errors = [],
    stack = ''
  ) {
    // Call the parent Error constructor with the message
    super(message);

    // ── Public properties attached to every ApiError instance ──

    /** HTTP status code sent in the response */
    this.statusCode = statusCode;

    /**
     * Always false for errors.
     * The client can rely on this field to distinguish success from failure
     * without parsing status codes.
     */
    this.success = false;

    /**
     * Array of detailed error objects.
     * Useful for returning multiple validation errors at once so the client
     * can highlight every invalid field, not just the first one.
     *
     * Example:
     *   [{ field: 'email', message: 'Required' }]
     */
    this.errors = errors;

    /**
     * Operational vs. Programmer errors:
     *
     * • Operational  (isOperational = true)  → expected failures like invalid
     *   input, missing resource, expired token. Safe to send to the client.
     *
     * • Programmer   (isOperational = false) → bugs, null-pointer errors,
     *   unhandled edge cases. Should be logged and masked with a generic
     *   "Internal Server Error" message.
     *
     * The global error handler uses this flag to decide what to expose.
     */
    this.isOperational = true;

    // ── Stack trace handling ──

    if (stack) {
      // If a stack trace was explicitly passed, keep it as-is.
      // This is useful when wrapping a lower-level error.
      this.stack = stack;
    } else {
      // Capture a fresh stack trace, excluding this constructor frame
      // so the trace points to where `new ApiError(...)` was called.
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // ──────────────────────────────────────────────
  // Static factory methods
  // ──────────────────────────────────────────────
  // These provide a more readable, self-documenting way to create
  // common error types without memorising status codes.

  /** 400 — Bad Request (invalid input, missing fields) */
  static badRequest(message = 'Bad request', errors = []) {
    return new ApiError(400, message, errors);
  }

  /** 401 — Unauthorized (missing or invalid token) */
  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message);
  }

  /** 403 — Forbidden (valid token but insufficient permissions) */
  static forbidden(message = 'Access denied') {
    return new ApiError(403, message);
  }

  /** 404 — Not Found */
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  /** 409 — Conflict (e.g. duplicate email on registration) */
  static conflict(message = 'Resource already exists') {
    return new ApiError(409, message);
  }

  /** 422 — Unprocessable Entity (semantic validation failure) */
  static unprocessable(message = 'Validation failed', errors = []) {
    return new ApiError(422, message, errors);
  }

  /** 429 — Too Many Requests (rate-limit exceeded) */
  static tooManyRequests(message = 'Too many requests, please try again later') {
    return new ApiError(429, message);
  }

  /** 500 — Internal Server Error (catch-all for unexpected failures) */
  static internal(message = 'Internal server error') {
    return new ApiError(500, message);
  }
}

export default ApiError;
