import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function CustomSelect({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  variant = 'dark', // 'light' or 'dark'
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value || opt === value);
  const displayLabel = selectedOption 
    ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
    : placeholder;

  const isLight = variant === 'light';

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    const val = typeof option === 'object' ? option.value : option;
    if (onChange) {
      onChange({ target: { value: val } });
    }
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-11 px-4 rounded-xl flex items-center justify-between text-left text-[14.5px] border outline-none transition-all duration-200 cursor-pointer ${
          isLight
            ? 'bg-[#f6f3f2] border-[#cfc2d6]/40 text-[#1b1c1c] focus:border-[#a04df3] focus:bg-[#ffffff]'
            : 'bg-[#1C1915] border-[rgba(255,255,255,0.07)] text-[#F0EDE7] focus:border-[#C9A96E]/45'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className={!selectedOption ? (isLight ? 'text-[#c9c6c0]' : 'text-[#4A4540]') : ''}>
          {displayLabel}
        </span>
        <span className={`text-[10px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${
          isLight ? 'text-[#6d6d6d]' : 'text-[#7A726A]'
        }`}>
          ▼
        </span>
      </button>

      {/* Options Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-50 left-0 right-0 mt-2 max-h-60 overflow-y-auto rounded-xl shadow-xl border p-1.5 focus:outline-none ${
              isLight
                ? 'bg-[#ffffff] border-[#e4e2e1] text-[#1b1c1c]'
                : 'bg-[#141210] border-[rgba(255,255,255,0.08)] text-[#F0EDE7]'
            }`}
          >
            {options.map((option, idx) => {
              const val = typeof option === 'object' ? option.value : option;
              const label = typeof option === 'object' ? option.label : option;
              const isSelected = val === value;

              return (
                <li
                  key={idx}
                  onClick={() => handleSelect(option)}
                  className={`px-3 py-2 text-[14px] rounded-lg cursor-pointer transition-colors duration-150 flex items-center justify-between ${
                    isLight
                      ? isSelected 
                        ? 'bg-[#a04df3]/10 text-[#a04df3] font-bold' 
                        : 'hover:bg-[#f6f3f2] text-[#1b1c1c]'
                      : isSelected 
                        ? 'bg-[#C9A96E]/15 text-[#C9A96E] font-bold' 
                        : 'hover:bg-[rgba(255,255,255,0.04)] text-[#F0EDE7]'
                  }`}
                >
                  <span>{label}</span>
                  {isSelected && (
                    <span className={isLight ? 'text-[#a04df3]' : 'text-[#C9A96E]'}>✓</span>
                  )}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
export default CustomSelect;
