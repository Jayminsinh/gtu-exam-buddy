import React from 'react';
import { motion } from 'framer-motion';

export function HowItWorksSection() {
  return (
    <section id="workflow" className="py-8 border-t border-[rgba(0,0,0,0.08)] bg-[#faf6ef]">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        className="flex flex-col md:flex-row gap-10 text-left"
      >
        <div className="md:w-1/4">
          <h2 className="text-2xl font-bold text-[#1a1a1a] uppercase">The Sequence.</h2>
          <p className="text-xs text-[#666666] mt-2 leading-relaxed font-medium">A strict, linear process to derive academic priorities.</p>
        </div>
        
        <div className="md:w-3/4 grid grid-cols-2 sm:grid-cols-4 gap-6 border-l border-[rgba(0,0,0,0.08)] pl-6 md:pl-10">
          <div className="group">
            <div className="text-[10px] text-[#8026d3] mb-1 font-bold">01</div>
            <div className="text-sm text-[#1a1a1a] font-bold mb-1">Parameters</div>
            <div className="text-xs text-[#666666] leading-relaxed">Branch, Sem, Subject.</div>
          </div>
          <div className="group">
            <div className="text-[10px] text-[#666666] group-hover:text-[#8026d3] transition-colors mb-1 font-bold">02</div>
            <div className="text-sm text-[#1a1a1a] font-bold mb-1">Archive Scan</div>
            <div className="text-xs text-[#666666] leading-relaxed">Historical paper ingestion.</div>
          </div>
          <div className="group">
            <div className="text-[10px] text-[#666666] group-hover:text-[#8026d3] transition-colors mb-1 font-bold">03</div>
            <div className="text-sm text-[#1a1a1a] font-bold mb-1">Syllabus Sync</div>
            <div className="text-xs text-[#666666] leading-relaxed">Curriculum alignment.</div>
          </div>
          <div className="group">
            <div className="text-[10px] text-[#666666] group-hover:text-[#8026d3] transition-colors mb-1 font-bold">04</div>
            <div className="text-sm text-[#1a1a1a] font-bold mb-1">Extraction</div>
            <div className="text-xs text-[#666666] leading-relaxed">Chapter-wise PDF output.</div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
export default HowItWorksSection;
