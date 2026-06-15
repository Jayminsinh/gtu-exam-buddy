import React from 'react';
import { motion } from 'framer-motion';

export function Reveal({
  children,
  delay = 0,
  duration = 0.6,
  yOffset = 24,
  className = ''
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        delay: delay,
        duration: duration,
        ease: [0.16, 1, 0.3, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
