import React from 'react';

export function Footer() {
  return (
    <footer className="w-full border-t border-[rgba(0,0,0,0.08)] py-8 bg-[#faf6ef]">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 md:px-20 max-w-[1440px] mx-auto">
        <div className="text-lg font-bold text-[#1a1a1a] mb-4 md:mb-0">
          GTU Exam Buddy.
        </div>
        <div className="text-[10px] uppercase tracking-widest text-[#666666] font-bold">
          © {new Date().getFullYear()} Academic Intelligence.
        </div>
      </div>
    </footer>
  );
}
export default Footer;
