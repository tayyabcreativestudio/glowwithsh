import React from 'react';
import { FounderCMS } from '../types';
import { Quote, Sparkles, MapPin, Phone, Instagram, ArrowRight } from 'lucide-react';

interface FounderPageProps {
  cms: FounderCMS;
  onNavigateToShop: () => void;
  onNavigateToContact: () => void;
}

export const FounderPage: React.FC<FounderPageProps> = ({
  cms,
  onNavigateToShop,
  onNavigateToContact,
}) => {
  return (
    <div id="founder-page" className="min-h-screen py-12 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-[11px] uppercase font-sans tracking-[0.25em] text-[#A78BFA] font-semibold">
            THE VISIONARY
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl text-[#1E1630] font-normal leading-tight">
            Meet Shagufi Hussain
          </h1>
          <p className="text-sm uppercase tracking-[0.2em] text-[#6B5F82] font-sans">
            {cms.signatureTitle || 'Founder & Creative Director, GlowWithSH'}
          </p>
        </div>

        {/* Hero Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-5">
            <div className="aspect-3/4 rounded-3xl overflow-hidden shadow-xl border border-[#DDD6F3] glass-card">
              <img
                src={cms.image}
                alt={cms.founderName}
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            {cms.quote && (
              <div className="p-6 glass-card rounded-2xl shadow-xs relative">
                <Quote size={24} className="text-[#A78BFA] mb-2 opacity-70" />
                <p className="font-serif text-xl sm:text-2xl text-[#1E1630] italic leading-relaxed">
                  "{cms.quote}"
                </p>
                <span className="block mt-3 text-xs uppercase tracking-wider font-sans font-semibold text-[#7C3AED]">
                  — {cms.founderName}
                </span>
              </div>
            )}

            <div className="font-sans text-[#6B5F82] leading-relaxed space-y-4 text-base">
              <p className="whitespace-pre-line leading-relaxed">
                {cms.story}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap gap-4 text-xs font-sans text-[#6B5F82]">
              <div className="flex items-center gap-1.5 glass-surface px-3.5 py-2 rounded-xl border border-[#DDD6F3] text-[#1E1630]">
                <MapPin size={14} className="text-[#A78BFA]" />
                <span>Delhi, India</span>
              </div>
              <a
                href="https://www.instagram.com/glowwithsh_skinwhitening_/?hl=en"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 glass-surface px-3.5 py-2 rounded-xl border border-[#DDD6F3] hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors"
                title="Visit Shagufi Hussain on Instagram"
              >
                <Instagram size={14} className="text-[#A78BFA]" />
                <span>@glowwithsh_skinwhitening_</span>
              </a>
              <div className="flex items-center gap-1.5 glass-surface px-3.5 py-2 rounded-xl border border-[#DDD6F3] text-[#1E1630]">
                <Phone size={14} className="text-[#A78BFA]" />
                <span>+91 7303490594</span>
              </div>
            </div>
          </div>
        </div>

        {/* Founder Letter / Statement */}
        <div className="glass-card p-8 sm:p-12 rounded-3xl shadow-sm max-w-3xl mx-auto space-y-6">
          <span className="text-[11px] uppercase font-sans tracking-[0.2em] text-[#A78BFA] font-semibold flex items-center gap-1.5">
            <Sparkles size={14} />
            <span>A PERSONAL NOTE</span>
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#1E1630]">
            Crafted for real moments, real skins, and everyday grace
          </h2>
          <div className="font-sans text-sm sm:text-base text-[#6B5F82] space-y-4 leading-relaxed">
            <p>
              When I began formulating the first batches of GlowWithSH, my commitment was simple:
              no compromises on texture, no false promises, and no formulas that damage the skin barrier.
            </p>
            <p>
              Whether it's the soothing sensation of rose mist after a long Delhi afternoon, or the deep replenishment of a rich night cream before sleep, I want every product bearing the GlowWithSH signature to feel like an affectionate conversation with yourself.
            </p>
          </div>
          <div className="pt-4 border-t border-[#DDD6F3]/80 flex items-center justify-between">
            <div>
              <p className="font-serif text-lg font-medium text-[#1E1630]">{cms.founderName}</p>
              <p className="text-xs font-sans text-[#6B5F82]">GlowWithSH Atelier, Delhi 110053</p>
            </div>
            <button
              onClick={onNavigateToShop}
              className="px-6 py-3 glass-btn-primary text-white rounded-xl text-xs uppercase tracking-wider font-sans font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <span>Explore My Rituals</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
