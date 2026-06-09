/**
 * @file Branch Model Schema
 * @description Defines the Mongoose database schema for academic departments
 *              (e.g., Computer Engineering, Information Technology).
 */

import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
      index: true, // Speeds up search and filter queries by name
    },
    code: {
      type: String,
      required: [true, 'Branch code is required'],
      unique: true, // Prevents duplicate branches (e.g. "CE", "IT")
      uppercase: true,
      trim: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true, // Allows admins to soft-delete or disable a branch
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Branch = mongoose.model('Branch', branchSchema);

export default Branch;
