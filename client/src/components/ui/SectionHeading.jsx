import React from 'react';
import { motion } from 'framer-motion';

export function SectionHeading({
  badge,
  title,
  description,
  align = 'left',
  className = ''
}) {
  const alignClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center mx-auto',
    right: 'text-right items-end ml-auto'
  };

  return (
    <div className={`flex flex-col ${alignClasses[align]} ${className}`}>
      {badge && (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-[10px] font-mono text-[#c9a96e] tracking-[0.3em] uppercase mb-3 font-extrabold"
        >
          {badge}
        </motion.span>
      )}
      
      {title && (
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-[#0f172a] uppercase leading-tight"
        >
          {title}
        </motion.h2>
      )}

      {description && (
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-[14px] md:text-[15px] text-[#64748b] mt-4 max-w-xl leading-relaxed"
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}
