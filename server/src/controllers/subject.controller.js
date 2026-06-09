/**
 * @file Subject Controller
 * @description Processes API endpoints for academic subjects. Reads client request inputs,
 *              invokes the subject service, and maps responses to standardized JSON.
 */

import subjectService from '../services/subject.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @route   POST /api/v1/subjects
 * @desc    Creates a new subject (department code, name, credits).
 * @access  Private (Admin only)
 */
export const createSubject = asyncHandler(async (req, res) => {
  // Payload has already been validated by createSubjectSchema middleware
  const subject = await subjectService.createSubject(req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, subject, 'Subject created successfully.'));
});

/**
 * @route   GET /api/v1/subjects
 * @desc    Retrieves a list of academic subjects (filterable, sorted, paginated).
 * @access  Public
 */
export const getAllSubjects = asyncHandler(async (req, res) => {
  // Pass query criteria directly to search execution
  const result = await subjectService.getAllSubjects(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, result, 'Subjects retrieved successfully.'));
});

/**
 * @route   GET /api/v1/subjects/:id
 * @desc    Retrieves detailed info about a single subject by ID.
 * @access  Public
 */
export const getSubjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const subject = await subjectService.getSubjectById(id);

  return res
    .status(200)
    .json(new ApiResponse(200, subject, 'Subject details retrieved.'));
});

/**
 * @route   PATCH /api/v1/subjects/:id
 * @desc    Updates an existing subject's information.
 * @access  Private (Admin only)
 */
export const updateSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const updatedSubject = await subjectService.updateSubject(id, updateData);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedSubject, 'Subject updated successfully.'));
});

/**
 * @route   DELETE /api/v1/subjects/:id
 * @desc    Permanently deletes a subject.
 * @access  Private (Admin only)
 */
export const deleteSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await subjectService.deleteSubject(id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Subject deleted successfully.'));
});
