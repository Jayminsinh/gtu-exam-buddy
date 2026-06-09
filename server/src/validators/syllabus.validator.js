/**
 * @file Syllabus Request Validators
 * @description Defines Zod validation schemas for uploading and updating
 *              academic syllabi.
 */

import { z } from 'zod';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const syllabusBaseRules = {
  subject: z
    .string({ required_error: 'Subject ID reference is required' })
    .regex(objectIdPattern, { message: 'Invalid Subject ID reference format' }),

  academicYear: z
    .string({ required_error: 'Academic year is required' })
    .trim()
    .min(4, { message: 'Academic year string must be at least 4 characters long' })
    .max(15, { message: 'Academic year string cannot exceed 15 characters' })
    .regex(/^\d{4}-\d{2,4}$/, {
      message: 'Academic year format must match "2025-26" or "2025-2026"',
    }),

  version: z
    .string({ required_error: 'Version is required' })
    .trim()
    .min(1, { message: 'Version cannot be empty' })
    .max(10, { message: 'Version cannot exceed 10 characters' }),
};

/**
 * Validation schema for Uploading a new Syllabus.
 * All base fields are strictly required.
 */
export const uploadSyllabusSchema = z.object(syllabusBaseRules);

/**
 * Validation schema for Updating an existing Syllabus's metadata.
 * All base fields are optional.
 */
export const updateSyllabusSchema = z.object(syllabusBaseRules).partial();
