import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { formatINR } from '../../utils/format';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();
  const results = trimmed
    ? products.filter((p) => {
        return (
          p.name.toLowerCase().includes(trimmed) ||
          p.sku.toLowerCase().includes(trimmed) ||
          p.categoryName.toLowerCase().includes(trimmed) ||
          p.shortDescription.toLowerCase().includes(trimmed) ||
          p.skinType.toLowerCase().includes(trimmed) ||
          (p.ingredients && p.ingredients.some((i) => i.toLowerCase().includes(trimmed)))
        );
      })
    : [];

  return (
    <div
      id="search-overlay"
      className="fixed inset-0 z-50 flex flex-col justify-start items-center pt-16 px-4 animate-in fade-in duration-200"
      style={{
        background: 'rgba(30, 22, 48, 0.75)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="w-full max-w-3xl glass-card rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'rgba(248, 245, 255, 0.95)', backdropFilter: 'blur(24px)' }}>
        {/* Search Header Bar */}
        <div className="flex items-center px-6 py-4 border-b border-[#DDD6F3]">
          <Search size={22} className="text-[#6B5F82] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search skincare essentials, formulas, ingredients (e.g. rice, saffron, facewash)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-base sm:text-lg font-sans bg-transparent text-[#1E1630] placeholder-[#6B5F82]/50 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[#6B5F82] hover:text-[#1E1630] mr-2"
              aria-label="Clear query"
            >
              <X size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs uppercase tracking-wider font-sans text-[#6B5F82] hover:text-[#7C3AED] hover:bg-[#EDE8F5] rounded-lg cursor-pointer transition-colors"
          >
            Esc
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {trimmed === '' ? (
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-widest font-sans font-semibold text-[#6B5F82]">
                Popular Ritual Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Golden facewash',
                  'Bridal glow cream',
                  'Korean rice serum',
                  'Sunscreen SPF 50',
                  'Anti acne gel',
                  'Rose soap',
                  'Booster serum',
                ].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3 py-1.5 glass-badge text-xs font-sans text-[#1E1630] rounded-full transition-all cursor-pointer hover:bg-[#EDE8F5]"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-serif text-xl text-[#1E1630]">No beauty essentials found</p>
              <p className="text-sm font-sans text-[#6B5F82] mt-1">
                Try searching for ingredients, categories (Creams, Serums) or product name.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest font-sans font-semibold text-[#6B5F82] mb-3">
                {results.length} {results.length === 1 ? 'Product' : 'Products'} Found
              </p>
              <div className="divide-y divide-[#DDD6F3]">
                {results.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      onSelectProduct(product);
                      onClose();
                    }}
                    className="py-3 flex items-center justify-between group cursor-pointer hover:bg-[#EDE8F5]/60 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={product.primaryImage}
                        alt={product.name}
                        className="w-14 h-14 object-cover rounded-xl"
                        style={{ border: '1px solid rgba(167, 139, 250, 0.2)' }}
                      />
                      <div>
                        <span className="text-[10px] uppercase font-sans tracking-wider text-[#A78BFA]">
                          {product.categoryName}
                        </span>
                        <h4 className="font-serif text-base text-[#1E1630] group-hover:text-[#7C3AED] transition-colors leading-tight">
                          {product.name}
                        </h4>
                        <span className="text-xs font-sans text-[#6B5F82]">
                          SKU: {product.sku}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className="font-sans font-semibold text-sm text-[#1E1630]">
                          {formatINR(product.price)}
                        </span>
                        {product.compareAtPrice && (
                          <span className="block text-xs line-through text-[#6B5F82]">
                            {formatINR(product.compareAtPrice)}
                          </span>
                        )}
                      </div>
                      <ArrowRight size={16} className="text-[#6B5F82] group-hover:text-[#7C3AED] transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
