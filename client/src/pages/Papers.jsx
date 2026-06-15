import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { PageHeader, Badge, EmptyState, LoadingSkeleton, FileUploadZone, CustomSelect } from '../components/ui';
import { Plus, Trash2, FileText, ExternalLink, Loader2 } from '../components/ui/Icons';

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
  const [totalPapers, setTotalPapers] = useState(0);
  const [loading, setLoading] = useState(true);

  // ─── Upload Form States ──────────────────────────────────
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [year, setYear] = useState('');
  const [examType, setExamType] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // ─── Concurrent Data Fetch ───────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [papersRes, subjectsRes] = await Promise.all([
          api.get('/papers', { params: { limit: 0 } }),
          api.get('/subjects'),
        ]);

        const papersData = papersRes.data?.data;
        setPapers(papersData?.papers || []);
        setTotalPapers(papersData?.totalPapers ?? (papersData?.papers?.length || 0));
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

  // ─── File Selection Handlers ──────────────────────────
  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) {
      setFile(null);
      return;
    }
    setFile(selectedFile);
    toast.success('Document file staged successfully.');
  };

  const handleFileClear = () => {
    setFile(null);
    toast.info('Staged file cleared.');
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
        setTotalPapers((prev) => prev + 1);
      }

      toast.success('Document archived successfully.');

      // Reset form
      setTitle('');
      setSelectedSubjectId('');
      setYear('');
      setExamType('');
      setFile(null);
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
      setTotalPapers((prev) => Math.max(0, prev - 1));
      toast.success('Archived paper deleted successfully.');
    } catch (error) {
      console.error('Failed to delete paper:', error);
      const errMsg = error.response?.data?.message || 'Failed to delete paper.';
      toast.error(errMsg);
    }
  };

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
    <div className="w-full flex flex-col gap-6 max-w-[1200px] mx-auto animate-fade-in text-[#1a1a1a]">
      <PageHeader
        title="Archival Papers"
        subtitle="Manage archival GTU past papers and academic keys"
        badge={`${totalPapers} Documents`}
      />

      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-12' : ''} gap-6 items-start`}>
        {/* Left Column: Form Panel (Only visible for Admins) */}
        {isAdmin && (
          <div className="lg:col-span-4 bg-[#ffffff] border border-[#cfc2d6]/40 rounded-[12px] p-6 lg:sticky lg:top-[84px] shadow-sm flex flex-col">
            <div className="border-b border-[#cfc2d6]/30 pb-3.5 mb-5 flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.08em]">
                Upload Paper
              </span>
            </div>

            <form onSubmit={handleUpload} className="flex flex-col gap-5">
              {/* Document Title */}
              <div className="flex flex-col">
                <label
                  htmlFor="paper-title"
                  className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.06em] mb-2"
                >
                  Document Title
                </label>
                <input
                  id="paper-title"
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-10 bg-[#ffffff] border border-[#cfc2d6]/40 rounded-lg px-3 text-[14px] text-[#1a1a1a] outline-none placeholder:text-[#c9c6c0] focus:border-[#8026d3] focus:shadow-[0_0_0_3px_rgba(128,38,211,0.08)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                  placeholder="e.g. OOP Winter 2024 Paper"
                />
              </div>

              {/* Subject Selector */}
              <div className="flex flex-col">
                <label
                  htmlFor="paper-subject"
                  className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.06em] mb-2"
                >
                  Subject Reference
                </label>
                <CustomSelect
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Select subject..."
                  variant="light"
                  options={subjects.map((sub) => ({ value: sub._id, label: `${sub.code} — ${sub.name}` }))}
                />
              </div>

              {/* Year & Exam Type Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Year Select */}
                <div className="flex flex-col">
                  <label
                    htmlFor="paper-year"
                    className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.06em] mb-2"
                  >
                    Exam Year
                  </label>
                  <CustomSelect
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Year..."
                    variant="light"
                    options={YEAR_OPTIONS.map((y) => ({ value: String(y), label: String(y) }))}
                  />
                </div>

                {/* Exam Type Select */}
                <div className="flex flex-col">
                  <label
                    htmlFor="paper-exam-type"
                    className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.06em] mb-2"
                  >
                    Exam Type
                  </label>
                  <CustomSelect
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Type..."
                    variant="light"
                    options={EXAM_TYPES}
                  />
                </div>
              </div>

              {/* Upload File Zone */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.06em] mb-2.5">
                  Academic Document
                </label>
                <FileUploadZone
                  accept=".pdf,application/pdf"
                  maxSizeMB={5}
                  onFileSelect={handleFileSelect}
                  selectedFile={file}
                  onClear={handleFileClear}
                  variant="ai"
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 bg-gradient-to-r from-[#8026d3] to-[#a04df3] hover:brightness-[1.08] hover:translate-y-[-0.5px] hover:shadow-[0_6px_20px_rgba(128,38,211,0.2)] active:brightness-[0.96] active:translate-y-[0] rounded-lg text-[13.5px] font-semibold text-[#ffffff] tracking-wide flex items-center justify-center gap-1.5 mt-2 disabled:opacity-65 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-150 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Archiving...</span>
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    <span>Archive Document</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Right Column: Papers Table View */}
        <div className={isAdmin ? 'lg:col-span-8' : 'w-full'}>
          {loading ? (
            <div className="bg-[#ffffff] border border-[#cfc2d6]/40 rounded-[10px] p-0 shadow-sm">
              <LoadingSkeleton rows={5} columns={['20%', '35%', '15%', '15%', '15%']} />
            </div>
          ) : papers.length === 0 ? (
            <div className="bg-[#ffffff] border border-[#cfc2d6]/40 rounded-[10px] p-6 text-center shadow-sm">
              <EmptyState
                Icon={FileText}
                title="No archived papers found"
                description="Use the upload panel to insert past paper documents into the system."
              />
            </div>
          ) : (
            <div className="w-full overflow-hidden border border-[#cfc2d6]/40 bg-[#ffffff] rounded-[10px] shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#cfc2d6]/35 bg-[#fcfbf9]">
                      <th className="py-3.5 px-5 font-ui text-[10px] tracking-[0.2em] uppercase text-[#76746f] font-bold w-1/4">
                        Year &amp; Season
                      </th>
                      <th className="py-3.5 px-5 font-ui text-[10px] tracking-[0.2em] uppercase text-[#76746f] font-bold w-1/3">
                        Subject
                      </th>
                      <th className="py-3.5 px-5 font-ui text-[10px] tracking-[0.2em] uppercase text-[#76746f] font-bold w-1/6">
                        File Type
                      </th>
                      <th className="py-3.5 px-5 font-ui text-[10px] tracking-[0.2em] uppercase text-[#76746f] font-bold w-1/12">
                        Branch
                      </th>
                      <th className="py-3.5 px-5 font-ui text-[10px] tracking-[0.2em] uppercase text-[#76746f] font-bold w-1/5 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#cfc2d6]/25">
                    {papers.map((paper) => (
                      <tr
                        key={paper._id}
                        className="hover:bg-[#8026d3]/3 transition-colors duration-150 group"
                      >
                        <td className="py-4 px-5 font-mono text-[13px] tracking-wide text-[#8026d3] font-bold uppercase">
                          {paper.year} {formatSeason(paper.examType)}
                        </td>
                        <td className="py-4 px-5 text-[14px] font-semibold text-[#1a1a1a]">
                          {paper.subject}
                        </td>
                        <td className="py-4 px-5">
                          <Badge variant="default" size="sm">
                            {formatFileType(paper.title)}
                          </Badge>
                        </td>
                        <td className="py-4 px-5 font-mono text-[12px] text-[#666666] uppercase font-semibold">
                          {paper.branch || '—'}
                        </td>
                        <td className="py-4 px-5 text-right space-x-2">
                          <a
                            href={paper.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-[#8026d3] hover:text-[#a04df3] hover:bg-[#8026d3]/8 rounded-md transition-all duration-120 inline-flex items-center"
                            title="View Document"
                          >
                            <ExternalLink size={14} />
                          </a>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeletePaper(paper._id)}
                               className="p-1.5 text-[#666666] hover:text-[#ff4d4d] hover:bg-[#ff4d4d]/10 rounded-md transition-all duration-120 inline-flex items-center cursor-pointer"
                              title="Delete Paper"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
