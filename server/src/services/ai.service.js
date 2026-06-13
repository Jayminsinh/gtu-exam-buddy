/**
 * @file AI Exam Blueprint Service
 * @description Interfaces with Google Gemini to analyze uploaded student syllabi
 *              alongside archival past GTU exam papers. Extracts real text from
 *              all PDFs using pdf-parse, downloads stored papers from Supabase,
 *              enforces strict data validation (no fallbacks to mock data), and
 *              compiles a professional Blueprint PDF using pdfkit.
 *
 *              PDF Layout Spec:
 *              ─ Page 1 Top: "The Ultimate GTU Exam Master Prompt" overlay box
 *              ─ Metadata band (subject, branch, semester)
 *              ─ Chapter-wise classification with frequency metrics
 */

import fs from 'fs';
import PDFDocument from 'pdfkit';
import { PDFParse } from 'pdf-parse';
import Paper from '../models/paper.model.js';
import geminiModel from '../config/gemini.js';
import ApiError from '../utils/ApiError.js';

// ──────────────────────────────────────────────
// PDF Text Extraction Helpers
// ──────────────────────────────────────────────

/**
 * Extracts text content from a raw PDF buffer using pdf-parse v2.
 *
 * pdf-parse v2 API:
 *   1. new PDFParse({ data: buffer }) — constructor accepts buffer via `data` option
 *   2. await parser.load()            — loads the PDF document
 *   3. await parser.getText()         — returns { pages, text, total }
 *   4. parser.destroy()               — releases internal resources
 *
 * Throws if the buffer is empty or yields no extractable text.
 *
 * @param {Buffer} pdfBuffer
 * @param {string} label - human-readable label for error logging
 * @returns {Promise<string>}
 */
const extractTextFromBuffer = async (pdfBuffer, label = 'PDF') => {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error(`${label}: Empty buffer received — nothing to parse.`);
  }

  const parser = new PDFParse({ data: pdfBuffer });
  try {
    await parser.load();
    const result = await parser.getText();
    const text = (result.text || '').trim();
    if (!text) {
      throw new Error(`${label}: pdf-parse returned zero text content from the document.`);
    }
    return text;
  } finally {
    // Always release parser resources to prevent memory leaks
    await parser.destroy().catch(() => {});
  }
};

/**
 * Downloads a PDF from a public URL and returns its buffer.
 * Uses native fetch (Node 18+) to avoid extra dependencies.
 * @param {string} url
 * @returns {Promise<Buffer>}
 */
const downloadPdfBuffer = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} when downloading ${url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

/**
 * Strips out excessive duplicate whitespaces, trailing spaces, and empty newline blocks.
 * Keeps the token payload tight and fast.
 * @param {string} text
 * @returns {string}
 */
const compactText = (text) => {
  if (!text) return '';
  return text
    .replace(/[ \t]+/g, ' ')
    .replace(/\r?\n(\r?\n)+/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .trim();
};

// ──────────────────────────────────────────────
// Core Blueprint Data Generator
// ──────────────────────────────────────────────

/**
 * Reads the student syllabus + all stored past papers, extracts their text,
 * builds an enriched Gemini prompt, and returns structured chapter-wise JSON.
 *
 * Throws ApiError if critical inputs are empty so the controller can return
 * a clear 422/500 to the client instead of silently falling back to mock data.
 *
 * @param {string} syllabusPath   - Local temp file path (from multer)
 * @param {string} subjectCode    - GTU subject code
 * @param {string} subjectName    - Subject display name
 * @param {string} branch         - Academic branch
 * @param {string|number} semester
 * @returns {Promise<Object>}     - Structured blueprint data
 */
export const generateBlueprintData = async (syllabusPath, subjectCode, subjectName, branch, semester) => {

  // ═══════════════════════════════════════════
  // STEP 1: Extract syllabus text
  // ═══════════════════════════════════════════
  if (!fs.existsSync(syllabusPath)) {
    throw ApiError.badRequest('Uploaded syllabus file could not be located on disk.');
  }

  const syllabusBuffer = fs.readFileSync(syllabusPath);
  let syllabusText;
  try {
    syllabusText = await extractTextFromBuffer(syllabusBuffer, 'Student Syllabus');
  } catch (parseErr) {
    throw ApiError.unprocessable(
      `Syllabus PDF could not be read: ${parseErr.message}. Please upload a valid, non-scanned PDF document.`
    );
  }
  console.log(`✅ Syllabus text extracted: ${syllabusText.length} characters`);

  // ═══════════════════════════════════════════
  // STEP 2: Query & download all past papers
  // ═══════════════════════════════════════════
  const papers = await Paper.find({
    $or: [
      { subject: { $regex: subjectCode, $options: 'i' } },
      { subject: { $regex: subjectName, $options: 'i' } }
    ]
  });

  console.log(`📄 Found ${papers.length} past paper(s) in database for "${subjectCode}" / "${subjectName}"`);

  if (papers.length === 0) {
    throw ApiError.unprocessable(
      `No archival exam papers found in the database for subject "${subjectName}" (${subjectCode}). ` +
      'Please ensure past papers have been uploaded by an administrator before generating a blueprint.'
    );
  }

  // Download and parse every paper PDF in parallel
  const paperTextResults = await Promise.allSettled(
    papers.map(async (paper) => {
      if (!paper.fileUrl) {
        throw new Error(`Paper "${paper.title}" has no fileUrl in the database.`);
      }
      const pdfBuffer = await downloadPdfBuffer(paper.fileUrl);
      const text = await extractTextFromBuffer(pdfBuffer, `Paper: ${paper.title}`);
      return {
        title: paper.title,
        year: paper.year,
        examType: paper.examType,
        text,
      };
    })
  );

  // Separate successes and failures
  const parsedPapers = [];
  const failedPapers = [];
  paperTextResults.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      parsedPapers.push(result.value);
    } else {
      failedPapers.push({ title: papers[idx].title, reason: result.reason?.message || 'Unknown error' });
    }
  });

  if (parsedPapers.length === 0) {
    throw ApiError.unprocessable(
      'All past paper PDFs failed text extraction. None of the stored documents could be read. ' +
      `Failures: ${JSON.stringify(failedPapers)}`
    );
  }

  if (failedPapers.length > 0) {
    console.warn(`⚠️  ${failedPapers.length} paper(s) failed text extraction:`, failedPapers);
  }

  // Build the concatenated past-papers context string
  let pastPapersContext = '';
  parsedPapers.forEach((p) => {
    pastPapersContext += `\n\n========== PAST PAPER: ${p.title} (${p.examType} ${p.year}) ==========\n${p.text}`;
  });

  console.log(`✅ Past papers text compiled: ${pastPapersContext.length} characters from ${parsedPapers.length} paper(s)`);

  // ═══════════════════════════════════════════
  // STEP 3: Validate Gemini API key
  // ═══════════════════════════════════════════
  if (!process.env.GEMINI_API_KEY) {
    throw ApiError.internal(
      'GEMINI_API_KEY is not configured in the server environment. The AI pipeline cannot operate without it.'
    );
  }

  // ═══════════════════════════════════════════
  // STEP 4: Build the Gemini prompt
  // ═══════════════════════════════════════════

  // Compact text data to minimize token payload and speed up transit
  const compactedSyllabus = compactText(syllabusText);
  const compactedPapers = compactText(pastPapersContext);

  // Cap contexts to stay within Gemini token limits (~60K chars each)
  const MAX_CTX = 60000;
  const trimmedSyllabus = compactedSyllabus.substring(0, MAX_CTX);
  const trimmedPapers = compactedPapers.substring(0, MAX_CTX);

  const promptText = `You are an expert GTU University Professor. Analyze the following syllabus and past exam papers to generate a structured blueprint.

Subject: ${subjectName} (${subjectCode})
Branch: ${branch}
Semester: ${semester}

=== STUDENT SYLLABUS ===
${trimmedSyllabus}

=== PAST GTU EXAM PAPERS ===
${trimmedPapers}

=== INSTRUCTIONS ===
1. CHAPTERS: Extract the exact chapter titles and numbers from the syllabus.
2. QUESTIONS: Scan the past papers and group all questions under their corresponding syllabus chapter.
3. SCHEMA: Return a JSON object with a single array format:
{
  "chapters": [
    {
      "title": "Exact Chapter Name (e.g. Chapter 1: DC Circuits)",
      "questions": [
        { 
          "id": "Sequential question ID (e.g. 1.1)", 
          "text": "The actual question text from exam papers", 
          "marks": "e.g. 7 Marks", 
          "frequency": "e.g. Frequently Asked (3+ times), 2 times asked, or 1 time asked" 
        }
      ]
    }
  ]
}
4. NO CHAT: Skip any introductory/conversational text, return ONLY the JSON payload. Do not use markdown wraps.`;

  // ═══════════════════════════════════════════
  // STEP 5: Call Gemini
  // ═══════════════════════════════════════════
  const result = await geminiModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: promptText }] }],
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });
  const responseText = result.response.text();
  let cleanedText = responseText.trim();

  // Strip accidental markdown code fences if they somehow slip in
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '').trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(cleanedText);
  } catch (jsonErr) {
    console.error('Gemini returned non-JSON response. Raw output:\n', cleanedText.substring(0, 500));
    throw ApiError.internal(
      'The AI model returned an unparseable response. Please try again — the model may be overloaded.'
    );
  }

  // Validate minimum structure
  if (!parsed.chapters || !Array.isArray(parsed.chapters) || parsed.chapters.length === 0) {
    console.error('Gemini returned empty chapters array. Full response:', JSON.stringify(parsed).substring(0, 500));
    throw ApiError.internal(
      'The AI model returned an empty chapter analysis. This usually means the syllabus text was not readable. Please try a different PDF.'
    );
  }

  const totalQuestions = parsed.chapters.reduce((sum, ch) => sum + (ch.questions?.length || 0), 0);
  console.log(`✅ Gemini returned ${totalQuestions} questions across ${parsed.chapters.length} chapters`);

  return parsed;
};

// ──────────────────────────────────────────────
// PDF Compilation Engine
// ──────────────────────────────────────────────

// Layout constants
const PAGE_LEFT = 50;
const PAGE_RIGHT = 550;
const CONTENT_WIDTH = PAGE_RIGHT - PAGE_LEFT; // 500
const PAGE_BOTTOM_LIMIT = 720; // trigger new page before this Y
const FOOTER_Y = 755;

/**
 * Checks remaining page space and adds a new page if needed.
 * Returns the new Y position.
 */
const ensureSpace = (doc, y, requiredHeight = 60) => {
  if (y + requiredHeight > PAGE_BOTTOM_LIMIT) {
    doc.addPage();
    return 50;
  }
  return y;
};

/**
 * Draws the page footer on the current page.
 */
const drawFooter = (doc) => {
  doc.strokeColor('#C9A96E').lineWidth(0.8).moveTo(PAGE_LEFT, FOOTER_Y - 5).lineTo(PAGE_RIGHT, FOOTER_Y - 5).stroke();
  doc.fillColor('#A89F91').font('Helvetica').fontSize(7)
    .text('GTU EXAM BUDDY  ·  POWERED BY GEMINI AI', PAGE_LEFT, FOOTER_Y)
    .text('CONFIDENTIAL / PREPARATORY USE ONLY', PAGE_RIGHT - 180, FOOTER_Y);
};

/**
 * Assembles a professionally styled Blueprint PDF following the exact layout:
 *
 * 1. TOP OF PAGE 1: "THE ULTIMATE GTU EXAM MASTER PROMPT" overlay box
 * 2. Metadata band (subject, code, branch, semester)
 * 3. Chapter-wise classification with frequency metrics
 * 4. Page footer on every page
 *
 * @param {PDFDocument} doc        - pdfkit document instance (already piped)
 * @param {Object}      data       - Gemini analysis result ({ chapters: [...] })
 * @param {Object}      subjectInfo - { subjectCode, subjectName, branch, semester }
 */
export const compileBlueprintPdf = (doc, data, subjectInfo) => {
  const { subjectCode, subjectName, branch, semester } = subjectInfo;

  // ═══════════════════════════════════════════
  // TOP OF PAGE 1: MASTER PROMPT OVERLAY BOX
  // ═══════════════════════════════════════════

  const MASTER_PROMPT_COPY = (
    'Act like a GTU experienced professor for this subject and help me to get high marks ' +
    "in tomorrow's exam. First, give me the best structure for how I should write answers " +
    'in the exam to increase my chance of scoring full marks. After that, I will give you ' +
    'questions one by one. Give me simple language answers so I can easily memorize and ' +
    'understand them. If a question requires a diagram, provide the best search keywords ' +
    'so I can find an easy and accurate diagram image on Google to boost my score.'
  );

  // Measure the height needed for the prompt text
  doc.font('Helvetica').fontSize(9);
  const promptTextHeight = doc.heightOfString(MASTER_PROMPT_COPY, { width: CONTENT_WIDTH - 30 });
  const boxTopPadding = 40; // space for title line inside the box
  const boxBottomPadding = 15;
  const masterBoxHeight = boxTopPadding + promptTextHeight + boxBottomPadding;
  const boxY = 40;

  // Draw the shaded accent box background
  doc.save();
  doc.fillColor('#1C1917').rect(PAGE_LEFT, boxY, CONTENT_WIDTH, masterBoxHeight).fill();

  // Gold accent stripe at the top of the box
  doc.fillColor('#C9A96E').rect(PAGE_LEFT, boxY, CONTENT_WIDTH, 4).fill();

  // Box title
  doc.fillColor('#C9A96E').font('Helvetica-Bold').fontSize(11)
    .text('✨  THE ULTIMATE GTU EXAM MASTER PROMPT', PAGE_LEFT + 15, boxY + 14);

  // Prompt text (white on dark)
  doc.fillColor('#F5F5F4').font('Helvetica').fontSize(9)
    .text(MASTER_PROMPT_COPY, PAGE_LEFT + 15, boxY + boxTopPadding, {
      width: CONTENT_WIDTH - 30,
      lineGap: 2.5,
    });

  // Subtle instruction below the prompt
  doc.fillColor('#A89F91').font('Helvetica-Oblique').fontSize(7)
    .text('↑  Copy the entire text above and paste it into any AI chat before asking your questions.',
      PAGE_LEFT + 15, boxY + masterBoxHeight - 12);

  doc.restore();

  let y = boxY + masterBoxHeight + 20;

  // ═══════════════════════════════════════════
  // DOCUMENT TITLE & METADATA BAND
  // ═══════════════════════════════════════════

  doc.strokeColor('#C9A96E').lineWidth(2).moveTo(PAGE_LEFT, y).lineTo(PAGE_RIGHT, y).stroke();
  y += 12;

  doc.fillColor('#1C1917').font('Times-Bold').fontSize(18).text('GTU EXAM BUDDY', PAGE_LEFT, y);
  doc.font('Times-Roman').fontSize(11).fillColor('#A89F91').text('IMP QUESTION BLUEPRINT — CHAPTER-WISE ANALYSIS', PAGE_LEFT, y + 22);
  y += 45;

  doc.strokeColor('#2E2A25').lineWidth(0.5).moveTo(PAGE_LEFT, y).lineTo(PAGE_RIGHT, y).stroke();
  y += 10;

  // Metadata grid (2 columns)
  const metaCol2X = 300;
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#1C1917');

  doc.text('SUBJECT:', PAGE_LEFT, y);
  doc.font('Helvetica').fillColor('#2E2A25').text(subjectName || 'N/A', PAGE_LEFT + 65, y);

  doc.font('Helvetica-Bold').fillColor('#1C1917').text('BRANCH:', metaCol2X, y);
  doc.font('Helvetica').fillColor('#2E2A25').text(branch || 'N/A', metaCol2X + 60, y);
  y += 14;

  doc.font('Helvetica-Bold').fillColor('#1C1917').text('CODE:', PAGE_LEFT, y);
  doc.font('Helvetica').fillColor('#2E2A25').text(subjectCode || 'N/A', PAGE_LEFT + 65, y);

  doc.font('Helvetica-Bold').fillColor('#1C1917').text('SEMESTER:', metaCol2X, y);
  doc.font('Helvetica').fillColor('#2E2A25').text(semester ? `Semester ${semester}` : 'N/A', metaCol2X + 60, y);
  y += 14;

  doc.strokeColor('#2E2A25').lineWidth(0.5).moveTo(PAGE_LEFT, y + 2).lineTo(PAGE_RIGHT, y + 2).stroke();
  y += 18;

  // ═══════════════════════════════════════════
  // CHAPTER-WISE CLASSIFICATION
  // ═══════════════════════════════════════════

  doc.font('Times-Bold').fontSize(13).fillColor('#1C1917')
    .text('CHAPTER-WISE IMP QUESTION CLASSIFICATION', PAGE_LEFT, y);
  y += 25;

  const chapters = data.chapters || [];

  chapters.forEach((chapter) => {
    // ── Chapter Header ──
    y = ensureSpace(doc, y, 50);

    // Chapter accent bar
    doc.fillColor('#C9A96E').rect(PAGE_LEFT, y, 4, 16).fill();
    doc.fillColor('#1C1917').font('Times-Bold').fontSize(11)
      .text(chapter.title || 'N/A', PAGE_LEFT + 12, y + 2);
    y += 24;

    const questions = chapter.questions || [];

    if (questions.length === 0) {
      doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#A89F91')
        .text('No matching questions found in past papers for this chapter.', PAGE_LEFT + 20, y);
      y += 18;
      return; // next chapter
    }

    questions.forEach((q) => {
      // Handle fallback and schema variations gracefully
      const qId = q.id || q.qId || '';
      const qText = qId ? `${qId}: ${q.text}` : q.text;

      doc.font('Helvetica').fontSize(9);
      const qTextHeight = doc.heightOfString(qText, { width: CONTENT_WIDTH - 40 });
      const entryHeight = qTextHeight + 18; // text + metrics line + padding

      y = ensureSpace(doc, y, entryHeight + 5);

      // Bullet marker
      doc.fillColor('#C9A96E').font('Helvetica-Bold').fontSize(9)
        .text('•', PAGE_LEFT + 12, y);

      // Question text
      doc.fillColor('#1C1917').font('Helvetica').fontSize(9)
        .text(qText, PAGE_LEFT + 24, y, { width: CONTENT_WIDTH - 40 });
      y += qTextHeight + 3;

      // Metrics line: marks + frequency
      const marksVal = q.marks || '7';
      const marksLabel = typeof marksVal === 'string' && marksVal.toLowerCase().includes('mark')
        ? marksVal
        : `${marksVal} Marks`;
      const freqLabel = q.frequency || `${q.timesAppeared || 1} time(s) asked`;
      const metricsStr = `${marksLabel}  —  ${freqLabel}`;

      doc.fillColor('#A89F91').font('Helvetica-Bold').fontSize(8)
        .text(metricsStr, PAGE_LEFT + 24, y);
      y += 16;
    });

    // Subtle separator after each chapter
    y = ensureSpace(doc, y, 10);
    doc.strokeColor('#E0DCD5').lineWidth(0.3).moveTo(PAGE_LEFT + 10, y).lineTo(PAGE_RIGHT - 10, y).stroke();
    y += 14;
  });

  // ═══════════════════════════════════════════
  // FOOTER (stamp on the last page)
  // ═══════════════════════════════════════════
  drawFooter(doc);
};

export default {
  generateBlueprintData,
  compileBlueprintPdf,
};
