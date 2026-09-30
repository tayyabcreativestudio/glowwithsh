import React from 'react';
import { Sparkles } from 'lucide-react';

interface AnnouncementBarProps {
  text?: string;
  enabled?: boolean;
  linkText?: string;
  onActionClick?: () => void;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
  text = 'Glow into your everyday ritual. Complimentary express shipping across India on orders above ₹999.',
  enabled = true,
  linkText,
  onActionClick,
}) => {
  if (!enabled || !text) return null;

  return (
    <aside
      id="announcement-bar"
      aria-label="Announcement"
      className="text-white text-[9px] sm:text-xs tracking-wider uppercase py-2.5 px-3 sm:px-4 text-center font-sans"
      style={{
        background: 'linear-gradient(135deg, #1E1630 0%, #2D1F4E 50%, #3B2571 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-start sm:items-center justify-center gap-1.5 sm:gap-2">
        <Sparkles size={12} className="text-[#A78BFA] shrink-0" />
        <span className="font-medium leading-4 sm:truncate">{text}</span>
        {linkText && (
          <button
            onClick={onActionClick}
            className="shrink-0 underline underline-offset-2 ml-1 font-semibold text-[#C084FC] hover:text-white transition-colors"
          >
            {linkText}
          </button>
        )}
      </div>
    </aside>
  );
};
