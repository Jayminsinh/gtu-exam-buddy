/**
 * @file Subject Service
 * @description Houses core business logic for subject management, including database
 *              creation, queries, filtering by branch/semester, search features,
 *              pagination, and sorting.
 */

import Subject from '../models/subject.model.js';
import ApiError from '../utils/ApiError.js';
import { PAGINATION } from '../utils/constants.js';

/**
 * Registers a new academic subject.
 *
 * @param {Object} subjectData - Subject registration data
 * @param {string} subjectData.name - Name of the subject
 * @param {string} subjectData.code - Unique subject code (GTU code)
 * @param {string} subjectData.branch - ObjectId reference of the Branch
 * @param {string} subjectData.semester - ObjectId reference of the Semester
 * @param {number} subjectData.credits - Academic credits count
 * @returns {Promise<Object>} - The created Subject document
 * @throws {ApiError} - 409 Conflict if the code already exists
 */
const createSubject = async (subjectData) => {
  // Check for duplicate subject code
  const existingSubject = await Subject.findOne({ code: subjectData.code });
  if (existingSubject) {
    throw ApiError.conflict(`Subject with code ${subjectData.code} already exists.`);
  }

  const subject = await Subject.create(subjectData);
  return subject;
};

/**
 * Retrieves subjects matching filters, with sorting and pagination.
 *
 * @param {Object} query - HTTP query parameters
 * @param {string} [query.branch] - Filter by Branch ID reference
 * @param {string} [query.semester] - Filter by Semester ID reference
 * @param {string} [query.name] - Partial match for subject name
 * @param {string} [query.code] - Partial match for subject code
 * @param {string} [query.search] - Unified keyword search matching name or code
 * @param {string} [query.page] - Page number (defaults to 1)
 * @param {string} [query.limit] - Page limit (defaults to 10)
 * @param {string} [query.sortBy] - Sort field ('name' or 'createdAt')
 * @param {string} [query.sortOrder] - Sort sequence ('asc' or 'desc')
 * @returns {Promise<Object>} - Paginated list of subjects & stats
 */
const getAllSubjects = async (query = {}) => {
  const { branch, semester, name, code, search, page, limit, sortBy, sortOrder } = query;

  const filter = {};

  // 1. Process Filters
  if (branch) {
    filter.branch = branch;
  }
  if (semester) {
    filter.semester = semester;
  }
  if (name) {
    filter.name = { $regex: name, $options: 'i' };
  }
  if (code) {
    filter.code = { $regex: code, $options: 'i' };
  }

  // 2. Process Unified Search (matches either name OR code)
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
  }

  // 3. Process Pagination Defaults
  const pageNum = Math.max(1, parseInt(page, 10) || PAGINATION.DEFAULT_PAGE);
  let limitNum = Math.max(1, parseInt(limit, 10) || PAGINATION.DEFAULT_LIMIT);
  if (limitNum > PAGINATION.MAX_LIMIT) {
    limitNum = PAGINATION.MAX_LIMIT;
  }
  const skip = (pageNum - 1) * limitNum;

  // 4. Process Sorting
  let sortField = 'name'; // Defaults to sorting alphabetically by name
  if (sortBy === 'createdAt') {
    sortField = 'createdAt';
  }
  const order = sortOrder === 'desc' ? -1 : 1;
  const sort = { [sortField]: order };

  // 5. Query Mongoose database
  const subjects = await Subject.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .populate('branch')
    .populate('semester');

  const totalSubjects = await Subject.countDocuments(filter);

  return {
    subjects,
    totalSubjects,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(totalSubjects / limitNum),
  };
};

/**
 * Fetches a single Subject by its ID, populating its relationships and paper count.
 *
 * @param {string} id - Database ObjectId
 * @returns {Promise<Object>} - The Subject document
 * @throws {ApiError} - 404 if the subject does not exist
 */
const getSubjectById = async (id) => {
  const subject = await Subject.findById(id)
    .populate('branch')
    .populate('semester')
    .populate('paperCount'); // Populate the paperCount virtual

  if (!subject) {
    throw ApiError.notFound('Subject not found.');
  }

  return subject;
};

/**
 * Updates a Subject's fields.
 *
 * @param {string} id - Database ObjectId
 * @param {Object} updateData - Keys/values to update
 * @returns {Promise<Object>} - The updated Subject document
 * @throws {ApiError} - 404 if subject doesn't exist, 409 if code conflicts with another record
 */
const updateSubject = async (id, updateData) => {
  // If subject code is being updated, verify it doesn't duplicate another record
  if (updateData.code) {
    const codeConflict = await Subject.findOne({
      code: updateData.code,
      _id: { $ne: id }, // Excludes current record
    });
    if (codeConflict) {
      throw ApiError.conflict(`Subject with code ${updateData.code} is already in use by another subject.`);
    }
  }

  const subject = await Subject.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true } // Returns updated doc, validates schemas
  )
    .populate('branch')
    .populate('semester');

  if (!subject) {
    throw ApiError.notFound('Subject not found.');
  }

  return subject;
};

/**
 * Removes a Subject document.
 *
 * @param {string} id - Database ObjectId
 * @returns {Promise<boolean>} - True on success
 * @throws {ApiError} - 404 if subject doesn't exist
 */
const deleteSubject = async (id) => {
  const subject = await Subject.findById(id);
  if (!subject) {
    throw ApiError.notFound('Subject not found.');
  }

  await subject.deleteOne();
  return true;
};

const subjectService = {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
};

export default subjectService;
