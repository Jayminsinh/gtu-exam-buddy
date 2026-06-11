/**
 * @file User Model Schema & Methods
 * @description Defines the Mongoose database schema for users, implements pre-save
 *              hooks for password hashing, and attaches custom helper methods for
 *              password validation and JWT generation.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { USER_ROLES_LIST, DEFAULT_USER_ROLE } from '../utils/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxLength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // Speeds up search queries by email
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Prevents password from leaking in standard find/select queries
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLES_LIST,
        message: '{VALUE} is not a valid user role',
      },
      default: DEFAULT_USER_ROLE,
    },
    avatar: {
      type: String,
      default: '', // Placeholder or empty path
    },
    refreshToken: {
      type: String,
      select: false, // Prevents refresh tokens from being retrieved unless explicitly selected
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
  }
);

// ──────────────────────────────────────────────
// Pre-Save Middleware (Password Hashing)
// ──────────────────────────────────────────────

/**
 * Automatically hashes the user's password before saving it to the database.
 * Uses a standard 10 rounds of salting.
 */
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// ──────────────────────────────────────────────
// Instance Methods
// ──────────────────────────────────────────────

/**
 * Compares a plain text password with the user's hashed password.
 *
 * @param {string} candidatePassword - Plain text password from the login request
 * @returns {Promise<boolean>}       - True if passwords match, false otherwise
 */
userSchema.methods.isPasswordCorrect = async function (candidatePassword) {
  // Since password has select: false, this.password will only be defined
  // if explicitly selected in the query.
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Generates a short-lived access JWT token.
 *
 * @returns {string} - JWT access token
 */
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: this.role,
    },
    config.jwt.access.secret,
    {
      expiresIn: config.jwt.access.expiry,
    }
  );
};

/**
 * Generates a long-lived refresh JWT token.
 *
 * @returns {string} - JWT refresh token
 */
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    config.jwt.refresh.secret,
    {
      expiresIn: config.jwt.refresh.expiry,
    }
  );
};

const User = mongoose.model('User', userSchema);

export default User;
