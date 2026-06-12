/**
 * @file Dashboard Layout
 * @description Persistent admin shell with a purely typographic sidebar
 *              matching the backend domains: BRANCHES, SEMESTERS, SUBJECTS.
 *              Responsive — collapses to a slide-over drawer on mobile.
 */

import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

// ─── Navigation Items (mapped to backend route domains) ──────
const navItems = [
  { label: 'BRANCHES', path: '/dashboard/branches' },
  { label: 'SEMESTERS', path: '/dashboard/semesters' },
  { label: 'SUBJECTS', path: '/dashboard/subjects' },
  { label: 'PAPERS', path: '/dashboard/papers' },
];

// ─── Section title derived from current route ────────────────
function useSectionTitle() {
  const location = useLocation();
  const segment = location.pathname.split('/').filter(Boolean).pop();
  if (segment === 'dashboard') return 'STUDENT PORTAL';
  return segment?.toUpperCase() || 'STUDENT PORTAL';
}

// ─── Hamburger SVG (3 thin geometric lines — no icon pack) ──
function HamburgerIcon({ isOpen }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className="text-luxury-espresso"
    >
      <motion.line
        x1="4" x2="20" y1="7" y2="7"
        stroke="currentColor"
        strokeWidth="0.75"
        animate={isOpen ? { rotate: 45, y: 5, x1: 4, x2: 20, y1: 12, y2: 12 } : {}}
        transition={{ duration: 0.3 }}
      />
      <motion.line
        x1="4" x2="20" y1="12" y2="12"
        stroke="currentColor"
        strokeWidth="0.75"
        animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
      <motion.line
        x1="4" x2="20" y1="17" y2="17"
        stroke="currentColor"
        strokeWidth="0.75"
        animate={isOpen ? { rotate: -45, y: -5, x1: 4, x2: 20, y1: 12, y2: 12 } : {}}
        transition={{ duration: 0.3 }}
      />
    </svg>
  );
}

// ─── Sidebar Content (shared between desktop & mobile) ───────
function SidebarContent({ onNavigate }) {
  const { logout, user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex flex-col h-full px-8 py-10">
      {/* Brand Mark */}
      <div className="mb-16">
        <NavLink to="/" className="block group" onClick={onNavigate}>
          <h2 className="font-serif text-lg tracking-wide text-luxury-espresso">
            GTU Exam
          </h2>
          <h2 className="font-serif text-lg tracking-wide text-luxury-espresso -mt-1">
            Buddy
          </h2>
          <div className="w-5 h-px bg-luxury-gold mt-3 group-hover:w-8 transition-all duration-500" />
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1">
        <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-luxury-taupe mb-4">
          MANAGE
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              [
                'group relative py-3 pl-5 font-sans text-[11px] tracking-[0.25em] uppercase transition-all duration-400 flex items-center justify-between',
                isActive
                  ? 'text-luxury-gold'
                  : 'text-luxury-espresso/50 hover:text-luxury-gold/60',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                {/* Active left border accent */}
                <motion.div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-px bg-luxury-gold"
                  initial={false}
                  animate={{
                    height: isActive ? 20 : 0,
                    opacity: isActive ? 1 : 0,
                  }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
                <span>{item.label}</span>
                {!isAdmin && (
                  <span className="font-sans text-[8px] tracking-widest text-luxury-taupe/50 lowercase mr-4">
                    (read-only)
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Sign Out */}
      <button
        type="button"
        className="font-sans text-[10px] tracking-[0.2em] uppercase text-luxury-taupe/50 hover:text-luxury-gold transition-colors duration-500 text-left mt-auto pt-8"
        onClick={logout}
      >
        SIGN OUT
      </button>
    </div>
  );
}

// ─── Main Layout ─────────────────────────────────────────────
export default function DashboardLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sectionTitle = useSectionTitle();

  return (
    <div className="min-h-screen flex bg-luxury-ivory">
      {/* ── Desktop Sidebar ─────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 min-h-screen border-r border-thin border-luxury-charcoal/10 bg-luxury-cream">
        <SidebarContent onNavigate={() => {}} />
      </aside>

      {/* ── Mobile Drawer Overlay ───────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-luxury-espresso/20 backdrop-blur-[2px] z-40 lg:hidden"
              onClick={() => setDrawerOpen(false)}
            />

            {/* Drawer Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-luxury-cream z-50 shadow-xl lg:hidden"
            >
              <SidebarContent onNavigate={() => setDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content Area ───────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-thin border-luxury-charcoal/8">
          {/* Mobile hamburger */}
          <button
            type="button"
            className="lg:hidden -ml-1 p-1"
            onClick={() => setDrawerOpen(!drawerOpen)}
            aria-label="Toggle navigation"
          >
            <HamburgerIcon isOpen={drawerOpen} />
          </button>

          {/* Section Title */}
          <h1 className="font-sans text-[11px] tracking-[0.3em] uppercase text-luxury-espresso/70">
            {sectionTitle}
          </h1>

          {/* Spacer for alignment */}
          <div className="w-6 lg:hidden" />
        </header>

        {/* Page Content */}
        <main className="flex-1 px-6 md:px-10 py-8 md:py-12">
          <Outlet />
        </main>

        {/* Subtle Footer */}
        <footer className="px-6 md:px-10 py-4 border-t border-thin border-luxury-charcoal/8">
          <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-luxury-taupe/40">
            GTU EXAM BUDDY — ADMIN CONSOLE
          </p>
        </footer>
      </div>
    </div>
  );
}
