import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { PageHeader, Badge, EmptyState, LoadingSkeleton, CustomSelect } from '../components/ui';
import { Plus, Trash2, CalendarDays, Loader2 } from '../components/ui/Icons';

export default function Semesters() {
  const [semesters, setSemesters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [number, setNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // ─── Fetch Semesters & Branches Concurrently ──────────────
  useEffect(() => {
    const fetchRegistryData = async () => {
      try {
        const [semestersRes, branchesRes] = await Promise.all([
          api.get('/semester'),
          api.get('/branch'),
        ]);
        setSemesters(semestersRes.data?.data || []);
        
        // Only keep active branches for the dropdown select list
        const activeBranches = (branchesRes.data?.data || []).filter(
          (b) => b.isActive !== false
        );
        setBranches(activeBranches);
      } catch (error) {
        console.error('Failed to load semester registry payload:', error);
        toast.error('Failed to retrieve academic semesters registry.');
      } finally {
        setLoading(false);
      }
    };

    fetchRegistryData();
  }, []);

  // ─── Handle Creation Form Submit ───────────────────────────
  const handleCreateSemester = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    const termNumber = parseInt(number, 10);
    if (isNaN(termNumber) || termNumber < 1 || termNumber > 8) {
      toast.error("Term must be between 1 and 8.");
      return;
    }
    if (!branch) {
      toast.error("A parent branch reference is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/semester', {
        number: termNumber,
        branch,
      });
      const newSemester = response.data?.data;

      if (newSemester) {
        setSemesters((prev) => {
          const updated = [...prev, newSemester];
          // Sort sequentially by term number
          return updated.sort((a, b) => a.number - b.number);
        });
      }

      toast.success("Registry Entry Documented Successfully.");
      setNumber('');
      setBranch('');
    } catch (error) {
      const errMsg = error.response?.data?.errors?.[0]?.message || 
                     error.response?.data?.errors?.[0]?.msg || 
                     error.response?.data?.message || 
                     'Failed to create academic term.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Handle Deletion ───────────────────────────────────────
  const handleDeleteSemester = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to delete this academic semester term?')) {
      return;
    }

    try {
      await api.delete(`/semester/${id}`);
      setSemesters((prev) => prev.filter((s) => s._id !== id));
      toast.success('Semester entry deleted successfully.');
    } catch (error) {
      console.error('Failed to delete semester:', error);
      const errMsg = error.response?.data?.message || 'Failed to delete semester.';
      toast.error(errMsg);
    }
  };

  const formatSemesterNum = (num) => {
    return `Semester ${String(num).padStart(2, '0')}`;
  };

  const activeCount = semesters.filter(s => s.isActive !== false).length;

  return (
    <div className="w-full flex flex-col gap-6 max-w-[1200px] mx-auto animate-fade-in">
      <PageHeader
        title="Semester Registry"
        subtitle="Manage semester definitions by branch"
        badge={`${activeCount} Active`}
      />

      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-12' : ''} gap-6 items-start`}>
        {/* Left Column: Form Panel (Only visible for Admins) */}
        {isAdmin && (
          <div className="lg:col-span-4 bg-[#ffffff] border border-[#cfc2d6]/40 rounded-[12px] p-6 lg:sticky lg:top-[84px] shadow-sm flex flex-col">
            <div className="border-b border-[#cfc2d6]/30 pb-3.5 mb-5 flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.08em]">
                Add Semester
              </span>
            </div>

            <form onSubmit={handleCreateSemester} className="flex flex-col gap-5">
              {/* Branch Relation Dropdown */}
              <div className="flex flex-col">
                <label
                  htmlFor="parent-branch"
                  className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.06em] mb-2"
                >
                  Branch Relation
                </label>
                <CustomSelect
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Select branch..."
                  variant="light"
                  options={branches.map((b) => ({ value: b._id, label: `${b.code} — ${b.name}` }))}
                />
              </div>

              {/* Term Number Input */}
              <div className="flex flex-col">
                <label
                  htmlFor="semester-number"
                  className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.06em] mb-2"
                >
                  Term Number
                </label>
                <input
                  id="semester-number"
                  type="number"
                  required
                  disabled={isSubmitting}
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="w-full h-10 bg-[#ffffff] border border-[#cfc2d6]/40 rounded-lg px-3 text-[14px] text-[#1a1a1a] outline-none placeholder:text-[#c9c6c0] focus:border-[#8026d3] focus:shadow-[0_0_0_3px_rgba(128,38,211,0.08)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                  placeholder="e.g. 4"
                  min="1"
                  max="8"
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

        {/* Right Column: Semesters Table View */}
        <div className={isAdmin ? 'lg:col-span-8' : 'w-full'}>
          {loading ? (
            <div className="bg-[#ffffff] border border-[#cfc2d6]/40 rounded-[10px] p-0 shadow-sm">
              <LoadingSkeleton rows={5} columns={['30%', '30%', '20%', '20%']} />
            </div>
          ) : semesters.length === 0 ? (
            <div className="bg-[#ffffff] border border-[#cfc2d6]/40 rounded-[10px] p-6 text-center shadow-sm">
              <EmptyState
                Icon={CalendarDays}
                title="No registered terms found"
                description="Use the side panel to add academic semester documents to the repository."
              />
            </div>
          ) : (
            <div className="w-full overflow-hidden border border-[#cfc2d6]/40 bg-[#ffffff] rounded-[10px] shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#cfc2d6]/35 bg-[#fcfbf9]">
                      <th className="py-3.5 px-5 font-ui text-[10px] tracking-[0.2em] uppercase text-[#76746f] font-bold w-1/3">
                        Semester Term
                      </th>
                      <th className="py-3.5 px-5 font-ui text-[10px] tracking-[0.2em] uppercase text-[#76746f] font-bold w-1/3">
                        Parent Branch Code
                      </th>
                      <th className="py-3.5 px-5 font-ui text-[10px] tracking-[0.2em] uppercase text-[#76746f] font-bold w-1/6">
                        Status
                      </th>
                      {isAdmin && (
                        <th className="py-3.5 px-5 font-ui text-[10px] tracking-[0.2em] uppercase text-[#76746f] font-bold w-1/6 text-right">
                          Action
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#cfc2d6]/25">
                    {semesters.map((sem) => (
                      <tr
                        key={sem._id}
                        className="hover:bg-[#8026d3]/3 transition-colors duration-150 group"
                      >
                        <td className="py-4 px-5 text-[14px] font-semibold text-[#1a1a1a]">
                          {formatSemesterNum(sem.number)}
                        </td>
                        <td className="py-4 px-5 font-mono text-[13px] tracking-wide text-[#8026d3] font-bold uppercase">
                          {sem.branch?.code || 'UNMAPPED'}
                        </td>
                        <td className="py-4 px-5">
                          <Badge variant={sem.isActive !== false ? 'success' : 'default'} size="sm">
                            {sem.isActive !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        {isAdmin && (
                          <td className="py-4 px-5 text-right">
                            <button
                               onClick={() => handleDeleteSemester(sem._id)}
                               className="p-1.5 text-[#666666] hover:text-[#ff4d4d] hover:bg-[#ff4d4d]/10 rounded-md transition-all duration-120 inline-flex items-center gap-1 cursor-pointer"
                              title="Delete Semester"
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
