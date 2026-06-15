import React from 'react';
import { Link } from 'react-router-dom';

export function Navbar({ onAuthClick }) {
  return (
    <nav className="sticky top-0 z-50 bg-[#faf6ef]/90 backdrop-blur-md w-full border-b border-[rgba(0,0,0,0.08)]">
      <div className="flex justify-between items-center w-full px-6 md:px-20 py-5 max-w-[1440px] mx-auto">
        <Link to="/" className="text-xl font-bold tracking-tight text-[#1a1a1a] hover:text-[#8026d3] transition-colors duration-200">
          GTU Exam Buddy.
        </Link>
        <div className="hidden md:flex items-center gap-10">
          <a className="text-[11px] uppercase tracking-widest text-[#666666] hover:text-[#8026d3] transition-colors duration-300 font-bold" href="#workflow">
            Process
          </a>
          <a className="text-[11px] uppercase tracking-widest text-[#666666] hover:text-[#8026d3] transition-colors duration-300 font-bold" href="#modules">
            Modules
          </a>
          <button
            onClick={() => onAuthClick && onAuthClick('login')}
            className="px-4 py-1.5 bg-[#8026d3] text-[#ffffff] hover:bg-[#9b47ed] rounded-[4px] text-[12px] font-semibold tracking-wide transition-all duration-200 cursor-pointer"
          >
            ENTER PORTAL
          </button>
        </div>
      </div>
    </nav>
  );
}
export default Navbar;
