import React, { useState } from 'react';
import { MessageSquare, X, Package, Sparkles, Phone, ArrowRight, ShieldCheck } from 'lucide-react';

interface WhatsAppConciergeProps {
  onNavigate: (path: string) => void;
}

export const WhatsAppConcierge: React.FC<WhatsAppConciergeProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);

  const founderAvatar =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop';

  return (
    <div className="fixed bottom-6 right-6 z-30 print:hidden">
      {/* Floating Action Modal */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-88 bg-white/95 backdrop-blur-md rounded-3xl p-5 shadow-2xl border border-[#DDD6F3] space-y-4 animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#DDD6F3] pb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={founderAvatar}
                  alt="Shagufi Hussain"
                  className="w-11 h-11 rounded-full object-cover border-2 border-[#7C3AED]"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-semibold text-[#1E1630] leading-tight">
                  Shagufi Hussain
                </h4>
                <span className="text-[10px] uppercase font-sans tracking-wider text-[#7C3AED] font-semibold">
                  Atelier Concierge • Online
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-[#6B5F82] hover:text-[#1E1630] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-xs font-sans text-[#6B5F82] leading-relaxed">
            Welcome darling! How may I assist your skincare journey today?
          </p>

          {/* Quick Action Navigation Buttons */}
          <div className="space-y-2 text-xs font-sans">
            <button
              onClick={() => {
                setIsOpen(false);
                onNavigate('/track-order');
              }}
              className="w-full p-2.5 bg-[#F8F5FF] hover:bg-[#EDE8F5] text-[#1E1630] rounded-xl font-medium flex items-center justify-between border border-[#DDD6F3] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Package size={14} className="text-[#7C3AED]" />
                <span>Track My Shipment</span>
              </span>
              <ArrowRight size={13} className="text-[#6B5F82]" />
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onNavigate('/quiz');
              }}
              className="w-full p-2.5 bg-[#F8F5FF] hover:bg-[#EDE8F5] text-[#1E1630] rounded-xl font-medium flex items-center justify-between border border-[#DDD6F3] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#7C3AED]" />
                <span>Take 60s Skin Ritual Quiz</span>
              </span>
              <ArrowRight size={13} className="text-[#6B5F82]" />
            </button>

            <a
              href="https://wa.me/917303490594?text=Hello%20Shagufi!%20I%20would%20like%20a%20personal%20skincare%20consultation%20for%20my%20skin."
              target="_blank"
              rel="noreferrer"
              className="w-full p-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl font-semibold flex items-center justify-between shadow-xs transition-colors"
            >
              <span className="flex items-center gap-2">
                <MessageSquare size={14} />
                <span>Chat Directly on WhatsApp</span>
              </span>
              <ArrowRight size={13} />
            </a>
          </div>

          <div className="pt-2 border-t border-[#DDD6F3] flex items-center justify-between text-[10px] text-[#6B5F82] font-sans">
            <span className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-600" />
              <span>Verified Delhi Atelier</span>
            </span>
            <span>Mon–Sat: 10am–7pm</span>
          </div>
        </div>
      )}

      {/* Floating Pill Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2.5 px-4 py-2.5 bg-white/90 hover:bg-white text-[#1E1630] rounded-full shadow-lg border border-[#DDD6F3] hover:border-[#7C3AED] backdrop-blur-md transition-all cursor-pointer"
        aria-label="Open Atelier Concierge"
      >
        <div className="relative">
          <img
            src={founderAvatar}
            alt="Shagufi Hussain"
            className="w-7 h-7 rounded-full object-cover border border-[#7C3AED]"
          />
          <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
        </div>
        <span className="text-xs font-sans font-semibold tracking-wide hidden sm:inline">
          {isOpen ? 'Close' : 'Glow Concierge'}
        </span>
        <span className="sm:hidden text-xs">💬</span>
      </button>
    </div>
  );
};
