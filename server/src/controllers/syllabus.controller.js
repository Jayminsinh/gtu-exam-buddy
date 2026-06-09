/**
 * @file Syllabus Controller
 * @description Listens to HTTP endpoints for syllabus management, parsing request params,
 *              body objects, files, and mapping to the syllabus service layer.
 */

import syllabusService from '../services/syllabus.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @route   POST /api/v1/syllabus
 * @desc    Uploads a new syllabus version for a subject.
 * @access  Private (Admin only)
 */
export const uploadSyllabus = asyncHandler(async (req, res) => {
  const metadata = req.body;
  const localFilePath = req.file.path;
  const userId = req.user._id;

  const syllabus = await syllabusService.uploadSyllabus({
    metadata,
    localFilePath,
    userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, syllabus, 'Syllabus uploaded and activated successfully.'));
});

/**
 * @route   GET /api/v1/syllabus
 * @desc    Retrieves a list of syllabi with optional filters & searching.
 * @access  Public
 */
export const getAllSyllabus = asyncHandler(async (req, res) => {
  const result = await syllabusService.getAllSyllabus(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, result, 'Syllabi list retrieved successfully.'));
});

/**
 * @route   GET /api/v1/syllabus/:id
 * @desc    Retrieves a single syllabus version by ID.
 * @access  Public
 */
export const getSyllabusById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const syllabus = await syllabusService.getSyllabusById(id);

  return res
    .status(200)
    .json(new ApiResponse(200, syllabus, 'Syllabus details retrieved.'));
});

/**
 * @route   GET /api/v1/syllabus/latest/:subjectId
 * @desc    Retrieves the active latest syllabus version for a subject.
 * @access  Public
 */
export const getLatestSyllabusBySubject = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;

  const syllabus = await syllabusService.getLatestSyllabusBySubject(subjectId);

  return res
    .status(200)
    .json(new ApiResponse(200, syllabus, 'Latest syllabus retrieved successfully.'));
});

/**
 * @route   PATCH /api/v1/syllabus/:id
 * @desc    Updates an existing syllabus's metadata.
 * @access  Private (Admin only)
 */
export const updateSyllabus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const updatedSyllabus = await syllabusService.updateSyllabus(id, updateData);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedSyllabus, 'Syllabus updated successfully.'));
});

/**
 * @route   DELETE /api/v1/syllabus/:id
 * @desc    Deletes a syllabus version, cleans files, and recalculates active latest status.
 * @access  Private (Admin only)
 */
export const deleteSyllabus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await syllabusService.deleteSyllabus(id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Syllabus deleted successfully.'));
});
export default {
  uploadSyllabus,
  getAllSyllabus,
  getSyllabusById,
  getLatestSyllabusBySubject,
  updateSyllabus,
  deleteSyllabus,
};
