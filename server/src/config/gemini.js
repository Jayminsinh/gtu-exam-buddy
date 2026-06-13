/**
 * @file Google Gemini AI Configuration
 * @description Configures the Google Generative AI (Gemini) client and exports
 *              a ready-to-use model instance.
 *
 *              This file handles CONFIGURATION ONLY — no prompt templates,
 *              no parsing logic, no business rules. Those belong in a
 *              dedicated service (e.g. services/geminiService.js).
 *
 * Usage:
 *   import { geminiModel } from './config/gemini.js';
 *
 *   const result = await geminiModel.generateContent('Explain recursion');
 *   const text   = result.response.text();
 *
 * Prerequisites:
 *   1. npm install @google/generative-ai
 *   2. Add the following to your .env:
 *        GEMINI_API_KEY=your_gemini_api_key
 *        GEMINI_MODEL=gemini-2.5-flash     (optional, defaults to gemini-2.5-flash)
 *
 * NOTE: These values are read directly from process.env because
 *       config/index.js doesn't include a gemini group yet.
 *       When config/index.js is updated in a future phase, switch
 *       the imports below to: import config from './index.js';
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// ──────────────────────────────────────────────
// Environment Variables
// ──────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// ──────────────────────────────────────────────
// Validate API Key (non-blocking warning)
// ──────────────────────────────────────────────
// Gemini is a later-phase feature. Missing the API key should warn —
// not crash — the server. This lets you develop other features first.

if (!GEMINI_API_KEY) {
  console.warn(
    '\n⚠️  Gemini API key is not configured.' +
      '\n   AI features will not work until you add this to your .env:' +
      '\n     GEMINI_API_KEY\n'
  );
}

// ──────────────────────────────────────────────
// Initialize Client & Model
// ──────────────────────────────────────────────

/**
 * GoogleGenerativeAI is the top-level client. You pass your API key once
 * and then request specific model instances from it.
 *
 * We pass an empty string when the key is missing so the import doesn't
 * throw at startup — the warning above already alerts the developer.
 * Any actual API call will fail with a clear auth error.
 */
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

/**
 * The model instance configured with a specific Gemini model.
 *
 * Available models (as of 2025):
 *   - gemini-2.0-flash   → legacy fast, cost-effective
 *   - gemini-2.5-pro     → most capable, best reasoning
 *   - gemini-2.5-flash   → balanced speed & quality (default)
 *
 * Change the default by setting GEMINI_MODEL in your .env.
 */
const geminiModel = genAI.getGenerativeModel({ model: GEMINI_MODEL });

// ──────────────────────────────────────────────
// Exports
// ──────────────────────────────────────────────

/** The top-level client — use if you need multiple model instances */
export { genAI };

/** Pre-configured model instance — use for most AI calls */
export { geminiModel };

/** Default export for convenience: import geminiModel from './config/gemini.js' */
export default geminiModel;
