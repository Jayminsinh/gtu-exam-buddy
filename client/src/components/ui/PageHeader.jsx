import React from 'react';
import Badge from './Badge';

export default function PageHeader({ title, subtitle, badge, action }) {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8 w-full">
      <div className="flex flex-col items-start">
        <h2
          className="text-[#1a1a1a] font-display italic tracking-[-0.02em] leading-tight font-bold"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.5rem, 2.5vw, 2rem)'
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-[14px] font-ui text-[#666666] mt-1.5 leading-relaxed font-semibold">
            {subtitle}
          </p>
        )}
        {badge && (
          <div className="mt-2.5">
            <Badge variant="gold" size="sm">
              {badge}
            </Badge>
          </div>
        )}
      </div>
      {action && (
        <div className="md:self-end flex items-center">
          {action}
        </div>
      )}
    </div>
  );
}
