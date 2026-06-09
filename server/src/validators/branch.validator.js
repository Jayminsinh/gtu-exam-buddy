/**
 * @file Branch Request Validators
 * @description Defines Zod validation schemas for creating and updating
 *              academic departments (branches).
 */

import { z } from 'zod';

const branchBaseRules = {
  name: z
    .string({ required_error: 'Branch name is required' })
    .trim()
    .min(2, { message: 'Branch name must be at least 2 characters long' })
    .max(100, { message: 'Branch name cannot exceed 100 characters' }),

  code: z
    .string({ required_error: 'Branch code is required' })
    .trim()
    .min(2, { message: 'Branch code must be at least 2 characters long' })
    .max(10, { message: 'Branch code cannot exceed 10 characters' }),

  isActive: z.boolean().optional(),
};

/**
 * Validation schema for Creating a new Branch.
 * All base fields are strictly required.
 */
export const createBranchSchema = z.object(branchBaseRules);

/**
 * Validation schema for Updating an existing Branch's metadata.
 * All fields are optional.
 */
export const updateBranchSchema = z.object(branchBaseRules).partial();
