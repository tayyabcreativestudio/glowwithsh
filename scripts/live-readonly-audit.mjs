import fs from 'node:fs';
const origin = 'https://www.glowwithsh.com';
const routes = ['/', '/shop', '/admin/', '/api/health', '/api/products', '/api/products?includeDrafts=true', '/api/admin/media', '/robots.txt', '/sitemap.xml'];
const results = await Promise.all(routes.map(async route => {
  try {
    const response = await fetch(origin + route, { signal: AbortSignal.timeout(15000) });
    const text = await response.text(); let publicCount, exposesCostField;
    if (route.startsWith('/api/products')) { const json = JSON.parse(text); const products = json.products || json; publicCount = products.length; exposesCostField = products.some(product => 'costPrice' in product); }
    return { route, status: response.status, finalUrl: response.url, bytes: Buffer.byteLength(text), title: text.match(/<title>(.*?)<\/title>/is)?.[1], canonical: text.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1], initialH1Count: (text.match(/<h1[\s>]/gi) || []).length, publicCount, exposesCostField, cacheControl: response.headers.get('cache-control'), contentType: response.headers.get('content-type') };
  } catch (error) { return { route, error: error.message }; }
}));
fs.mkdirSync('docs/seo', { recursive: true });
fs.writeFileSync('docs/seo/live-readonly-check.json', JSON.stringify({ checkedAt: new Date().toISOString(), method: 'Unauthenticated read-only HTTP; current live build, not changed local code', results }, null, 2));
console.log(JSON.stringify(results, null, 2));
