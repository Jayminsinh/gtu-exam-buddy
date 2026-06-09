/**
 * @file Async Handler Utility
 * @description A higher-order function that wraps async Express route handlers
 *              (controllers) so that any rejected promise is automatically
 *              forwarded to Express's `next()` — which hands it off to the
 *              global error-handling middleware.
 *
 * WHY THIS EXISTS:
 *   Without it, every single controller would need its own try/catch:
 *
 *     // ❌  Repetitive — imagine 50 controllers like this
 *     const getUser = async (req, res, next) => {
 *       try {
 *         const user = await User.findById(req.params.id);
 *         res.status(200).json(new ApiResponse(200, user, 'Fetched'));
 *       } catch (err) {
 *         next(err);
 *       }
 *     };
 *
 *   With asyncHandler the same controller becomes:
 *
 *     // ✅  Clean — error forwarding is handled for you
 *     const getUser = asyncHandler(async (req, res) => {
 *       const user = await User.findById(req.params.id);
 *       res.status(200).json(new ApiResponse(200, user, 'Fetched'));
 *     });
 *
 * Usage:
 *   import asyncHandler from '../utils/asyncHandler.js';
 *
 *   router.get('/users/:id', asyncHandler(getUser));
 *   // or inline:
 *   router.get('/users/:id', asyncHandler(async (req, res) => { ... }));
 */

/**
 * Wraps an async function and returns a new function that Express can use
 * as a route handler. If the wrapped function throws or returns a rejected
 * promise, the error is caught and passed to `next()`.
 *
 * @param {Function} fn - An async Express route handler: (req, res, next) => Promise
 * @returns {Function}  - A standard Express middleware: (req, res, next) => void
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    // Promise.resolve() ensures this works even if `fn` accidentally
    // returns a non-promise value (defensive programming).
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
