/**
 * @file Subject Request Validators
 * @description Defines Zod validation schemas for creating and updating
 *              academic subjects.
 */

import { z } from 'zod';

// MongoDB ObjectId Regex validation pattern (24-char hex string)
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const subjectBaseRules = {
  name: z
    .string({ required_error: 'Subject name is required' })
    .trim()
    .min(2, { message: 'Subject name must be at least 2 characters long' })
    .max(100, { message: 'Subject name cannot exceed 100 characters' }),

  code: z
    .string({ required_error: 'Subject code is required' })
    .trim()
    .min(3, { message: 'Subject code must be at least 3 characters long' })
    .max(15, { message: 'Subject code cannot exceed 15 characters' }),

  branch: z
    .string({ required_error: 'Branch ID reference is required' })
    .regex(objectIdPattern, { message: 'Invalid Branch ID reference format' }),

  semester: z
    .string({ required_error: 'Semester ID reference is required' })
    .regex(objectIdPattern, { message: 'Invalid Semester ID reference format' }),

  credits: z
    .number({ required_error: 'Credits count is required' })
    .int({ message: 'Credits must be an integer' })
    .positive({ message: 'Credits must be a positive number' })
    .min(1, { message: 'Credits must be at least 1' })
    .max(10, { message: 'Credits cannot exceed 10' }),

  isActive: z.boolean().optional(),
};

/**
 * Validation schema for Creating a new Subject.
 * All base fields are strictly required.
 */
export const createSubjectSchema = z.object(subjectBaseRules);

/**
 * Validation schema for Updating an existing Subject.
 * All fields are optional but must pass validations if provided.
 */
export const updateSubjectSchema = z.object(subjectBaseRules).partial();
