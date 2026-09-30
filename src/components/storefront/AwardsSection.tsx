import React from 'react';
import { Award as AwardType } from '../../types';
import { Award as AwardIcon, CheckCircle2, ExternalLink } from 'lucide-react';

interface AwardsSectionProps {
  awards: AwardType[];
}

export const AwardsSection: React.FC<AwardsSectionProps> = ({ awards }) => {
  // Filter for verified & published awards
  const verifiedAwards = awards.filter((a) => a.verified && a.published);

  // If no verified awards have been entered by the administrator,
  // we show a graceful founder commitment statement as strictly mandated in Section 2 & 10!
  if (verifiedAwards.length === 0) {
    return (
      <section className="py-12 relative overflow-hidden">
        <div className="absolute inset-0 glass-surface" />
        <div className="max-w-4xl mx-auto px-4 text-center space-y-2 relative">
          <span className="text-[11px] uppercase font-sans tracking-[0.2em] text-[#A78BFA] font-semibold">
            Commitment to Authenticity
          </span>
          <p className="font-serif text-xl sm:text-2xl text-[#1E1630]">
            GlowWithSH honors verifiable beauty — driven by genuine founder craftsmanship and authentic customer rituals.
          </p>
          <p className="text-xs font-sans text-[#6B5F82]">
            Verified industry recognitions and independent atelier certifications will appear here once officially recorded.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-20 relative overflow-hidden">
      <div className="absolute top-20 right-20 w-80 h-80 bg-[#A78BFA]/6 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-[11px] uppercase font-sans tracking-[0.2em] text-[#A78BFA] font-semibold flex items-center justify-center gap-1.5">
            <AwardIcon size={14} />
            <span>Verified Recognitions</span>
          </span>
          <h2 className="font-serif text-3xl text-[#1E1630] font-normal">
            Awards &amp; Milestones
          </h2>
          <p className="text-xs font-sans text-[#6B5F82]">
            Official industry accolades and formal acknowledgments granted to Shagufi Hussain &amp; GlowWithSH.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {verifiedAwards.map((item) => (
            <div
              key={item.id}
              className="glass-card glass-card-hover p-6 rounded-2xl space-y-3 relative flex flex-col justify-between transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[#A78BFA] font-sans font-semibold">
                  <span>{item.organization}</span>
                  <span>{item.year}</span>
                </div>
                <h3 className="font-serif text-xl text-[#1E1630] font-medium mt-1">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-xs font-sans text-[#6B5F82] mt-2 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#DDD6F3]/60 flex items-center justify-between text-[11px] font-sans">
                <span className="text-emerald-600 flex items-center gap-1 font-medium">
                  <CheckCircle2 size={13} />
                  Verified Record
                </span>
                {item.externalLink && (
                  <a
                    href={item.externalLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#6B5F82] hover:text-[#7C3AED] flex items-center gap-1 transition-colors"
                  >
                    <span>Details</span>
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
