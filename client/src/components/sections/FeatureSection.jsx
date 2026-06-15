import React from 'react';
import { motion } from 'framer-motion';

const modules = [
  {
    badge: 'Module Alpha',
    title: 'Historical Archive',
    description: 'Digitized repository of past GTU examinations for pattern recognition.',
    image: '/assets/feature-papers.webp'
  },
  {
    badge: 'Module Beta',
    title: 'Syllabus Context',
    description: 'Strict mapping to current curriculum requirements.',
    image: '/assets/feature-syllabus.webp'
  },
  {
    badge: 'Module Gamma',
    title: 'AI Extraction',
    description: 'Algorithmic sorting of high-probability questions by chapter.',
    image: '/assets/feature-analytics.webp'
  }
];

export function FeatureSection() {
  return (
    <section id="modules" className="py-6 bg-[#faf6ef] text-left">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modules.map((module, index) => (
          <motion.div
            key={module.badge}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: index * 0.1, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
            className="bg-[#ffffff] border border-[rgba(0,0,0,0.08)] p-6 flex flex-col h-[400px] hover:shadow-[0_4px_24px_-8px_rgba(128,38,211,0.08)] transition-all duration-300 group"
          >
            <div className="text-[10px] uppercase tracking-widest text-[#666666] mb-4 font-bold">
              {module.badge}
            </div>
            
            <div className="w-full h-[180px] mb-4 overflow-hidden bg-[#f5f5f5] rounded-lg border border-[rgba(0,0,0,0.04)]">
              <img 
                src={module.image} 
                alt={module.title}
                loading="lazy"
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 mix-blend-multiply"
                style={{ contentVisibility: 'auto' }}
              />
            </div>
            
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">{module.title}</h3>
            <p className="text-xs text-[#666666] leading-relaxed mt-auto font-medium">{module.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
export default FeatureSection;
