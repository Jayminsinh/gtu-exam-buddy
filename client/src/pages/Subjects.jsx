/**
 * @file Subjects Management Page
 * @description Renders the Subjects registry mapping branch and semester references.
 *              Includes an admin creation drawer with input validation and native toasts.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

        // Note: getAllSubjects endpoint returns a paginated object containing `subjects`
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
      // Note the plural endpoint path `/subjects`
      const response = await api.post('/subjects', {
        name,
        code,
        branch: branchId,
        semester: semesterId,
        credits: creditsNum,
      });

      const newSubject = response.data?.data;
      if (newSubject) {
        // Resolve relation references locally to keep the UI state populated
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
      setDrawerOpen(false);
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

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl">
      {/* Header section */}
      <div className="flex justify-between items-end border-b border-thin border-luxury-charcoal/10 pb-6">
        <div>
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-gold mb-1">
            ACADEMIC REGISTRY
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-luxury-espresso font-normal uppercase">
            Subject Matrix
          </h2>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="font-sans text-[11px] tracking-[0.25em] uppercase px-5 py-2 border border-thin border-luxury-charcoal hover:bg-luxury-espresso hover:text-luxury-ivory transition-all duration-500"
          >
            + REGISTER NEW SUBJECT
          </button>
        )}
      </div>

      {/* List Table View */}
      {loading ? (
        <div className="py-20 text-center">
          <p className="font-sans text-xs tracking-widest text-luxury-taupe animate-pulse">
            LOADING MATRIX...
          </p>
        </div>
      ) : subjects.length === 0 ? (
        <div className="border border-thin border-luxury-charcoal/10 rounded-sm p-16 text-center bg-luxury-cream">
          <p className="font-sans text-xs tracking-[0.2em] uppercase text-luxury-taupe/60">
            NO REGISTERED SUBJECTS FOUND
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-thin border-luxury-charcoal/20">
                <th className="py-4 font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-taupe font-normal w-1/5">
                  CODE
                </th>
                <th className="py-4 font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-taupe font-normal w-1/3">
                  SUBJECT NAME
                </th>
                <th className="py-4 font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-taupe font-normal w-1/6">
                  BRANCH
                </th>
                <th className="py-4 font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-taupe font-normal w-1/6">
                  TERM
                </th>
                <th className="py-4 font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-taupe font-normal w-1/12">
                  CREDITS
                </th>
                {isAdmin && (
                  <th className="py-4 font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-taupe font-normal w-1/6 text-right">
                    ACTION
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {subjects.map((sub) => (
                <motion.tr
                  key={sub._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b-[0.5px] border-luxury-charcoal/30 hover:bg-luxury-cream/50 transition-colors duration-300"
                >
                  <td className="py-5 font-sans text-xs tracking-widest font-medium text-luxury-espresso uppercase">
                    {sub.code}
                  </td>
                  <td className="py-5 font-serif text-sm text-luxury-charcoal">
                    {sub.name}
                  </td>
                  <td className="py-5 font-sans text-xs tracking-widest text-luxury-espresso uppercase">
                    {sub.branch?.code || 'UNMAPPED'}
                  </td>
                  <td className="py-5 font-sans text-xs text-luxury-charcoal">
                    {sub.semester?.number ? `TERM ${sub.semester.number}` : 'UNMAPPED'}
                  </td>
                  <td className="py-5 font-sans text-xs text-luxury-espresso">
                    {sub.credits}
                  </td>
                  {isAdmin && (
                    <td className="py-5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteSubject(sub._id)}
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
              <div className="overflow-y-auto pr-1">
                <div className="flex justify-between items-center mb-12">
                  <div>
                    <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-luxury-gold mb-1">
                      NEW REGISTRY ENTRY
                    </p>
                    <h3 className="font-serif text-2xl text-luxury-espresso font-normal">
                      Register Subject
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

                <form onSubmit={handleCreateSubject} className="space-y-8 pb-8">
                  {/* Branch selector */}
                  <div className="space-y-1">
                    <label
                      htmlFor="select-branch"
                      className="block font-sans text-[9px] tracking-[0.25em] uppercase text-luxury-taupe"
                    >
                      ACADEMIC BRANCH
                    </label>
                    <div className="relative">
                      <select
                        id="select-branch"
                        required
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        className="w-full bg-transparent border-b border-luxury-charcoal/20 py-2 focus:border-luxury-gold transition-colors duration-300 outline-none text-sm appearance-none font-sans tracking-wide text-luxury-espresso"
                      >
                        <option value="" disabled className="text-luxury-taupe/40 bg-luxury-cream">
                          Select branch relationship...
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
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-luxury-taupe/60 text-[9px]">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Semester selector */}
                  <div className="space-y-1">
                    <label
                      htmlFor="select-semester"
                      className="block font-sans text-[9px] tracking-[0.25em] uppercase text-luxury-taupe"
                    >
                      SEMESTER TERM
                    </label>
                    <div className="relative">
                      <select
                        id="select-semester"
                        required
                        value={semesterId}
                        onChange={(e) => setSemesterId(e.target.value)}
                        className="w-full bg-transparent border-b border-luxury-charcoal/20 py-2 focus:border-luxury-gold transition-colors duration-300 outline-none text-sm appearance-none font-sans tracking-wide text-luxury-espresso"
                      >
                        <option value="" disabled className="text-luxury-taupe/40 bg-luxury-cream">
                          Select semester relationship...
                        </option>
                        {semesters
                          .filter((s) => !branchId || s.branch?._id === branchId)
                          .map((s) => (
                            <option
                              key={s._id}
                              value={s._id}
                              className="bg-luxury-cream text-luxury-espresso"
                            >
                              Term {s.number} {s.branch?.code ? `(${s.branch.code})` : ''}
                            </option>
                          ))}
                      </select>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-luxury-taupe/60 text-[9px]">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Subject Code */}
                  <div className="space-y-1">
                    <label
                      htmlFor="subject-code"
                      className="block font-sans text-[9px] tracking-[0.25em] uppercase text-luxury-taupe"
                    >
                      SUBJECT CODE (GTU)
                    </label>
                    <input
                      id="subject-code"
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full bg-transparent border-b border-luxury-charcoal/20 py-2 focus:border-luxury-gold transition-colors duration-300 outline-none text-sm placeholder-luxury-taupe/40 uppercase"
                      placeholder="e.g. 3140702"
                    />
                  </div>

                  {/* Subject Name */}
                  <div className="space-y-1">
                    <label
                      htmlFor="subject-name"
                      className="block font-sans text-[9px] tracking-[0.25em] uppercase text-luxury-taupe"
                    >
                      SUBJECT NAME
                    </label>
                    <input
                      id="subject-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-transparent border-b border-luxury-charcoal/20 py-2 focus:border-luxury-gold transition-colors duration-300 outline-none text-sm placeholder-luxury-taupe/40"
                      placeholder="e.g. Object Oriented Programming"
                    />
                  </div>

                  {/* Subject Credits */}
                  <div className="space-y-1">
                    <label
                      htmlFor="subject-credits"
                      className="block font-sans text-[9px] tracking-[0.25em] uppercase text-luxury-taupe"
                    >
                      ACADEMIC CREDITS
                    </label>
                    <input
                      id="subject-credits"
                      type="number"
                      required
                      value={credits}
                      onChange={(e) => setCredits(e.target.value)}
                      className="w-full bg-transparent border-b border-luxury-charcoal/20 py-2 focus:border-luxury-gold transition-colors duration-300 outline-none text-sm placeholder-luxury-taupe/40"
                      placeholder="e.g. 4"
                      min="1"
                      max="10"
                    />
                    <AnimatePresence>
                      {credits !== '' && (parseInt(credits, 10) < 1 || parseInt(credits, 10) > 10) && (
                        <motion.span
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-[10px] tracking-widest text-red-500 mt-1 block overflow-hidden font-sans uppercase"
                        >
                          CREDITS MUST BE BETWEEN 1 AND 10
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

              <footer className="pt-4 border-t border-thin border-luxury-charcoal/8 bg-luxury-cream">
                <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-luxury-taupe/40 text-center">
                  GTU EXAM BUDDY · SUBJECT MANAGER
                </p>
              </footer>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
