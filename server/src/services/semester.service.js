/**
 * @file Semester Service
 * @description Houses core business logic for semester management, including
 *              duplicate prevention via the branch+number compound key,
 *              filtering by branch, and sequential sorting.
 */

import Semester from '../models/semester.model.js';
import Branch from '../models/branch.model.js';
import ApiError from '../utils/ApiError.js';

/**
 * Creates a new semester record for a specific branch.
 *
 * @param {Object} semesterData - Payload parameters
 * @param {number} semesterData.number - Semester number (1–8)
 * @param {string} semesterData.branch - ObjectId reference of the Branch
 * @returns {Promise<Object>} - The newly created Semester document
 * @throws {ApiError} - 404 if branch doesn't exist, 409 if the branch+number combination is taken
 */
const createSemester = async (semesterData) => {
  // Verify the referenced branch actually exists
  const branchExists = await Branch.findById(semesterData.branch);
  if (!branchExists) {
    throw ApiError.notFound('Referenced branch does not exist.');
  }

  // Check for duplicate semester within the same branch (compound unique constraint)
  const existingSemester = await Semester.findOne({
    branch: semesterData.branch,
    number: semesterData.number,
  });
  if (existingSemester) {
    throw ApiError.conflict(
      `Semester ${semesterData.number} already exists for this branch.`
    );
  }

  const semester = await Semester.create(semesterData);

  // Return populated document for immediate client use
  return semester.populate('branch');
};

/**
 * Retrieves all semester records matching optional filters, sorted sequentially.
 *
 * @param {Object} query - HTTP query parameters
 * @param {string} [query.branch] - Filter by Branch ObjectId
 * @param {string} [query.isActive] - Filter by active state ('true' or 'false')
 * @param {string} [query.sortOrder] - Sort sequence ('asc' or 'desc'), defaults to ascending
 * @returns {Promise<Array>} - List of matching Semester documents
 */
const getAllSemesters = async (query = {}) => {
  const { branch, isActive, sortOrder } = query;

  const filter = {};

  // Filter by branch reference
  if (branch) {
    filter.branch = branch;
  }

  // Filter by active/inactive state
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }

  // Default sort: ascending by semester number (1, 2, 3...)
  const order = sortOrder === 'desc' ? -1 : 1;
  const sort = { number: order };

  const semesters = await Semester.find(filter)
    .sort(sort)
    .populate('branch');

  return semesters;
};

/**
 * Retrieves a single semester by its ID.
 *
 * @param {string} id - Database ObjectId
 * @returns {Promise<Object>} - The Semester document
 * @throws {ApiError} - 404 if semester does not exist
 */
const getSemesterById = async (id) => {
  const semester = await Semester.findById(id).populate('branch');

  if (!semester) {
    throw ApiError.notFound('Semester not found.');
  }

  return semester;
};

/**
 * Updates an existing semester's details.
 *
 * @param {string} id - Database ObjectId
 * @param {Object} updateData - Keys/values to update
 * @returns {Promise<Object>} - The updated Semester document
 * @throws {ApiError} - 404 if not found, 409 if the new branch+number combination conflicts
 */
const updateSemester = async (id, updateData) => {
  // If number or branch is being changed, verify the new combination is unique
  if (updateData.number !== undefined || updateData.branch) {
    const currentSemester = await Semester.findById(id);
    if (!currentSemester) {
      throw ApiError.notFound('Semester not found.');
    }

    // If branch is being updated, verify it exists
    if (updateData.branch) {
      const branchExists = await Branch.findById(updateData.branch);
      if (!branchExists) {
        throw ApiError.notFound('Referenced branch does not exist.');
      }
    }

    // Determine effective values after the update
    const effectiveNumber = updateData.number ?? currentSemester.number;
    const effectiveBranch = updateData.branch ?? currentSemester.branch.toString();

    const conflict = await Semester.findOne({
      branch: effectiveBranch,
      number: effectiveNumber,
      _id: { $ne: id },
    });
    if (conflict) {
      throw ApiError.conflict(
        `Semester ${effectiveNumber} already exists for this branch.`
      );
    }
  }

  const semester = await Semester.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate('branch');

  if (!semester) {
    throw ApiError.notFound('Semester not found.');
  }

  return semester;
};

/**
 * Removes a semester document.
 *
 * @param {string} id - Database ObjectId
 * @returns {Promise<boolean>} - True on success
 * @throws {ApiError} - 404 if not found
 */
const deleteSemester = async (id) => {
  const semester = await Semester.findById(id);
  if (!semester) {
    throw ApiError.notFound('Semester not found.');
  }

  await semester.deleteOne();
  return true;
};

const semesterService = {
  createSemester,
  getAllSemesters,
  getSemesterById,
  updateSemester,
  deleteSemester,
};

export default semesterService;
