/**
 * @file Semesters Management Page
 * @description Renders active semesters with relation maps to parent branches.
 *              Includes an admin-restricted slide-over panel to register new terms.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Semesters() {
  const [semesters, setSemesters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
      setDrawerOpen(false);
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

  // Helper helper to pad semester numbers (e.g., 4 -> 04)
  const formatSemesterNum = (num) => {
    return `SEMESTER ${String(num).padStart(2, '0')}`;
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
            Semester Registry
          </h2>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="font-sans text-[11px] tracking-[0.25em] uppercase px-5 py-2 border border-thin border-luxury-charcoal hover:bg-luxury-espresso hover:text-luxury-ivory transition-all duration-500"
          >
            + ADD NEW TERM
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
      ) : semesters.length === 0 ? (
        <div className="border border-thin border-luxury-charcoal/10 rounded-sm p-16 text-center bg-luxury-cream">
          <p className="font-sans text-xs tracking-[0.2em] uppercase text-luxury-taupe/60">
            NO REGISTERED TERMS FOUND
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-thin border-luxury-charcoal/20">
                <th className="py-4 font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-taupe font-normal w-1/3">
                  SEMESTER TERM
                </th>
                <th className="py-4 font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-taupe font-normal w-1/3">
                  PARENT BRANCH CODE
                </th>
                <th className="py-4 font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-taupe font-normal w-1/3">
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
              {semesters.map((sem) => (
                <motion.tr
                  key={sem._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b-[0.5px] border-luxury-charcoal/30 hover:bg-luxury-cream/50 transition-colors duration-300"
                >
                  <td className="py-5 font-serif text-sm text-luxury-charcoal">
                    {formatSemesterNum(sem.number)}
                  </td>
                  <td className="py-5 font-sans text-xs tracking-widest font-medium text-luxury-espresso uppercase">
                    {sem.branch?.code || 'UNMAPPED'}
                  </td>
                  <td className="py-5 font-sans text-[10px] tracking-widest uppercase">
                    {sem.isActive !== false ? (
                      <span className="text-luxury-gold">ACTIVE</span>
                    ) : (
                      <span className="text-luxury-taupe/60">INACTIVE</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="py-5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteSemester(sem._id)}
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
                      Add Semester
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

                <form onSubmit={handleCreateSemester} className="space-y-8">
                  {/* Branch relational select dropdown */}
                  <div className="space-y-1">
                    <label
                      htmlFor="parent-branch"
                      className="block font-sans text-[9px] tracking-[0.25em] uppercase text-luxury-taupe"
                    >
                      PARENT BRANCH RELATION
                    </label>
                    <div className="relative">
                      <select
                        id="parent-branch"
                        required
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="w-full bg-transparent border-b border-luxury-charcoal/20 py-2 focus:border-luxury-gold transition-colors duration-300 outline-none text-sm appearance-none font-sans tracking-wide text-luxury-espresso"
                      >
                        <option value="" disabled className="text-luxury-taupe/40 bg-luxury-cream">
                          Select academic branch...
                        </option>
                        {branches.map((b) => (
                          <option
                            key={b._id}
                            value={b._id}
                            className="bg-luxury-cream text-luxury-espresso"
                          >
                            {b.code} — {b.name}
                          </option>
                        ))}
                      </select>
                      {/* Minimal visual chevron indicator */}
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-luxury-taupe/60 text-[9px] tracking-widest font-sans">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Semester number validation input */}
                  <div className="space-y-1">
                    <label
                      htmlFor="semester-number"
                      className="block font-sans text-[9px] tracking-[0.25em] uppercase text-luxury-taupe"
                    >
                      TERM NUMBER
                    </label>
                    <input
                      id="semester-number"
                      type="number"
                      required
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="w-full bg-transparent border-b border-luxury-charcoal/20 py-2 focus:border-luxury-gold transition-colors duration-300 outline-none text-sm placeholder-luxury-taupe/40"
                      placeholder="e.g. 4"
                      min="1"
                      max="8"
                    />
                    <AnimatePresence>
                      {number !== '' && (parseInt(number, 10) < 1 || parseInt(number, 10) > 8) && (
                        <motion.span
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-[10px] tracking-widest text-red-500 mt-1 block overflow-hidden font-sans uppercase"
                        >
                          TERM MUST BE BETWEEN 1 AND 8
                        </motion.span>
                      )}
                    </AnimatePresence>
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
                  GTU EXAM BUDDY · SEMESTER MANAGER
                </p>
              </footer>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
