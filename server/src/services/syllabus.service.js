/**
 * @file Syllabus Service
 * @description Coordinates business logic for syllabus uploads, history tracking,
 *              dynamic "latest version" promotions, unlinking and database CRUD.
 */

import Syllabus from '../models/syllabus.model.js';
import Subject from '../models/subject.model.js';
import cloudinaryService from './cloudinary.service.js';
import ApiError from '../utils/ApiError.js';
import { PAGINATION } from '../utils/constants.js';

/**
 * Uploads a syllabus PDF, resets existing latest records for the subject,
 * and sets the uploaded document as the active version.
 *
 * @param {Object} data - Payload parameters
 * @param {Object} data.metadata - Subject, academicYear, version
 * @param {string} data.localFilePath - Temporary file path from Multer
 * @param {string} data.userId - ObjectId of the user uploading the syllabus
 * @returns {Promise<Object>} - The newly created Syllabus document
 */
const uploadSyllabus = async ({ metadata, localFilePath, userId }) => {
  // Verify that the subject reference exists
  const subjectExists = await Subject.findById(metadata.subject);
  if (!subjectExists) {
    throw ApiError.notFound('Associated subject not found.');
  }

  // 1. Upload file to Cloudinary
  const { secure_url, public_id } = await cloudinaryService.uploadPDF(localFilePath);

  try {
    // 2. Mark any current active latest syllabus for this subject as false
    await Syllabus.updateMany(
      { subject: metadata.subject, isLatest: true },
      { $set: { isLatest: false } }
    );

    // 3. Store the new syllabus document, flagging it as isLatest: true
    const syllabus = await Syllabus.create({
      ...metadata,
      fileUrl: secure_url,
      publicId: public_id,
      uploadedBy: userId,
      isLatest: true,
    });

    return syllabus;
  } catch (error) {
    // ──────────────────────────────────────────────
    // Transactional Rollback
    // ──────────────────────────────────────────────
    // If saving metadata to the database fails, we must remove the uploaded PDF from Cloudinary
    // to prevent leaving orphaned files consuming remote storage.
    await cloudinaryService.deletePDF(public_id).catch((cleanupError) => {
      console.error(`⚠️ Failed to clean up Cloudinary upload: ${public_id} after DB write error`, cleanupError);
    });

    throw error;
  }
};

/**
 * Fetches all syllabi matching optional filters.
 *
 * @param {Object} query - Query options
 * @param {string} [query.subject] - Filter by specific Subject ObjectId
 * @param {string} [query.academicYear] - Filter by exact Academic Year
 * @param {string} [query.isLatest] - Filter by active status ('true' or 'false')
 * @param {string} [query.search] - Search subjects by code or name
 * @param {string} [query.page] - Page index (defaults to 1)
 * @param {string} [query.limit] - Page size (defaults to 10)
 * @returns {Promise<Object>} - Paginated list of syllabi & stats
 */
const getAllSyllabus = async (query = {}) => {
  const { subject, academicYear, isLatest, search, page, limit } = query;

  const filter = {};

  if (subject) {
    filter.subject = subject;
  }
  if (academicYear) {
    filter.academicYear = academicYear;
  }
  if (isLatest !== undefined) {
    filter.isLatest = isLatest === 'true';
  }

  // Handle search parameter by querying matching subjects first
  if (search) {
    const matchingSubjects = await Subject.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');

    const subjectIds = matchingSubjects.map((sub) => sub._id);
    filter.subject = { $in: subjectIds };
  }

  // Pagination setups
  const pageNum = Math.max(1, parseInt(page, 10) || PAGINATION.DEFAULT_PAGE);
  let limitNum = Math.max(1, parseInt(limit, 10) || PAGINATION.DEFAULT_LIMIT);
  if (limitNum > PAGINATION.MAX_LIMIT) {
    limitNum = PAGINATION.MAX_LIMIT;
  }
  const skip = (pageNum - 1) * limitNum;

  const syllabi = await Syllabus.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate('subject')
    .populate('uploadedBy', 'name email role');

  const totalSyllabi = await Syllabus.countDocuments(filter);

  return {
    syllabi,
    totalSyllabi,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(totalSyllabi / limitNum),
  };
};

/**
 * Retrieves a single syllabus by its ID.
 *
 * @param {string} id - Database ObjectId
 * @returns {Promise<Object>} - Syllabus document populated with subject & uploader
 * @throws {ApiError} - 404 if not found
 */
const getSyllabusById = async (id) => {
  const syllabus = await Syllabus.findById(id)
    .populate('subject')
    .populate('uploadedBy', 'name email role');

  if (!syllabus) {
    throw ApiError.notFound('Syllabus not found.');
  }

  return syllabus;
};

/**
 * Retrieves the active latest syllabus for a given subject.
 *
 * @param {string} subjectId - Database ObjectId of the Subject
 * @returns {Promise<Object>} - Syllabus document
 * @throws {ApiError} - 404 if not found
 */
const getLatestSyllabusBySubject = async (subjectId) => {
  const syllabus = await Syllabus.findOne({ subject: subjectId, isLatest: true })
    .populate('subject')
    .populate('uploadedBy', 'name email role');

  if (!syllabus) {
    throw ApiError.notFound('No active syllabus found for this subject.');
  }

  return syllabus;
};

/**
 * Updates an existing syllabus's metadata (non-file properties).
 *
 * @param {string} id - Database ObjectId
 * @param {Object} updateData - Keys/values to update
 * @returns {Promise<Object>} - The updated Syllabus document
 * @throws {ApiError} - 404 if not found
 */
const updateSyllabus = async (id, updateData) => {
  // Protect system-managed fields from client updates
  delete updateData.fileUrl;
  delete updateData.publicId;
  delete updateData.uploadedBy;
  delete updateData.isLatest;

  const syllabus = await Syllabus.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .populate('subject')
    .populate('uploadedBy', 'name email role');

  if (!syllabus) {
    throw ApiError.notFound('Syllabus not found.');
  }

  return syllabus;
};

/**
 * Deletes a syllabus document, purges its Cloudinary asset,
 * and automatically promotes the next most recent syllabus version to "latest".
 *
 * @param {string} id - Database ObjectId
 * @returns {Promise<boolean>} - True on success
 * @throws {ApiError} - 404 if not found
 */
const deleteSyllabus = async (id) => {
  const syllabus = await Syllabus.findById(id);
  if (!syllabus) {
    throw ApiError.notFound('Syllabus not found.');
  }

  const wasLatest = syllabus.isLatest;
  const subjectId = syllabus.subject;

  // 1. Delete physical asset from Cloudinary
  await cloudinaryService.deletePDF(syllabus.publicId);

  // 2. Delete metadata document from database
  await syllabus.deleteOne();

  // 3. Promote next most recent syllabus version to latest if active latest was deleted
  if (wasLatest) {
    const nextLatest = await Syllabus.findOne({ subject: subjectId }).sort({ createdAt: -1 });
    if (nextLatest) {
      nextLatest.isLatest = true;
      await nextLatest.save();
    }
  }

  return true;
};

const syllabusService = {
  uploadSyllabus,
  getAllSyllabus,
  getSyllabusById,
  getLatestSyllabusBySubject,
  updateSyllabus,
  deleteSyllabus,
};

export default syllabusService;
