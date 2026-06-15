import React from 'react';
import { Container } from '../ui/Container';
import { Button } from '../ui/Button';
import { ChevronRight } from '../ui/Icons';

export function CTASection() {
  return (
    <section className="py-24 bg-[#ffffff] border-t border-[#e2e8f0] relative overflow-hidden">
      <Container className="text-center relative z-10">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#c9a96e] font-mono mb-4">
            START PREPARATION TODAY
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-[#0f172a] uppercase leading-tight mb-6">
            Get instant access to academic intelligence
          </h2>
          <p className="text-[15px] text-[#64748b] leading-relaxed mb-8 max-w-lg font-medium">
            Join the students using GTU Exam Buddy to organize their semesters, review past exam questions, and generate weighted blueprints.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button to="/login" variant="accent" className="w-full sm:w-auto px-8">
              Access Dashboard
              <ChevronRight size={15} className="ml-1.5" />
            </Button>
            <Button to="/login" variant="secondary" className="w-full sm:w-auto px-8">
              System Admin Console
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
export default CTASection;
