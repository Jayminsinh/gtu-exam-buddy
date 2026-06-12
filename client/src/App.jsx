/**
 * @file App Root
 * @description Routes configuration for the GTU Exam Buddy frontend.
 *              Landing page at root, Dashboard layout at /dashboard/*.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
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
        position="top-right" 
        toastOptions={{
          style: {
            background: '#FAF8F5',
            color: '#1C1917',
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            letterSpacing: '0.05em',
            borderRadius: '0px',
            border: '0.5px solid rgba(46, 42, 37, 0.1)',
          }
        }} 
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
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
