import React from 'react';
import { ArrowRight, Clock, BookOpen } from 'lucide-react';
import { BlogPost } from '../../types';
import { formatDate } from '../../utils/format';

interface JournalSectionProps {
  posts: BlogPost[];
  onSelectArticle: (slug: string) => void;
  onViewAll: () => void;
}

export const JournalSection: React.FC<JournalSectionProps> = ({
  posts,
  onSelectArticle,
  onViewAll,
}) => {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      <div className="absolute inset-0 glass-surface" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#C084FC]/6 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-[11px] uppercase font-sans tracking-[0.2em] text-[#A78BFA] font-semibold flex items-center gap-1.5">
              <BookOpen size={14} />
              <span>THE GLOW JOURNAL</span>
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1E1630] font-normal mt-1">
              Rituals, Formulations &amp; Skin Wisdom
            </h2>
            <p className="text-sm font-sans text-[#6B5F82] mt-1">
              Reflections on ingredients, climate care, and daily nourishment by Shagufi Hussain.
            </p>
          </div>

          <button
            onClick={onViewAll}
            className="inline-flex items-center gap-2 text-xs uppercase font-sans font-semibold tracking-wider text-[#7C3AED] hover:text-[#A78BFA] transition-colors cursor-pointer"
          >
            <span>Read All Articles</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.slice(0, 3).map((article) => (
            <article
              key={article.id}
              onClick={() => onSelectArticle(article.slug)}
              className="group flex flex-col justify-between glass-card glass-card-hover rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
            >
              <div className="relative aspect-16/10 overflow-hidden bg-[#EDE8F5]">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
                <div
                  className="absolute top-3 left-3 text-white text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-sans"
                  style={{
                    background: 'rgba(30, 22, 48, 0.75)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {article.category}
                </div>
              </div>

              <div className="p-6 flex flex-col justify-between flex-1 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-[11px] text-[#6B5F82] font-sans">
                    <span>{formatDate(article.publishedAt)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {article.readTime}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl text-[#1E1630] group-hover:text-[#7C3AED] transition-colors font-medium leading-snug">
                    {article.title}
                  </h3>

                  <p className="text-xs font-sans text-[#6B5F82] line-clamp-2 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#DDD6F3]/60 flex items-center justify-between text-xs font-sans font-semibold text-[#7C3AED] group-hover:text-[#A78BFA]">
                  <span>Read Article</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
