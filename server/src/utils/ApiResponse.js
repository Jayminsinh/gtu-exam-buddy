/**
 * @file Standardized API Response Class
 * @description Provides a consistent shape for every successful JSON response
 *              sent by the server. Pairing this with ApiError ensures the client
 *              always receives a predictable structure — whether the request
 *              succeeded or failed.
 *
 * Response shape:
 *   {
 *     success: true,
 *     statusCode: 200,
 *     message: "User fetched successfully",
 *     data: { ... }
 *   }
 *
 * Usage:
 *   import ApiResponse from '../utils/ApiResponse.js';
 *
 *   // In a controller:
 *   res.status(200).json(new ApiResponse(200, user, 'User fetched successfully'));
 *
 *   // Created resource:
 *   res.status(201).json(new ApiResponse(201, newPost, 'Post created'));
 *
 *   // No content to return:
 *   res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
 */

class ApiResponse {
  /**
   * @param {number}       statusCode - HTTP status code (e.g. 200, 201, 204)
   * @param {Object|null}  data       - The payload to send back to the client
   *                                    (user object, list of items, null, etc.)
   * @param {string}       message    - Human-readable description of the result
   */
  constructor(statusCode, data, message = 'Success') {
    /** HTTP status code — mirrors the one set on the response */
    this.statusCode = statusCode;

    /**
     * The actual payload.
     * Keeping it under a `data` key means the client can always do:
     *   const { data } = await response.json();
     * regardless of what the data looks like.
     */
    this.data = data;

    /** Human-readable message for UI toasts, logs, debugging, etc. */
    this.message = message;

    /**
     * Derived automatically from the status code.
     * Any code in the 2xx range is considered successful.
     * The client can check `if (response.success)` without
     * manually comparing status codes.
     */
    this.success = statusCode >= 200 && statusCode < 300;
  }
}

export default ApiResponse;
