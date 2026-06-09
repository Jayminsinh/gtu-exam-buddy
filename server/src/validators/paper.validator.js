/**
 * @file Question Paper Request Validators
 * @description Defines schemas using Zod to validate payloads when uploading
 *              or updating GTU question papers.
 */

import { z } from 'zod';

const currentYear = new Date().getFullYear();

// Base validation rules reused across schemas
const paperBaseRules = {
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(3, { message: 'Title must be at least 3 characters long' })
    .max(100, { message: 'Title cannot exceed 100 characters' }),

  subject: z
    .string({ required_error: 'Subject name or code is required' })
    .trim()
    .min(2, { message: 'Subject must be at least 2 characters' })
    .max(100, { message: 'Subject cannot exceed 100 characters' }),

  semester: z
    .number({ required_error: 'Semester is required' })
    .int()
    .min(1, { message: 'Semester must be between 1 and 8' })
    .max(8, { message: 'Semester must be between 1 and 8' }),

  branch: z
    .string({ required_error: 'Branch is required' })
    .trim()
    .min(2, { message: 'Branch name must be at least 2 characters' })
    .max(100, { message: 'Branch name cannot exceed 100 characters' }),

  year: z
    .number({ required_error: 'Year is required' })
    .int()
    .min(2000, { message: 'Year must be 2000 or later' })
    .max(currentYear, { message: `Year cannot be later than the current year (${currentYear})` }),

  examType: z.enum(['winter', 'summer', 'remedial'], {
    errorMap: () => ({ message: 'Exam type must be either winter, summer, or remedial' }),
  }),
};

/**
 * Validation schema for Uploading a new Question Paper.
 * All base fields are strictly required.
 */
export const uploadPaperSchema = z.object(paperBaseRules);

/**
 * Validation schema for Updating an existing Question Paper.
 * All base fields are optional, but if provided, must meet their standard validation.
 */
export const updatePaperSchema = z.object(paperBaseRules).partial();
