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

// Secure HTTP headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? true : config.client.url,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// HTTP request logging
const logFormat = config.server.isProd ? 'combined' : 'dev';
app.use(morgan(logFormat));

// Parse body payloads with size limitations
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Parse request cookies
app.use(cookieParser());

// Response compression
app.use(compression());

// Rate limiting for public APIs
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use('/api', limiter);

// Serve static assets from uploads folder
app.use('/uploads', express.static('uploads'));

// Central routing registry prefix
app.use(API.PREFIX, rootRouter);

// Fallback 404 handler for undefined routes
app.use((req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.originalUrl}`));
});

// Central error handling middleware
app.use(errorHandler);

export default app;
