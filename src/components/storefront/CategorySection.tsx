import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Category } from '../../types';

interface CategorySectionProps {
  categories: Category[];
  onSelectCategory: (slug: string) => void;
}

const FALLBACK_CATEGORY_IMAGES: Record<string, string> = {
  creams: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=800&auto=format&fit=crop',
  serums: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop',
  'body-care': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop',
  'face-care': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop',
};

export const CategorySection: React.FC<CategorySectionProps> = ({
  categories,
  onSelectCategory,
}) => {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <section id="shop-by-category-section" className="py-16 sm:py-24 relative">
      {/* Decorative orb */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-[#A78BFA]/6 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-[11px] uppercase font-sans tracking-[0.2em] text-[#A78BFA] font-semibold">
            Categorized Care
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1E1630] font-normal">
            Shop by Category
          </h2>
          <p className="text-sm font-sans text-[#6B5F82]">
            Formulations crafted with purpose for every moment of your daily and nocturnal rituals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, idx) => {
            const hasError = imageErrors[cat.id];
            const fallbackImg = FALLBACK_CATEGORY_IMAGES[cat.slug] || FALLBACK_CATEGORY_IMAGES['creams'];
            const imgSrc = hasError ? fallbackImg : (cat.image || fallbackImg);

            return (
              <div
                key={cat.id}
                id={`category-card-${cat.slug}`}
                onClick={() => onSelectCategory(cat.slug)}
                className="group relative aspect-3/4 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                style={{
                  boxShadow: '0 4px 24px rgba(167, 139, 250, 0.1)',
                  border: '1px solid rgba(167, 139, 250, 0.15)',
                }}
              >
                {/* Background Photography */}
                <img
                  src={imgSrc}
                  alt={cat.name}
                  onError={() => handleImageError(cat.id)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />

                {/* Gradient Overlay */}
                <div
                  className="absolute inset-0 transition-opacity group-hover:opacity-95"
                  style={{
                    background: 'linear-gradient(to top, rgba(30, 22, 48, 0.88) 0%, rgba(45, 31, 78, 0.3) 50%, transparent 100%)',
                  }}
                />

                {/* Text & Action */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                  <div className="flex items-end justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-2xl sm:text-3xl font-medium tracking-wide drop-shadow-sm">
                        <a href={`/shop/category/${cat.slug}`} onClick={event => { event.preventDefault(); event.stopPropagation(); onSelectCategory(cat.slug); }}>{cat.name}</a>
                      </h3>
                      <p className="text-xs font-sans text-white/75 mt-1.5 line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                        idx === 0
                          ? 'bg-[#A78BFA] text-white group-hover:bg-[#C084FC]'
                          : 'text-white group-hover:bg-[#A78BFA] group-hover:text-white'
                      }`}
                      style={idx !== 0 ? { background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' } : {}}
                    >
                      <ArrowUpRight size={18} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
