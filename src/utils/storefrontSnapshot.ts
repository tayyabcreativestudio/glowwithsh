import type { Product, Category, HomepageCMS, FounderCMS, Award, InstagramSettings, BlogPost, StorePage } from '../types';

export interface StorefrontSnapshot {
  products: Product[];
  categories: Category[];
  homepageCMS: HomepageCMS;
  founderCMS: FounderCMS;
  awards: Award[];
  socialSettings: InstagramSettings;
  posts: BlogPost[];
  storePages: StorePage[];
}
export function readStorefrontSnapshot(): StorefrontSnapshot | null {
  if (typeof document === 'undefined') return null;
  try {
    const value = JSON.parse(document.getElementById('storefront-snapshot')?.textContent || 'null');
    return value?.homepageCMS && value?.founderCMS && Array.isArray(value.products) ? value : null;
  } catch { return null; }
}
