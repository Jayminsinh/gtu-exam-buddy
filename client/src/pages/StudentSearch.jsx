/**
 * @file Student Search Portal ("My Classroom")
 * @description Premium, high-contrast cascading filter interface for students.
 *              Allows selecting Branch -> Semester -> Subject, then displays
 *              syllabus details and past exam papers for the selected subject.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../utils/api';

const MAX_SYLLABUS_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export default function StudentSearch() {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedBranchCode, setSelectedBranchCode] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [syllabus, setSyllabus] = useState(null);
  const [papers, setPapers] = useState([]);
  
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingSyllabusAndPapers, setLoadingSyllabusAndPapers] = useState(false);

  // Staged custom student syllabus files
  const [localSyllabusFile, setLocalSyllabusFile] = useState(null);
  const [isDragOverSyllabus, setIsDragOverSyllabus] = useState(false);
  const [generatingBlueprint, setGeneratingBlueprint] = useState(false);

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

    // Recover last selected subject session state if exists
    const stored = localStorage.getItem('currentSubject');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSelectedBranchId(parsed.branchId || '');
        setSelectedBranchCode(parsed.branchCode || '');
        setSelectedSemester(parsed.semesterNumber || '');
        setSelectedSubjectId(parsed.id || '');
      } catch (e) {
        console.warn('Failed to recover subject session:', e);
      }
    }
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
    setSelectedSubjectId('');
    setSelectedSubject(null);
    setSyllabus(null);
    setPapers([]);
    setLocalSyllabusFile(null);
    localStorage.removeItem('currentSubject');
  };

  // ─── Handle Semester Selection Change ──────────────────────
  const handleSemesterChange = (e) => {
    setSelectedSemester(e.target.value);
    
    // Reset subject level selection states
    setSelectedSubjectId('');
    setSelectedSubject(null);
    setSyllabus(null);
    setPapers([]);
    setLocalSyllabusFile(null);
    localStorage.removeItem('currentSubject');
  };

  // ─── Fetch Subjects on Branch & Semester Selection ─────────
  useEffect(() => {
    if (!selectedBranchId || !selectedSemester) {
      setSubjects([]);
      return;
    }

    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      try {
        // Resolve Semester ObjectId dynamically
        const semestersRes = await api.get(`/semester?branch=${selectedBranchId}`);
        const activeSemesters = semestersRes.data?.data || [];
        const matchedSemester = activeSemesters.find(
          (s) => s.number === Number(selectedSemester)
        );

        if (!matchedSemester) {
          setSubjects([]);
          setLoadingSubjects(false);
          return;
        }

        const subjectsRes = await api.get(`/subjects?branch=${selectedBranchId}&semester=${matchedSemester._id}&limit=100`);
        setSubjects(subjectsRes.data?.data?.subjects || []);
      } catch (error) {
        console.error('Failed to load subjects:', error);
        toast.error('Failed to retrieve subjects for the selected term.');
        setSubjects([]);
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, [selectedBranchId, selectedSemester]);

  // ─── Fetch Syllabus & Papers once a Subject is Chosen ──────
  useEffect(() => {
    if (!selectedSubjectId) {
      setSelectedSubject(null);
      setSyllabus(null);
      setPapers([]);
      return;
    }

    const subjectObj = subjects.find((s) => s._id === selectedSubjectId);
    if (!subjectObj) return;

    setSelectedSubject(subjectObj);
    setLocalSyllabusFile(null);

    // Save configuration in localStorage for AI context linking
    localStorage.setItem(
      'currentSubject',
      JSON.stringify({
        id: subjectObj._id,
        name: subjectObj.name,
        code: subjectObj.code,
        credits: subjectObj.credits,
        branchCode: selectedBranchCode,
        branchId: selectedBranchId,
        semesterNumber: selectedSemester,
      })
    );

    const fetchResources = async () => {
      setLoadingSyllabusAndPapers(true);
      setSyllabus(null);
      setPapers([]);
      
      try {
        // 1. Fetch latest syllabus (handle 404 gracefully)
        let loadedSyllabus = null;
        try {
          const syllabusRes = await api.get(`/syllabus/latest/${selectedSubjectId}`);
          loadedSyllabus = syllabusRes.data?.data || null;
        } catch (sError) {
          if (sError.response?.status === 404) {
            console.log('No active syllabus indexed for this course.');
          } else {
            console.error('Failed to load syllabus context:', sError);
          }
        }
        setSyllabus(loadedSyllabus);

        // 2. Fetch past papers under this subject code/name
        const papersRes = await api.get(`/papers?branch=${selectedBranchCode}&semester=${selectedSemester}&limit=100`);
        const allPapers = papersRes.data?.data?.papers || [];
        
        // Filter papers belonging to selected subject code/name
        const subCode = subjectObj.code?.toLowerCase() || '';
        const subName = subjectObj.name?.toLowerCase() || '';
        
        const filtered = allPapers.filter((paper) => {
          const paperSub = paper.subject?.toLowerCase() || '';
          return (
            paperSub.includes(subCode) ||
            paperSub.includes(subName) ||
            subName.includes(paperSub)
          );
        });

        setPapers(filtered);
      } catch (error) {
        console.error('Failed to fetch syllabus or exam papers:', error);
        toast.error('Failed to load archival resources for this subject.');
      } finally {
        setLoadingSyllabusAndPapers(false);
      }
    };

    fetchResources();
  }, [selectedSubjectId, subjects, selectedBranchCode, selectedSemester, selectedBranchId]);

  // ─── Local Syllabus Upload Handlers ─────────────────────────
  const handleSyllabusDragOver = (e) => {
    e.preventDefault();
    setIsDragOverSyllabus(true);
  };

  const handleSyllabusDragLeave = (e) => {
    e.preventDefault();
    setIsDragOverSyllabus(false);
  };

  const validateSyllabusFile = (file) => {
    if (!file) return false;

    const isPdf =
      file.type === 'application/pdf' &&
      file.name?.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      toast.warning('Invalid file type. Please upload an official text-based PDF syllabus.');
      return false;
    }

    if (file.size > MAX_SYLLABUS_FILE_SIZE_BYTES) {
      toast.warning('File size too large. Syllabus documents must be under 5MB.');
      return false;
    }

    return true;
  };

  const handleSyllabusDrop = (e) => {
    e.preventDefault();
    setIsDragOverSyllabus(false);
    const droppedFile = e.dataTransfer.files[0];
    if (!validateSyllabusFile(droppedFile)) {
      return;
    }

    setLocalSyllabusFile(droppedFile);
    toast.success('Local syllabus PDF staged successfully.');
  };

  const handleSyllabusFileChange = (e) => {
    const selected = e.target.files[0];
    if (!validateSyllabusFile(selected)) {
      e.target.value = '';
      return;
    }

    setLocalSyllabusFile(selected);
    toast.success('Local syllabus PDF staged successfully.');
  };

  // ─── Trigger AI Blueprint Generation PDF ────────────────────
  const handleGenerateBlueprint = async () => {
    if (!selectedBranchCode || !selectedSemester || !selectedSubject || !localSyllabusFile) {
      toast.error('Please complete all selection fields and stage a syllabus PDF.');
      return;
    }

    setGeneratingBlueprint(true);
    try {
      const formData = new FormData();
      formData.append('branch', selectedBranchCode);
      formData.append('semester', selectedSemester);
      formData.append('subjectCode', selectedSubject.code);
      formData.append('subjectName', selectedSubject.name);
      formData.append('syllabus', localSyllabusFile);

      const response = await api.post('/ai/generate-blueprint-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
      });

      // Instantiate a local window object URL mapping
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));

      // Programmatically append a hidden temporary document anchor tag link <a> element
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = downloadUrl;
      link.download = `GTU-IMP-Blueprint-${selectedSubject.code}.pdf`;
      document.body.appendChild(link);
      
      // Trigger automatic file download
      link.click();
      
      // Cleanly purge the temporary pointer references from memory immediately
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('IMP Blueprint PDF compiled successfully.');
    } catch (error) {
      console.error('Failed to generate blueprint PDF:', error);
      toast.error('Failed to compile blueprint PDF. Please try again.');
    } finally {
      setGeneratingBlueprint(false);
    }
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
          My Classroom
        </h2>
        <p className="font-sans text-xs text-luxury-taupe mt-2 max-w-xl leading-relaxed">
          Select your Branch, Semester, and Course Subject to access official syllabus logs and archival GTU exam question papers.
        </p>
      </div>

      {/* ─── Cascading Selector Funnel Panel ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-luxury-cream border border-thin border-luxury-charcoal/10 p-6 md:p-8 rounded-sm shadow-sm">
        {/* Step 1: Branch Select */}
        <div className="space-y-2">
          <label className="block font-sans text-[9px] tracking-[0.25em] uppercase text-luxury-taupe font-medium">
            1 · ACADEMIC BRANCH
          </label>
          {loadingBranches ? (
            <div className="h-11 bg-luxury-ivory/50 animate-pulse border border-thin border-luxury-charcoal/10" />
          ) : (
            <div className="relative">
              <select
                value={selectedBranchId}
                onChange={handleBranchChange}
                className="w-full bg-luxury-ivory border border-thin border-luxury-charcoal/20 px-4 py-3 rounded-none focus:border-luxury-gold outline-none font-serif text-sm text-luxury-espresso appearance-none cursor-pointer hover:border-luxury-gold/50 transition-colors duration-300"
              >
                <option value="">Select Branch...</option>
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
          <label className="block font-sans text-[9px] tracking-[0.25em] uppercase text-luxury-taupe font-medium">
            2 · TERM SEMESTER
          </label>
          <div className="relative">
            <select
              value={selectedSemester}
              onChange={handleSemesterChange}
              disabled={!selectedBranchId}
              className={`w-full border border-thin px-4 py-3 rounded-none focus:border-luxury-gold outline-none font-serif text-sm appearance-none cursor-pointer transition-all duration-300 ${
                selectedBranchId
                  ? 'bg-luxury-ivory border-luxury-charcoal/20 text-luxury-espresso hover:border-luxury-gold/50'
                  : 'bg-luxury-ivory/40 border-luxury-charcoal/10 text-luxury-taupe/40 cursor-not-allowed'
              }`}
            >
              <option value="">Select Semester...</option>
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

        {/* Step 3: Subject Select */}
        <div className="space-y-2">
          <label className="block font-sans text-[9px] tracking-[0.25em] uppercase text-luxury-taupe font-medium">
            3 · COURSE COURSE
          </label>
          <div className="relative">
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={!selectedSemester || subjects.length === 0 || loadingSubjects}
              className={`w-full border border-thin px-4 py-3 rounded-none focus:border-luxury-gold outline-none font-serif text-sm appearance-none cursor-pointer transition-all duration-300 ${
                selectedSemester && subjects.length > 0
                  ? 'bg-luxury-ivory border-luxury-charcoal/20 text-luxury-espresso hover:border-luxury-gold/50'
                  : 'bg-luxury-ivory/40 border-luxury-charcoal/10 text-luxury-taupe/40 cursor-not-allowed'
              }`}
            >
              {loadingSubjects ? (
                <option>Loading courses...</option>
              ) : subjects.length === 0 ? (
                <option value="">No courses registered...</option>
              ) : (
                <>
                  <option value="">Select Course Subject...</option>
                  {subjects.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.code} — {sub.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-luxury-taupe text-[10px]">
              ▼
            </div>
          </div>
        </div>
      </div>

      {/* ─── Classroom Materials Grid ───────────────────────── */}
      <AnimatePresence mode="wait">
        {loadingSyllabusAndPapers ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-32 text-center"
          >
            <div className="inline-block w-8 h-8 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-sans text-xs tracking-[0.25em] uppercase text-luxury-taupe animate-pulse">
              RETRIEVING CLASSROOM RESOURCES...
            </p>
          </motion.div>
        ) : selectedSubject ? (
          <motion.div
            key="resources"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
          >
            {/* Left Col: Syllabus Module (1/3 width) */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="border border-thin border-luxury-charcoal/10 bg-luxury-cream p-6 rounded-sm shadow-sm">
                <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-luxury-gold mb-4 font-semibold">
                  📚 Syllabus Module
                </p>
                
                {syllabus ? (
                  <div className="space-y-4">
                    <h4 className="font-serif text-lg text-luxury-espresso font-normal">
                      GTU Reference Syllabus
                    </h4>
                    <div className="h-px bg-luxury-charcoal/10 my-2" />
                    <div className="space-y-2 font-sans text-xs text-luxury-charcoal">
                      <div className="flex justify-between">
                        <span className="text-luxury-taupe">Version:</span>
                        <span className="font-medium">{syllabus.version || '1.0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-luxury-taupe">Academic Year:</span>
                        <span className="font-medium">{syllabus.academicYear || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-luxury-taupe">Indexed:</span>
                        <span className="font-medium">
                          {new Date(syllabus.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <a
                      href={syllabus.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-center block font-sans text-[10px] tracking-[0.25em] uppercase py-3 border border-thin border-luxury-charcoal bg-luxury-espresso text-luxury-ivory hover:bg-transparent hover:text-luxury-espresso transition-all duration-500 mt-6"
                    >
                      VIEW SYLLABUS PDF
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div
                      onDragOver={handleSyllabusDragOver}
                      onDragLeave={handleSyllabusDragLeave}
                      onDrop={handleSyllabusDrop}
                      onClick={() => document.getElementById('syllabus-file-input')?.click()}
                      className={[
                        'relative cursor-pointer border border-dashed py-8 px-4 text-center transition-all duration-400 rounded-sm',
                        isDragOverSyllabus
                          ? 'border-luxury-gold bg-luxury-gold/5'
                          : localSyllabusFile
                          ? 'border-luxury-gold/40 bg-luxury-gold/[0.02]'
                          : 'border-luxury-charcoal/20 hover:border-luxury-gold/40 hover:bg-luxury-cream/50',
                      ].join(' ')}
                    >
                      <input
                        id="syllabus-file-input"
                        type="file"
                        accept=".pdf"
                        onChange={handleSyllabusFileChange}
                        className="sr-only"
                      />
                      {localSyllabusFile ? (
                        <div>
                          <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-luxury-gold mb-1 font-semibold">
                            FILE STAGED
                          </p>
                          <p className="font-sans text-xs text-luxury-espresso truncate max-w-[200px] mx-auto font-medium">
                            {localSyllabusFile.name}
                          </p>
                          <p className="font-sans text-[9px] tracking-widest text-luxury-taupe/60 mt-1">
                            {(localSyllabusFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="text-luxury-gold text-lg block mb-1">📁</span>
                          <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-luxury-charcoal mb-1 font-semibold">
                            Upload Latest GTU Syllabus (PDF)
                          </p>
                          <p className="font-sans text-[9px] tracking-widest text-luxury-taupe/40">
                            DRAG &amp; DROP OR CLICK
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateBlueprint}
                      disabled={generatingBlueprint || !selectedBranchCode || !selectedSemester || !selectedSubjectId || !localSyllabusFile}
                      className="w-full flex items-center justify-center gap-2 font-sans text-[10px] tracking-[0.2em] uppercase py-3 border border-thin border-luxury-charcoal bg-luxury-espresso text-luxury-ivory hover:bg-transparent hover:text-luxury-espresso disabled:opacity-30 disabled:hover:bg-luxury-espresso disabled:hover:text-luxury-ivory disabled:cursor-not-allowed transition-all duration-500 font-semibold"
                    >
                      {generatingBlueprint ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-luxury-ivory border-t-transparent rounded-full animate-spin" />
                          <span>COMPILING BLUEPRINT...</span>
                        </>
                      ) : (
                        'Generate IMP Question Blueprint PDF'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Papers Table (2/3 width) */}
            <div className="lg:col-span-2 border border-thin border-luxury-charcoal/10 bg-luxury-cream p-6 rounded-sm shadow-sm">
              <div className="flex justify-between items-center border-b border-thin border-luxury-charcoal/10 pb-4 mb-6">
                <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-luxury-gold font-semibold animate-none">
                  📄 Archival Papers Table
                </p>
                <span className="font-sans text-[9px] tracking-widest text-luxury-taupe uppercase">
                  {papers.length} DOCUMENTS
                </span>
              </div>

              {papers.length === 0 ? (
                <div className="py-16 text-center border border-thin border-dashed border-luxury-charcoal/10 bg-luxury-cream/40 rounded-sm">
                  <p className="font-sans text-xs tracking-wider text-luxury-taupe/60">
                    NO EXAM PAPERS ARCHIVED FOR THIS SUBJECT
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-thin border-luxury-charcoal/10">
                        <th className="py-3 font-sans text-[9px] tracking-[0.25em] uppercase text-luxury-taupe font-normal">
                          YEAR &amp; SEASON
                        </th>
                        <th className="py-3 font-sans text-[9px] tracking-[0.25em] uppercase text-luxury-taupe font-normal">
                          FILE TYPE
                        </th>
                        <th className="py-3 font-sans text-[9px] tracking-[0.25em] uppercase text-luxury-taupe font-normal text-right">
                          ACTION
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-luxury-charcoal/5">
                      {papers.map((paper) => (
                        <tr key={paper._id} className="hover:bg-luxury-ivory/20 transition-colors duration-300">
                          <td className="py-4 font-sans text-xs tracking-widest font-medium text-luxury-espresso uppercase">
                            {paper.year} {formatSeason(paper.examType)}
                          </td>
                          <td className="py-4">
                            <span className="font-sans text-[8px] tracking-[0.2em] uppercase text-luxury-taupe border border-luxury-charcoal/10 px-2 py-0.5">
                              {formatFileType(paper.title)}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <a
                              href={paper.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block font-sans text-[9px] tracking-[0.2em] uppercase text-luxury-gold hover:text-luxury-espresso transition-colors duration-300 border-b border-luxury-gold/20 hover:border-luxury-espresso/40 pb-0.5 font-medium"
                            >
                              VIEW PDF
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border border-thin border-dashed border-luxury-charcoal/10 p-16 text-center bg-luxury-cream/30"
          >
            <p className="font-sans text-xs tracking-[0.15em] uppercase text-luxury-taupe/60">
              PLEASE COMPLETE CASCADING SELECTOR STEP BY STEP TO REVEAL CURRICULUM MATERIALS
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
