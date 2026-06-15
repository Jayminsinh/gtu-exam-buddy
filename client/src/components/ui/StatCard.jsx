import React from 'react';

export default function StatCard({ value, label, Icon }) {
  return (
    <div className="relative bg-[rgba(201,169,110,0.06)] border border-[rgba(201,169,110,0.14)] rounded-[10px] px-5 py-4 min-w-[140px] flex-1">
      {Icon && (
        <div className="absolute top-3 right-3 text-[rgba(201,169,110,0.3)]">
          <Icon size={18} />
        </div>
      )}
      <div
        className="text-[22px] font-semibold text-[#C9A96E] font-display"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {value}
      </div>
      <div className="text-[11px] font-ui text-[#7A726A] uppercase tracking-[0.08em] mt-1">
        {label}
      </div>
    </div>
  );
}
