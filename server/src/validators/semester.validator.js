/**
 * @file Semester Request Validators
 * @description Defines Zod validation schemas for creating and updating
 *              academic semesters (1–8) linked to a specific branch.
 */

import { z } from 'zod';

// MongoDB ObjectId Regex validation pattern (24-char hex string)
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const semesterBaseRules = {
  number: z
    .number({ required_error: 'Semester number is required' })
    .int({ message: 'Semester number must be an integer' })
    .min(1, { message: 'Semester number must be at least 1' })
    .max(8, { message: 'Semester number cannot exceed 8' }),

  branch: z
    .string({ required_error: 'Branch ID reference is required' })
    .regex(objectIdPattern, { message: 'Invalid Branch ID reference format' }),

  isActive: z.boolean().optional(),
};

/**
 * Validation schema for Creating a new Semester.
 * Both `number` and `branch` are strictly required.
 */
export const createSemesterSchema = z.object(semesterBaseRules);

/**
 * Validation schema for Updating an existing Semester.
 * All fields are optional but must pass validations if provided.
 */
export const updateSemesterSchema = z.object(semesterBaseRules).partial();
