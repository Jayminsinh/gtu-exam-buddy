import React from 'react';
import { Container } from '../ui/Container';
import { stats } from '../../data/stats';

export function StatsSection() {
  return (
    <section className="px-6 md:px-12 lg:px-20 py-16 bg-[#f8fafc] border-t border-b border-[#e2e8f0]">
      <Container clean className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-left">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono mb-1">
              {stat.label}
            </span>
            <span className="text-3xl md:text-4xl font-black" style={{ color: stat.color }}>
              {stat.value}
            </span>
            <span className="text-[13px] text-[#64748b] mt-1 font-medium">
              {stat.description}
            </span>
          </div>
        ))}
      </Container>
    </section>
  );
}
export default StatsSection;
