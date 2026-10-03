import React from 'react';
import { Instagram, ArrowUpRight } from 'lucide-react';
import { InstagramSettings } from '../../types';
import { responsiveImage } from '../../utils/responsiveImage';

interface InstagramSectionProps {
  settings: InstagramSettings;
}

export const InstagramSection: React.FC<InstagramSectionProps> = ({ settings }) => {
  if (!settings.enabled) return null;

  return (
    <section className="py-16 sm:py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-[11px] uppercase font-sans tracking-[0.2em] text-[#6D28D9] font-semibold flex items-center gap-1.5">
              <Instagram size={14} />
              <span>COMMUNITY &amp; RITUALS</span>
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1E1630] font-normal mt-1">
              GlowWithSH on Instagram
            </h2>
            <p className="text-sm font-sans text-[#6B5F82] mt-1">
              Follow the world of GlowWithSH • <span className="font-semibold text-[#7C3AED]">{settings.handle}</span>
            </p>
          </div>

          <a
            href={settings.profileUrl || 'https://www.instagram.com/glowwithsh_skinwhitening_/?hl=en'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-xl text-xs font-sans uppercase tracking-wider font-semibold text-[#1E1630] hover:text-[#7C3AED] transition-all shadow-sm"
          >
            <span>Follow {settings.handle || '@glowwithsh_skinwhitening_'}</span>
            <ArrowUpRight size={14} />
          </a>
        </div>

        {/* 4-Column Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {settings.curatedPosts.map((post) => (
            <a
              key={post.id}
              href={post.postUrl || settings.profileUrl}
              target="_blank"
              rel="noreferrer"
              className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{ border: '1px solid rgba(167, 139, 250, 0.15)' }}
            >
              <img
                {...responsiveImage(post.imageUrl, '(min-width: 1024px) 25vw, 50vw')}
                width="640" height="640"
                alt={post.caption || 'GlowWithSH Instagram'}
                className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 ease-out"
                loading="lazy"
              />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center text-white"
                style={{ background: 'linear-gradient(135deg, rgba(30, 22, 48, 0.8), rgba(124, 58, 237, 0.6))' }}
              >
                <Instagram size={24} className="text-[#6D28D9] mb-2" />
                <p className="text-xs font-sans line-clamp-3 leading-snug">
                  {post.caption}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
