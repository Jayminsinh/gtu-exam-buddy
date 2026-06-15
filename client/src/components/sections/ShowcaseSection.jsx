import React from 'react';
import { motion } from 'framer-motion';
import { Download } from '../ui/Icons';
import { Link } from 'react-router-dom';

export function ShowcaseSection({ onAuthClick }) {
  return (
    <section className="py-6 bg-[#faf6ef] text-left">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        className="bg-[#ffffff] border border-[rgba(0,0,0,0.08)] shadow-[0_4px_24px_-8px_rgba(128,38,211,0.08)] p-8 max-w-4xl mx-auto"
      >
        <div className="flex justify-between items-end border-b border-[rgba(0,0,0,0.08)] pb-4 mb-6">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#8026d3] mb-1 font-bold">
              Document Preview
            </div>
            <h2 className="text-2xl font-bold text-[#1a1a1a] uppercase">
              Generated Priority Output
            </h2>
          </div>
          
          <button 
            onClick={() => onAuthClick && onAuthClick('login')}
            className="text-xs uppercase tracking-widest text-[#1a1a1a] hover:text-[#8026d3] transition-colors flex items-center gap-1 font-bold border border-[rgba(0,0,0,0.08)] px-3 py-1.5 rounded-lg bg-[#faf6ef]/30 cursor-pointer"
          >
            <Download size={14} /> PDF
          </button>
        </div>

        <div className="space-y-6 opacity-90">
          <div>
            <h4 className="text-sm font-bold text-[#1a1a1a] border-b border-[rgba(0,0,0,0.04)] pb-1 mb-2 font-mono">
              Chapter 1: Foundations
            </h4>
            <ul className="space-y-2 text-xs text-[#666666] font-serif">
              <li className="flex gap-4 items-center">
                <span className="text-[#1a1a1a]/30 font-bold font-mono">01.</span> 
                <span>Explain the architecture with a block diagram.</span> 
                <span className="ml-auto text-[10px] text-[#8026d3] font-bold font-mono bg-[#8026d3]/5 px-2 py-0.5 rounded-full">Freq: High</span>
              </li>
              <li className="flex gap-4 items-center">
                <span className="text-[#1a1a1a]/30 font-bold font-mono">02.</span> 
                <span>Differentiate between the two primary models.</span> 
                <span className="ml-auto text-[10px] text-[#8026d3] font-bold font-mono bg-[#8026d3]/5 px-2 py-0.5 rounded-full">Freq: Med</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-bold text-[#1a1a1a] border-b border-[rgba(0,0,0,0.04)] pb-1 mb-2 font-mono">
              Chapter 2: Advanced Concepts
            </h4>
            <ul className="space-y-2 text-xs text-[#666666] font-serif">
              <li className="flex gap-4 items-center">
                <span className="text-[#1a1a1a]/30 font-bold font-mono">01.</span> 
                <span>Derive the equation for state analysis.</span> 
                <span className="ml-auto text-[10px] text-[#8026d3] font-bold font-mono bg-[#8026d3]/5 px-2 py-0.5 rounded-full">Freq: High</span>
              </li>
            </ul>
          </div>
        </div>

      </motion.div>
    </section>
  );
}
export default ShowcaseSection;
