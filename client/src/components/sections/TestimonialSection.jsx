import React from 'react';
import { motion } from 'framer-motion';
import { Container } from '../ui/Container';
import { Link } from 'react-router-dom';
import { testimonials } from '../../data/testimonials';

export function TestimonialSection() {
  const t = testimonials[0];

  return (
    <section className="px-6 md:px-12 lg:px-20 py-24 bg-[#f8fafc] border-t border-b border-[#e2e8f0] flex flex-col items-center">
      <Container clean className="max-w-[1000px] w-full grid grid-cols-1 md:grid-cols-12 gap-10 items-center bg-[#ffffff] border border-[#e2e8f0] rounded-[32px] p-8 md:p-14 shadow-sm">
        
        {/* Portrait Image Block */}
        <div className="md:col-span-4 aspect-square rounded-2xl overflow-hidden border border-[#e2e8f0] bg-[#f8fafc]">
          <img 
            src={t.image} 
            alt={t.author} 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Message Content */}
        <div className="md:col-span-8 text-left flex flex-col justify-center">
          <span className="text-[10px] font-mono text-[#c9a96e] tracking-[0.25em] uppercase mb-2">STUDENT ADVISORY MESSAGE</span>
          <h3 className="text-xl md:text-2xl font-bold tracking-tight text-[#0f172a] mb-5">
            "We have structure where we previously had clutter."
          </h3>
          <p className="text-[14px] text-[#475569] leading-relaxed mb-6 italic font-medium">
            "{t.quote}"
          </p>
          <div className="border-t border-[#f1f5f9] pt-4 flex items-center justify-between">
            <div>
              <span className="text-[13.5px] font-bold text-[#0f172a] block">{t.author}</span>
              <span className="text-[11px] text-[#c9a96e] uppercase tracking-wider font-mono">{t.role}</span>
            </div>
            
            <Link 
              to="/login"
              className="w-9 h-9 rounded-xl border border-[#e2e8f0] flex items-center justify-center text-[#0f172a] hover:bg-[#0f172a] hover:text-[#ffffff] hover:border-[#0f172a] transition-all duration-300"
            >
              →
            </Link>
          </div>
        </div>

      </Container>
    </section>
  );
}
export default TestimonialSection;
