import React from 'react';
import { Award } from '../types';
import { Award as AwardIcon, CheckCircle2, ExternalLink, ShieldCheck, ArrowRight } from 'lucide-react';

interface AwardsPageProps {
  awards: Award[];
  onNavigateToShop: () => void;
}

export const AwardsPage: React.FC<AwardsPageProps> = ({ awards, onNavigateToShop }) => {
  const verifiedList = awards.filter((a) => a.verified && a.published);

  return (
    <div id="awards-recognition-page" className="min-h-screen py-12 sm:py-20 bg-[#F8F5FF]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-[11px] uppercase font-sans tracking-[0.25em] text-[#7C3AED] font-semibold bg-[#7C3AED]/10 px-3.5 py-1 rounded-full border border-[#7C3AED]/20 inline-flex items-center justify-center gap-1.5">
            <AwardIcon size={14} />
            <span>AUTHENTICITY &amp; RECOGNITIONS</span>
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl text-[#1E1630] font-normal leading-tight">
            Awards &amp; <span className="gradient-text">Milestones</span>
          </h1>
          <p className="font-sans text-base text-[#6B5F82] max-w-xl mx-auto leading-relaxed">
            Every recognition and certificate presented here reflects formal independent evaluation and verified founder achievements.
          </p>
        </div>

        {/* Verification Standards Notice */}
        <div className="glass-card p-5 rounded-2xl border border-[#DDD6F3] flex items-center gap-4 text-xs font-sans text-[#6B5F82] shadow-sm">
          <ShieldCheck size={20} className="text-[#7C3AED] shrink-0" />
          <p>
            In alignment with GlowWithSH's ethical transparency mandate, our platform maintains a zero-fabrication standard. Only audited industry recognitions verified by our administration team are published.
          </p>
        </div>

        {/* Content Body */}
        {verifiedList.length === 0 ? (
          <div className="glass-card p-10 sm:p-14 rounded-3xl border border-[#DDD6F3] text-center space-y-4 max-w-2xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#EDE8F9] flex items-center justify-center text-[#7C3AED] mx-auto">
              <AwardIcon size={28} />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#1E1630]">
              Quiet Craftsmanship in Progress
            </h2>
            <p className="text-sm font-sans text-[#6B5F82] leading-relaxed">
              We choose genuine customer praise over unearned titles. Formal accolades, clinical accreditations, and industry awards will be cataloged directly here as they are officially confirmed.
            </p>
            <div className="pt-4">
              <button
                onClick={onNavigateToShop}
                className="px-6 py-3 glass-btn-primary rounded-xl text-xs uppercase tracking-wider font-sans font-semibold inline-flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>Experience Our Formulations</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {verifiedList.map((item) => (
              <div
                key={item.id}
                className="glass-card p-6 sm:p-8 rounded-2xl border border-[#DDD6F3] shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md hover:border-[#7C3AED]/40 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-sans">
                    <span className="text-[#7C3AED] font-semibold tracking-wider uppercase">
                      {item.organization}
                    </span>
                    <span className="text-[#6B5F82] font-mono bg-[#EDE8F9] px-2.5 py-0.5 rounded-full border border-[#DDD6F3]">
                      {item.year}
                    </span>
                  </div>

                  <h3 className="font-serif text-2xl text-[#1E1630] leading-snug">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-xs font-sans text-[#6B5F82] leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-[#DDD6F3] flex items-center justify-between text-xs font-sans">
                  <span className="text-emerald-700 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 size={14} />
                    Verified Official Record
                  </span>
                  {item.externalLink && (
                    <a
                      href={item.externalLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#1E1630] hover:text-[#7C3AED] flex items-center gap-1 font-medium transition-colors"
                    >
                      <span>Certificate Details</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
