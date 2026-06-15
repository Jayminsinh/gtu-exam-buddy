import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { PageHeader, Badge, EmptyState, LoadingSkeleton, CustomSelect } from '../components/ui';
import { Plus, Trash2, BookOpen, Loader2 } from '../components/ui/Icons';

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form input states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [branchId, setBranchId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [credits, setCredits] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // ─── Fetch All Relational Data Concurrently ────────────────
  useEffect(() => {
    const fetchMatrixData = async () => {
      try {
        const [subjectsRes, branchesRes, semestersRes] = await Promise.all([
          api.get('/subjects'),
          api.get('/branch'),
          api.get('/semester'),
        ]);

        setSubjects(subjectsRes.data?.data?.subjects || []);
        setBranches(branchesRes.data?.data || []);
        setSemesters(semestersRes.data?.data || []);
      } catch (error) {
        console.error('Failed to load subjects matrix data:', error);
        toast.error('Failed to retrieve subjects registry data.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatrixData();
  }, []);

  // ─── Handle Creation Form Submit ───────────────────────────
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    const creditsNum = parseInt(credits, 10);
    if (isNaN(creditsNum) || creditsNum < 1 || creditsNum > 10) {
      toast.error("Credits must be an integer between 1 and 10.");
      return;
    }
    if (!branchId || !semesterId) {
      toast.error("Branch and Semester relationships must be selected.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/subjects', {
        name,
        code,
        branch: branchId,
        semester: semesterId,
        credits: creditsNum,
      });

      const newSubject = response.data?.data;
      if (newSubject) {
        const matchedBranch = branches.find((b) => b._id === branchId);
        const matchedSemester = semesters.find((s) => s._id === semesterId);
        
        newSubject.branch = matchedBranch;
        newSubject.semester = matchedSemester;

        setSubjects((prev) => [...prev, newSubject]);
      }

      toast.success("Registry Entry Documented Successfully.");
      setName('');
      setCode('');
      setBranchId('');
      setSemesterId('');
      setCredits('');
    } catch (error) {
      const errMsg = error.response?.data?.errors?.[0]?.message || 
                     error.response?.data?.errors?.[0]?.msg || 
                     error.response?.data?.message || 
                     'Failed to create subject entry.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Handle Deletion ───────────────────────────────────────
  const handleDeleteSubject = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to delete this subject registry entry?')) {
      return;
    }

    try {
      await api.delete(`/subjects/${id}`);
      setSubjects((prev) => prev.filter((sub) => sub._id !== id));
      toast.success('Subject entry deleted successfully.');
    } catch (error) {
      console.error('Failed to delete subject:', error);
      const errMsg = error.response?.data?.message || 'Failed to delete subject.';
      toast.error(errMsg);
    }
  };

  const activeCount = subjects.filter(s => s.isActive !== false).length;

  return (
    <div className="w-full flex flex-col gap-6 max-w-[1200px] mx-auto animate-fade-in text-[#1a1a1a]">
      <PageHeader
        title="Subject Matrix"
        subtitle="Manage subject entries mapped to branches and semesters"
        badge={`${activeCount} Active`}
      />

      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-12' : ''} gap-6 items-start`}>
        {/* Left Column: Form Panel (Only visible for Admins) */}
        {isAdmin && (
          <div className="lg:col-span-4 bg-[#ffffff] border border-[#cfc2d6]/40 rounded-[12px] p-6 lg:sticky lg:top-[84px] shadow-sm flex flex-col">
            <div className="border-b border-[#cfc2d6]/30 pb-3.5 mb-5 flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.08em]">
                Register Subject
              </span>
            </div>

            <form onSubmit={handleCreateSubject} className="flex flex-col gap-5">
              {/* Branch Selector */}
              <div className="flex flex-col">
                <label
                  htmlFor="select-branch"
                  className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.06em] mb-2"
                >
                  Branch Relation
                </label>
                <CustomSelect
                  value={branchId}
                  onChange={(e) => {
                    setBranchId(e.target.value);
                    setSemesterId(''); // reset semester relation
                  }}
                  disabled={isSubmitting}
                  placeholder="Select branch..."
                  variant="light"
                  options={branches.map((b) => ({ value: b._id, label: `${b.code} — ${b.name}` }))}
                />
              </div>

              {/* Semester Selector */}
              <div className="flex flex-col">
                <label
                  htmlFor="select-semester"
                  className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.06em] mb-2"
                >
                  Semester Term
                </label>
                <CustomSelect
                  value={semesterId}
                  onChange={(e) => setSemesterId(e.target.value)}
                  disabled={isSubmitting || !branchId}
                  placeholder={branchId ? 'Select semester...' : 'First select branch...'}
                  variant="light"
                  options={semesters
                    .filter((s) => s.branch?._id === branchId)
                    .map((s) => ({ value: s._id, label: `Semester ${s.number}` }))}
                />
              </div>

              {/* Subject Code */}
              <div className="flex flex-col">
                <label
                  htmlFor="subject-code"
                  className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.06em] mb-2"
                >
                  Subject Code (GTU)
                </label>
                <input
                  id="subject-code"
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-10 bg-[#ffffff] border border-[#cfc2d6]/40 rounded-lg px-3 text-[14px] text-[#1a1a1a] outline-none placeholder:text-[#c9c6c0] focus:border-[#8026d3] focus:shadow-[0_0_0_3px_rgba(128,38,211,0.08)] disabled:opacity-50 disabled:cursor-not-allowed uppercase transition-all duration-150"
                  placeholder="e.g. 3140702"
                />
              </div>

              {/* Subject Name */}
              <div className="flex flex-col">
                <label
                  htmlFor="subject-name"
                  className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.06em] mb-2"
                >
                  Subject Name
                </label>
                <input
                  id="subject-name"
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 bg-[#ffffff] border border-[#cfc2d6]/40 rounded-lg px-3 text-[14px] text-[#1a1a1a] outline-none placeholder:text-[#c9c6c0] focus:border-[#8026d3] focus:shadow-[0_0_0_3px_rgba(128,38,211,0.08)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                  placeholder="e.g. Object Oriented Programming"
                />
              </div>

              {/* Subject Credits */}
              <div className="flex flex-col">
                <label
                  htmlFor="subject-credits"
                  className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.06em] mb-2"
                >
                  Credits
                </label>
                <input
                  id="subject-credits"
                  type="number"
                  required
                  disabled={isSubmitting}
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                  className="w-full h-10 bg-[#ffffff] border border-[#cfc2d6]/40 rounded-lg px-3 text-[14px] text-[#1a1a1a] outline-none placeholder:text-[#c9c6c0] focus:border-[#8026d3] focus:shadow-[0_0_0_3px_rgba(128,38,211,0.08)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                  placeholder="e.g. 4"
                  min="1"
                  max="10"
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
                    <span>Documenting...</span>
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    <span>Document Entry</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Right Column: Subjects Table View */}
        <div className={isAdmin ? 'lg:col-span-8' : 'w-full'}>
          {loading ? (
            <div className="bg-[#ffffff] border border-[#cfc2d6]/40 rounded-[10px] p-0 shadow-sm">
              <LoadingSkeleton rows={5} columns={['15%', '40%', '15%', '15%', '15%']} />
            </div>
          ) : subjects.length === 0 ? (
            <div className="bg-[#ffffff] border border-[#cfc2d6]/40 rounded-[10px] p-6 text-center shadow-sm">
              <EmptyState
                Icon={BookOpen}
                title="No registered subjects found"
                description="Use the side panel to add course subject records to the registry."
              />
            </div>
          ) : (
            <div className="w-full overflow-hidden border border-[#cfc2d6]/40 bg-[#ffffff] rounded-[10px] shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#cfc2d6]/35 bg-[#fcfbf9]">
                      <th className="py-3.5 px-5 font-ui text-[10px] tracking-[0.2em] uppercase text-[#76746f] font-bold w-1/6">
                        Code
                      </th>
                      <th className="py-3.5 px-5 font-ui text-[10px] tracking-[0.2em] uppercase text-[#76746f] font-bold w-2/5">
                        Subject Name
                      </th>
                      <th className="py-3.5 px-5 font-ui text-[10px] tracking-[0.2em] uppercase text-[#76746f] font-bold w-1/6">
                        Branch
                      </th>
                      <th className="py-3.5 px-5 font-ui text-[10px] tracking-[0.2em] uppercase text-[#76746f] font-bold w-1/6">
                        Semester
                      </th>
                      <th className="py-3.5 px-5 font-ui text-[10px] tracking-[0.2em] uppercase text-[#76746f] font-bold w-1/12">
                        Credits
                      </th>
                      {isAdmin && (
                        <th className="py-3.5 px-5 font-ui text-[10px] tracking-[0.2em] uppercase text-[#76746f] font-bold w-1/6 text-right">
                          Action
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#cfc2d6]/25">
                    {subjects.map((sub) => (
                      <tr
                        key={sub._id}
                        className="hover:bg-[#8026d3]/3 transition-colors duration-150 group"
                      >
                        <td className="py-4 px-5 font-mono text-[13px] tracking-wide text-[#8026d3] font-bold uppercase">
                          {sub.code}
                        </td>
                        <td className="py-4 px-5 text-[14px] font-semibold text-[#1a1a1a]">
                          {sub.name}
                        </td>
                        <td className="py-4 px-5 font-mono text-[12px] text-[#666666] uppercase font-semibold">
                          {sub.branch?.code || 'UNMAPPED'}
                        </td>
                        <td className="py-4 px-5">
                          <Badge variant="gold" size="sm">
                            {sub.semester?.number ? `Sem ${sub.semester.number}` : 'UNMAPPED'}
                          </Badge>
                        </td>
                        <td className="py-4 px-5 text-[13.5px] text-[#666666] font-semibold">
                          {sub.credits}
                        </td>
                        {isAdmin && (
                          <td className="py-4 px-5 text-right">
                            <button
                               onClick={() => handleDeleteSubject(sub._id)}
                               className="p-1.5 text-[#666666] hover:text-[#ff4d4d] hover:bg-[#ff4d4d]/10 rounded-md transition-all duration-120 inline-flex items-center gap-1 cursor-pointer"
                              title="Delete Subject"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
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
