import React from 'react';
import { renderToString } from 'react-dom/server';
import type { DatabaseSchema } from './db';
import type { StorefrontSnapshot } from '../src/utils/storefrontSnapshot';
import { HomePage } from '../src/pages/HomePage';
import { Header } from '../src/components/common/Header';
import { Footer } from '../src/components/common/Footer';
import { AnnouncementBar } from '../src/components/common/AnnouncementBar';
import { CartProvider } from '../src/context/CartContext';
import { WishlistProvider } from '../src/context/WishlistContext';

export function publicStorefrontSnapshot(db: DatabaseSchema): StorefrontSnapshot {
  return {
    products: db.products.filter(p => p.status === 'published' && p.visible !== false).map(({ costPrice, sourceDescription, ...product }) => product),
    categories: db.categories,
    homepageCMS: db.homepageCMS,
    founderCMS: db.founderCMS,
    awards: db.awards.filter(a => a.published && a.verified),
    socialSettings: db.instagramSettings,
    posts: db.blogPosts.filter(p => p.status === 'published'),
    storePages: (db.pages || []).filter(p => p.status === 'published'),
  };
}
const noop = () => {};
export function renderStorefrontHome(snapshot: StorefrontSnapshot) {
  return renderToString(<CartProvider><WishlistProvider>
    <div className="min-h-screen flex flex-col bg-[#F8F5FF] text-[#1E1630]">
      <AnnouncementBar {...snapshot.homepageCMS.announcementBar} onActionClick={noop} />
      <Header currentPath="/" onNavigate={noop} onOpenSearch={noop} pages={snapshot.storePages} />
      <main className="flex-1"><HomePage {...snapshot}
        blogPosts={snapshot.posts} onNavigate={noop} onSelectArticle={noop} onSelectProduct={noop} onSelectCategory={noop} /></main>
      <Footer onNavigate={noop} />
    </div>
  </WishlistProvider></CartProvider>);
}
