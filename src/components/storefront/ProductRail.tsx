import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';

interface ProductRailProps {
  title?: string;
  subtitle?: string;
  products: Product[];
  onSelectProduct: (slug: string) => void;
}

export const ProductRail: React.FC<ProductRailProps> = ({
  title = 'Most Coveted Best Sellers',
  subtitle = 'Beloved formulations trusted daily across our glowing community.',
  products,
  onSelectProduct,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 relative">
      <div className="absolute top-10 right-10 w-64 h-64 bg-[#A78BFA]/6 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-[11px] uppercase font-sans tracking-[0.2em] text-[#A78BFA] font-semibold">
              Curated Essentials
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1E1630] font-normal mt-1">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm font-sans text-[#6B5F82] mt-1.5 max-w-lg">
                {subtitle}
              </p>
            )}
          </div>

          {/* Navigation arrow buttons */}
          <div className="hidden sm:flex items-center space-x-2">
            <button
              onClick={() => handleScroll('left')}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#1E1630] glass-card transition-all hover:text-[#7C3AED] cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#1E1630] glass-card transition-all hover:text-[#7C3AED] cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Track */}
        <div
          ref={scrollRef}
          className="flex space-x-4 sm:space-x-6 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="w-[78vw] sm:w-[280px] lg:w-[300px] shrink-0 snap-start"
            >
              <ProductCard product={product} onClick={onSelectProduct} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
