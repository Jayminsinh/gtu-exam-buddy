/**
 * @file Question Paper Controller
 * @description Processes API requests for uploading, fetching, updating,
 *              and deleting question papers. Feeds data directly to the paperService
 *              and standardizes HTTP response formats.
 */

import paperService from '../services/paper.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @route   POST /api/v1/papers
 * @desc    Uploads a new question paper PDF and stores metadata.
 * @access  Private (Admin only)
 */
export const uploadPaper = asyncHandler(async (req, res) => {
  // Metadata is sent in the body; the file is populated by Multer in req.file
  const metadata = req.body;
  const localFilePath = req.file.path;
  const userId = req.user._id;

  const paper = await paperService.uploadPaper({
    metadata,
    localFilePath,
    userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, paper, 'Question paper uploaded successfully.'));
});

/**
 * @route   GET /api/v1/papers
 * @desc    Retrieves a list of question papers with optional filters and pagination.
 * @access  Public
 */
export const getAllPapers = asyncHandler(async (req, res) => {
  // Pass query params directly to the service for processing
  const result = await paperService.getAllPapers(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, result, 'Question papers retrieved successfully.'));
});

/**
 * @route   GET /api/v1/papers/:id
 * @desc    Retrieves a single question paper's details.
 * @access  Public
 */
export const getPaperById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const paper = await paperService.getPaperById(id);

  return res
    .status(200)
    .json(new ApiResponse(200, paper, 'Question paper details retrieved.'));
});

/**
 * @route   PATCH /api/v1/papers/:id
 * @desc    Updates an existing question paper's metadata.
 * @access  Private (Admin only)
 */
export const updatePaper = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const updatedPaper = await paperService.updatePaper(id, updateData);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPaper, 'Question paper updated successfully.'));
});

/**
 * @route   DELETE /api/v1/papers/:id
 * @desc    Deletes a question paper document and its associated file on Cloudinary.
 * @access  Private (Admin only)
 */
export const deletePaper = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await paperService.deletePaper(id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Question paper deleted successfully.'));
});
