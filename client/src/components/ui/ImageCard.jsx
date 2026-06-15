import React from 'react';
import { motion } from 'framer-motion';

export function ImageCard({
  src,
  alt,
  aspectRatio = 'aspect-[4/3]',
  className = '',
  overlayContent,
  hoverZoom = true
}) {
  return (
    <div className={`relative w-full ${aspectRatio} rounded-[20px] overflow-hidden border border-[#e2e8f0] bg-[#f8fafc] ${className}`}>
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full h-full object-cover"
        style={{ contentVisibility: 'auto' }}
        whileHover={hoverZoom ? { scale: 1.015 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />
      
      {overlayContent && (
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/20 to-transparent flex flex-col justify-end p-6 md:p-8">
          {overlayContent}
        </div>
      )}
    </div>
  );
}
