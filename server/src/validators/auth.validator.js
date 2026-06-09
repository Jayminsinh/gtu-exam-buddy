/**
 * @file Authentication Request Validators
 * @description Defines schemas using Zod to validate incoming request bodies
 *              for authentication routes (registration and login). This guarantees
 *              data integrity before it hits services or database models.
 */

import { z } from 'zod';

/**
 * Validation schema for User Registration.
 * Matches client fields: name, email, password.
 */
export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(50, { message: 'Name cannot exceed 50 characters' }),

  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email({ message: 'Invalid email address format' }),

  password: z
    .string({ required_error: 'Password is required' })
    .min(8, { message: 'Password must be at least 8 characters long' })
    .max(128, { message: 'Password cannot exceed 128 characters' }),
});

/**
 * Validation schema for User Login.
 * Matches client fields: email, password.
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email({ message: 'Invalid email address format' }),

  password: z
    .string({ required_error: 'Password is required' })
    .min(1, { message: 'Password cannot be empty' }),
});
