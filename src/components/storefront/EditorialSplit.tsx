import React from 'react';
import { responsiveImage } from '../../utils/responsiveImage';
import { ArrowRight, Sparkles } from 'lucide-react';

interface EditorialSplitProps {
  headline?: string;
  text?: string;
  image?: string;
  onExplore: () => void;
}

export const EditorialSplit: React.FC<EditorialSplitProps> = ({
  headline = 'Beauty begins with the ritual.',
  text = 'Rooted in authentic self-care and thoughtful formulations, GlowWithSH crafts beauty essentials designed to elevate your everyday routine into a moment of intentional indulgence.',
  image = 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=1000&auto=format&fit=crop',
  onExplore,
}) => {
  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      {/* Glass background */}
      <div className="absolute inset-0 glass-surface" />
      <div className="absolute top-10 left-10 w-64 h-64 bg-[#C084FC]/8 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Editorial Image */}
          <div className="lg:col-span-6 order-2 lg:order-1 relative">
            <div className="aspect-4/3 rounded-2xl overflow-hidden shadow-lg" style={{ border: '1px solid rgba(167, 139, 250, 0.2)' }}>
              <img
                {...responsiveImage(image, '(min-width: 1024px) 50vw, 100vw')}
                width="800" height="600"
                alt="GlowWithSH Skincare Ritual Texture"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            {/* Subtle purple decorative accent */}
            <div className="absolute -bottom-4 -left-4 w-24 h-24 border border-[#A78BFA]/30 rounded-xl -z-10 hidden sm:block" />
          </div>

          {/* Editorial Content */}
          <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs uppercase font-sans tracking-[0.2em] text-[#6D28D9] font-semibold">
              <Sparkles size={14} />
              <span>THE GLOW PHILOSOPHY</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl text-[#1E1630] font-normal leading-[1.15]">
              {headline}
            </h2>

            <p className="font-sans text-base text-[#6B5F82] leading-relaxed max-w-lg">
              {text}
            </p>

            <div className="pt-2">
              <button
                onClick={onExplore}
                className="inline-flex items-center gap-2 text-xs uppercase font-sans font-semibold tracking-[0.15em] text-[#7C3AED] border-b-2 border-[#7C3AED] pb-1 hover:border-[#A78BFA] hover:text-[#6D28D9] transition-colors cursor-pointer"
              >
                <span>Discover the Routine</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
