/**
 * @file App Root
 * @description Routes configuration for the GTU Exam Buddy frontend.
 *              Landing page at root, Dashboard layout at /dashboard/*.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import LandingPage from './pages/LandingPage';
import Branches from './pages/Branches';
import Semesters from './pages/Semesters';
import Subjects from './pages/Subjects';
import Papers from './pages/Papers';
import StudentSearch from './pages/StudentSearch';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <>
      <Toaster
        position="bottom-right"
        gap={8}
        visibleToasts={4}
        toastOptions={{
          style: {
            background: '#ffffff',
            border: '1px solid rgba(128,38,211,0.15)',
            color: '#1a1a1a',
            borderRadius: '10px',
            fontSize: '14px',
            fontFamily: 'Inter, -apple-system, sans-serif',
            boxShadow: '0 8px 32px rgba(128,38,211,0.08), 0 0 0 1px rgba(128,38,211,0.02)',
            backdropFilter: 'blur(16px)',
            padding: '14px 16px',
            lineHeight: '1.5',
          },
          classNames: {
            title:       'font-medium text-[#1a1a1a] text-[14px]',
            description: 'text-[#666666] text-[13px] mt-0.5',
            success:     'border-l-[3px] border-l-[#a04df3]',
            error:       'border-l-[3px] border-l-[#ff4d4d]',
            warning:     'border-l-[3px] border-l-[#ffb300]',
            info:        'border-l-[3px] border-l-[#2e54fe]',
            actionButton:'bg-[rgba(128,38,211,0.08)] text-[#8026d3] text-[12px] rounded-md px-3 py-1.5 hover:bg-[rgba(128,38,211,0.12)] transition-colors',
            cancelButton:'text-[#777777] text-[12px] hover:text-[#1a1a1a] transition-colors',
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          {/* Protected Administrative Dashboard Layout */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              {/* Student Search and Nested CRUD pages */}
              <Route index element={<StudentSearch />} />
              <Route path="branches" element={<Branches />} />
              <Route path="semesters" element={<Semesters />} />
              <Route path="subjects" element={<Subjects />} />
              <Route path="papers" element={<Papers />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

/**
 * Minimal placeholder for future CRUD pages.
 * Maintains the Quiet Luxury aesthetic while awaiting Phase 2 implementation.
 */
function PlaceholderPage({ title }) {
  return (
    <div className="flex flex-col items-start">
      <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-taupe mb-4">
        MANAGE
      </p>
      <h2 className="font-serif text-3xl text-luxury-espresso mb-3">
        {title.charAt(0) + title.slice(1).toLowerCase()}
      </h2>
      <div className="w-8 h-px bg-luxury-gold mb-8" />
      <div className="w-full border-thin border-luxury-charcoal/10 rounded-sm p-12 text-center">
        <p className="font-sans text-xs tracking-[0.2em] uppercase text-luxury-taupe/60">
          CRUD INTERFACE — COMING IN PHASE 2
        </p>
      </div>
    </div>
  );
}

export default App;
