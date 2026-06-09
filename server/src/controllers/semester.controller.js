/**
 * @file Semester Controller
 * @description Processes API endpoints for academic semesters. Reads client request inputs,
 *              invokes the semester service, and maps responses to standardized JSON.
 */

import semesterService from '../services/semester.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @route   POST /api/v1/semesters
 * @desc    Creates a new semester record for a branch.
 * @access  Private (Admin only)
 */
export const createSemester = asyncHandler(async (req, res) => {
  // Body validation is done by the createSemesterSchema middleware
  const semester = await semesterService.createSemester(req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, semester, 'Semester created successfully.'));
});

/**
 * @route   GET /api/v1/semesters
 * @desc    Retrieves a list of semesters (filterable by branch, sorted by number).
 * @access  Public
 */
export const getAllSemesters = asyncHandler(async (req, res) => {
  // Pass query criteria directly to the service for filtering/sorting
  const semesters = await semesterService.getAllSemesters(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, semesters, 'Semesters retrieved successfully.'));
});

/**
 * @route   GET /api/v1/semesters/:id
 * @desc    Retrieves detailed info about a single semester by ID.
 * @access  Public
 */
export const getSemesterById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const semester = await semesterService.getSemesterById(id);

  return res
    .status(200)
    .json(new ApiResponse(200, semester, 'Semester details retrieved.'));
});

/**
 * @route   PATCH /api/v1/semesters/:id
 * @desc    Updates an existing semester's information.
 * @access  Private (Admin only)
 */
export const updateSemester = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedSemester = await semesterService.updateSemester(id, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedSemester, 'Semester updated successfully.'));
});

/**
 * @route   DELETE /api/v1/semesters/:id
 * @desc    Permanently deletes a semester.
 * @access  Private (Admin only)
 */
export const deleteSemester = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await semesterService.deleteSemester(id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Semester deleted successfully.'));
});
