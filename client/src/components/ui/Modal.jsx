import React, { useEffect } from 'react';
import { X } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

export default function Modal({ isOpen, onClose, title, children, variant = 'dark' }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isLight = variant === 'light';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className={`fixed inset-0 backdrop-blur-[4px] ${
              isLight ? 'bg-black/40' : 'bg-[#0B0905]/70'
            }`}
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full max-w-lg rounded-[20px] shadow-2xl overflow-hidden z-10 flex flex-col border ${
              isLight 
                ? 'bg-[#ffffff] border-[#e4e2e1] text-[#1b1c1c]' 
                : 'bg-[#141210] border-[rgba(255,255,255,0.08)] text-[#F0EDE7]'
            }`}
          >
            {/* Header */}
            <div className={`px-6 py-4.5 flex items-center justify-between border-b ${
              isLight ? 'border-[#f0eded]' : 'border-[rgba(255,255,255,0.05)]'
            }`}>
              <h3 className={`text-[18px] font-bold ${
                isLight ? 'text-[#1b1c1c]' : 'font-serif text-[#F0EDE7] italic'
              }`}>
                {title}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-[#7A726A] hover:text-[#F87171] p-1 transition-colors duration-120 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="px-6 py-6 overflow-y-auto max-h-[calc(100vh-200px)]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
