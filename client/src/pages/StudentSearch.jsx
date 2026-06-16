import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../utils/api';
import {
  Badge,
  EmptyState,
  FileUploadZone,
  CustomSelect
} from '../components/ui';
import {
  FileText,
  ExternalLink,
  Sparkles,
  Loader2,
  Search
} from '../components/ui/Icons';

// ─── Study Quotes for compile waiting state ────────────────
const STUDY_QUOTES = [
  "Did you know? Reviewing past papers before reading the syllabus can improve recall by up to 35%.",
  "GTU Tip: Always draw clean block diagrams in 7-mark questions to secure maximum points.",
  "Keep going! 'The beautiful thing about learning is that no one can take it away from you.' — B.B. King",
  "Strategy: Target high-frequency chapters first. Quality of review beats quantity of reading.",
  "Did you know? Active recall and spacing out revision cycles is the most proven way to retain formulas.",
  "GTU Tip: Keep your answer handwriting clean and structure points using bold headings.",
  "Practice: Solving at least 3 previous years' papers reduces exam anxiety by 40%."
];

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
  const [generatingBlueprint, setGeneratingBlueprint] = useState(false);
  const [downloadBlobUrl, setDownloadBlobUrl] = useState(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // States for Compile Waiting UX
  const [activeQuoteIdx, setActiveQuoteIdx] = useState(0);
  const [progressVal, setProgressVal] = useState(0);

  // Rotate quotes while compiling is in progress
  useEffect(() => {
    let quoteInterval;
    if (generatingBlueprint) {
      setActiveQuoteIdx(0);
      quoteInterval = setInterval(() => {
        setActiveQuoteIdx((prev) => (prev + 1) % STUDY_QUOTES.length);
      }, 3500);
    }
    return () => clearInterval(quoteInterval);
  }, [generatingBlueprint]);

  // Simulate progress ticker while compiling
  useEffect(() => {
    let progInterval;
    if (generatingBlueprint) {
      setProgressVal(0);
      progInterval = setInterval(() => {
        setProgressVal((prev) => {
          if (prev >= 98) return prev;
          const next = prev + Math.floor(Math.random() * 8) + 2;
          return next > 98 ? 98 : next;
        });
      }, 300);
    } else {
      setProgressVal(0);
    }
    return () => clearInterval(progInterval);
  }, [generatingBlueprint]);

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

  // ─── Staged Local Syllabus Selection Handlers ──────────────
  const handleSyllabusSelect = (file) => {
    if (!file) {
      setLocalSyllabusFile(null);
      return;
    }

    setLocalSyllabusFile(file);
    toast.success('Local syllabus PDF staged successfully.');
  };

  const handleSyllabusClear = () => {
    setLocalSyllabusFile(null);
    toast.info('Staged syllabus cleared.');
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
      
      setDownloadBlobUrl(downloadUrl);
      setShowDownloadModal(true);
      toast.success('IMP Blueprint PDF compiled successfully.');
    } catch (error) {
      console.error('Failed to generate blueprint PDF:', error);
      let serverMessage = 'Failed to compile blueprint PDF. Please try again.';
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const parsed = JSON.parse(text);
          console.error('Server response JSON:', parsed);
          if (parsed.message) {
            serverMessage = parsed.message;
          }
        } catch (parseErr) {
          console.error('Failed to parse error blob:', parseErr);
        }
      } else if (error.response?.data?.message) {
        serverMessage = error.response.data.message;
      }
      toast.error(serverMessage);
    } finally {
      setGeneratingBlueprint(false);
    }
  };

  const handleDownloadConfirm = () => {
    if (!downloadBlobUrl || !selectedSubject) return;
    
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = downloadBlobUrl;
    link.download = `GTU-IMP-Blueprint-${selectedSubject.code}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Revoke and close
    window.URL.revokeObjectURL(downloadBlobUrl);
    setDownloadBlobUrl(null);
    setShowDownloadModal(false);
    toast.success('Document downloaded successfully.');
  };

  const handleCloseDownloadModal = () => {
    if (downloadBlobUrl) {
      window.URL.revokeObjectURL(downloadBlobUrl);
      setDownloadBlobUrl(null);
    }
    setShowDownloadModal(false);
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
    <div className="w-full flex flex-col gap-8 max-w-[1200px] mx-auto animate-fade-in text-[#1a1a1a]">
      {/* Fullscreen Compiling overlay wait screen */}
      <AnimatePresence>
        {generatingBlueprint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#faf6ef]/95 backdrop-blur-[16px] z-50 flex flex-col items-center justify-center p-6 text-center select-none"
          >
            {/* Grain Overlay */}
            <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.012] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9Ii4xIi8+Cjwvc3ZnPg==')] bg-repeat" />

            <div className="max-w-[480px] w-full flex flex-col items-center gap-6">
              {/* Spinner ring */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-[#8026d3]/10" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-4 border-t-[#8026d3] border-r-transparent border-b-transparent border-l-transparent"
                />
                <span className="font-mono text-[14.5px] font-bold text-[#8026d3]">
                  {progressVal}%
                </span>
              </div>

              {/* Status Header */}
              <div className="flex flex-col gap-1.5 mt-2">
                <h3 className="font-display text-[22px] font-bold text-[#1a1a1a]">
                  Compiling IMP Blueprint
                </h3>
                <p className="text-[13px] font-mono text-[#8026d3] uppercase tracking-[0.15em] font-bold">
                  {progressVal < 35 
                    ? "Reading syllabus structure..." 
                    : progressVal < 70 
                      ? "Cross-referencing past exam archives..." 
                      : "Calculating key chapter priorities..."}
                </p>
              </div>

              {/* Quotes & Tips Box */}
              <motion.div
                key={activeQuoteIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="bg-[#ffffff] border border-[#cfc2d6]/40 rounded-2xl p-5 shadow-[0_8px_30px_rgba(128,38,211,0.03)] w-full min-h-[105px] flex items-center justify-center"
              >
                <p className="text-[14px] text-[#4c4354] leading-relaxed italic font-semibold">
                  {STUDY_QUOTES[activeQuoteIdx]}
                </p>
              </motion.div>

              <p className="text-[11px] text-[#76746f] mt-4 tracking-wide font-medium">
                This compiles instantly using our high-speed local engine. Please keep this window active.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION 1 — PAGE HEADER */}
      <div className="flex flex-col">
        <h2 className="font-display text-[2.25rem] md:text-[2.75rem] text-[#1a1a1a] italic tracking-[-0.025em] font-normal">
          Exam Archive
        </h2>
        <p className="text-[15px] font-ui text-[#666666] mt-2 max-w-[540px] leading-relaxed font-medium">
          Discover past papers and generate AI-powered study blueprints for your subjects
        </p>
        <div className="border-b border-[#cfc2d6]/30 mt-6 mb-2" />
      </div>

      {/* SECTION 2 — SELECTION FLOW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#ffffff] border border-[#cfc2d6]/40 p-6 rounded-[12px] shadow-[0_8px_30px_rgba(128,38,211,0.015)]">
        {/* Step 1: Branch Select */}
        <div className="relative flex flex-col">
          <span className="absolute top-0 right-0 font-mono text-[10px] text-[#8026d3]/40 font-bold tracking-wide">
            01
          </span>
          <label className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.08em] mb-2">
            Branch
          </label>
          <CustomSelect
            value={selectedBranchId}
            onChange={handleBranchChange}
            disabled={loadingBranches}
            placeholder="Select Branch..."
            variant="light"
            options={branches.map(b => ({ value: b._id, label: `${b.name} ${b.code ? `(${b.code})` : ''}` }))}
          />
        </div>

        {/* Step 2: Semester Select */}
        <div className="relative flex flex-col">
          <span className="absolute top-0 right-0 font-mono text-[10px] text-[#8026d3]/40 font-bold tracking-wide">
            02
          </span>
          <label className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.08em] mb-2">
            Semester
          </label>
          <CustomSelect
            value={selectedSemester}
            onChange={handleSemesterChange}
            disabled={!selectedBranchId}
            placeholder="Select Semester..."
            variant="light"
            options={Array.from({ length: 8 }, (_, i) => i + 1).map(num => ({ value: num, label: `Semester ${num}` }))}
          />
        </div>

        {/* Step 3: Subject Select */}
        <div className="relative flex flex-col">
          <span className="absolute top-0 right-0 font-mono text-[10px] text-[#8026d3]/40 font-bold tracking-wide">
            03
          </span>
          <label className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.08em] mb-2">
            Subject
          </label>
          <CustomSelect
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            disabled={!selectedSemester || subjects.length === 0 || loadingSubjects}
            placeholder={loadingSubjects ? "Loading courses..." : subjects.length === 0 ? "No courses registered..." : "Select Course Subject..."}
            variant="light"
            options={subjects.map(sub => ({ value: sub._id, label: `${sub.code} — ${sub.name}` }))}
          />
        </div>
      </div>

      {/* Main viewport transition */}
      <AnimatePresence mode="wait">
        {loadingSyllabusAndPapers ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="py-24 text-center flex flex-col items-center justify-center"
          >
            <Loader2 className="text-[#8026d3] animate-spin mb-4" size={32} />
            <p className="font-mono text-xs tracking-widest text-[#76746f] uppercase animate-pulse font-bold">
              Retrieving classroom resources...
            </p>
          </motion.div>
        ) : selectedSubject ? (
          <motion.div
            key="resources"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6"
          >
            {/* SECTION 3 — SUBJECT INFO CARD */}
            <div className="bg-[#ffffff] border-l-4 border-[#8026d3] border-y border-r border-[#cfc2d6]/40 rounded-[10px] px-6 py-5 flex items-center justify-between flex-wrap gap-4 animate-fade-up shadow-[0_4px_20px_rgba(128,38,211,0.01)]">
              <div className="flex flex-col">
                <h3 className="font-display text-[18px] text-[#1a1a1a] font-bold">
                  {selectedSubject.name}
                </h3>
                <span className="font-mono text-[12px] text-[#666666] mt-1 tracking-wide font-semibold">
                  {selectedSubject.code}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="default" size="sm">
                  {selectedBranchCode || 'Branch'}
                </Badge>
                <Badge variant="gold" size="sm">
                  Sem {selectedSemester}
                </Badge>
                <Badge variant="default" size="sm">
                  {selectedSubject.credits || 0} Credits
                </Badge>
              </div>
            </div>

            {/* SECTION 4 — RESOURCE PANELS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Syllabus Card (40%) */}
              <div className="lg:col-span-5 bg-[#ffffff] border border-[#cfc2d6]/40 rounded-[12px] overflow-hidden flex flex-col shadow-sm">
                {/* Header */}
                <div className="bg-[#fcfbf9] border-b border-[#cfc2d6]/30 py-3.5 px-5 flex items-center gap-2">
                  <FileText size={14} className="text-[#8026d3]" />
                  <span className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.08em]">
                    Syllabus Module
                  </span>
                </div>
                
                {/* Body */}
                <div className="p-5">
                  {syllabus ? (
                    <div className="flex flex-col bg-[#f6f3f2] border border-[#cfc2d6]/25 rounded-[8px] p-4 gap-3.5">
                      <div className="flex items-start gap-3">
                        <FileText size={20} className="text-[#8026d3] mt-0.5 shrink-0" />
                        <div className="overflow-hidden">
                          <p className="text-[13px] text-[#1a1a1a] font-semibold truncate">
                            Official syllabus reference
                          </p>
                          <p className="text-[11px] text-[#666666] mt-1 font-medium">
                            Academic Year: {syllabus.academicYear || '—'} · Version: {syllabus.version || '1.0'}
                          </p>
                        </div>
                      </div>
                      <a
                        href={syllabus.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-8 border border-[#8026d3]/20 text-[#8026d3] hover:bg-[#8026d3]/5 flex items-center justify-center gap-1.5 rounded-md text-[12px] font-bold tracking-wide transition-all duration-150"
                      >
                        <span>View Syllabus</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  ) : (
                    <EmptyState
                      Icon={FileText}
                      title="No syllabus indexed"
                      description="The administrator hasn't uploaded a syllabus for this subject yet."
                    />
                  )}
                </div>
              </div>

              {/* Right Column: Past Papers (60%) */}
              <div className="lg:col-span-7 bg-[#ffffff] border border-[#cfc2d6]/40 rounded-[12px] overflow-hidden flex flex-col shadow-sm">
                {/* Header */}
                <div className="bg-[#fcfbf9] border-b border-[#cfc2d6]/30 py-3.5 px-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-[#8026d3]" />
                    <span className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.08em]">
                      Past Papers
                    </span>
                  </div>
                  {papers.length > 0 && (
                    <Badge variant="gold" size="sm">
                      {papers.length} Papers
                    </Badge>
                  )}
                </div>

                {/* Body */}
                <div className="divide-y divide-[#cfc2d6]/25">
                  {papers.length === 0 ? (
                    <EmptyState
                      Icon={Search}
                      title="No papers in archive"
                      description="Papers for this subject haven't been uploaded yet."
                    />
                  ) : (
                    papers.map((paper) => (
                      <div
                        key={paper._id}
                        className="py-3.5 px-5 flex items-center justify-between gap-4 hover:bg-[#8026d3]/3 transition-colors duration-120 group"
                      >
                        <div className="flex items-center gap-3.5 overflow-hidden">
                          {/* Year Badge */}
                          <span className="font-mono text-[10px] font-bold text-[#8026d3] bg-[#8026d3]/8 px-2 py-1 rounded-[4px] shrink-0 min-w-[56px] text-center border border-[#8026d3]/15">
                            {paper.year}
                          </span>
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <Badge variant={paper.examType === 'summer' ? 'summer' : paper.examType === 'winter' ? 'winter' : 'remedial'} size="sm">
                              {formatSeason(paper.examType)}
                            </Badge>
                            <span className="text-[13px] text-[#4c4354] font-ui truncate font-semibold">
                              {formatFileType(paper.title)}
                            </span>
                          </div>
                        </div>

                        <a
                          href={paper.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-[#76746f] hover:text-[#8026d3] hover:bg-[#8026d3]/8 rounded-md transition-all duration-120 shrink-0"
                        >
                          <ExternalLink size={15} />
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 5 — AI BLUEPRINT GENERATOR */}
            <div className="bg-[rgba(128,38,211,0.02)] border border-[rgba(128,38,211,0.14)] rounded-[14px] p-6 md:p-8 flex flex-col gap-5 mt-4">
              {/* Header row */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={20} className="text-[#8026d3]" />
                  <h3 className="text-[17px] font-bold text-[#1a1a1a] font-ui">
                    AI Blueprint Generator
                  </h3>
                </div>
                <Badge variant="ai" size="sm">
                  Gemini AI
                </Badge>
              </div>

              {/* Description */}
              <p className="text-[13.5px] text-[#4c4354] leading-relaxed max-w-[480px] font-medium">
                Stage an official GTU syllabus document to evaluate chapter weightage distributions and construct tailored question structures dynamically.
              </p>

              {/* PDF upload zone */}
              <div className="max-w-[480px]">
                <FileUploadZone
                  accept=".pdf,application/pdf"
                  maxSizeMB={5}
                  onFileSelect={handleSyllabusSelect}
                  selectedFile={localSyllabusFile}
                  onClear={handleSyllabusClear}
                  variant="ai"
                  disabled={generatingBlueprint}
                />
              </div>

              {/* Action trigger button */}
              <button
                type="button"
                onClick={handleGenerateBlueprint}
                disabled={generatingBlueprint || !localSyllabusFile}
                className="h-12 w-full max-w-[480px] bg-gradient-to-r from-[#8026d3] to-[#a04df3] hover:brightness-[1.1] hover:translate-y-[-1.5px] hover:shadow-[0_10px_28px_rgba(128,38,211,0.25)] active:brightness-[0.95] active:translate-y-0 rounded-lg text-[15px] font-bold text-white tracking-wide flex items-center justify-center gap-2 mt-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-180 ease-out cursor-pointer shadow-sm"
              >
                {generatingBlueprint ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    <span>Generating Blueprint...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={17} />
                    <span>Generate IMP Blueprint PDF</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-dashed border-[#cfc2d6] rounded-[12px] p-16 text-center bg-[#ffffff]/35 animate-fade-in shadow-[0_8px_30px_rgba(128,38,211,0.01)]"
          >
            <p className="font-ui text-xs tracking-[0.15em] text-[#76746f] uppercase leading-relaxed max-w-md mx-auto font-bold">
              Please complete selectors step by step to load archival GTU past papers and start AI blueprint compile pipelines
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Professional Download Modal Popup */}
      <AnimatePresence>
        {showDownloadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDownloadModal}
              className="absolute inset-0 bg-[#1c1917]/40 backdrop-blur-[4px]"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative bg-[#ffffff] border border-[#cfc2d6]/50 rounded-2xl p-6 md:p-8 max-w-[440px] w-full shadow-[0_24px_48px_-12px_rgba(128,38,211,0.15)] flex flex-col items-center text-center z-10"
            >
              {/* Success Badge Graphic */}
              <div className="w-16 h-16 rounded-full bg-[#8026d3]/10 border border-[#8026d3]/20 flex items-center justify-center text-[#8026d3] mb-5">
                <Sparkles size={28} />
              </div>

              {/* Title */}
              <h3 className="font-display text-[20px] font-bold text-[#1a1a1a] mb-2">
                Blueprint Compiled!
              </h3>
              
              <p className="text-[13.5px] text-[#666666] leading-relaxed mb-6">
                Your customized prep strategy for <strong className="text-[#1a1a1a] font-semibold">{selectedSubject?.name || 'Subject'}</strong> is compiled and ready for download.
              </p>

              {/* Subject details card inside modal */}
              <div className="w-full bg-[#fcfbf9] border border-[#cfc2d6]/30 rounded-xl p-4 mb-6 flex flex-col gap-2.5 text-left">
                <div className="flex justify-between text-xs">
                  <span className="text-[#76746f] font-semibold tracking-wider uppercase">Subject Code</span>
                  <span className="font-mono font-bold text-[#1a1a1a]">{selectedSubject?.code}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-[#cfc2d6]/20 pt-2.5">
                  <span className="text-[#76746f] font-semibold tracking-wider uppercase">Branch</span>
                  <span className="font-bold text-[#8026d3]">{selectedBranchCode || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-[#cfc2d6]/20 pt-2.5">
                  <span className="text-[#76746f] font-semibold tracking-wider uppercase">Semester</span>
                  <span className="font-bold text-[#1a1a1a]">Semester {selectedSemester}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  type="button"
                  onClick={handleCloseDownloadModal}
                  className="order-2 sm:order-1 flex-1 h-11 border border-[#cfc2d6] text-[#4c4354] hover:bg-[#fcfbf9] rounded-xl text-[13.5px] font-semibold tracking-wide transition-all duration-150 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleDownloadConfirm}
                  className="order-1 sm:order-2 flex-1 h-11 bg-[#8026d3] hover:bg-[#9b47ed] text-[#ffffff] hover:shadow-[0_8px_20px_rgba(128,38,211,0.15)] rounded-xl text-[13.5px] font-bold tracking-wide transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileText size={14} />
                  <span>Download PDF</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
