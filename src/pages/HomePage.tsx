import React from 'react';
import { Product, Category, BlogPost, Award, InstagramSettings, HomepageCMS, FounderCMS } from '../types';
import { HeroSection } from '../components/storefront/HeroSection';
import { ProductGrid } from '../components/storefront/ProductGrid';
import { ProductRail } from '../components/storefront/ProductRail';
import { CategorySection } from '../components/storefront/CategorySection';
import { EditorialSplit } from '../components/storefront/EditorialSplit';
import { FounderSection } from '../components/storefront/FounderSection';
import { AwardsSection } from '../components/storefront/AwardsSection';
import { InstagramSection } from '../components/storefront/InstagramSection';
import { JournalSection } from '../components/storefront/JournalSection';
import { ArrowRight, Sparkles, ShoppingBag } from 'lucide-react';

interface HomePageProps {
  products: Product[];
  categories: Category[];
  homepageCMS: HomepageCMS;
  founderCMS: FounderCMS;
  awards: Award[];
  socialSettings: InstagramSettings;
  blogPosts: BlogPost[];
  onNavigate: (path: string) => void;
  onSelectProduct: (slug: string) => void;
  onSelectCategory: (slug: string) => void;
  onSelectArticle: (slug: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  products,
  categories,
  homepageCMS,
  founderCMS,
  awards,
  socialSettings,
  blogPosts,
  onNavigate,
  onSelectProduct,
  onSelectCategory,
  onSelectArticle,
}) => {
  const visibility = homepageCMS.sectionVisibility || {
    hero: true,
    featured: true,
    statement: true,
    categories: true,
    founder: true,
    awards: true,
    bestSellers: true,
    instagram: true,
    journal: true,
  };

  // All published products
  const publishedProducts = products.filter((p) => p.status === 'published');

  // Section: Featured Products for rail
  const featuredProducts = products
    .filter((p) => p.featured && p.status === 'published')
    .slice(0, 6);

  return (
    <div id="glowwithsh-homepage" className="min-h-screen">
      {/* Hero Section */}
      {visibility.hero && (
        <HeroSection
          cms={homepageCMS.hero}
          onPrimaryClick={() => onNavigate(homepageCMS.hero.primaryCtaLink || '/shop')}
          onSecondaryClick={() => onNavigate(homepageCMS.hero.secondaryCtaLink || '/about')}
        />
      )}

      {/* SECTION: Shop by Category (Placed directly below Hero Section as requested) */}
      {visibility.categories && (
        <CategorySection
          categories={categories}
          onSelectCategory={(slug) => {
            onSelectCategory(slug);
            onNavigate(`/shop?category=${slug}`);
          }}
        />
      )}

      {/* SECTION: ALL PRODUCTS - Full Catalog on Home Page */}
      <section id="all-products-section" className="py-16 sm:py-24 relative">
        {/* Decorative background orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#A78BFA]/8 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#C084FC]/6 rounded-full blur-3xl animate-pulse-glow pointer-events-none" style={{ animationDelay: '2s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-[11px] uppercase font-sans tracking-[0.2em] text-[#A78BFA] font-semibold flex items-center gap-1.5">
                <ShoppingBag size={13} />
                <span>OUR COMPLETE COLLECTION</span>
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#1E1630] font-normal mt-1">
                All Products
              </h2>
              <p className="text-sm font-sans text-[#6B5F82] mt-1">
                Explore our entire range of carefully crafted beauty essentials.
              </p>
            </div>

            <button
              onClick={() => onNavigate('/shop')}
              className="inline-flex items-center gap-2 text-xs uppercase font-sans font-semibold tracking-wider text-[#7C3AED] hover:text-[#A78BFA] transition-colors cursor-pointer"
            >
              <span>View in Shop</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <ProductGrid
            products={publishedProducts.length > 0 ? publishedProducts : products}
            onSelectProduct={onSelectProduct}
          />
        </div>
      </section>

      {/* SECTION: Editorial Brand Statement */}
      {visibility.statement && (
        <EditorialSplit
          headline={homepageCMS.editorialStatement.headline}
          text={homepageCMS.editorialStatement.text}
          image={homepageCMS.editorialStatement.image}
          onExplore={() => onNavigate('/about')}
        />
      )}

      {/* SECTION: Founder Story */}
      {visibility.founder && (
        <FounderSection
          cms={founderCMS}
          onMeetFounder={() => onNavigate('/founder')}
        />
      )}

      {/* SECTION: Recognition / Awards */}
      {visibility.awards && <AwardsSection awards={awards} />}

      {/* SECTION: Featured Picks Rail */}
      {visibility.bestSellers && featuredProducts.length > 0 && (
        <ProductRail
          title="Featured Picks"
          subtitle="Hand-selected favorites from our glowing community."
          products={featuredProducts}
          onSelectProduct={onSelectProduct}
        />
      )}

      {/* SECTION: Instagram / Social Proof */}
      {visibility.instagram && <InstagramSection settings={socialSettings} />}

      {/* SECTION: Journal preview */}
      {visibility.journal && (
        <JournalSection
          posts={blogPosts}
          onSelectArticle={onSelectArticle}
          onViewAll={() => onNavigate('/journal')}
        />
      )}
    </div>
  );
};
