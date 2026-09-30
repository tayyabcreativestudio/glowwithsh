import React, { useState } from 'react';
import { BlogPost } from '../types';
import { Clock, BookOpen, ArrowRight } from 'lucide-react';
import { formatDate } from '../utils/format';

interface JournalPageProps {
  posts: BlogPost[];
  onSelectArticle: (slug: string) => void;
}

export const JournalPage: React.FC<JournalPageProps> = ({ posts, onSelectArticle }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(posts.map((p) => p.category)))];

  const filtered = selectedCategory === 'all'
    ? posts.filter((p) => p.status === 'published')
    : posts.filter((p) => p.status === 'published' && p.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div id="journal-catalog-page" className="min-h-screen py-12 sm:py-20 bg-[#F8F5FF]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-[11px] uppercase font-sans tracking-[0.25em] text-[#7C3AED] font-semibold bg-[#7C3AED]/10 px-3.5 py-1 rounded-full border border-[#7C3AED]/20 inline-flex items-center justify-center gap-1.5">
            <BookOpen size={14} />
            <span>THE GLOW JOURNAL</span>
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl text-[#1E1630] font-normal leading-tight">
            Skin Wisdom &amp; <span className="gradient-text">Daily Rituals</span>
          </h1>
          <p className="font-sans text-base text-[#6B5F82] max-w-xl mx-auto leading-relaxed">
            Reflections on ingredient chemistry, climate changes, and intentional self-care by Shagufi Hussain.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs uppercase font-sans tracking-wider transition-all cursor-pointer capitalize shrink-0 ${
                selectedCategory === cat
                  ? 'glass-btn-primary shadow-sm'
                  : 'glass-card text-[#1E1630] hover:border-[#7C3AED]/40'
              }`}
            >
              {cat === 'all' ? 'All Reflections' : cat}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filtered.map((post) => (
            <article
              key={post.id}
              onClick={() => onSelectArticle(post.slug)}
              className="group glass-card rounded-2xl border border-[#DDD6F3] overflow-hidden cursor-pointer shadow-sm hover:shadow-xl hover:border-[#7C3AED]/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="relative aspect-16/10 overflow-hidden bg-[#EDE8F9]">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute top-3 left-3 bg-[#1E1630]/85 backdrop-blur-md text-white text-[10px] uppercase font-sans tracking-wider px-2.5 py-0.5 rounded-full border border-white/20">
                  {post.category}
                </div>
              </div>

              <div className="p-6 flex flex-col justify-between flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-sans text-[#6B5F82]">
                    <span>{formatDate(post.publishedAt)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {post.readTime}
                    </span>
                  </div>

                  <h2 className="font-serif text-2xl text-[#1E1630] group-hover:text-[#7C3AED] transition-colors leading-snug">
                    {post.title}
                  </h2>

                  <p className="text-xs font-sans text-[#6B5F82] line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#DDD6F3] flex items-center justify-between text-xs font-sans font-semibold text-[#1E1630] group-hover:text-[#7C3AED] transition-colors">
                  <span>Read Full Article</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};
