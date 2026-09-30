import React from 'react';
import { BadgeType } from '../../types';

interface BadgeProps {
  type: BadgeType | string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, className = '' }) => {
  if (!type) return null;

  const normalized = type.toUpperCase();

  let style = 'bg-[#1E1630] text-white';
  if (normalized === 'BESTSELLER') {
    style = 'bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] text-white font-semibold';
  } else if (normalized === 'NEW') {
    style = 'bg-[#1E1630] text-white tracking-widest';
  } else if (normalized === 'LIMITED') {
    style = 'bg-[#C084FC] text-white';
  } else if (normalized === 'SALE') {
    style = 'bg-[#EF4444] text-white';
  } else if (normalized === 'FEATURED') {
    style = 'glass-badge text-[#7C3AED]';
  }

  return (
    <span
      className={`inline-flex items-center justify-center text-[10px] uppercase font-sans tracking-wider px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-sm ${style} ${className}`}
    >
      {type}
    </span>
  );
};
