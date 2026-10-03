import type { DatabaseSchema } from './db';
import type { Product } from '../src/types';
import { initialProducts } from '../src/data/seedData';

export const SITE_ORIGIN = 'https://www.glowwithsh.com';
export const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
const plain = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const publicProduct = (product: Product) => product.status === 'published' && product.visible !== false;
const link = (href: string, label: string) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;

export function productSchema(product: Product) {
  return { '@context': 'https://schema.org', '@type': 'Product', name: product.name,
    description: `${product.name}${product.size ? ` (${product.size})` : ''} from the GlowWithSH ${product.categoryName.toLowerCase()} collection.`,
    ...(!product.primaryImage.includes('images.unsplash.com') ? { image: [new URL(product.primaryImage, SITE_ORIGIN).href] } : {}),
    ...(product.sku ? { sku: product.sku } : {}), brand: { '@type': 'Brand', name: 'GlowWithSH' },
    offers: { '@type': 'Offer', priceCurrency: 'INR', price: product.price,
      availability: !product.trackInventory || product.stockQuantity > 0 ? 'https://schema.org/InStock' :
        product.allowBackorders ? 'https://schema.org/BackOrder' : 'https://schema.org/OutOfStock',
      url: `${SITE_ORIGIN}/product/${product.slug}` } };
}

const staticPages: Record<string, [string, string]> = {
  '/': ['GlowWithSH — Skincare & Beauty by Shagufi Hussain', 'Explore GlowWithSH face care, creams, serums and body care. Browse product details and prices, and find your next skincare essential.'],
  '/shop': ['Shop Skincare & Beauty Online | GlowWithSH', 'Browse GlowWithSH skincare and beauty products. Compare creams, face care, serums and body care by price and availability.'],
  '/about': ['About GlowWithSH | Skincare by Shagufi Hussain', 'Meet GlowWithSH, the skincare and beauty brand founded by Shagufi Hussain. Explore the brand and its product collection.'],
  '/founder': ['Shagufi Hussain | Founder of GlowWithSH', 'Meet Shagufi Hussain, founder of GlowWithSH, and explore the skincare and beauty collection.'],
  '/awards': ['Awards & Recognition | GlowWithSH', 'Explore recognition published by GlowWithSH. Contact the brand for further information about its awards.'],
  '/journal': ['Skincare Journal & Routine Guides | GlowWithSH', 'Read the GlowWithSH journal for skincare routine ideas and product education. Explore related products and contact us with questions.'],
  '/contact': ['Contact GlowWithSH | Product & Order Support', 'Contact GlowWithSH for product questions, order support and delivery enquiries. Find the available contact options here.'],
};
for (const tab of ['shipping', 'refunds', 'privacy', 'terms', 'faq', 'disclaimer', 'contact']) {
  const title = { refunds: 'Returns & Refunds', faq: 'Frequently Asked Questions', disclaimer: 'Skincare Disclaimer', contact: 'Contact Information' }[tab] || `${tab[0].toUpperCase()}${tab.slice(1)} Policy`;
  staticPages[`/policies/${tab}`] = [`${title} | GlowWithSH`, `Read the GlowWithSH ${title.toLowerCase()} and contact the store if you need clarification before ordering.`];
}

export function pageSeo(pathname: string, db: DatabaseSchema) {
  const path = pathname.replace(/\/+$/, '') || '/';
  let title = staticPages[path]?.[0] || 'Page Not Found | GlowWithSH';
  let description = staticPages[path]?.[1] || 'The page could not be found. Browse GlowWithSH skincare and beauty products.';
  let h1 = title.split(' | ')[0];
  let content = `<p>${escapeHtml(description)}</p>`;
  let image: string | undefined = db.homepageCMS.hero.posterImage;
  let status = staticPages[path] ? 200 : 404;
  let index = Boolean(staticPages[path]);
  let schema: Record<string, unknown>[] = [];
  const products = db.products.filter(publicProduct);
  const productLinks = (items: Product[]) => `<ul>${items.map(product => `<li>${link(`/product/${product.slug}`, product.name)} — ₹${escapeHtml(product.price)}</li>`).join('')}</ul>`;
  if (path === '/' || path === '/shop') content += productLinks(products);
  if (path === '/') {
    h1 = 'GlowWithSH Skincare & Beauty';
    content += `<h2>Shop by category</h2><ul>${db.categories.map(category => `<li>${link(`/shop/category/${category.slug}`, category.name)}</li>`).join('')}</ul>`;
    schema.push({ '@context': 'https://schema.org', '@type': 'Organization', name: 'GlowWithSH', url: SITE_ORIGIN, logo: `${SITE_ORIGIN}/brand/glowwithsh-mark.svg`,
      founder: { '@type': 'Person', name: 'Shagufi Hussain' } },
      { '@context': 'https://schema.org', '@type': 'WebSite', name: 'GlowWithSH', url: SITE_ORIGIN });
  }
  if (path.startsWith('/shop/category/')) {
    const category = db.categories.find(item => item.slug === path.slice(15));
    if (category) {
      status = 200; index = true; h1 = category.name;
      title = `${category.name} | Shop GlowWithSH Skincare`;
      description = `Explore GlowWithSH ${category.name.toLowerCase()}. Compare product details, prices and stock availability before choosing your skincare essentials.`;
      image = category.image;
      content = `<p>${escapeHtml(description)}</p>${productLinks(products.filter(product => product.categoryId === category.id || product.categoryId === category.slug))}`;
      content += `<h2>Choosing from ${escapeHtml(category.name.toLowerCase())}</h2><p>Compare each product’s size, price, usage directions and availability. Checkout confirms the final total for your selection.</p><p>${link('/contact', 'Product questions')} · ${link('/policies/shipping', 'Shipping information')} · ${link('/policies/refunds', 'Returns and refunds')}</p>`;
    }
  }
  if (path.startsWith('/product/')) {
    const product = products.find(item => item.slug === path.slice(9));
    if (product) {
      status = 200; index = true; h1 = product.name;
      const duplicateName = products.some(other => other.id !== product.id && other.name === product.name && other.size === product.size);
      const variantLabel = duplicateName && product.sku ? ` · ${product.sku}` : '';
      const searchName = product.slug === 'combo-all-skin-problems' ? 'Skincare Combo' : product.name;
      title = `${searchName}${product.size ? ` — ${product.size}` : ''}${variantLabel} | GlowWithSH`;
      description = `Shop ${searchName}${product.size ? ` (${product.size})` : ''}${variantLabel} from GlowWithSH for ₹${product.price}. Read product details and usage information, and check availability.`;
      // Replace legacy seed marketing defaults; respect subsequently edited merchant SEO fields.
      const legacy = initialProducts.find(item => item.id === product.id);
      if (product.seoTitle && product.seoTitle !== legacy?.seoTitle) title = `${product.seoTitle}${variantLabel}`;
      if (product.seoDescription && product.seoDescription !== legacy?.seoDescription) description = product.seoDescription;
      image = product.primaryImage.includes('images.unsplash.com') ? undefined : product.primaryImage;
      content = `<p>${escapeHtml(product.shortDescription)}</p><p>₹${escapeHtml(product.price)}${product.size ? ` · ${escapeHtml(product.size)}` : ''}</p><h2>Product details</h2><p>${escapeHtml(plain(product.description))}</p>`;
      if (product.howToUse) content += `<h2>How to use</h2><p>${escapeHtml(product.howToUse)}</p>`;
      content += `<h2>Before ordering</h2><p>Review the product details and directions. ${link('/contact', 'Contact the store')} if you need clarification before choosing this product.</p>`;
      content += `<p>${link(`/shop/category/${db.categories.find(category => category.id === product.categoryId)?.slug || product.categoryId}`, product.categoryName)} · ${link('/policies/shipping', 'Shipping information')} · ${link('/policies/refunds', 'Returns and refunds')}</p>`;
      schema.push(productSchema(product));
    }
  }
  if (path.startsWith('/journal/')) {
    const post = db.blogPosts.find(item => item.slug === path.slice(9) && item.status === 'published');
    if (post) {
      status = 200; index = true; h1 = post.title; title = `${post.title} | GlowWithSH Journal`;
      description = plain(post.excerpt); image = post.coverImage;
      content = `<p>${escapeHtml(description)}</p><p>${escapeHtml(plain(post.content))}</p>`;
      schema.push({ '@context': 'https://schema.org', '@type': 'Article', headline: post.title,
        description, image: image ? [new URL(image, SITE_ORIGIN).href] : undefined,
        datePublished: post.publishedAt, author: { '@type': 'Person', name: post.author } });
    }
  }
  if (path === '/journal') content += `<ul>${db.blogPosts.filter(post => post.status === 'published').map(post => `<li>${link(`/journal/${post.slug}`, post.title)}</li>`).join('')}</ul>`;
  const custom = db.pages?.find(page => `/${page.slug}` === path && page.status === 'published');
  if (custom) {
    status = 200; index = true; h1 = custom.title; title = custom.seoTitle || `${custom.title} | GlowWithSH`;
    description = custom.seoDescription || plain(custom.content).slice(0, 160); image = custom.coverImage;
    content = `<p>${escapeHtml(custom.content)}</p>`;
  }
  if (/^\/(admin(?:\/|$)|admin-login$|cart$|checkout$|order-confirmation$|track-order$|wishlist$|quiz$)/.test(path)) {
    status = 200; index = false; title = 'GlowWithSH'; h1 = 'GlowWithSH'; content = '<p>Loading…</p>';
  }
  if (index && path !== '/') {
    const crumbs = [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: h1, item: `${SITE_ORIGIN}${path}` }];
    schema.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs });
  }
  return { path, title, description, h1, content, image, status, index, schema, canonical: `${SITE_ORIGIN}${path}` };
}

export function sitemapXml(db: DatabaseSchema) {
  const paths = [...Object.keys(staticPages), ...db.categories.map(category => `/shop/category/${category.slug}`),
    ...db.products.filter(publicProduct).map(product => `/product/${product.slug}`),
    ...db.blogPosts.filter(post => post.status === 'published').map(post => `/journal/${post.slug}`),
    ...(db.pages || []).filter(page => page.status === 'published').map(page => `/${page.slug}`)];
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...new Set(paths)].map(path => `<url><loc>${escapeHtml(`${SITE_ORIGIN}${path}`)}</loc></url>`).join('')}</urlset>`;
}

export function renderSeoHtml(template: string, path: string, db: DatabaseSchema) {
  const seo = pageSeo(path, db);
  const meta = `<title>${escapeHtml(seo.title)}</title><meta name="description" content="${escapeHtml(seo.description)}"><link rel="canonical" href="${escapeHtml(seo.canonical)}"><meta name="robots" content="${seo.index ? 'index,follow' : 'noindex,follow'}"><meta property="og:title" content="${escapeHtml(seo.title)}"><meta property="og:description" content="${escapeHtml(seo.description)}"><meta property="og:url" content="${escapeHtml(seo.canonical)}"><meta property="og:type" content="${seo.path.startsWith('/journal/') ? 'article' : 'website'}">${seo.image ? `<meta property="og:image" content="${escapeHtml(new URL(seo.image, SITE_ORIGIN).href)}">` : ''}<meta name="twitter:card" content="summary_large_image">${seo.schema.map(value => `<script type="application/ld+json" data-page-seo="true">${JSON.stringify(value).replace(/</g, '\\u003c')}</script>`).join('')}`;
  const social = `<meta name="twitter:title" content="${escapeHtml(seo.title)}"><meta name="twitter:description" content="${escapeHtml(seo.description)}">${seo.image ? `<meta name="twitter:image" content="${escapeHtml(new URL(seo.image, SITE_ORIGIN).href)}">` : ''}`;
  const cleaned = template.replace(/<title>[\s\S]*?<\/title>/gi, '').replace(/<meta\s+[^>]*(?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/gi, '').replace(/<link\s+[^>]*rel="canonical"[^>]*>/gi, '').replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');
  return { ...seo, html: cleaned.replace('</head>', `${meta}${social}</head>`).replace('<div id="root"></div>', `<div id="root"><main style="max-width:72rem;margin:2rem auto;padding:1rem"><nav>${link('/', 'GlowWithSH')} · ${link('/shop', 'Shop')} · ${link('/contact', 'Contact')}</nav><h1>${escapeHtml(seo.h1)}</h1>${seo.content}</main></div>`) };
}
