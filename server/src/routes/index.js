/**
 * @file Central Routing Registry
 * @description Configures and registers all API sub-routes (auth, papers, subjects, syllabus)
 *              under a central Express Router. Includes a basic health-check endpoint.
 *
 * Usage:
 *   Mounted in src/app.js:
 *   import rootRouter from './routes/index.js';
 *   app.use('/api/v1', rootRouter);
 */

import { Router } from 'express';
import ApiResponse from '../utils/ApiResponse.js';

// Import sub-routing modules
import authRouter from './auth.routes.js';
import paperRouter from './paper.routes.js';
import subjectRouter from './subject.routes.js';
import syllabusRouter from './syllabus.routes.js';
import branchRouter from './branch.routes.js';
import semesterRouter from './semester.routes.js';
import aiRouter from './ai.routes.js';


const router = Router();

// ──────────────────────────────────────────────
// 1. Health Check Endpoint
// ──────────────────────────────────────────────

/**
 * @route   GET /api/v1/health
 * @desc    Liveness/readiness probe to check if the server is up and running.
 * @access  Public
 */
router.get('/health', (req, res) => {
  const healthInfo = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'UP',
  };

  return res
    .status(200)
    .json(new ApiResponse(200, healthInfo, 'Server is running smoothly.'));
});

// ──────────────────────────────────────────────
// 2. Sub-Routes Mounting
// ──────────────────────────────────────────────

// Auth endpoints (register, login, logout, refresh-token, me) -> /api/v1/auth
router.use('/auth', authRouter);

// Question Paper endpoints (CRUD, search, upload) -> /api/v1/papers
router.use('/papers', paperRouter);

// Subject endpoints (CRUD, list by department) -> /api/v1/subjects
router.use('/subjects', subjectRouter);

// Syllabus endpoints (CRUD, latest version tracker) -> /api/v1/syllabus
router.use('/syllabus', syllabusRouter);

// Branch endpoints (CRUD) -> /api/v1/branch
router.use('/branch', branchRouter);

// Semester endpoints (CRUD) -> /api/v1/semester
router.use('/semester', semesterRouter);

// AI Cognitive endpoints (blueprint compiling, etc.) -> /api/v1/ai
router.use('/ai', aiRouter);


export default router;
