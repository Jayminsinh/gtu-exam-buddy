/**
 * @file Express Application Entrypoint
 * @description Creates the Express app, registers global security, parsing,
 *              logging, and optimization middlewares, mounts application routes,
 *              and configures global error handling.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';

import config from './config/index.js';
import { API } from './utils/constants.js';
import rootRouter from './routes/index.js';
import errorHandler from './middlewares/error.middleware.js';
import ApiError from './utils/ApiError.js';

// Initialize the Express app
const app = express();

// ──────────────────────────────────────────────
// 1. Global Pre-Routing Middlewares
// ──────────────────────────────────────────────

// Helmet: Secure the Express app by setting various HTTP headers
app.use(helmet());

// CORS: Enable Cross-Origin Resource Sharing
app.use(
  cors({
    origin: config.client.url,
    credentials: true, // Allow session cookies/JWT tokens to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Morgan: HTTP request logging
// 'dev' format provides colored, concise logs for local development.
// 'combined' is standard Apache style logs for production.
const logFormat = config.server.isProd ? 'combined' : 'dev';
app.use(morgan(logFormat));

// Body Parsers: Parse incoming request bodies
// Limit body sizes to prevent Denial of Service (DoS) attacks
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Cookie Parser: Parse Cookie headers and populate req.cookies
app.use(cookieParser());

// Compression: Compress response bodies for all requests (Gzip compression)
app.use(compression());

// Global Rate Limiting: Limit repeated requests to public APIs
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

// Apply rate limiter to all API endpoints
app.use('/api', limiter);

// ──────────────────────────────────────────────
// 2. Route Mounting
// ──────────────────────────────────────────────

// Serve uploaded files statically (if any exist in the uploads folder)
app.use('/uploads', express.static('uploads'));

// Mount central router registry under the configured prefix (e.g. /api/v1)
app.use(API.PREFIX, rootRouter);

// ──────────────────────────────────────────────
// 3. Fallback Route (404 Not Found)
// ──────────────────────────────────────────────

// Catch any routes that aren't defined above and throw a 404 ApiError
app.use((req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.originalUrl}`));
});

// ──────────────────────────────────────────────
// 4. Global Post-Routing Error Handler
// ──────────────────────────────────────────────

// Express global error handler middleware (must be registered last)
app.use(errorHandler);

export default app;
