import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSeoHtml } from '../server/seo';
import { responsiveImage } from '../src/utils/responsiveImage';
import { initialProducts, initialCategories, initialHomepageCMS, initialFounderCMS, initialAwards, initialInstagramSettings, initialBlogPosts } from '../src/data/seedData';

test('homepage sends stable content and an escaped public-only initial snapshot', () => {
  const products = structuredClone(initialProducts);
  products[0].name = '</script><script>alert(1)</script>';
  products[0].costPrice = 98765;
  products[0].sourceDescription = 'private-supplier-detail';
  products[1].status = 'draft';
  const db = { products, categories: initialCategories, homepageCMS: initialHomepageCMS, founderCMS: initialFounderCMS, awards: initialAwards, instagramSettings: initialInstagramSettings, blogPosts: initialBlogPosts, pages: [], adminUsers: [{ password: 'private-admin-secret' }], orders: [{ customer: 'private-buyer' }] } as any;
  const html = renderSeoHtml('<head></head><div id="root"></div>', '/', db).html;
  const serialized = html.match(/<script id="storefront-snapshot" type="application\/json">(.*?)<\/script>/s)?.[1];
  assert.ok(serialized);
  const snapshot = JSON.parse(serialized);
  assert.ok(!snapshot.products.some((product: any) => product.id === products[1].id));
  assert.ok(snapshot.products.every((product: any) => !('costPrice' in product) && !('sourceDescription' in product)));
  assert.ok(!html.includes('private-admin-secret') && !html.includes('private-buyer') && !html.includes('private-supplier-detail'));
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.equal(snapshot.products[0].name, products[0].name);
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
  assert.ok(html.includes('id="brand-footer"'));
  assert.ok(html.includes('fetchPriority="high"') || html.includes('fetchpriority="high"'));
  assert.ok(html.includes('hero-poster-640.webp 640w'));
  assert.ok(!html.includes('<video'));
});

test('responsive images preserve merchant media and resize only the known service', () => {
  for (const source of ['/uploads/merchant.webp', 'https://cdn.example.com/product.jpg']) assert.deepEqual(responsiveImage(source, '50vw'), { src: source, decoding: 'async' });
  const image = responsiveImage('https://images.unsplash.com/photo-test?w=1600&fit=crop', '50vw');
  assert.equal(new URL(image.src).searchParams.get('w'), '640');
  assert.ok(image.srcSet?.includes('320w') && image.srcSet.includes('1280w'));
  assert.equal(image.sizes, '50vw');
  assert.equal(new URL(image.src).searchParams.get('fit'), 'crop');
});
