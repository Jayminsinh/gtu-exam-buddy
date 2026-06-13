/**
 * @file Question Paper Service
 * @description Implements database actions, filtering, sorting, pagination,
 *              and assets storage integration for question papers.
 */

import Paper from '../models/paper.model.js';
import supabaseService from './supabase.service.js';
import ApiError from '../utils/ApiError.js';
import { PAGINATION } from '../utils/constants.js';

/**
 * Uploads a question paper file and saves its details in the database.
 *
 * @param {Object} data - Paper payload
 * @param {Object} data.metadata - Title, subject, semester, branch, year, examType
 * @param {string} data.localFilePath - Temporary path where file was saved by Multer
 * @param {string} data.userId - ObjectId of the uploader
 * @returns {Promise<Object>} - The newly created Paper document
 */
const uploadPaper = async ({ metadata, localFilePath, userId }) => {
  // 1. Upload file to Supabase Storage
  const { secure_url, public_id } = await supabaseService.uploadPDF(localFilePath);

  // 2. Write metadata and Supabase URLs to MongoDB
  const paper = await Paper.create({
    ...metadata,
    fileUrl: secure_url,
    publicId: public_id,
    uploadedBy: userId,
  });

  return paper;
};

/**
 * Fetches question papers matching optional filters, paginated and sorted.
 *
 * @param {Object} query - Query parameters from HTTP request
 * @param {string} [query.subject] - Case-insensitive partial match for subject
 * @param {string} [query.branch] - Case-insensitive partial match for branch
 * @param {string} [query.semester] - Exact match for semester number
 * @param {string} [query.year] - Exact match for year
 * @param {string} [query.examType] - Exact match for examType (summer, winter, remedial)
 * @param {string} [query.search] - Full-text search string for title/subject
 * @param {string} [query.page] - Page number (defaults to 1)
 * @param {string} [query.limit] - Page limit size (defaults to 10)
 * @returns {Promise<Object>} - Paginated lists of papers and pagination stats
 */
const getAllPapers = async (query = {}) => {
  const { subject, branch, semester, year, examType, search, page, limit } = query;

  const filter = {};

  // 1. Process Text Search
  if (search) {
    filter.$text = { $search: search };
  }

  // 2. Process Filters
  if (subject) {
    filter.subject = { $regex: subject, $options: 'i' };
  }
  if (branch) {
    filter.branch = { $regex: branch, $options: 'i' };
  }
  if (semester) {
    filter.semester = parseInt(semester, 10);
  }
  if (year) {
    filter.year = parseInt(year, 10);
  }
  if (examType) {
    filter.examType = examType;
  }

  // 3. Process Pagination Defaults
  const pageNum = Math.max(1, parseInt(page, 10) || PAGINATION.DEFAULT_PAGE);
  let limitNum = Math.max(1, parseInt(limit, 10) || PAGINATION.DEFAULT_LIMIT);
  if (limitNum > PAGINATION.MAX_LIMIT) {
    limitNum = PAGINATION.MAX_LIMIT;
  }
  const skip = (pageNum - 1) * limitNum;

  // 4. Query Mongoose database
  const papers = await Paper.find(filter)
    .sort({ createdAt: -1 }) // Latest uploads first
    .skip(skip)
    .limit(limitNum)
    .populate('uploadedBy', 'name email role'); // Populate uploader details

  const totalPapers = await Paper.countDocuments(filter);

  return {
    papers,
    totalPapers,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(totalPapers / limitNum),
  };
};

/**
 * Retrieves a single paper by its database ID.
 *
 * @param {string} id - Database ObjectId
 * @returns {Promise<Object>} - The Paper document populated with uploader
 * @throws {ApiError} - 404 if paper does not exist
 */
const getPaperById = async (id) => {
  const paper = await Paper.findById(id).populate('uploadedBy', 'name email role');
  if (!paper) {
    throw ApiError.notFound('Question paper not found.');
  }
  return paper;
};

/**
 * Updates an existing paper's metadata.
 *
 * @param {string} id - Database ObjectId
 * @param {Object} updateData - Key/value pairs to update
 * @returns {Promise<Object>} - The updated Paper document
 * @throws {ApiError} - 404 if paper does not exist
 */
const updatePaper = async (id, updateData) => {
  // Prevent direct mutation of file properties or uploader reference via update metadata
  delete updateData.fileUrl;
  delete updateData.publicId;
  delete updateData.uploadedBy;

  const paper = await Paper.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true } // Returns updated doc, validates schemas
  ).populate('uploadedBy', 'name email role');

  if (!paper) {
    throw ApiError.notFound('Question paper not found.');
  }

  return paper;
};

/**
 * Deletes a question paper from database and its file from Cloudinary.
 *
 * @param {string} id - Database ObjectId
 * @returns {Promise<boolean>} - True if successful
 * @throws {ApiError} - 404 if paper does not exist
 */
const deletePaper = async (id) => {
  const paper = await Paper.findById(id);
  if (!paper) {
    throw ApiError.notFound('Question paper not found.');
  }

  // 1. Delete physical asset from Supabase Storage
  await supabaseService.deletePDF(paper.publicId);

  // 2. Remove document from database
  await paper.deleteOne();

  return true;
};

const paperService = {
  uploadPaper,
  getAllPapers,
  getPaperById,
  updatePaper,
  deletePaper,
};

export default paperService;
