import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { PageHeader, Badge, EmptyState, LoadingSkeleton } from '../components/ui';
import { Plus, Trash2, GitBranch, Loader2 } from '../components/ui/Icons';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // ─── Fetch Active Branches ─────────────────────────────────
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await api.get('/branch');
        setBranches(response.data?.data || []);
      } catch (error) {
        console.error('Failed to load branches list:', error);
        toast.error('Failed to retrieve academic branches.');
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  // ─── Handle Creation Form Submit ───────────────────────────
  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSubmitting(true);

    try {
      const response = await api.post('/branch', { name, code });
      const newBranch = response.data?.data;
      
      if (newBranch) {
        setBranches((prev) => [...prev, newBranch]);
      }
      
      toast.success("Registry Entry Documented Successfully.");
      setName('');
      setCode('');
    } catch (error) {
      const errMsg = error.response?.data?.errors?.[0]?.message || 
                     error.response?.data?.errors?.[0]?.msg || 
                     error.response?.data?.message || 
                     'Failed to create academic branch.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Handle Deletion ───────────────────────────────────────
  const handleDeleteBranch = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to delete this academic branch?')) {
      return;
    }

    try {
      await api.delete(`/branch/${id}`);
      setBranches((prev) => prev.filter((b) => b._id !== id));
      toast.success('Branch entry deleted successfully.');
    } catch (error) {
      console.error('Failed to delete branch:', error);
      const errMsg = error.response?.data?.message || 'Failed to delete branch.';
      toast.error(errMsg);
    }
  };

  const activeCount = branches.filter(b => b.isActive !== false).length;

  return (
    <div className="w-full flex flex-col gap-6 max-w-[1200px] mx-auto animate-fade-in">
      <PageHeader
        title="Branch Registry"
        subtitle="Manage academic branches and programmes"
        badge={`${activeCount} Active`}
      />

      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-12' : ''} gap-6 items-start`}>
        {/* Left Column: Form Panel (Only visible for Admins) */}
        {isAdmin && (
          <div className="lg:col-span-4 bg-[#ffffff] border border-[#cfc2d6]/40 rounded-[12px] p-6 lg:sticky lg:top-[84px] shadow-sm flex flex-col">
            <div className="border-b border-[#cfc2d6]/30 pb-3.5 mb-5 flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.08em]">
                Add New Branch
              </span>
            </div>

            <form onSubmit={handleCreateBranch} className="flex flex-col gap-5">
              {/* Branch Code */}
              <div className="flex flex-col">
                <label
                  htmlFor="branch-code"
                  className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.06em] mb-2"
                >
                  Branch Code
                </label>
                <input
                  id="branch-code"
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-10 bg-[#ffffff] border border-[#cfc2d6]/40 rounded-lg px-3 text-[14px] text-[#1a1a1a] outline-none placeholder:text-[#c9c6c0] focus:border-[#8026d3] focus:shadow-[0_0_0_3px_rgba(128,38,211,0.08)] disabled:opacity-50 disabled:cursor-not-allowed uppercase transition-all duration-150"
                  placeholder="e.g. CE"
                />
              </div>

              {/* Branch Name */}
              <div className="flex flex-col">
                <label
                  htmlFor="branch-name"
                  className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.06em] mb-2"
                >
                  Branch Name
                </label>
                <input
                  id="branch-name"
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 bg-[#ffffff] border border-[#cfc2d6]/40 rounded-lg px-3 text-[14px] text-[#1a1a1a] outline-none placeholder:text-[#c9c6c0] focus:border-[#8026d3] focus:shadow-[0_0_0_3px_rgba(128,38,211,0.08)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                  placeholder="e.g. Computer Engineering"
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

        {/* Right Column: Branch Table View */}
        <div className={isAdmin ? 'lg:col-span-8' : 'w-full'}>
          {loading ? (
            <div className="bg-[#ffffff] border border-[#cfc2d6]/40 rounded-[10px] p-0 shadow-sm">
              <LoadingSkeleton rows={5} columns={['20%', '50%', '15%', '15%']} />
            </div>
          ) : branches.length === 0 ? (
            <div className="bg-[#ffffff] border border-[#cfc2d6]/40 rounded-[10px] p-6 text-center shadow-sm">
              <EmptyState
                Icon={GitBranch}
                title="No registered branches found"
                description="Use the side panel to add academic branch documents to the repository."
              />
            </div>
          ) : (
            <div className="w-full overflow-hidden border border-[#cfc2d6]/40 bg-[#ffffff] rounded-[10px] shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#cfc2d6]/35 bg-[#fcfbf9]">
                      <th className="py-3.5 px-5 font-ui text-[10px] tracking-[0.2em] uppercase text-[#76746f] font-bold w-1/5">
                        Code
                      </th>
                      <th className="py-3.5 px-5 font-ui text-[10px] tracking-[0.2em] uppercase text-[#76746f] font-bold w-2/5">
                        Department Name
                      </th>
                      <th className="py-3.5 px-5 font-ui text-[10px] tracking-[0.2em] uppercase text-[#76746f] font-bold w-1/5">
                        Status
                      </th>
                      {isAdmin && (
                        <th className="py-3.5 px-5 font-ui text-[10px] tracking-[0.2em] uppercase text-[#76746f] font-bold w-1/5 text-right">
                          Action
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#cfc2d6]/25">
                    {branches.map((branch) => (
                      <tr
                        key={branch._id}
                        className="hover:bg-[#8026d3]/3 transition-colors duration-150 group"
                      >
                        <td className="py-4 px-5 font-mono text-[13px] tracking-wide text-[#8026d3] font-bold uppercase">
                          {branch.code}
                        </td>
                        <td className="py-4 px-5 text-[14px] font-semibold text-[#1a1a1a]">
                          {branch.name}
                        </td>
                        <td className="py-4 px-5">
                          <Badge variant={branch.isActive !== false ? 'success' : 'default'} size="sm">
                            {branch.isActive !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        {isAdmin && (
                          <td className="py-4 px-5 text-right">
                            <button
                               onClick={() => handleDeleteBranch(branch._id)}
                               className="p-1.5 text-[#666666] hover:text-[#ff4d4d] hover:bg-[#ff4d4d]/10 rounded-md transition-all duration-120 inline-flex items-center gap-1 cursor-pointer"
                              title="Delete Branch"
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
