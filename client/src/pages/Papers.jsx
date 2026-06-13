/**
 * @file Papers Management Page
 * @description Renders the Archival Papers registry for browsing and uploading
 *              past GTU exam papers. Admins get a slide-over upload drawer with
 *              multipart FormData submission to Cloudinary via the backend.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// ─── Year Options Generator (2020 → current year) ────────────
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i);

const EXAM_TYPES = [
  { value: 'winter', label: 'WINTER' },
  { value: 'summer', label: 'SUMMER' },
  { value: 'remedial', label: 'REMEDIAL' },
];

export default function Papers() {
  const [papers, setPapers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ─── Upload Form States ──────────────────────────────────
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [year, setYear] = useState('');
  const [examType, setExamType] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // ─── Concurrent Data Fetch ───────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [papersRes, subjectsRes] = await Promise.all([
          api.get('/papers'),
          api.get('/subjects'),
        ]);

        setPapers(papersRes.data?.data?.papers || []);
        setSubjects(subjectsRes.data?.data?.subjects || []);
      } catch (error) {
        console.error('Failed to load papers data:', error);
        toast.error('Failed to retrieve archival papers data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ─── Resolve Subject Object from Selected ID ────────────
  const resolveSubject = (subjectId) => subjects.find((s) => s._id === subjectId);

  // ─── File Drag & Drop Handlers ──────────────────────────
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
    } else {
      toast.error('Only PDF files are accepted.');
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
    } else if (selected) {
      toast.error('Only PDF files are accepted.');
      e.target.value = '';
    }
  };

  // ─── Upload Form Submit ─────────────────────────────────
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    const selectedSubject = resolveSubject(selectedSubjectId);
    if (!selectedSubject) {
      toast.error('Please select a valid subject.');
      return;
    }
    if (!file) {
      toast.error('Please attach a PDF document.');
      return;
    }
    if (!year || !examType || !title.trim()) {
      toast.error('All fields are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('subject', selectedSubject.name || selectedSubject.code);
      formData.append('semester', selectedSubject.semester?.number || selectedSubject.semester);
      formData.append('branch', selectedSubject.branch?.code || selectedSubject.branch);
      formData.append('year', year);
      formData.append('examType', examType);
      formData.append('file', file);

      const response = await api.post('/papers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newPaper = response.data?.data;
      if (newPaper) {
        setPapers((prev) => [newPaper, ...prev]);
      }

      toast.success('Document archived successfully.');

      // Reset form
      setTitle('');
      setSelectedSubjectId('');
      setYear('');
      setExamType('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setDrawerOpen(false);
    } catch (error) {
      const errMsg =
        error.response?.data?.errors?.[0]?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        error.response?.data?.message ||
        'Failed to upload document.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Handle Deletion ───────────────────────────────────────
  const handleDeletePaper = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to delete this archived paper?')) {
      return;
    }

    try {
      await api.delete(`/papers/${id}`);
      setPapers((prev) => prev.filter((p) => p._id !== id));
      toast.success('Archived paper deleted successfully.');
    } catch (error) {
      console.error('Failed to delete paper:', error);
      const errMsg = error.response?.data?.message || 'Failed to delete paper.';
      toast.error(errMsg);
    }
  };

  // ─── Display Helpers ────────────────────────────────────
  const formatSeason = (examTypeVal) => {
    if (!examTypeVal) return '—';
    return examTypeVal.toUpperCase();
  };

  const formatFileType = (titleVal) => {
    if (!titleVal) return 'DOCUMENT';
    const lower = titleVal.toLowerCase();
    if (lower.includes('answer') || lower.includes('solution') || lower.includes('key')) {
      return 'ANSWER KEY';
    }
    return 'QUESTION PAPER';
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl">
      {/* ─── Header Section ──────────────────────────────── */}
      <div className="flex justify-between items-end border-b border-thin border-luxury-charcoal/10 pb-6">
        <div>
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-gold mb-1">
            DOCUMENT ARCHIVE
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-luxury-espresso font-normal uppercase">
            Archival Papers
          </h2>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="font-sans text-[11px] tracking-[0.25em] uppercase px-5 py-2 border border-thin border-luxury-charcoal hover:bg-luxury-espresso hover:text-luxury-ivory transition-all duration-500"
          >
            + UPLOAD DOCUMENT
          </button>
        )}
      </div>

      {/* ─── List Table View ─────────────────────────────── */}
      {loading ? (
        <div className="py-20 text-center">
          <p className="font-sans text-xs tracking-widest text-luxury-taupe animate-pulse">
            LOADING ARCHIVE...
          </p>
        </div>
      ) : papers.length === 0 ? (
        <div className="border border-thin border-luxury-charcoal/10 rounded-sm p-16 text-center bg-luxury-cream">
          <p className="font-sans text-xs tracking-[0.2em] uppercase text-luxury-taupe/60">
            NO ARCHIVED PAPERS FOUND
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-thin border-luxury-charcoal/20">
                <th className="py-4 font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-taupe font-normal w-1/5">
                  YEAR &amp; SEASON
                </th>
                <th className="py-4 font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-taupe font-normal w-1/4">
                  SUBJECT
                </th>
                <th className="py-4 font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-taupe font-normal w-1/5">
                  FILE TYPE
                </th>
                <th className="py-4 font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-taupe font-normal w-1/6">
                  BRANCH
                </th>
                <th className="py-4 font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-taupe font-normal w-1/6 text-right">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {papers.map((paper) => (
                <motion.tr
                  key={paper._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b-[0.5px] border-luxury-charcoal/30 hover:bg-luxury-cream/50 transition-colors duration-300"
                >
                  <td className="py-5 font-sans text-xs tracking-widest font-medium text-luxury-espresso uppercase">
                    {paper.year} {formatSeason(paper.examType)}
                  </td>
                  <td className="py-5 font-serif text-sm text-luxury-charcoal">
                    {paper.subject}
                  </td>
                  <td className="py-5">
                    <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-luxury-taupe border border-luxury-charcoal/15 px-3 py-1">
                      {formatFileType(paper.title)}
                    </span>
                  </td>
                  <td className="py-5 font-sans text-xs tracking-widest text-luxury-espresso uppercase">
                    {paper.branch || '—'}
                  </td>
                  <td className="py-5 text-right space-x-4">
                    <a
                      href={paper.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block font-sans text-[10px] tracking-[0.25em] uppercase text-luxury-gold hover:text-luxury-espresso transition-colors duration-300 border-b border-luxury-gold/30 hover:border-luxury-espresso/50 pb-0.5"
                    >
                      VIEW DOCUMENT
                    </a>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeletePaper(paper._id)}
                        className="inline-block font-sans text-[10px] tracking-[0.25em] uppercase text-red-700/80 hover:text-red-950 transition-colors duration-300 border-b border-red-700/20 hover:border-red-950/40 pb-0.5"
                      >
                        DELETE
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Upload Drawer (Admin Only) ──────────────────── */}
      <AnimatePresence>
        {isAdmin && drawerOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-luxury-espresso/15 backdrop-blur-[2px] z-50"
            />

            {/* Sidebar Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-luxury-cream border-l border-thin border-luxury-charcoal/15 shadow-2xl p-8 md:p-10 z-50 flex flex-col justify-between"
            >
              <div className="overflow-y-auto pr-1">
                <div className="flex justify-between items-center mb-12">
                  <div>
                    <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-luxury-gold mb-1">
                      NEW DOCUMENT
                    </p>
                    <h3 className="font-serif text-2xl text-luxury-espresso font-normal">
                      Upload Paper
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="font-sans text-[10px] tracking-[0.2em] text-luxury-taupe hover:text-luxury-gold transition-colors duration-300"
                  >
                    CLOSE
                  </button>
                </div>

                <form onSubmit={handleUpload} className="space-y-8 pb-8">
                  {/* Title */}
                  <div className="space-y-1">
                    <label
                      htmlFor="paper-title"
                      className="block font-sans text-[9px] tracking-[0.25em] uppercase text-luxury-taupe"
                    >
                      DOCUMENT TITLE
                    </label>
                    <input
                      id="paper-title"
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-transparent border-b border-luxury-charcoal/20 py-2 focus:border-luxury-gold transition-colors duration-300 outline-none text-sm placeholder-luxury-taupe/40"
                      placeholder="e.g. OOP Winter 2024 Question Paper"
                    />
                  </div>

                  {/* Subject Selector */}
                  <div className="space-y-1">
                    <label
                      htmlFor="paper-subject"
                      className="block font-sans text-[9px] tracking-[0.25em] uppercase text-luxury-taupe"
                    >
                      SUBJECT
                    </label>
                    <div className="relative">
                      <select
                        id="paper-subject"
                        required
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                        className="w-full bg-transparent border-b border-luxury-charcoal/20 py-2 focus:border-luxury-gold transition-colors duration-300 outline-none text-sm appearance-none font-sans tracking-wide text-luxury-espresso"
                      >
                        <option value="" disabled className="text-luxury-taupe/40 bg-luxury-cream">
                          Select subject reference...
                        </option>
                        {subjects.map((sub) => (
                          <option
                            key={sub._id}
                            value={sub._id}
                            className="bg-luxury-cream text-luxury-espresso"
                          >
                            {sub.code} — {sub.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-luxury-taupe/60 text-[9px]">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Year & Exam Type Row */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Exam Year */}
                    <div className="space-y-1">
                      <label
                        htmlFor="paper-year"
                        className="block font-sans text-[9px] tracking-[0.25em] uppercase text-luxury-taupe"
                      >
                        EXAM YEAR
                      </label>
                      <div className="relative">
                        <select
                          id="paper-year"
                          required
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          className="w-full bg-transparent border-b border-luxury-charcoal/20 py-2 focus:border-luxury-gold transition-colors duration-300 outline-none text-sm appearance-none font-sans tracking-wide text-luxury-espresso"
                        >
                          <option value="" disabled className="text-luxury-taupe/40 bg-luxury-cream">
                            Year...
                          </option>
                          {YEAR_OPTIONS.map((y) => (
                            <option key={y} value={y} className="bg-luxury-cream text-luxury-espresso">
                              {y}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-luxury-taupe/60 text-[9px]">
                          ▼
                        </div>
                      </div>
                    </div>

                    {/* Exam Type */}
                    <div className="space-y-1">
                      <label
                        htmlFor="paper-exam-type"
                        className="block font-sans text-[9px] tracking-[0.25em] uppercase text-luxury-taupe"
                      >
                        EXAM TYPE
                      </label>
                      <div className="relative">
                        <select
                          id="paper-exam-type"
                          required
                          value={examType}
                          onChange={(e) => setExamType(e.target.value)}
                          className="w-full bg-transparent border-b border-luxury-charcoal/20 py-2 focus:border-luxury-gold transition-colors duration-300 outline-none text-sm appearance-none font-sans tracking-wide text-luxury-espresso"
                        >
                          <option value="" disabled className="text-luxury-taupe/40 bg-luxury-cream">
                            Type...
                          </option>
                          {EXAM_TYPES.map((et) => (
                            <option
                              key={et.value}
                              value={et.value}
                              className="bg-luxury-cream text-luxury-espresso"
                            >
                              {et.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-luxury-taupe/60 text-[9px]">
                          ▼
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PDF File Input (Custom Drag/Drop Zone) */}
                  <div className="space-y-1">
                    <label className="block font-sans text-[9px] tracking-[0.25em] uppercase text-luxury-taupe">
                      ACADEMIC DOCUMENT
                    </label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={[
                        'relative cursor-pointer border border-dashed py-10 px-6 text-center transition-all duration-400',
                        isDragOver
                          ? 'border-luxury-gold bg-luxury-gold/5'
                          : file
                          ? 'border-luxury-gold/40 bg-luxury-gold/3'
                          : 'border-luxury-charcoal/20 hover:border-luxury-gold/40',
                      ].join(' ')}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="sr-only"
                        tabIndex={-1}
                      />
                      {file ? (
                        <div>
                          <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-luxury-gold mb-1">
                            FILE ATTACHED
                          </p>
                          <p className="font-sans text-xs text-luxury-espresso truncate max-w-[280px] mx-auto">
                            {file.name}
                          </p>
                          <p className="font-sans text-[9px] tracking-widest text-luxury-taupe/60 mt-2">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-luxury-taupe mb-2">
                            ATTACH ACADEMIC PDF DOCUMENT
                          </p>
                          <p className="font-sans text-[9px] tracking-widest text-luxury-taupe/40">
                            DRAG &amp; DROP OR CLICK TO BROWSE
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full font-sans text-xs tracking-[0.3em] uppercase py-4 border-thin border-luxury-charcoal bg-luxury-espresso text-luxury-ivory hover:bg-transparent hover:text-luxury-espresso transition-all duration-500 mt-12"
                  >
                    {isSubmitting ? 'ARCHIVING...' : 'ARCHIVE DOCUMENT'}
                  </button>
                </form>
              </div>

              <footer className="pt-4 border-t border-thin border-luxury-charcoal/8 bg-luxury-cream">
                <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-luxury-taupe/40 text-center">
                  GTU EXAM BUDDY · DOCUMENT ARCHIVE
                </p>
              </footer>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
