import React from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';

interface NotFoundPageProps {
  onBackToShop: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onBackToShop }) => {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center space-y-6 bg-[#F8F5FF]">
      <div className="w-16 h-16 rounded-full bg-[#EDE8F9] flex items-center justify-center text-[#7C3AED] shadow-sm">
        <Sparkles size={26} />
      </div>

      <span className="text-[10px] uppercase tracking-[0.25em] font-sans text-[#7C3AED] font-semibold bg-[#7C3AED]/10 px-3.5 py-1 rounded-full border border-[#7C3AED]/20">
        404 • PAGE NOT FOUND
      </span>

      <h1 className="font-serif text-3xl sm:text-5xl text-[#1E1630] font-normal">
        This glow seems to have wandered.
      </h1>

      <p className="text-xs sm:text-sm font-sans text-[#6B5F82] max-w-sm leading-relaxed">
        The ritual or page you are looking for may have been moved or is currently being reformulated in our atelier.
      </p>

      <div className="pt-2">
        <button
          onClick={onBackToShop}
          className="px-8 py-3.5 glass-btn-primary rounded-xl text-xs uppercase tracking-widest font-sans font-semibold inline-flex items-center gap-2 cursor-pointer shadow-md"
        >
          <ArrowLeft size={14} />
          <span>Return to Catalog</span>
        </button>
      </div>
    </div>
  );
};
