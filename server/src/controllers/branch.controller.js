/**
 * @file Branch Controller
 * @description Processes API endpoints for academic branches. Reads client request inputs,
 *              invokes the branch service, and maps responses to standardized JSON.
 */

import branchService from '../services/branch.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @route   POST /api/v1/branches
 * @desc    Creates a new branch.
 * @access  Private (Admin only)
 */
export const createBranch = asyncHandler(async (req, res) => {
  // Body validation is done by the createBranchSchema middleware
  const branch = await branchService.createBranch(req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, branch, 'Branch created successfully.'));
});

/**
 * @route   GET /api/v1/branches
 * @desc    Retrieves a list of academic branches.
 * @access  Public
 */
export const getAllBranches = asyncHandler(async (req, res) => {
  const branches = await branchService.getAllBranches(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, branches, 'Branches retrieved successfully.'));
});

/**
 * @route   GET /api/v1/branches/:id
 * @desc    Retrieves detailed info about a single branch by ID.
 * @access  Public
 */
export const getBranchById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const branch = await branchService.getBranchById(id);

  return res
    .status(200)
    .json(new ApiResponse(200, branch, 'Branch details retrieved.'));
});

/**
 * @route   PATCH /api/v1/branches/:id
 * @desc    Updates an existing branch's information.
 * @access  Private (Admin only)
 */
export const updateBranch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedBranch = await branchService.updateBranch(id, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedBranch, 'Branch updated successfully.'));
});

/**
 * @route   DELETE /api/v1/branches/:id
 * @desc    Permanently deletes a branch.
 * @access  Private (Admin only)
 */
export const deleteBranch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await branchService.deleteBranch(id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Branch deleted successfully.'));
});
