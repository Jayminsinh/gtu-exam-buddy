import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CustomSelect } from '../ui/CustomSelect';

export function HeroSection({ onAuthClick }) {
  const [selectedBranch, setSelectedBranch] = useState('');

  return (
    <section className="py-6 md:py-10 bg-[#faf6ef]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        
        {/* Left Image Block */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          className="col-span-1 lg:col-span-7 relative h-[50vh] lg:h-[75vh] rounded-none overflow-hidden border border-[rgba(0,0,0,0.08)] shadow-[0_4px_24px_-8px_rgba(128,38,211,0.08)] group"
        >
          <motion.img 
            src="/assets/hero-student-study.webp" 
            alt="Student studying engineering" 
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
          />
        </motion.div>

        {/* Right Content Block */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
          className="col-span-1 lg:col-span-5 flex flex-col justify-center pt-2 lg:pt-8"
        >
          {/* Animated Display Typography with Staggered Word Reveal */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] text-[#1a1a1a] mb-6 tracking-tight text-left uppercase">
            {["Distill", "years", "of", "exams", "into", "focus."].map((word, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                className="inline-block mr-3"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          {/* Quotable Refined Copy */}
          <p className="text-sm leading-relaxed text-[#666666] mb-8 max-w-sm text-left italic border-l-2 border-[#8026d3]/40 pl-4 font-serif">
            "A precise academic intelligence tool designed for clarity. We analyze historical GTU papers and your exact syllabus to generate definitive, chapter-wise priority questions."
          </p>

          {/* Polished Control Selector with Custom Select components */}
          <div className="bg-[#ffffff] p-6 border border-[rgba(0,0,0,0.08)] shadow-[0_4px_24px_-8px_rgba(128,38,211,0.08)] max-w-md w-full text-left rounded-2xl">
            <div className="text-[10px] uppercase tracking-widest text-[#666666] mb-4 font-bold font-mono">
              Initiate Analysis
            </div>
            
            <div className="space-y-4 mb-6">
              <CustomSelect
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                placeholder="Select Engineering Branch"
                variant="light"
                options={[
                  { value: 'ce', label: 'Computer Engineering' },
                  { value: 'civil', label: 'Civil Engineering' },
                  { value: 'me', label: 'Mechanical Engineering' }
                ]}
              />
              
              <CustomSelect
                value=""
                disabled={!selectedBranch}
                placeholder="Select Semester"
                variant="light"
                options={[]}
              />
              
              <CustomSelect
                value=""
                disabled={true}
                placeholder="Select Subject"
                variant="light"
                options={[]}
              />
            </div>

            <button
              onClick={() => onAuthClick && onAuthClick('login')}
              className="w-full bg-[#1a1a1a] hover:bg-[#8026d3] text-white text-[10px] uppercase tracking-widest py-3 mt-4 transition-colors duration-300 flex items-center justify-center gap-2 font-bold rounded-xl shadow-sm hover:shadow-[rgba(128,38,211,0.15)_0px_4px_12px] cursor-pointer"
            >
              Begin →
            </button>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
export default HeroSection;
