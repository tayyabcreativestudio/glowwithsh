import React from 'react';
import { BlogPost, Product } from '../types';
import { formatDate } from '../utils/format';
import { ProductCard } from '../components/storefront/ProductCard';
import { Clock, ArrowLeft, Share2, Sparkles, User, Check } from 'lucide-react';

interface JournalArticlePageProps {
  post: BlogPost;
  allProducts: Product[];
  onBack: () => void;
  onSelectProduct: (slug: string) => void;
}

export const JournalArticlePage: React.FC<JournalArticlePageProps> = ({
  post,
  allProducts,
  onBack,
  onSelectProduct,
}) => {
  const [copied, setCopied] = React.useState(false);

  const relatedProducts = allProducts.filter((p) =>
    post.relatedProductIds?.includes(p.id)
  );

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article id="journal-article-detail" className="min-h-screen py-12 sm:py-20 bg-[#F8F5FF]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Navigation & Back */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs uppercase font-sans font-semibold tracking-wider text-[#6B5F82] hover:text-[#7C3AED] transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Journal</span>
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-sans text-[#6B5F82] hover:text-[#7C3AED] glass-card px-3.5 py-1.5 rounded-full border border-[#DDD6F3] cursor-pointer transition-all"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
            <span>{copied ? 'Link Copied' : 'Share'}</span>
          </button>
        </div>

        {/* Article Header */}
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <span className="text-[11px] uppercase font-sans tracking-[0.2em] text-[#7C3AED] font-semibold bg-[#7C3AED]/10 px-3.5 py-1 rounded-full border border-[#7C3AED]/20 inline-block">
            {post.category}
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#1E1630] font-normal leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center justify-center gap-3 text-xs font-sans text-[#6B5F82] pt-2">
            <span className="flex items-center gap-1">
              <User size={13} className="text-[#7C3AED]" />
              {post.author}
            </span>
            <span>•</span>
            <span>{formatDate(post.publishedAt)}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {post.readTime}
            </span>
          </div>
        </div>

        {/* Cover Photo */}
        <div className="aspect-16/9 rounded-3xl overflow-hidden shadow-lg border border-[#DDD6F3]">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Excerpt Lead */}
        <div className="glass-card text-lg sm:text-xl font-serif text-[#1E1630] italic border-l-4 border-[#7C3AED] p-6 rounded-r-2xl max-w-2xl mx-auto shadow-sm">
          "{post.excerpt}"
        </div>

        {/* Article Body Content */}
        <div className="max-w-2xl mx-auto font-sans text-[#6B5F82] text-base leading-relaxed space-y-6 pt-4">
          {post.content.split('\n\n').map((para, i) => (
            <p key={i} className="leading-relaxed text-[#1E1630]/90">
              {para}
            </p>
          ))}
        </div>

        {/* Related Routine Products */}
        {relatedProducts.length > 0 && (
          <div className="pt-12 border-t border-[#DDD6F3] space-y-6">
            <div className="text-center space-y-1">
              <span className="text-xs uppercase font-sans tracking-[0.2em] text-[#7C3AED] font-semibold flex items-center justify-center gap-1.5">
                <Sparkles size={14} />
                <span>RITUAL COMPANIONS</span>
              </span>
              <h3 className="font-serif text-2xl text-[#1E1630]">
                Products Mentioned in this Reflection
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {relatedProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onClick={onSelectProduct}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
};
