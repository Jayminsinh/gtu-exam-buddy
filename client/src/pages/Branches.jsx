import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
        // Dynamically append new branch to the local state list
        setBranches((prev) => [...prev, newBranch]);
      }
      
      toast.success("Registry Entry Documented Successfully.");
      setName('');
      setCode('');
      setDrawerOpen(false);
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

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl">
      {/* Header section */}
      <div className="flex justify-between items-end border-b border-thin border-luxury-charcoal/10 pb-6">
        <div>
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-gold mb-1">
            ACADEMIC REGISTRY
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-luxury-espresso font-normal uppercase">
            Branch Registry
          </h2>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="font-sans text-[11px] tracking-[0.25em] uppercase px-5 py-2 border border-thin border-luxury-charcoal hover:bg-luxury-espresso hover:text-luxury-ivory transition-all duration-500"
          >
            + ADD NEW ENTRY
          </button>
        )}
      </div>

      {/* List Grid View */}
      {loading ? (
        <div className="py-20 text-center">
          <p className="font-sans text-xs tracking-widest text-luxury-taupe animate-pulse">
            LOADING REGISTRY...
          </p>
        </div>
      ) : branches.length === 0 ? (
        <div className="border border-thin border-luxury-charcoal/10 rounded-sm p-16 text-center bg-luxury-cream">
          <p className="font-sans text-xs tracking-[0.2em] uppercase text-luxury-taupe/60">
            NO REGISTERED BRANCHES FOUND
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-thin border-luxury-charcoal/20">
                <th className="py-4 font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-taupe font-normal w-1/4">
                  CODE
                </th>
                <th className="py-4 font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-taupe font-normal w-2/5">
                  DEPARTMENT NAME
                </th>
                <th className="py-4 font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-taupe font-normal w-1/4">
                  STATUS
                </th>
                {isAdmin && (
                  <th className="py-4 font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-taupe font-normal w-1/6 text-right">
                    ACTION
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <motion.tr
                  key={branch._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b-[0.5px] border-luxury-charcoal/30 hover:bg-luxury-cream/50 transition-colors duration-300"
                >
                  <td className="py-5 font-sans text-xs tracking-widest font-medium text-luxury-espresso uppercase">
                    {branch.code}
                  </td>
                  <td className="py-5 font-serif text-sm text-luxury-charcoal">
                    {branch.name}
                  </td>
                  <td className="py-5 font-sans text-[10px] tracking-widest uppercase">
                    {branch.isActive !== false ? (
                      <span className="text-luxury-gold">ACTIVE</span>
                    ) : (
                      <span className="text-luxury-taupe/60">INACTIVE</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="py-5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteBranch(branch._id)}
                        className="font-sans text-[10px] tracking-[0.25em] uppercase text-red-700/80 hover:text-red-950 transition-colors duration-300 border-b border-red-700/20 hover:border-red-950/40 pb-0.5"
                      >
                        DELETE
                      </button>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Creation Drawer */}
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
              <div>
                <div className="flex justify-between items-center mb-12">
                  <div>
                    <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-luxury-gold mb-1">
                      NEW REGISTRY ENTRY
                    </p>
                    <h3 className="font-serif text-2xl text-luxury-espresso font-normal">
                      Add Branch
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

                <form onSubmit={handleCreateBranch} className="space-y-8">
                  <div className="space-y-1">
                    <label
                      htmlFor="branch-code"
                      className="block font-sans text-[9px] tracking-[0.25em] uppercase text-luxury-taupe"
                    >
                      BRANCH CODE
                    </label>
                    <input
                      id="branch-code"
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full bg-transparent border-b border-luxury-charcoal/20 py-2 focus:border-luxury-gold transition-colors duration-300 outline-none text-sm placeholder-luxury-taupe/40 uppercase"
                      placeholder="e.g. CE"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="branch-name"
                      className="block font-sans text-[9px] tracking-[0.25em] uppercase text-luxury-taupe"
                    >
                      BRANCH NAME
                    </label>
                    <input
                      id="branch-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-transparent border-b border-luxury-charcoal/20 py-2 focus:border-luxury-gold transition-colors duration-300 outline-none text-sm placeholder-luxury-taupe/40"
                      placeholder="e.g. Computer Engineering"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full font-sans text-xs tracking-[0.3em] uppercase py-4 border-thin border-luxury-charcoal bg-luxury-espresso text-luxury-ivory hover:bg-transparent hover:text-luxury-espresso transition-all duration-500 mt-12"
                  >
                    {isSubmitting ? 'DOCUMENTING...' : 'DOCUMENT ENTRY'}
                  </button>
                </form>
              </div>

              <footer>
                <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-luxury-taupe/40 text-center">
                  GTU EXAM BUDDY · BRANCH MANAGER
                </p>
              </footer>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
