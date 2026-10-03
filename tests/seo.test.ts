import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pageSeo, renderSeoHtml, sitemapXml, productSchema } from '../server/seo';
import { initialProducts, initialCategories, initialHomepageCMS, initialBlogPosts } from '../src/data/seedData';
const db = { products: structuredClone(initialProducts), categories: initialCategories, homepageCMS: initialHomepageCMS, blogPosts: initialBlogPosts, pages: [] } as any;

test('sitemap uses canonical host, excludes private/draft URLs and invents no lastmod', () => {
  const fixture = structuredClone(db);
  fixture.products[0].status = 'draft';
  const sitemap = sitemapXml(fixture);
  assert.ok(!sitemap.includes(`/product/${fixture.products[0].slug}`));
  assert.ok(!sitemap.includes('lastmod') && !sitemap.includes('/admin') && !sitemap.includes('/cart'));
  assert.ok(sitemap.includes('https://www.glowwithsh.com/shop'));
});
test('initial HTML is escaped, has a single canonical/title and real product schema', () => {
  const fixture = structuredClone(db);
  fixture.products[0].name = '</script><script>alert(1)</script>';
  const page = renderSeoHtml('<head><title>Old</title><link rel="canonical" href="http://wrong"></head><div id="root"></div>', `/product/${fixture.products[0].slug}`, fixture);
  assert.equal(page.status, 200);
  assert.equal((page.html.match(/<title>/g) || []).length, 1);
  assert.equal((page.html.match(/rel="canonical"/g) || []).length, 1);
  assert.ok(!page.html.includes('<script>alert(1)</script>'));
  assert.ok(page.html.includes('"@type":"Product"'));
});
test('utility pages are noindex; unknown and unpublished products return real 404', () => {
  assert.equal(pageSeo('/checkout', db).index, false);
  assert.equal(pageSeo('/missing', db).status, 404);
  const fixture = structuredClone(db); fixture.products[0].visible = false;
  assert.equal(pageSeo(`/product/${fixture.products[0].slug}`, fixture).status, 404);
});
test('schema availability respects untracked stock and backorders', () => {
  const product = { ...db.products[0], stockQuantity: 0, trackInventory: false };
  assert.equal(productSchema(product).offers.availability, 'https://schema.org/InStock');
  product.trackInventory = true; product.allowBackorders = true;
  assert.equal(productSchema(product).offers.availability, 'https://schema.org/BackOrder');
});
test('stock images are not represented as genuine Product schema images; merchant SEO edits are respected', () => {
  const product = { ...db.products[0], primaryImage: 'https://images.unsplash.com/illustrative.jpg', seoTitle: 'Merchant edited product title', seoDescription: 'Merchant edited description' };
  assert.equal('image' in productSchema(product), false);
  const fixture = { ...db, products: [product] };
  assert.equal(pageSeo(`/product/${product.slug}`, fixture).title, product.seoTitle);
  assert.equal(pageSeo(`/product/${product.slug}`, fixture).description, product.seoDescription);
});
