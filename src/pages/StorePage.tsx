import React from 'react';
import { ArrowRight } from 'lucide-react';
import { StorePage as StorePageRecord } from '../types';
import { usePageSeo } from '../utils/seo';

interface StorePageProps { page: StorePageRecord; onNavigateToShop: () => void; }

export const StorePage: React.FC<StorePageProps> = ({ page, onNavigateToShop }) => {
  const title = page.seoTitle || `${page.title} | GlowWithSH`;
  const description = page.seoDescription || page.content.slice(0, 155);
  const canonical = typeof window === 'undefined' ? `/${page.slug}` : `${window.location.origin}/${page.slug}`;
  usePageSeo({ title, description, canonical, image: page.coverImage });

  return <article className="min-h-[65vh] bg-[#F8F5FF] px-4 py-12 text-[#1E1630] sm:py-20">
    <div className="mx-auto max-w-4xl">
      <header className="text-center">
        <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#7C3AED]">GlowWithSH</span>
        <h1 className="mt-3 font-serif text-4xl font-normal leading-tight sm:text-6xl">{page.title}</h1>
      </header>
      {page.coverImage && <img src={page.coverImage} alt="" className="mt-10 max-h-[30rem] w-full rounded-3xl object-cover shadow-lg" />}
      <div className="mx-auto mt-10 max-w-3xl space-y-6 font-sans text-base leading-8 text-[#554C68] sm:text-lg">
        {page.content.split(/\n\s*\n/).filter((paragraph) => paragraph.trim()).map((paragraph, index) => <p key={index} className="whitespace-pre-line">{paragraph}</p>)}
      </div>
      <button onClick={onNavigateToShop} className="mx-auto mt-12 inline-flex items-center gap-2 rounded-full bg-[#1E1630] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#7C3AED]">
        Explore the collection <ArrowRight size={15} />
      </button>
    </div>
  </article>;
};
