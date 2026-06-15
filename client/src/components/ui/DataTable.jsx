import React from 'react';
import LoadingSkeleton from './LoadingSkeleton';

export default function DataTable({
  headers = [],
  rows = [],
  loading = false,
  emptyState = null,
  skeletonRows = 5,
  skeletonColumns = ['20%', '50%', '15%', '15%']
}) {
  return (
    <div className="w-full overflow-hidden border border-[rgba(255,255,255,0.06)] bg-[#141210] rounded-[10px]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.01)]">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="py-3.5 px-5 font-ui text-[10px] tracking-[0.2em] uppercase text-[#7A726A] font-medium"
                  style={{ width: h.width || 'auto' }}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
            {loading ? (
              <tr>
                <td colSpan={headers.length} className="p-0">
                  <LoadingSkeleton rows={skeletonRows} columns={skeletonColumns} />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="py-12 px-6">
                  {emptyState}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-[rgba(255,255,255,0.015)] transition-colors duration-150 group"
                >
                  {headers.map((h, colIndex) => (
                    <td
                      key={colIndex}
                      className="py-4.5 px-5 text-[13.5px] font-ui text-[#BDB5AA]"
                    >
                      {row[h.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
