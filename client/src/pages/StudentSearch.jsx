/**
 * @file Student Search Portal
 * @description Premium, high-contrast cascading filter interface for students.
 *              Allows filtering subjects by Branch and Semester, and expanding
 *              each subject inline to access past GTU exam papers and answer keys.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../utils/api';

export default function StudentSearch() {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedBranchCode, setSelectedBranchCode] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [papers, setPapers] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [expandedSubjectId, setExpandedSubjectId] = useState(null);

  // ─── Fetch Active Branches on Mount ────────────────────────
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await api.get('/branch');
        setBranches(response.data?.data || []);
      } catch (error) {
        console.error('Failed to load branches:', error);
        toast.error('Failed to load active branches.');
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchBranches();
  }, []);

  // ─── Handle Branch Selection Change ────────────────────────
  const handleBranchChange = (e) => {
    const branchId = e.target.value;
    setSelectedBranchId(branchId);
    
    const branch = branches.find((b) => b._id === branchId);
    setSelectedBranchCode(branch ? branch.code : '');
    
    // Reset secondary cascading states
    setSelectedSemester('');
    setSubjects([]);
    setPapers([]);
    setExpandedSubjectId(null);
  };

  // ─── Fetch Subjects & Papers on Cascading Selection ────────
  useEffect(() => {
    if (!selectedBranchId || !selectedSemester) {
      return;
    }

    const fetchAcademicMatrix = async () => {
      setLoadingData(true);
      setExpandedSubjectId(null);
      try {
        // 1. Resolve Semester ObjectId dynamically
        const semestersRes = await api.get(`/semester?branch=${selectedBranchId}`);
        const activeSemesters = semestersRes.data?.data || [];
        const matchedSemester = activeSemesters.find(
          (s) => s.number === Number(selectedSemester)
        );

        if (!matchedSemester) {
          setSubjects([]);
          setPapers([]);
          setLoadingData(false);
          return;
        }

        // 2. Fetch Subjects and Papers concurrently using resolved IDs
        const [subjectsRes, papersRes] = await Promise.all([
          api.get(`/subjects?branch=${selectedBranchId}&semester=${matchedSemester._id}&limit=100`),
          api.get(`/papers?branch=${selectedBranchCode}&semester=${selectedSemester}&limit=100`)
        ]);

        setSubjects(subjectsRes.data?.data?.subjects || []);
        setPapers(papersRes.data?.data?.papers || []);
      } catch (error) {
        console.error('Failed to load filtered academic resources:', error);
        toast.error('Failed to load academic subjects and papers.');
        setSubjects([]);
        setPapers([]);
      } finally {
        setLoadingData(false);
      }
    };

    fetchAcademicMatrix();
  }, [selectedBranchId, selectedSemester, selectedBranchCode]);

  // ─── Filter Papers by Subject Name or Code ──────────────────
  const getPapersForSubject = (subject) => {
    const subCode = subject.code?.toLowerCase() || '';
    const subName = subject.name?.toLowerCase() || '';

    return papers.filter((paper) => {
      const paperSub = paper.subject?.toLowerCase() || '';
      return (
        paperSub.includes(subCode) ||
        paperSub.includes(subName) ||
        subName.includes(paperSub)
      );
    });
  };

  const toggleExpandSubject = (subjectId) => {
    setExpandedSubjectId(expandedSubjectId === subjectId ? null : subjectId);
  };

  const formatSeason = (examType) => {
    if (!examType) return '—';
    return examType.toUpperCase();
  };

  const formatFileType = (title) => {
    if (!title) return 'DOCUMENT';
    const lower = title.toLowerCase();
    if (lower.includes('answer') || lower.includes('solution') || lower.includes('key')) {
      return 'ANSWER KEY';
    }
    return 'QUESTION PAPER';
  };

  return (
    <div className="flex flex-col gap-10 w-full max-w-5xl">
      {/* ─── Hero / Header Block ───────────────────────────── */}
      <div className="border-b border-thin border-luxury-charcoal/10 pb-6">
        <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-gold mb-1">
          STUDENT ARCHIVE PORTAL
        </p>
        <h2 className="font-serif text-3xl md:text-4xl text-luxury-espresso font-normal uppercase tracking-wide">
          Search the Archive
        </h2>
        <p className="font-sans text-xs text-luxury-taupe mt-2 max-w-xl leading-relaxed">
          Select your branch and semester to dynamically retrieve GTU past papers, solution indices, and credit matrices.
        </p>
      </div>

      {/* ─── Cascading Selector Panel ───────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-luxury-cream border border-thin border-luxury-charcoal/10 p-6 md:p-8 rounded-sm">
        {/* Step 1: Branch Select */}
        <div className="space-y-2">
          <label className="block font-sans text-[10px] tracking-[0.25em] uppercase text-luxury-taupe">
            STEP 1 · SELECT ACADEMIC BRANCH
          </label>
          {loadingBranches ? (
            <div className="h-11 bg-luxury-ivory/50 animate-pulse border border-thin border-luxury-charcoal/10" />
          ) : (
            <div className="relative">
              <select
                value={selectedBranchId}
                onChange={handleBranchChange}
                className="w-full bg-luxury-ivory border border-thin border-luxury-charcoal/20 px-4 py-3 rounded-none focus:border-luxury-gold outline-none font-serif text-sm text-luxury-espresso appearance-none cursor-pointer"
              >
                <option value="">Choose Branch...</option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name} {branch.code ? `(${branch.code})` : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-luxury-taupe text-[10px]">
                ▼
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Semester Select */}
        <div className="space-y-2">
          <label className="block font-sans text-[10px] tracking-[0.25em] uppercase text-luxury-taupe">
            STEP 2 · SELECT TERM SEMESTER
          </label>
          <div className="relative">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              disabled={!selectedBranchId}
              className={`w-full border border-thin px-4 py-3 rounded-none focus:border-luxury-gold outline-none font-serif text-sm appearance-none cursor-pointer transition-all duration-300 ${
                selectedBranchId
                  ? 'bg-luxury-ivory border-luxury-charcoal/20 text-luxury-espresso'
                  : 'bg-luxury-ivory/40 border-luxury-charcoal/10 text-luxury-taupe/40 cursor-not-allowed'
              }`}
            >
              <option value="">Choose Semester...</option>
              {Array.from({ length: 8 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  Semester 0{num}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-luxury-taupe text-[10px]">
              ▼
            </div>
          </div>
        </div>
      </div>

      {/* ─── Narrowed Academic Matrix Grid ──────────────────── */}
      <div className="mt-4">
        {loadingData ? (
          <div className="py-24 text-center">
            <div className="inline-block w-6 h-6 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-sans text-xs tracking-[0.25em] uppercase text-luxury-taupe animate-pulse">
              RETRIEVING ACADEMIC MATRIX...
            </p>
          </div>
        ) : !selectedBranchId || !selectedSemester ? (
          <div className="border border-thin border-dashed border-luxury-charcoal/10 p-16 text-center bg-luxury-cream/30">
            <p className="font-sans text-xs tracking-[0.15em] uppercase text-luxury-taupe/60">
              PLEASE COMPLETE CASCADING FILTERS TO REVEAL CURRICULUM
            </p>
          </div>
        ) : subjects.length === 0 ? (
          <div className="border border-thin border-luxury-charcoal/10 p-16 text-center bg-luxury-cream">
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-luxury-taupe/70 mb-2">
              NO SUBJECTS ARCHIVED
            </p>
            <p className="font-sans text-[10px] tracking-wide text-luxury-taupe/50">
              There are no courses populated under this specific Branch and Semester.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-luxury-taupe mb-4">
              CURRICULUM MATRIX — {subjects.length} COURSES FOUND
            </p>

            <div className="border border-thin border-luxury-charcoal/15 bg-luxury-cream rounded-sm overflow-hidden divide-y divide-luxury-charcoal/10">
              {subjects.map((subject) => {
                const isExpanded = expandedSubjectId === subject._id;
                const subjectPapers = getPapersForSubject(subject);

                return (
                  <div key={subject._id} className="transition-all duration-300">
                    {/* Row Header */}
                    <button
                      onClick={() => toggleExpandSubject(subject._id)}
                      className="w-full px-6 py-5 flex flex-col md:flex-row md:items-center justify-between text-left hover:bg-luxury-ivory/40 transition-colors duration-300 focus:outline-none"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                        <span className="font-sans text-xs tracking-[0.2em] font-medium text-luxury-gold">
                          {subject.code}
                        </span>
                        <h4 className="font-serif text-base text-luxury-espresso font-normal">
                          {subject.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-4 mt-2 md:mt-0">
                        <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-luxury-taupe/80 bg-luxury-ivory border border-thin border-luxury-charcoal/10 px-2 py-0.5">
                          {subject.credits} {subject.credits === 1 ? 'Credit' : 'Credits'}
                        </span>
                        <span className="font-sans text-xs text-luxury-gold transform transition-transform duration-300">
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </div>
                    </button>

                    {/* Accordion Expansion */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: 'easeInOut' }}
                          className="overflow-hidden bg-luxury-ivory/30"
                        >
                          <div className="px-6 pb-6 pt-2 border-t border-thin border-luxury-charcoal/5">
                            <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-luxury-taupe/70 mb-4">
                              ARCHIVED RESOURCES FOR {subject.name.toUpperCase()}
                            </p>

                            {subjectPapers.length === 0 ? (
                              <div className="py-8 text-center border border-thin border-dashed border-luxury-charcoal/10 bg-luxury-cream/40">
                                <p className="font-sans text-xs tracking-wider text-luxury-taupe/60">
                                  NO PAPERS OR SOLUTION KEYS ARCHIVED FOR THIS SUBJECT
                                </p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {subjectPapers.map((paper) => (
                                  <div
                                    key={paper._id}
                                    className="border border-thin border-luxury-charcoal/10 bg-luxury-cream p-4 flex justify-between items-center hover:border-luxury-gold/50 transition-colors duration-300"
                                  >
                                    <div>
                                      <p className="font-sans text-[10px] tracking-widest font-semibold text-luxury-espresso">
                                        {paper.year} {formatSeason(paper.examType)}
                                      </p>
                                      <span className="inline-block mt-1.5 font-sans text-[9px] tracking-widest text-luxury-gold border border-luxury-gold/20 px-2 py-0.5 uppercase bg-luxury-gold/[0.03]">
                                        {formatFileType(paper.title)}
                                      </span>
                                    </div>
                                    <a
                                      href={paper.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-sans text-[10px] tracking-[0.2em] uppercase text-luxury-espresso hover:text-luxury-gold transition-colors duration-300 border-b border-luxury-espresso hover:border-gold pb-0.5"
                                    >
                                      VIEW PDF
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
