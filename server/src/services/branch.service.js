/**
 * @file Branch Service
 * @description Coordinates business logic for managing academic departments (branches),
 *              ensuring duplicate codes are blocked, and implementing search and sorting.
 */

import Branch from '../models/branch.model.js';
import ApiError from '../utils/ApiError.js';

/**
 * Creates a new academic department branch.
 *
 * @param {Object} branchData - Payload parameters
 * @param {string} branchData.name - Full branch name
 * @param {string} branchData.code - Unique code (CE, IT, ME)
 * @returns {Promise<Object>} - The newly created Branch document
 * @throws {ApiError} - 409 Conflict if the code already exists
 */
const createBranch = async (branchData) => {
  const codeUpper = branchData.code.toUpperCase();

  // Check for duplicate branch codes
  const existingBranch = await Branch.findOne({ code: codeUpper });
  if (existingBranch) {
    throw ApiError.conflict(`Branch with code ${codeUpper} already exists.`);
  }

  const branch = await Branch.create({
    ...branchData,
    code: codeUpper,
  });

  return branch;
};

/**
 * Retrieves all branch records matching optional filters and sorting parameters.
 *
 * @param {Object} query - HTTP query parameters
 * @param {string} [query.isActive] - Filter by active state ('true' or 'false')
 * @param {string} [query.search] - Case-insensitive match on name or code
 * @param {string} [query.sortBy] - Sort field ('name' or 'createdAt')
 * @param {string} [query.sortOrder] - Sort sequence ('asc' or 'desc')
 * @returns {Promise<Array>} - List of matching Branch documents
 */
const getAllBranches = async (query = {}) => {
  const { isActive, search, sortBy, sortOrder } = query;

  const filter = {};

  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
  }

  // Sorting
  let sortField = 'name';
  if (sortBy === 'createdAt') {
    sortField = 'createdAt';
  }
  const order = sortOrder === 'desc' ? -1 : 1;
  const sort = { [sortField]: order };

  const branches = await Branch.find(filter).sort(sort);
  return branches;
};

/**
 * Retrieves a single department branch by ID.
 *
 * @param {string} id - Database ObjectId
 * @returns {Promise<Object>} - The Branch document
 * @throws {ApiError} - 404 if branch does not exist
 */
const getBranchById = async (id) => {
  const branch = await Branch.findById(id);
  if (!branch) {
    throw ApiError.notFound('Branch not found.');
  }
  return branch;
};

/**
 * Updates an existing department branch's details.
 *
 * @param {string} id - Database ObjectId
 * @param {Object} updateData - Keys/values to update
 * @returns {Promise<Object>} - The updated Branch document
 * @throws {ApiError} - 404 if branch not found, 409 if code conflicts with another record
 */
const updateBranch = async (id, updateData) => {
  if (updateData.code) {
    const codeUpper = updateData.code.toUpperCase();
    updateData.code = codeUpper;

    // Check for duplicate branch codes (excluding the current branch being updated)
    const codeConflict = await Branch.findOne({
      code: codeUpper,
      _id: { $ne: id },
    });
    if (codeConflict) {
      throw ApiError.conflict(`Branch with code ${codeUpper} is already in use by another branch.`);
    }
  }

  const branch = await Branch.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!branch) {
    throw ApiError.notFound('Branch not found.');
  }

  return branch;
};

/**
 * Removes a branch document.
 *
 * @param {string} id - Database ObjectId
 * @returns {Promise<boolean>} - True on success
 * @throws {ApiError} - 404 if not found
 */
const deleteBranch = async (id) => {
  const branch = await Branch.findById(id);
  if (!branch) {
    throw ApiError.notFound('Branch not found.');
  }

  await branch.deleteOne();
  return true;
};

const branchService = {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
};

export default branchService;
