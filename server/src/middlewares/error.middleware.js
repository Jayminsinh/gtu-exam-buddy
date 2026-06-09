/**
 * @file Global Error Handling Middleware
 * @description Intercepts all errors thrown in the application, standardizes them
 *              into ApiError format, and sends a uniform JSON response to the client.
 *              Protects sensitive server internals by hiding stack traces in production.
 *
 * Usage:
 *   Mounted as the last middleware in src/app.js:
 *   app.use(errorHandler);
 */

import config from '../config/index.js';
import ApiError from '../utils/ApiError.js';
import { MESSAGES } from '../utils/constants.js';

/**
 * Global Express error handling middleware.
 * Note: Must have exactly 4 arguments (err, req, res, next) for Express to recognize it as an error handler.
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // 1. Convert non-ApiError instances into a standardized ApiError
  if (!(error instanceof ApiError)) {
    // Determine the status code and default message
    const statusCode = error.statusCode || 500;
    const message = error.message || MESSAGES.INTERNAL_ERROR;

    // Build the new ApiError preserving the original stack trace
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  // 2. Prepare JSON response payload
  const response = {
    success: error.success,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    // Provide stack trace only in development/testing for security
    ...(config.server.isProd ? {} : { stack: error.stack }),
  };

  // 3. Log the error internally
  // In production, you would use a logger library (like Winston or Bunyan),
  // but console.error is standard for basic setups.
  if (config.server.isProd) {
    // Avoid logging full stack traces or client-operational errors in simple console output,
    // but log internal server errors (500) so developers can debug production issues.
    if (error.statusCode === 500) {
      console.error(`[INTERNAL SERVER ERROR] ${error.message}`, error.stack);
    }
  } else {
    // In dev, log the full error stack trace for debugging
    console.error(error);
  }

  // 4. Send the standardized JSON response
  return res.status(error.statusCode).json(response);
};

export default errorHandler;
