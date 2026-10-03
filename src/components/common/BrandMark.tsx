import React from 'react';

/** Decorative beside the readable brand name; the parent supplies its accessible name. */
export const BrandMark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img src="/brand/glowwithsh-mark.svg" alt="" aria-hidden="true" width="64" height="64" className={`shrink-0 ${className}`} />
);
