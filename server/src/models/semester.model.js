/**
 * @file Semester Model Schema
 * @description Defines the Mongoose database schema for Semesters (1 to 8).
 *              Each semester belongs to a specific Branch.
 */

import mongoose from 'mongoose';

const semesterSchema = new mongoose.Schema(
  {
    number: {
      type: Number,
      required: [true, 'Semester number is required'],
      min: [1, 'Semester number must be between 1 and 8'],
      max: [8, 'Semester number must be between 1 and 8'],
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch reference is required'],
      index: true, // Speeds up search queries for semesters belonging to a branch
    },
    isActive: {
      type: Boolean,
      default: true, // Allows disabling a semester's display dynamically
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// ──────────────────────────────────────────────
// Indexes & Constraints
// ──────────────────────────────────────────────

// Compound Unique Index: Ensures that a single branch cannot have duplicate semester entries
// (e.g. branch "Computer Engineering" can only have exactly one "Semester 5" record)
semesterSchema.index({ branch: 1, number: 1 }, { unique: true });

const Semester = mongoose.model('Semester', semesterSchema);

export default Semester;
