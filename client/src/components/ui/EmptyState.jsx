import React from 'react';

export default function EmptyState({ Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      {Icon && (
        <div className="mb-4 text-[#2A2520] flex items-center justify-center">
          <Icon size={44} strokeWidth={1} />
        </div>
      )}
      <h3 className="font-ui text-[15px] font-medium text-[#7A726A] text-center">
        {title}
      </h3>
      {description && (
        <p className="font-ui text-[13px] text-[#4A4540] mt-1.5 max-w-[280px] text-center leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-5 h-9 px-4 border border-[rgba(201,169,110,0.25)] text-[#C9A96E] rounded-[8px] text-[13px] hover:bg-[rgba(201,169,110,0.08)] transition-all duration-150 ease-in-out font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
