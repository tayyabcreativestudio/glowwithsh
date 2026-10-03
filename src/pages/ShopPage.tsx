import React, { useState, useMemo, useEffect } from 'react';
import { Product, Category } from '../types';
import { ProductGrid } from '../components/storefront/ProductGrid';
import { Search, Filter, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';
import { analyticsItem, trackCommerce } from '../utils/analytics';

interface ShopPageProps {
  products: Product[];
  categories: Category[];
  initialCategory?: string;
  onSelectProduct: (slug: string) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  products,
  categories,
  initialCategory = 'all',
  onSelectProduct,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name-asc' | 'newest'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const activeCategory = categories.find(category => category.id === selectedCategory || category.slug === selectedCategory);

  // Synchronize when initialCategory changes (e.g. from deep-link URL or category cards)
  useEffect(() => {
    if (initialCategory && initialCategory !== 'all') {
      const matched = categories.find(
        (c) =>
          c.slug === initialCategory ||
          c.id === initialCategory ||
          c.name.toLowerCase() === initialCategory.toLowerCase()
      );
      setSelectedCategory(matched ? matched.id : initialCategory);
    } else {
      setSelectedCategory('all');
    }
  }, [initialCategory, categories]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => p.status === 'published' && p.visible !== false);

    // Category filter matching ID, slug, or name
    if (selectedCategory !== 'all') {
      const activeCat = categories.find(
        (c) => c.id === selectedCategory || c.slug === selectedCategory
      );
      const targetId = activeCat ? activeCat.id : selectedCategory;
      const targetSlug = activeCat ? activeCat.slug : selectedCategory;

      list = list.filter(
        (p) =>
          p.categoryId === targetId ||
          p.categoryId === targetSlug ||
          (activeCat && p.categoryName.toLowerCase() === activeCat.name.toLowerCase())
      );
    }

    // In stock only filter
    if (inStockOnly) {
      list = list.filter((p) => !p.trackInventory || p.stockQuantity > 0 || p.allowBackorders);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q)
      );
    }

    // Sorting
    return list.sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.sortOrder - b.sortOrder;
    });
  }, [products, selectedCategory, inStockOnly, searchQuery, sortBy]);

  useEffect(() => {
    trackCommerce('view_item_list', filteredProducts.map(product => analyticsItem(product)));
  }, [filteredProducts]);
  return (
    <div id="shop-catalog-page" className="min-h-screen py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Top Section */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-[11px] uppercase font-sans tracking-[0.25em] text-[#A78BFA] font-semibold">
            THE CATALOG
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#1E1630] font-normal tracking-tight">
            {activeCategory ? activeCategory.name : 'Shop GlowWithSH'}
          </h1>
          <p className="text-sm sm:text-base font-sans text-[#6B5F82] max-w-xl mx-auto leading-relaxed">
            {activeCategory ? `Explore GlowWithSH ${activeCategory.name.toLowerCase()}. Compare product details, prices and availability to find your next skincare essential.` : 'Explore face care, creams, serums and body care. Compare product details, prices and availability, all in one place.'}
          </p>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-4 gap-2 scrollbar-none mb-8">
          <a
            href="/shop"
            className={`px-4 py-2 rounded-full text-xs uppercase font-sans tracking-wider transition-all cursor-pointer shrink-0 ${
              selectedCategory === 'all'
                ? 'glass-btn-primary font-semibold text-white shadow-sm'
                : 'glass-btn-secondary text-[#6B5F82] hover:text-[#1E1630]'
            }`}
          >
            All Products ({products.filter((p) => p.status === 'published').length})
          </a>
          {categories.map((cat) => {
            const count = products.filter(
              (p) => p.categoryId === cat.id && p.status === 'published'
            ).length;
            const isSelected = selectedCategory === cat.slug || selectedCategory === cat.id;
            return (
              <a
                key={cat.id}
                href={`/shop/category/${cat.slug}`}
                className={`px-4 py-2 rounded-full text-xs uppercase font-sans tracking-wider transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'glass-btn-primary font-semibold text-white shadow-sm'
                    : 'glass-btn-secondary text-[#6B5F82] hover:text-[#1E1630]'
                }`}
              >
                {cat.name} ({count})
              </a>
            );
          })}
        </div>

        {/* Search & Sort Controls Bar */}
        <div className="glass-card p-4 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B5F82]" />
            <input
              type="text"
              aria-label="Search the catalog"
              placeholder="Search in catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs font-sans glass-surface rounded-xl border border-[#DDD6F3] focus:outline-none focus:border-[#7C3AED] text-[#1E1630] placeholder-[#6B5F82]/60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B5F82] hover:text-[#7C3AED]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters & Sorting Options */}
          <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4">
            {/* Availability Toggle */}
            <label className="flex items-center gap-2 text-xs font-sans text-[#1E1630] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded border-[#DDD6F3] accent-[#7C3AED]"
              />
              <span>In Stock Only</span>
            </label>

            {/* Sorting Select */}
            <div className="flex items-center gap-2">
              <ArrowUpDown size={14} className="text-[#6B5F82]" />
              <select
                aria-label="Sort products"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-sans glass-surface border border-[#DDD6F3] rounded-xl px-3 py-2 text-[#1E1630] focus:outline-none focus:border-[#7C3AED] cursor-pointer"
              >
                <option value="featured">Featured Sequence</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Alphabetical (A-Z)</option>
                <option value="newest">Newest Arrivals</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between mb-6 text-xs text-[#6B5F82] font-sans">
          <span>Showing {filteredProducts.length} skincare products</span>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-[#7C3AED] hover:text-[#A78BFA] underline cursor-pointer"
            >
              Reset Category Filter
            </button>
          )}
        </div>

        {/* Product Grid */}
        <ProductGrid
          products={filteredProducts}
          onSelectProduct={onSelectProduct}
        />
        <section className="mt-12 max-w-3xl space-y-4 text-sm leading-relaxed text-[#554C68]">
          <h2 className="font-serif text-2xl text-[#1E1630]">Choosing from {activeCategory ? activeCategory.name.toLowerCase() : 'the collection'}</h2>
          <p>Open a product page to compare its size, price, usage directions and availability. The product grid shows current prices; checkout confirms the final total for your selection.</p>
          <p>For questions about a particular product, <a className="underline" href="/contact">contact GlowWithSH</a> before ordering. Read our <a className="underline" href="/policies/shipping">shipping information</a> and <a className="underline" href="/policies/refunds">returns and refunds policy</a> for purchase details.</p>
        </section>
      </div>
    </div>
  );
};
