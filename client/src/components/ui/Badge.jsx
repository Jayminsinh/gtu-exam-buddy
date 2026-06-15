import React from 'react';

const variantClasses = {
  default: 'bg-[rgba(255,255,255,0.07)] text-[#9A9188]',
  gold: 'bg-[rgba(201,169,110,0.12)] text-[#C9A96E] border border-[rgba(201,169,110,0.15)]',
  success: 'bg-[rgba(52,211,153,0.10)] text-[#34D399]',
  error: 'bg-[rgba(248,113,113,0.10)] text-[#F87171]',
  warning: 'bg-[rgba(251,191,36,0.10)] text-[#FBBF24]',
  ai: 'bg-[rgba(99,102,241,0.12)] text-[#6366F1] border border-[rgba(99,102,241,0.18)]',
  summer: 'bg-[rgba(251,191,36,0.10)] text-[#FBBF24]',
  winter: 'bg-[rgba(99,102,241,0.10)] text-[#818CF8]',
  remedial: 'bg-[rgba(248,113,113,0.10)] text-[#F87171]',
};

const sizeClasses = {
  sm: 'text-[11px] px-2 py-[2px] rounded-[4px]',
  md: 'text-[12px] px-2.5 py-[4px] rounded-[6px]',
};

export default function Badge({ variant = 'default', size = 'sm', children }) {
  const chosenVariant = variantClasses[variant] || variantClasses.default;
  const chosenSize = sizeClasses[size] || sizeClasses.sm;

  return (
    <span
      className={`inline-flex items-center font-mono font-medium tracking-[0.05em] uppercase ${chosenVariant} ${chosenSize}`}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {children}
    </span>
  );
}
