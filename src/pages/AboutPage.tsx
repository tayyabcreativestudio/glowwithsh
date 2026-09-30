import React from 'react';
import { ArrowRight, Sparkles, Heart, ShieldCheck, Leaf } from 'lucide-react';

interface AboutPageProps {
  onNavigateToShop: () => void;
  onNavigateToFounder: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  onNavigateToShop,
  onNavigateToFounder,
}) => {
  return (
    <div id="about-brand-page" className="min-h-screen py-12 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Top Header */}
        <div className="text-center space-y-3">
          <span className="text-[11px] uppercase font-sans tracking-[0.25em] text-[#A78BFA] font-semibold">
            THE ATELIER PHILOSOPHY
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl text-[#1E1630] font-normal leading-tight">
            Beauty Begins With The Ritual
          </h1>
          <p className="font-sans text-base sm:text-lg text-[#6B5F82] max-w-2xl mx-auto leading-relaxed">
            GlowWithSH was born from a desire to return skincare to something personal, intentional, and calming.
          </p>
        </div>

        {/* Feature Image Banner */}
        <div className="aspect-16/9 rounded-3xl overflow-hidden shadow-md border border-[#DDD6F3] glass-card">
          <img
            src="https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1200&auto=format&fit=crop"
            alt="GlowWithSH Ritual Studio"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Brand Story Prose */}
        <div className="max-w-3xl mx-auto space-y-6 font-sans text-[#6B5F82] leading-relaxed text-base">
          <p className="font-serif text-2xl sm:text-3xl text-[#1E1630] leading-snug">
            "We believe everyday skincare should not feel like an aggressive chemical chore, but a peaceful ritual of self-appreciation."
          </p>
          <p>
            Founded by <strong>Shagufi Hussain</strong> in Delhi, GlowWithSH crafts thoughtfully composed skincare formulas that combine the restorative qualities of botanical traditions with contemporary dermatological comfort.
          </p>
          <p>
            Each formulation — from our micro-foaming Golden Facewash and fermented Korean Rice Serums to our intensely nourishing Ceremonial Bridal Creams — is developed with meticulous attention to texture, absorption, and skin barrier harmony.
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#A78BFA]/15 flex items-center justify-center text-[#7C3AED]">
              <Leaf size={20} />
            </div>
            <h3 className="font-serif text-xl text-[#1E1630]">Intentional Ingredients</h3>
            <p className="text-xs font-sans text-[#6B5F82] leading-relaxed">
              Every botanical oil, peptide, and soothing extract is purposefully selected to nourish rather than overwhelm.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#A78BFA]/15 flex items-center justify-center text-[#7C3AED]">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-serif text-xl text-[#1E1630]">Delhi Atelier Standards</h3>
            <p className="text-xs font-sans text-[#6B5F82] leading-relaxed">
              Formulated, inspected, and shipped directly from our dedicated studio in Subhash Vihar, Delhi 110053.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#A78BFA]/15 flex items-center justify-center text-[#7C3AED]">
              <Heart size={20} />
            </div>
            <h3 className="font-serif text-xl text-[#1E1630]">Cruelty-Free Craft</h3>
            <p className="text-xs font-sans text-[#6B5F82] leading-relaxed">
              Never tested on animals. Formulated for everyday harmony across diverse Indian skin types and changing seasons.
            </p>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-[#1E1630] via-[#2D1F4E] to-[#3B2571] text-white rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-[rgba(167,139,250,0.3)]">
          <div>
            <h3 className="font-serif text-2xl sm:text-3xl font-medium">Meet Founder Shagufi Hussain</h3>
            <p className="text-xs sm:text-sm font-sans text-white/80 mt-1 max-w-md">
              Discover the personal journey, values, and dedication behind the GlowWithSH rituals.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={onNavigateToFounder}
              className="px-6 py-3.5 glass-btn-primary text-white rounded-xl text-xs uppercase font-sans font-semibold tracking-wider cursor-pointer text-center shadow-md"
            >
              Meet Shagufi
            </button>
            <button
              onClick={onNavigateToShop}
              className="px-6 py-3.5 glass-btn-secondary text-white rounded-xl text-xs uppercase font-sans font-semibold tracking-wider cursor-pointer text-center"
            >
              Explore Shop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
