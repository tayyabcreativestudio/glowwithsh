import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'glowwithsh-http-test-'));
const base = 'http://127.0.0.1:5199';
const env = { ...process.env, DB_DRIVER: process.env.TEST_DB_DRIVER || 'json', NODE_ENV: 'production', PORT: '5199', ADMIN_SAME_ORIGIN: 'true',
  PREVIEW_MODE: 'true', ADMIN_AUTH_SECRET: crypto.randomBytes(32).toString('hex'),
  ADMIN_USERNAME: 'integration_admin', ADMIN_PASSWORD: crypto.randomBytes(20).toString('hex'),
  DATA_DIR: path.join(directory, 'data'), UPLOADS_DIR: path.join(directory, 'uploads'), SITE_GSTIN: '',
  RAZORPAY_KEY_ID: '', RAZORPAY_KEY_SECRET: '', RAZORPAY_WEBHOOK_SECRET: '' };
let child;
let cookie = '';
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks += 1; };
async function request(route, options = {}) {
  const response = await fetch(`${base}${route}`, { ...options, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...options.headers } });
  const text = await response.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { response, data };
}
async function start() {
  child = spawn(process.execPath, ['dist/server.cjs'], { env, stdio: 'pipe' });
  let startupError = ''; child.stderr.on('data', data => { startupError += data.toString(); });
  for (let i = 0; i < 80; i++) {
    try { const response = await fetch(`${base}/api/health`); if (response.ok) return; } catch {}
    if (child.exitCode !== null) throw new Error(`Server startup failed: ${startupError}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Server startup timed out');
}
async function stop() {
  if (child && child.exitCode === null) { const done = new Promise(resolve => child.once('exit', resolve)); child.kill(); await done; }
}
try {
  await start();
  check((await request('/api/admin/media')).response.status === 401, 'Unauthenticated media denied');
  for (const route of ['/api/products?includeDrafts=true', '/api/blog?includeDrafts=true', '/api/reviews?all=true', '/api/awards?all=true']) {
    check((await request(route)).response.status === 401, `${route} is private`);
  }
  const products = (await request('/api/products')).data.products;
  check(!products.some(product => 'costPrice' in product || 'sourceDescription' in product), 'Internal product fields absent');
  const product = products.find(product => product.trackInventory && product.price < 4000);
  check(Boolean(product), 'Stock-tracked product available');
  const sitemap = (await request('/sitemap.xml')).data;
  check(!sitemap.includes('<lastmod>'), 'No fabricated sitemap modification dates');
  check(!sitemap.includes('/admin') && !sitemap.includes('/checkout'), 'Private routes excluded from sitemap');
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1]).pathname);
  for (const url of urls) {
    const { response, data } = await request(url);
    check(response.status === 200, `Sitemap route ${url} resolves`);
    check(data.includes('<h1>') && data.includes('rel="canonical"'), `${url} initial HTML has content and canonical`);
    check((data.match(/<title>/g) || []).length === 1, `${url} has one title`);
  }
  check((await request('/nonexistent-test-page')).response.status === 404, 'Unknown route is real 404');
  check((await request('/assets/missing.js')).response.status === 404, 'Missing asset is real 404');
  check((await request('/cart')).data.includes('noindex,follow'), 'Cart is noindex');
  const productHtml = (await request(`/product/${product.slug}`)).data;
  check(productHtml.includes('"@type":"Product"') && productHtml.includes('"priceCurrency":"INR"'), 'Real product schema in initial HTML');
  const login = await request('/api/admin/auth/login', { method: 'POST', body: JSON.stringify({ username: env.ADMIN_USERNAME, password: env.ADMIN_PASSWORD }) });
  check((await request('/api/admin/auth/login', { method: 'POST', body: JSON.stringify({ username: 'unknown_account', password: env.ADMIN_PASSWORD }) })).response.status === 401, 'Unknown username cannot use fallback password');
  check(login.response.status === 200, 'Admin login works'); cookie = login.response.headers.get('set-cookie').split(';')[0];
  const category = await request('/api/admin/categories', { method: 'POST', body: JSON.stringify({ name: 'Regression category', slug: 'chosen-category-url', productIds: [] }) });
  check(category.response.status === 201 && category.data.slug === 'chosen-category-url', 'Category creation respects chosen URL');
  const categoryUpdate = await request(`/api/admin/categories/${category.data.id}`, { method: 'PATCH', body: JSON.stringify({ id: 'overwrite-id', slug: 'New URL', name: 'Edited category' }) });
  check(categoryUpdate.data.id === category.data.id && categoryUpdate.data.slug === 'new-url', 'Category ID is immutable and URL normalized');
  check((await request(`/api/admin/categories/${category.data.id}`, { method: 'PATCH', body: JSON.stringify({ name: '   ' }) })).response.status === 400, 'Empty category name rejected');
  check((await request(`/api/admin/categories/${category.data.id}`, { method: 'DELETE' })).response.status === 200, 'Temporary category removed');
  check((await request('/api/admin/categories', { method: 'POST', body: JSON.stringify({ name: 123 }) })).response.status === 400, 'Invalid category name type rejected');
  check((await request('/api/admin/pages', { method: 'POST', body: JSON.stringify({ title: 'Collision', slug: 'api' }) })).response.status === 400, 'Custom page cannot collide with API routes');
  const draftPage = await request('/api/admin/pages', { method: 'POST', body: JSON.stringify({ title: 'Regression page', slug: 'stable-page-url', coverImage: '/uploads/test.png', content: 'Test copy', status: 'draft' }) });
  check(draftPage.response.status === 201 && draftPage.data.coverImage === '/uploads/test.png', 'Draft page accepts media path');
  check((await request('/api/pages/stable-page-url')).response.status === 404, 'Draft page is hidden publicly');
  const pageUpdate = await request(`/api/admin/pages/${draftPage.data.id}`, { method: 'PATCH', body: JSON.stringify({ title: 'Renamed page', status: 'published' }) });
  check(pageUpdate.data.slug === 'stable-page-url', 'Page title-only edit preserves custom URL');
  check((await request('/api/pages/stable-page-url')).response.status === 200, 'Published custom page API resolves');
  check((await request('/stable-page-url')).response.status === 200, 'Published custom page HTML resolves');
  check((await request(`/api/admin/pages/${draftPage.data.id}`, { method: 'DELETE' })).response.status === 200, 'Temporary page removed');
  check((await request('/')).data.includes('name="google-site-verification"'), 'Search verification in server HTML');
  check((await request('/api/health')).response.headers.get('content-security-policy').includes('https://www.googletagmanager.com'), 'CSP permits requested Google tag');
  check((await request('/api/admin/media', { method: 'POST', headers: { Origin: 'https://localhost.attacker.example' }, body: '{}' })).response.status === 403, 'CSRF origin bypass denied');
  const payload = phone => ({ customer: { name: 'Integration Buyer', phone, address: '123 Test Street', city: 'Delhi', state: 'Delhi', pincode: '110001' }, items: [{ productId: product.id, quantity: 1 }], paymentMethod: 'cod', grandTotal: 1, price: 1 });
  const originalStock = (await request(`/api/products/${product.slug}`)).data.product.stockQuantity;
  const invalidCoupon = await request('/api/orders', { method: 'POST', body: JSON.stringify({ ...payload('9876543210'), discountCode: 'DOES-NOT-EXIST' }) });
  check(invalidCoupon.response.status === 400, 'Invalid coupon rejected');
  check((await request(`/api/products/${product.slug}`)).data.product.stockQuantity === originalStock, 'Failed checkout preserves inventory');
  const duplicate = payload('9876543210'); duplicate.items.push({ ...duplicate.items[0] });
  check((await request('/api/orders', { method: 'POST', body: JSON.stringify(duplicate) })).response.status === 400, 'Duplicate cart lines rejected by real route');
  const settings = (await request('/api/site-settings')).data;
  const order = await request('/api/orders', { method: 'POST', body: JSON.stringify(payload('9876543211')) });
  check(order.response.status === 201, 'COD order created');
  const retryKey = crypto.randomUUID();
  const repeatPayload = payload('9876543220');
  const beforeRetryStock = (await request(`/api/products/${product.slug}`)).data.product.stockQuantity;
  const firstRequest = await request('/api/orders', { method: 'POST', headers: { 'Idempotency-Key': retryKey }, body: JSON.stringify(repeatPayload) });
  const repeatedRequest = await request('/api/orders', { method: 'POST', headers: { 'Idempotency-Key': retryKey }, body: JSON.stringify(repeatPayload) });
  check(firstRequest.response.status === 201 && repeatedRequest.data.order.id === firstRequest.data.order.id, 'Checkout retry returns the same persisted order');
  check((await request(`/api/products/${product.slug}`)).data.product.stockQuantity === beforeRetryStock - 1, 'Checkout retry reserves stock only once');
  check((await request(`/api/admin/orders/${order.data.order.id}`, { method: 'PATCH', body: JSON.stringify({ orderStatus: 'invented-status' }) })).response.status === 400, 'Unknown order status denied');
  check((await request(`/api/admin/orders/${order.data.order.id}`, { method: 'PATCH', body: JSON.stringify({ paymentStatus: 'refunded' }) })).response.status === 400, 'Unverified refund status denied');
  check(order.data.order.grandTotal === product.price + (product.price >= settings.freeShippingThreshold ? 0 : settings.standardShippingFee), 'Client price tampering ignored');
  check((await request(`/api/orders/lookup/${order.data.order.id}`)).response.status === 404, 'Order lookup requires identity');
  check((await request(`/api/orders/lookup/${order.data.order.id}?phone=9876543211`)).response.status === 200, 'Matching buyer can recover order');
  check((await request(`/api/admin/orders/${order.data.order.id}`, { method: 'PATCH', body: JSON.stringify({ orderStatus: 'Delivered' }) })).response.status === 400, 'Illegal fulfilment status jump denied');
  const submittedReview = await request('/api/reviews', { method: 'POST', body: JSON.stringify({ productId: product.id, productName: 'Spoofed name', customerName: 'Test reviewer', rating: 4, reviewText: 'A local regression review.' }) });
  check((await request(`/api/admin/reviews/${submittedReview.data.review.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'invented-status' }) })).response.status === 400, 'Invalid review moderation status rejected');
  check(submittedReview.response.status === 201 && !submittedReview.data.review.verifiedPurchase && submittedReview.data.review.productName === product.name, 'Reviews cannot invent verified purchase or product name');
  const badUpload = await request('/api/admin/upload', { method: 'POST', body: JSON.stringify({ filename: 'invalid.png', data: 'data:image/png;base64,aGVsbG8=' }) });
  check(badUpload.response.status === 400, 'Actual upload route rejects invalid image signature');
  check((await request('/api/orders', { method: 'POST', body: JSON.stringify({ ...payload('9876543212'), paymentMethod: 'online_ready' }) })).response.status === 503, 'Unconfigured online payment rejected before reserving stock');
  await request(`/api/admin/products/${product.id}`, { method: 'PATCH', body: JSON.stringify({ stockQuantity: 1 }) });
  const competing = await Promise.all(['9876543213', '9876543214'].map(phone => request('/api/orders', { method: 'POST', body: JSON.stringify(payload(phone)) })));
  check(competing.filter(result => result.response.status === 201).length === 1, 'Exactly one buyer receives the last unit via actual HTTP');
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
  const upload = await request('/api/admin/upload', { method: 'POST', body: JSON.stringify({ filename: 'regression.png', data: `data:image/png;base64,${png}` }) });
  check(upload.response.status === 201, 'Media upload writes a real asset');
  const url = upload.data.url || upload.data.media?.url || upload.data.mediaItem?.url;
  check(Boolean(url), 'Upload returns public URL');
  check((await fetch(`${base}${url}`)).status === 200, 'Uploaded image is retrievable');
  await stop(); await start();
  check((await fetch(`${base}${url}`)).status === 200, 'Media survives process restart with persistent directories');
  check((await request(`/api/orders/lookup/${order.data.order.id}?phone=9876543211`)).response.status === 200, 'Order survives process restart');
  console.log(`Production HTTP regression passed: ${checks} assertions; isolated temporary storage; no live orders created.`);
} finally { await stop(); fs.rmSync(directory, { recursive: true, force: true }); }
