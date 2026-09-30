import React from 'react';
import { ArrowRight, Quote } from 'lucide-react';
import { FounderCMS } from '../../types';

interface FounderSectionProps {
  cms: FounderCMS;
  onMeetFounder: () => void;
}

export const FounderSection: React.FC<FounderSectionProps> = ({ cms, onMeetFounder }) => {
  return (
    <section className="py-16 sm:py-28 relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#A78BFA]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Founder Portrait Column */}
          <div className="lg:col-span-5 relative">
            <div className="aspect-3/4 rounded-2xl overflow-hidden shadow-xl bg-[#EDE8F5]" style={{ border: '1px solid rgba(167, 139, 250, 0.2)' }}>
              <img
                src={cms.image}
                alt={cms.founderName}
                className="w-full h-full object-cover object-top"
                loading="lazy"
              />
            </div>

            {/* Subtle Name Tag */}
            <div
              className="absolute -bottom-5 right-6 px-5 py-3 rounded-xl shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #1E1630 0%, #2D1F4E 100%)',
                border: '1px solid rgba(167, 139, 250, 0.3)',
              }}
            >
              <span className="font-serif text-lg tracking-wide block text-white">
                {cms.founderName}
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#A78BFA] font-sans block">
                {cms.signatureTitle || 'Founder, GlowWithSH'}
              </span>
            </div>
          </div>

          {/* Founder Narrative Column */}
          <div className="lg:col-span-7 space-y-6 pt-6 lg:pt-0">
            <div className="space-y-2">
              <span className="text-[11px] uppercase font-sans tracking-[0.2em] text-[#A78BFA] font-semibold">
                Founder-Led Beauty
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl text-[#1E1630] font-normal leading-[1.12]">
                {cms.headline || 'Meet Shagufi'}
              </h2>
            </div>

            {cms.quote && (
              <div className="relative pl-6 border-l-2 border-[#A78BFA] italic font-serif text-xl sm:text-2xl text-[#1E1630]">
                <Quote size={20} className="text-[#A78BFA] mb-1 opacity-70" />
                <p>"{cms.quote}"</p>
              </div>
            )}

            <p className="font-sans text-base text-[#6B5F82] leading-relaxed whitespace-pre-line">
              {cms.story}
            </p>

            <div className="pt-3">
              <button
                id="meet-the-founder-cta"
                onClick={onMeetFounder}
                className="px-8 py-3.5 glass-btn-primary font-sans font-semibold text-xs tracking-[0.15em] uppercase rounded-xl inline-flex items-center gap-2 cursor-pointer"
              >
                <span>MEET THE FOUNDER</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
