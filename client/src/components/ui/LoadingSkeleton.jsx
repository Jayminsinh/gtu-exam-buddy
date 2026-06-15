import React from 'react';

export default function LoadingSkeleton({
  rows = 5,
  columns = ['45%', '20%', '18%', '17%']
}) {
  return (
    <div className="w-full flex flex-col">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center gap-3 py-3.5 px-4 border-b border-[rgba(255,255,255,0.04)] last:border-b-0"
        >
          {columns.map((colWidth, colIndex) => (
            <div
              key={colIndex}
              className="skeleton h-3"
              style={{ width: colWidth }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
