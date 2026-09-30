import 'dotenv/config';
import crypto from 'crypto';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';
import {
  getDatabase,
  saveDatabase,
  resetDatabase,
  loadDatabase,
  withDatabaseLock,
  DatabaseSchema,
} from './server/db';
import {
  Product,
  Order,
  InventoryAdjustment,
  BlogPost,
  Award,
  Review,
  ContactInquiry,
  MediaItem,
  ActivityLog,
  OrderStatus,
} from './src/types';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  getSessionToken,
  setSessionCookie,
  clearSessionCookie,
  checkLoginRateLimit,
  recordLoginFailure,
  clearLoginFailures,
  requireConfiguredAuthSecret,
  csrfOriginCheck,
  sanitizeString,
} from './server/security';
import {
  getRazorpayConfig,
  assertRazorpayConfiguration,
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  fetchRazorpayPayment,
  createRazorpayRefund,
} from './server/razorpay';
import {
  orderSubmissionSchema,
  paymentIntentSchema,
  paymentVerifySchema,
  adminLoginSchema,
  adminChangePasswordSchema,
  reviewSubmissionSchema,
  contactSubmissionSchema,
  productMutationSchema,
  discountMutationSchema,
} from './server/validation';

// Assert production secrets on startup
requireConfiguredAuthSecret();
assertRazorpayConfiguration();

// Initialize DB on boot
loadDatabase();

const app = express();
// Required when TLS is terminated by the deployment platform's reverse proxy.
app.set('trust proxy', 1);
const STOREFRONT_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5173;
const ADMIN_PORT = process.env.ADMIN_PORT ? parseInt(process.env.ADMIN_PORT, 10) : 5174;

// High performance compression
app.use(compression());

// Production Security Headers & Content-Security-Policy
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com",
    "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);

  if (process.env.NODE_ENV === 'production' && req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Cross-Origin Resource Sharing (CORS) configured for Storefront and Admin Subdomain separation
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    `http://localhost:${STOREFRONT_PORT}`,
    `http://localhost:${ADMIN_PORT}`,
    `http://127.0.0.1:${STOREFRONT_PORT}`,
    `http://127.0.0.1:${ADMIN_PORT}`,
    `http://admin.localhost:${ADMIN_PORT}`,
    process.env.APP_URL || 'https://www.glowwithsh.com',
    process.env.ADMIN_URL || 'https://admin.glowwithsh.com',
  ].filter(Boolean) as string[];

  if (
    origin &&
    (allowedOrigins.includes(origin) ||
      origin.endsWith(`:${ADMIN_PORT}`) ||
      origin.endsWith(`:${STOREFRONT_PORT}`))
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  }

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Domain & Port Context Helper
function isAdministrativeContext(req: Request): boolean {
  const host = req.headers.host || '';
  const port = host.split(':')[1] || '';
  const localPort = req.socket?.localPort;
  const hostname = (req.hostname || host.split(':')[0] || '').toLowerCase();

  const isLocalAdminPort = localPort === ADMIN_PORT || port === String(ADMIN_PORT);
  const isSubdomainAdmin = hostname.startsWith('admin.') || hostname === 'admin.localhost';
  return isLocalAdminPort || isSubdomainAdmin;
}

// Security Boundary: Storefront Port (Main Domain) vs Admin Subdomain / Port
app.use((req: Request, res: Response, next: NextFunction) => {
  const isAdminContext = isAdministrativeContext(req);
  (req as any).isAdminContext = isAdminContext;

  const host = req.headers.host || '';
  const hostname = (req.hostname || host.split(':')[0] || 'localhost').toLowerCase();

  // Keep one public origin for SEO, cookies, and payment return URLs.
  if (process.env.NODE_ENV === 'production' && hostname === 'glowwithsh.com') {
    res.redirect(308, `https://www.glowwithsh.com${req.originalUrl}`);
    return;
  }

  // 1. If on Storefront port / main domain:
  if (!isAdminContext) {
    // Strictly block administrative APIs on Storefront port / domain
    if (req.path.startsWith('/api/admin') || req.path === '/api/upload') {
      const adminTarget =
        process.env.NODE_ENV === 'production'
          ? `https://admin.${hostname.replace(/^www\./, '')}/admin`
          : `http://${hostname}:${ADMIN_PORT}/admin`;

      res.status(403).json({
        success: false,
        error: `Access denied: Administrative APIs are strictly restricted to the Admin Subdomain / Port (${ADMIN_PORT}).`,
        adminUrl: adminTarget,
      });
      return;
    }

    // Redirect browser navigation to /admin or /admin-login to the Admin portal
    if (req.path === '/admin' || req.path.startsWith('/admin/') || req.path === '/admin-login') {
      const targetUrl =
        process.env.NODE_ENV === 'production'
          ? `https://admin.${hostname.replace(/^www\./, '')}${req.originalUrl}`
          : `http://${hostname}:${ADMIN_PORT}${req.originalUrl}`;
      res.redirect(302, targetUrl);
      return;
    }
  }

  // 2. If on Admin port / subdomain:
  if (isAdminContext) {
    // Redirect root / or /home or /shop to /admin
    if (req.path === '/' || req.path === '/home' || req.path === '/shop') {
      res.redirect(302, '/admin');
      return;
    }
  }

  next();
});

// Capture raw body Buffer for webhook verification while parsing standard JSON
app.use(
  express.json({
    limit: '2mb',
    verify: (req: Request, _res: Response, buf: Buffer) => {
      (req as any).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// Rate limiting in-memory helpers
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const rateLimits = new Map<string, RateLimitBucket>();

function createRateLimiter(windowMs: number, maxRequests: number, prefix: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${prefix}:${ip}`;
    const now = Date.now();

    let bucket = rateLimits.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 1, resetAt: now + windowMs };
      rateLimits.set(key, bucket);
      return next();
    }

    if (bucket.count >= maxRequests) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        success: false,
        error: `Too many requests. Please try again after ${retryAfter} seconds.`,
      });
    }

    bucket.count += 1;
    next();
  };
}

const apiGeneralRateLimiter = createRateLimiter(60_000, 150, 'api');
const ordersRateLimiter = createRateLimiter(15 * 60_000, 20, 'orders');
const trackingRateLimiter = createRateLimiter(60_000, 40, 'tracking');
const orderLookupRateLimiter = createRateLimiter(15 * 60_000, 20, 'order-lookup');
const paymentRateLimiter = createRateLimiter(15 * 60_000, 20, 'payments');
const reviewsRateLimiter = createRateLimiter(15 * 60_000, 10, 'reviews');
const contactsRateLimiter = createRateLimiter(15 * 60_000, 10, 'contacts');

// Helper: Logging administrative activities
function logActivity(action: string, entity: string, entityId?: string, details?: string) {
  const db = getDatabase();
  const log: ActivityLog = {
    id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: 'admin-1',
    userName: 'Shagufi Hussain',
    action,
    entity,
    entityId,
    details,
    timestamp: new Date().toISOString(),
  };
  db.activityLogs.unshift(log);
  if (db.activityLogs.length > 200) {
    db.activityLogs = db.activityLogs.slice(0, 200);
  }
}

// Simple slug generator
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ----------------------------------------------------
// 1. HEALTH CHECK
// ----------------------------------------------------
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    brand: 'GlowWithSH',
    founder: 'Shagufi Hussain',
    productsCount: getDatabase().products.length,
    timestamp: new Date().toISOString(),
  });
});

// ----------------------------------------------------
// 2. ADMIN AUTHENTICATION & RBAC
// ----------------------------------------------------
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const token = getSessionToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized administrative access required.' });
  }

  const db = getDatabase();
  const activeVersion = db.siteSettings.adminTokenVersion || 1;
  const verified = verifySessionToken(token, activeVersion);

  if (!verified) {
    return res.status(401).json({ success: false, error: 'Invalid or expired administrative session.' });
  }

  const admin = db.admins.find((a) => a.id === verified.sub);
  if (!admin) {
    return res.status(401).json({ success: false, error: 'Admin account not found.' });
  }

  (req as any).adminUser = admin;
  next();
}

app.post('/api/admin/auth/login', (req: Request, res: Response) => {
  const parseResult = adminLoginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || 'Invalid input' });
  }

  const { username, email, password } = parseResult.data;
  const identifier = (username || email || '').trim().toLowerCase();

  // Rate limiting check
  const rateLimitStatus = checkLoginRateLimit(req, identifier);
  if (!rateLimitStatus.allowed) {
    return res.status(429).json({
      success: false,
      error: `Account temporarily locked due to multiple failed login attempts. Retry in ${rateLimitStatus.retryAfterSeconds} seconds.`,
      retryAfterSeconds: rateLimitStatus.retryAfterSeconds,
    });
  }

  const db = getDatabase();
  const admin = db.admins.find(
    (a) =>
      a.email.toLowerCase() === identifier ||
      (a.username && a.username.toLowerCase() === identifier)
  );

  const targetHash = admin?.passwordHash || db.siteSettings.adminPasswordHash;
  if (!targetHash) {
    return res.status(500).json({ success: false, error: 'Authentication is not initialized. Please configure ADMIN_PASSWORD.' });
  }

  const isValidPassword = verifyPassword(password, targetHash);

  if (!isValidPassword) {
    recordLoginFailure(req, identifier);
    return res.status(401).json({
      success: false,
      message: 'Invalid administrative credentials.',
    });
  }

  clearLoginFailures(req, identifier);

  const activeAdmin = admin || db.admins[0];
  const tokenVersion = db.siteSettings.adminTokenVersion || 1;
  const token = createSessionToken(activeAdmin, tokenVersion);

  setSessionCookie(res, token);
  logActivity('Admin Logged In', 'Authentication', activeAdmin.id, `Session authorized for ${activeAdmin.name}`);

  return res.json({
    success: true,
    user: {
      id: activeAdmin.id,
      email: activeAdmin.email,
      name: activeAdmin.name,
      role: activeAdmin.role,
      avatar: activeAdmin.avatar,
    },
  });
});

app.post('/api/admin/auth/logout', requireAdminAuth, (req: Request, res: Response) => {
  const db = getDatabase();
  // Invalidate sessions by incrementing token version
  db.siteSettings.adminTokenVersion = (db.siteSettings.adminTokenVersion || 1) + 1;
  if (db.admins.length > 0) {
    db.admins[0].tokenVersion = db.siteSettings.adminTokenVersion;
  }
  saveDatabase(db);
  clearSessionCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

app.post('/api/admin/auth/change-password', requireAdminAuth, (req: Request, res: Response) => {
  const parseResult = adminChangePasswordSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid password data' });
  }

  const { currentPassword, newPassword } = parseResult.data;
  const db = getDatabase();
  const currentHash = db.siteSettings.adminPasswordHash;

  if (!currentHash || !verifyPassword(currentPassword, currentHash)) {
    return res.status(400).json({ error: 'Current password does not match' });
  }

  const newHash = hashPassword(newPassword);
  db.siteSettings.adminPasswordHash = newHash;
  // Increment token version to immediately invalidate any previously issued sessions
  db.siteSettings.adminTokenVersion = (db.siteSettings.adminTokenVersion || 1) + 1;
  if (db.admins.length > 0) {
    db.admins[0].passwordHash = newHash;
    db.admins[0].tokenVersion = db.siteSettings.adminTokenVersion;
  }

  logActivity('Password Changed', 'Security', 'admin-1', 'Master administrative password was updated');
  saveDatabase(db);

  // Issue fresh session cookie
  const activeAdmin = db.admins[0];
  const freshToken = createSessionToken(activeAdmin, db.siteSettings.adminTokenVersion);
  setSessionCookie(res, freshToken);

  res.json({ success: true, message: 'Administrative password updated successfully' });
});

app.get('/api/admin/auth/me', requireAdminAuth, (req: Request, res: Response) => {
  const user = (req as any).adminUser || getDatabase().admins[0];
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    },
  });
});

// Protect all /api/admin routes (login is public)
app.use('/api/admin', (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/auth/login') return next();
  csrfOriginCheck(req, res, () => {
    requireAdminAuth(req, res, next);
  });
});

// ----------------------------------------------------
// 3. PRODUCTS API
// ----------------------------------------------------
app.get('/api/products', (req: Request, res: Response) => {
  const db = getDatabase();
  let results = [...db.products];
  const { category, collection, search, sort, includeDrafts, featured, bestSeller } = req.query;

  if (includeDrafts !== 'true') {
    results = results.filter((p) => p.status === 'published' && p.visible !== false);
  }

  if (category && category !== 'all') {
    results = results.filter(
      (p) => p.categoryId === category || p.categoryName.toLowerCase() === (category as string).toLowerCase()
    );
  }

  if (collection && collection !== 'all') {
    const foundCol = db.collections.find((c) => c.slug === collection || c.id === collection);
    if (foundCol) {
      results = results.filter((p) => foundCol.productIds.includes(p.id));
    }
  }

  if (featured === 'true') {
    results = results.filter((p) => p.featured);
  }

  if (bestSeller === 'true') {
    results = results.filter((p) => p.bestSeller);
  }

  if (search) {
    const q = (search as string).toLowerCase().trim();
    results = results.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.ingredients && p.ingredients.some((ing) => ing.toLowerCase().includes(q)))
      );
    });
  }

  if (sort === 'price-asc') {
    results.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-desc') {
    results.sort((a, b) => b.price - a.price);
  } else if (sort === 'name-asc') {
    results.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'newest') {
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    results.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  res.json({
    count: results.length,
    total: db.products.length,
    products: results,
  });
});

app.get('/api/products/:slugOrId', (req: Request, res: Response) => {
  const db = getDatabase();
  const { slugOrId } = req.params;
  const product = db.products.find((p) => p.slug === slugOrId || p.id === slugOrId);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const related = db.products
    .filter((p) => p.id !== product.id && p.categoryId === product.categoryId && p.status === 'published')
    .slice(0, 4);

  res.json({ product, related });
});

app.post('/api/admin/products', (req: Request, res: Response) => {
  const parseResult = productMutationSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid product data' });
  }

  const raw = parseResult.data;
  const db = getDatabase();

  const id = `prod-${Date.now()}`;
  let baseSlug = generateSlug(raw.name) || 'product';
  let slug = baseSlug;
  let counter = 1;
  while (db.products.some((p) => p.slug === slug)) {
    slug = `${baseSlug}-${counter++}`;
  }

  const category = db.categories.find((c) => c.id === raw.categoryId) || db.categories[0];

  const newProduct: Product = {
    id,
    sku: raw.sku ? raw.sku.trim().toUpperCase() : `GW-${Date.now().toString().slice(-6)}`,
    name: sanitizeString(raw.name),
    slug,
    categoryId: category.id,
    categoryName: category.name,
    collectionId: req.body.collectionId || '',
    shortDescription: sanitizeString(raw.shortDescription),
    description: raw.description,
    sourceDescription: req.body.sourceDescription || '',
    benefits: Array.isArray(raw.benefits) ? raw.benefits.map(sanitizeString) : [],
    ingredients: Array.isArray(raw.ingredients) ? raw.ingredients.map(sanitizeString) : [],
    howToUse: sanitizeString(raw.howToUse),
    skinType: raw.skinType,
    productType: raw.productType,
    size: raw.size,
    price: Number(raw.price),
    compareAtPrice: raw.compareAtPrice ? Number(raw.compareAtPrice) : undefined,
    costPrice: raw.costPrice ? Number(raw.costPrice) : undefined,
    stockQuantity: Number(raw.stockQuantity),
    lowStockThreshold: Number(raw.lowStockThreshold),
    trackInventory: raw.trackInventory !== false,
    allowBackorders: Boolean(raw.allowBackorders),
    status: raw.status as any,
    featured: Boolean(raw.featured),
    bestSeller: Boolean(raw.bestSeller),
    newProduct: Boolean(raw.newProduct),
    limitedEdition: Boolean(raw.limitedEdition),
    visible: raw.visible !== false,
    primaryImage:
      raw.primaryImage ||
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop',
    mediaGallery: Array.isArray(raw.mediaGallery) && raw.mediaGallery.length > 0
      ? raw.mediaGallery
      : [raw.primaryImage || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop'],
    video: req.body.video || '',
    seoTitle: raw.seoTitle || `${raw.name} | GlowWithSH by Shagufi Hussain`,
    seoDescription: raw.seoDescription || raw.shortDescription || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sortOrder: db.products.length + 1,
  };

  db.products.push(newProduct);

  const adj: InventoryAdjustment = {
    id: `adj-${Date.now()}`,
    productId: newProduct.id,
    productName: newProduct.name,
    sku: newProduct.sku,
    previousStock: 0,
    newStock: newProduct.stockQuantity,
    change: newProduct.stockQuantity,
    reason: 'Initial stock intake',
    adjustedBy: 'Shagufi Hussain',
    timestamp: new Date().toISOString(),
  };
  db.inventoryAdjustments.unshift(adj);

  logActivity('Created Product', 'Products', newProduct.id, `Created ${newProduct.name} (${newProduct.sku})`);
  saveDatabase(db);

  res.status(201).json({ success: true, product: newProduct });
});

app.patch('/api/admin/products/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const index = db.products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const existing = db.products[index];
  const updates = req.body;

  if (updates.stockQuantity !== undefined && Number(updates.stockQuantity) !== existing.stockQuantity) {
    const prev = existing.stockQuantity;
    const next = Math.max(0, Number(updates.stockQuantity));
    const adj: InventoryAdjustment = {
      id: `adj-${Date.now()}`,
      productId: existing.id,
      productName: existing.name,
      sku: existing.sku,
      previousStock: prev,
      newStock: next,
      change: next - prev,
      reason: updates.stockAdjustmentReason || 'Admin manual update',
      adjustedBy: 'Shagufi Hussain',
      timestamp: new Date().toISOString(),
    };
    db.inventoryAdjustments.unshift(adj);
  }

  if (updates.categoryId && updates.categoryId !== existing.categoryId) {
    const cat = db.categories.find((c) => c.id === updates.categoryId);
    if (cat) {
      updates.categoryName = cat.name;
    }
  }

  const updatedProduct: Product = {
    ...existing,
    ...updates,
    price: updates.price !== undefined ? Math.max(0, Number(updates.price)) : existing.price,
    stockQuantity:
      updates.stockQuantity !== undefined ? Math.max(0, Number(updates.stockQuantity)) : existing.stockQuantity,
    updatedAt: new Date().toISOString(),
  };

  db.products[index] = updatedProduct;
  logActivity('Updated Product', 'Products', updatedProduct.id, `Updated ${updatedProduct.name}`);
  saveDatabase(db);

  res.json({ success: true, product: updatedProduct });
});

app.delete('/api/admin/products/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const product = db.products.find((p) => p.id === id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  db.products = db.products.filter((p) => p.id !== id);
  logActivity('Deleted Product', 'Products', id, `Removed product ${product.name}`);
  saveDatabase(db);

  res.json({ success: true, message: `Product ${product.name} deleted` });
});

app.post('/api/admin/products/bulk', (req: Request, res: Response) => {
  const db = getDatabase();
  const { productIds, action, value } = req.body;

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ error: 'No product IDs provided' });
  }

  let count = 0;
  if (action === 'publish') {
    db.products.forEach((p) => {
      if (productIds.includes(p.id)) {
        p.status = 'published';
        p.visible = true;
        count++;
      }
    });
  } else if (action === 'unpublish' || action === 'draft') {
    db.products.forEach((p) => {
      if (productIds.includes(p.id)) {
        p.status = 'draft';
        count++;
      }
    });
  } else if (action === 'archive') {
    db.products.forEach((p) => {
      if (productIds.includes(p.id)) {
        p.status = 'archived';
        p.visible = false;
        count++;
      }
    });
  } else if (action === 'delete') {
    db.products = db.products.filter((p) => !productIds.includes(p.id));
    count = productIds.length;
  } else if (action === 'setCategory' && value) {
    const cat = db.categories.find((c) => c.id === value);
    if (cat) {
      db.products.forEach((p) => {
        if (productIds.includes(p.id)) {
          p.categoryId = cat.id;
          p.categoryName = cat.name;
          count++;
        }
      });
    }
  }

  logActivity('Bulk Action', 'Products', undefined, `${action} applied to ${count} products`);
  saveDatabase(db);
  res.json({ success: true, updatedCount: count });
});

// ----------------------------------------------------
// 4. CATEGORIES & COLLECTIONS API
// ----------------------------------------------------
app.get('/api/categories', (_req: Request, res: Response) => {
  const db = getDatabase();
  const categoriesWithCounts = db.categories.map((c) => ({
    ...c,
    productCount: db.products.filter((p) => p.categoryId === c.id && p.status === 'published').length,
  }));
  res.json(categoriesWithCounts);
});

app.post('/api/admin/categories', (req: Request, res: Response) => {
  const db = getDatabase();
  const { name, description, image } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const id = `cat-${generateSlug(name)}`;
  const slug = generateSlug(name);
  const newCat = {
    id,
    name: sanitizeString(name),
    slug,
    description: description ? sanitizeString(description) : '',
    image: image || 'https://images.unsplash.com/photo-1608248597359-009579a33bb5?q=80&w=800&auto=format&fit=crop',
  };
  db.categories.push(newCat);
  logActivity('Created Category', 'Categories', id, `Created category ${name}`);
  saveDatabase(db);
  res.status(201).json(newCat);
});

app.patch('/api/admin/categories/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const index = db.categories.findIndex((c) => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Category not found' });

  const existing = db.categories[index];
  const updated = { ...existing, ...req.body };
  if (req.body.name && !req.body.slug) {
    updated.slug = generateSlug(req.body.name);
  }
  db.categories[index] = updated;
  logActivity('Updated Category', 'Categories', id, `Category ${updated.name} updated`);
  saveDatabase(db);
  res.json(updated);
});

app.delete('/api/admin/categories/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  db.categories = db.categories.filter((c) => c.id !== id);
  logActivity('Deleted Category', 'Categories', id, `Category ${id} removed`);
  saveDatabase(db);
  res.json({ success: true });
});

app.get('/api/collections', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.collections);
});

app.post('/api/admin/collections', (req: Request, res: Response) => {
  const db = getDatabase();
  const { name, description, image, featured, productIds } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const newCol = {
    id: `col-${generateSlug(name)}`,
    name: sanitizeString(name),
    slug: generateSlug(name),
    description: description ? sanitizeString(description) : '',
    image: image || 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=800&auto=format&fit=crop',
    featured: Boolean(featured),
    productIds: Array.isArray(productIds) ? productIds : [],
  };
  db.collections.push(newCol);
  logActivity('Created Collection', 'Collections', newCol.id, `Created collection ${name}`);
  saveDatabase(db);
  res.status(201).json(newCol);
});

app.patch('/api/admin/collections/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const index = db.collections.findIndex((c) => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Collection not found' });

  const existing = db.collections[index];
  const updated = { ...existing, ...req.body };
  if (req.body.name && !req.body.slug) {
    updated.slug = generateSlug(req.body.name);
  }
  db.collections[index] = updated;
  logActivity('Updated Collection', 'Collections', id, `Collection ${updated.name} updated`);
  saveDatabase(db);
  res.json(updated);
});

app.delete('/api/admin/collections/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  db.collections = db.collections.filter((c) => c.id !== id);
  logActivity('Deleted Collection', 'Collections', id, `Collection ${id} removed`);
  saveDatabase(db);
  res.json({ success: true });
});

// ----------------------------------------------------
// 5. ORDERS & CHECKOUT API
// ----------------------------------------------------
// Secure admin orders list
app.get('/api/orders', requireAdminAuth, (req: Request, res: Response) => {
  const db = getDatabase();
  const { status, search, limit } = req.query;
  let results = [...db.orders];

  if (status && status !== 'all') {
    results = results.filter((o) => o.orderStatus === status);
  }

  if (search) {
    const q = (search as string).toLowerCase();
    results = results.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        o.city.toLowerCase().includes(q)
    );
  }

  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (limit) {
    results = results.slice(0, Number(limit));
  }

  res.json({
    total: db.orders.length,
    orders: results,
  });
});

// Public order tracking: Enumeration resistant, requires orderId + phone/email verification
app.get('/api/orders/track', trackingRateLimiter, (req: Request, res: Response) => {
  const db = getDatabase();
  const rawOrderId = ((req.query.orderId || req.query.query || '') as string).trim();
  const rawPhone = ((req.query.phone || '') as string).trim().replace(/\D/g, '').slice(-10);
  const rawEmail = ((req.query.email || '') as string).trim().toLowerCase();

  // Enforce dual identity factor: must supply order reference AND phone or email
  if (!rawOrderId || (!rawPhone && !rawEmail)) {
    return res.status(400).json({
      success: false,
      error: 'Please provide both your Order ID and the phone number or email used during checkout.',
      orders: [],
    });
  }

  const cleanOrderId = rawOrderId.toLowerCase();
  const order = db.orders.find((o) => {
    if (o.id.toLowerCase() !== cleanOrderId) return false;
    const orderPhone = o.phone.replace(/\D/g, '').slice(-10);
    const orderEmail = (o.email || '').toLowerCase();
    if (rawPhone && orderPhone === rawPhone) return true;
    if (rawEmail && orderEmail === rawEmail) return true;
    return false;
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'No matching order found for the provided details. Please verify your order number and phone/email.',
      orders: [],
    });
  }

  // Sanitize customer data for public tracking (mask address, strip internal payment secrets)
  const safeOrder = {
    id: order.id,
    customerName: order.customerName,
    city: order.city,
    state: order.state,
    pincode: order.pincode,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    courierPartner: order.courierPartner,
    trackingNumber: order.trackingNumber,
    courierTrackingUrl: order.courierTrackingUrl,
    estimatedDeliveryDate: order.estimatedDeliveryDate,
    dispatchDate: order.dispatchDate,
    statusHistory: order.statusHistory,
    items: order.items.map((it) => ({
      name: it.name,
      sku: it.sku,
      quantity: it.quantity,
      price: it.price,
      image: it.image,
    })),
    subtotal: order.subtotal,
    discountAmount: order.discountAmount ?? order.discount ?? 0,
    deliveryFee: order.deliveryFee,
    grandTotal: order.grandTotal,
    createdAt: order.createdAt,
    taxSummary: order.taxSummary,
  };

  res.json({
    success: true,
    order: safeOrder,
    orders: [safeOrder],
    total: 1,
  });
});

// Public customer order lookup for confirmation screen: requires phone or email matching the order
app.get('/api/orders/lookup/:id', orderLookupRateLimiter, (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const rawPhone = ((req.query.phone || '') as string).trim().replace(/\D/g, '').slice(-10);
  const rawEmail = ((req.query.email || '') as string).trim().toLowerCase();

  const order = db.orders.find((o) => o.id === id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const orderPhone = order.phone.replace(/\D/g, '').slice(-10);
  const orderEmail = (order.email || '').toLowerCase();
  const phoneMatch = rawPhone && orderPhone === rawPhone;
  const emailMatch = rawEmail && orderEmail === rawEmail;
  if (!phoneMatch && !emailMatch) {
    return res.status(404).json({ error: 'Order not found or verification mismatch' });
  }

  const settings = db.siteSettings;
  const itemsText = order.items.map((it) => `• ${it.name} (x${it.quantity}) - ₹${it.price * it.quantity}`).join('\n');
  const waMessage = encodeURIComponent(
    `*NEW ORDER from GlowWithSH*\n\n` +
      `*Order ID:* ${order.id}\n` +
      `*Customer:* ${order.customerName}\n` +
      `*Phone:* ${order.phone}\n` +
      `*Address:* ${order.address}, ${order.city} - ${order.pincode}\n\n` +
      `*Items:*\n${itemsText}\n\n` +
      `*Total:* ₹${order.grandTotal} (${order.paymentMethod.toUpperCase()})\n\n` +
      `Thank you for shopping GlowWithSH by Shagufi Hussain!`
  );
  const whatsappUrl = `https://wa.me/${settings.whatsappNotificationNumber}?text=${waMessage}`;

  // Mask private customer payment tokens
  const safeOrder = {
    ...order,
    paymentId: order.paymentStatus === 'paid' ? 'Verified' : undefined,
  };

  res.json({
    success: true,
    order: safeOrder,
    whatsappUrl,
  });
});

// Authoritative Order Placement with Concurrency Locking & Server-side Pricing
app.post('/api/orders', ordersRateLimiter, async (req: Request, res: Response) => {
  const parseResult = orderSubmissionSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid order information' });
  }

  const { customer, items, paymentMethod, discountCode } = parseResult.data;

  try {
    const createdOrder = await withDatabaseLock(async (db: DatabaseSchema) => {
      // 1. Verify existence and inventory for all items
      for (const item of items) {
        const product = db.products.find((p) => p.id === item.productId);
        if (!product || product.status !== 'published') {
          throw new Error(`Product "${item.productId}" is not available.`);
        }
        if (product.trackInventory && !product.allowBackorders) {
          if (product.stockQuantity < item.quantity) {
            throw new Error(`Only ${product.stockQuantity} units of "${product.name}" are in stock.`);
          }
        }
      }

      // 2. Authoritative pricing calculation
      let subtotal = 0;
      const verifiedItems = [];

      for (const item of items) {
        const product = db.products.find((p) => p.id === item.productId)!;
        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        verifiedItems.push({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          quantity: item.quantity,
          image: product.primaryImage,
        });

        // Atomically reserve inventory
        if (product.trackInventory) {
          product.stockQuantity = Math.max(0, product.stockQuantity - item.quantity);
        }
      }

      // 3. Server-side discount evaluation
      let discount = 0;
      let appliedCode: string | undefined = undefined;

      if (discountCode) {
        const cleanCode = discountCode.trim().toUpperCase();
        const foundDisc = db.discounts.find((d) => d.code.toUpperCase() === cleanCode && d.active);

        if (!foundDisc) {
          throw new Error(`Promo code "${cleanCode}" is invalid or inactive.`);
        }

        const now = new Date().toISOString();
        if (foundDisc.startDate && foundDisc.startDate > now) {
          throw new Error(`Promo code "${cleanCode}" is not yet active.`);
        }
        if (foundDisc.endDate && foundDisc.endDate < now) {
          throw new Error(`Promo code "${cleanCode}" has expired.`);
        }
        if (foundDisc.usageLimit && (foundDisc.usageCount || 0) >= foundDisc.usageLimit) {
          throw new Error(`Promo code "${cleanCode}" usage limit has been reached.`);
        }
        if (foundDisc.minSpend && subtotal < foundDisc.minSpend) {
          throw new Error(`Minimum ritual order value of ₹${foundDisc.minSpend} required for promo code ${foundDisc.code}.`);
        }

        if (foundDisc.discountType === 'percentage') {
          discount = Math.round((subtotal * foundDisc.discountValue) / 100);
          if (foundDisc.maxDiscount && discount > foundDisc.maxDiscount) {
            discount = foundDisc.maxDiscount;
          }
        } else {
          discount = Math.min(subtotal, foundDisc.discountValue);
        }

        foundDisc.usageCount = (foundDisc.usageCount || 0) + 1;
        appliedCode = foundDisc.code;
      }

      const settings = db.siteSettings;
      const deliveryFee = subtotal >= settings.freeShippingThreshold ? 0 : settings.standardShippingFee;
      const grandTotal = Math.max(0, subtotal - discount + deliveryFee);

      // 4. COD specific controls
      if (paymentMethod === 'cod') {
        if (grandTotal > 5000) {
          throw new Error('Cash on Delivery (COD) is available for orders up to ₹5,000. Please choose online payment.');
        }

        // Duplicate submission protection (same phone, identical total within 60s)
        const recentDuplicate = db.orders.find((o) => {
          if (o.phone !== customer.phone || o.grandTotal !== grandTotal) return false;
          const diffMs = Date.now() - new Date(o.createdAt).getTime();
          return diffMs < 60_000;
        });

        if (recentDuplicate) {
          throw new Error('A duplicate order was recently received. Please check your order status or contact concierge.');
        }
      }

      // 5. Authoritative GST calculation (HSN 3304: Skincare preparations, standard 18% GST in India)
      const isDelhiIntraState = customer.state.toLowerCase().includes('delhi');
      const taxableValue = Math.max(0, subtotal - discount);
      const gstRate = 18;
      const totalTax = Math.round((taxableValue * gstRate) / (100 + gstRate)); // GST inclusive calculation
      const cgst = isDelhiIntraState ? Math.round(totalTax / 2) : 0;
      const sgst = isDelhiIntraState ? Math.round(totalTax / 2) : 0;
      const igst = isDelhiIntraState ? 0 : totalTax;

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const orderNumber = Math.floor(1000 + Math.random() * 9000);
      const orderId = `ORD-${dateStr}-${orderNumber}`;

      const initialStatus: OrderStatus = 'New';
      const initialPaymentStatus =
        paymentMethod === 'whatsapp'
          ? 'manual_verification'
          : paymentMethod === 'online_ready'
          ? 'pending_online'
          : 'pending_cod';

      const newOrder: Order = {
        id: orderId,
        customerName: customer.name,
        phone: customer.phone,
        email: customer.email || undefined,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
        deliveryNotes: customer.deliveryNotes || '',
        items: verifiedItems,
        subtotal,
        discount,
        discountAmount: discount,
        couponCode: appliedCode,
        deliveryFee,
        grandTotal,
        paymentMethod,
        paymentStatus: initialPaymentStatus,
        orderStatus: initialStatus,
        stockReserved: true,
        stockRestored: false,
        taxSummary: {
          taxableAmount: taxableValue - totalTax,
          cgst,
          sgst,
          igst,
          rate: gstRate,
          isInterstate: !isDelhiIntraState,
          hsn: '3304',
        },
        statusHistory: [
          {
            status: initialStatus,
            timestamp: new Date().toISOString(),
            note: `Order submitted through online storefront (${
              paymentMethod === 'whatsapp'
                ? 'WhatsApp Concierge'
                : paymentMethod === 'online_ready'
                ? 'Online Payment (Prepaid)'
                : 'Cash on Delivery'
            })`,
          },
        ],
        source: 'web',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.orders.unshift(newOrder);
      logActivity('New Order', 'Orders', newOrder.id, `Order placed by ${newOrder.customerName} for ₹${newOrder.grandTotal}`);
      return newOrder;
    });

    const settings = getDatabase().siteSettings;
    const itemsText = createdOrder.items.map((it) => `• ${it.name} (x${it.quantity}) - ₹${it.price * it.quantity}`).join('\n');
    const waMessage = encodeURIComponent(
      `*NEW ORDER from GlowWithSH*\n\n` +
        `*Order ID:* ${createdOrder.id}\n` +
        `*Customer:* ${createdOrder.customerName}\n` +
        `*Phone:* ${createdOrder.phone}\n` +
        `*Address:* ${createdOrder.address}, ${createdOrder.city} - ${createdOrder.pincode}\n\n` +
        `*Items:*\n${itemsText}\n\n` +
        `*Total:* ₹${createdOrder.grandTotal} (${createdOrder.paymentMethod.toUpperCase()})\n\n` +
        `Thank you for shopping GlowWithSH by Shagufi Hussain!`
    );
    const whatsappUrl = `https://wa.me/${settings.whatsappNotificationNumber}?text=${waMessage}`;

    res.status(201).json({
      success: true,
      order: createdOrder,
      whatsappUrl,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to place order.' });
  }
});

// Customer fallback: Switch pending online order to COD
app.post('/api/orders/:id/switch-to-cod', paymentRateLimiter, async (req: Request, res: Response) => {
  const { id } = req.params;
  const rawPhone = ((req.body.phone || '') as string).trim().replace(/\D/g, '').slice(-10);
  const rawEmail = ((req.body.email || '') as string).trim().toLowerCase();

  try {
    const updatedOrder = await withDatabaseLock(async (db: DatabaseSchema) => {
      const order = db.orders.find((o) => o.id === id);
      if (!order) throw new Error('Order not found');

      const orderPhone = order.phone.replace(/\D/g, '').slice(-10);
      const orderEmail = (order.email || '').toLowerCase();
      const phoneMatch = rawPhone && orderPhone === rawPhone;
      const emailMatch = rawEmail && orderEmail === rawEmail;
      if (!phoneMatch && !emailMatch) {
        throw new Error('Identity verification failed');
      }

      if (order.paymentStatus === 'paid') {
        throw new Error('Order is already paid and cannot be switched to COD.');
      }
      if (order.grandTotal > 5000) {
        throw new Error('Order amount exceeds maximum COD limit of ₹5,000.');
      }

      order.paymentMethod = 'cod';
      order.paymentStatus = 'pending_cod';
      order.statusHistory.push({
        status: order.orderStatus,
        timestamp: new Date().toISOString(),
        note: 'Customer switched payment method to Cash on Delivery (COD)',
      });
      order.updatedAt = new Date().toISOString();
      return order;
    });

    res.json({ success: true, order: updatedOrder });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 5.1 ONLINE PAYMENTS API (REAL RAZORPAY INTEGRATION)
// ----------------------------------------------------
app.post('/api/payments/create-intent', paymentRateLimiter, async (req: Request, res: Response) => {
  if (process.env.PREVIEW_MODE === 'true') {
    return res.status(503).json({ error: 'Online payments are disabled in this preview. Please use Cash on Delivery to test checkout.' });
  }

  const parseResult = paymentIntentSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Order ID is required to create payment intent' });
  }

  const { orderId, phone, email } = parseResult.data;
  const db = getDatabase();
  const order = db.orders.find((o) => o.id === orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const matchesPhone = phone && order.phone.replace(/\D/g, '').slice(-10) === phone.replace(/\D/g, '').slice(-10);
  const matchesEmail = email && (order.email || '').toLowerCase() === email.toLowerCase();
  if (!matchesPhone && !matchesEmail) {
    return res.status(404).json({ error: 'Order not found or verification mismatch' });
  }

  if (order.paymentStatus === 'paid') {
    return res.json({ success: true, alreadyPaid: true, order });
  }

  try {
    const amountPaise = Math.round(order.grandTotal * 100);
    const rpConfig = getRazorpayConfig();

    const rpOrder = await createRazorpayOrder({
      amountPaise,
      currency: 'INR',
      receipt: order.id,
      notes: {
        order_id: order.id,
        customer_phone: order.phone,
      },
    });

    await withDatabaseLock((lockedDb: DatabaseSchema) => {
      const activeOrder = lockedDb.orders.find((o) => o.id === order.id);
      if (activeOrder) {
        activeOrder.razorpayOrderId = rpOrder.id;
        activeOrder.updatedAt = new Date().toISOString();
      }
    });

    res.json({
      success: true,
      orderId: rpOrder.id,
      internalOrderId: order.id,
      amount: rpOrder.amount,
      currency: 'INR',
      keyId: rpConfig.keyId || 'mock_key_glowwithsh',
      sandbox: rpConfig.mode === 'test',
    });
  } catch (err: any) {
    console.error('Failed to create Razorpay Order:', err);
    res.status(500).json({ error: 'Failed to initialize payment gateway: ' + err.message });
  }
});

app.post('/api/payments/verify', paymentRateLimiter, async (req: Request, res: Response) => {
  const parseResult = paymentVerifySchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Missing required payment verification fields' });
  }

  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature, phone, email } = parseResult.data;

  try {
    const verifiedOrder = await withDatabaseLock(async (db: DatabaseSchema) => {
      const order = db.orders.find((o) => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const matchesPhone = phone && order.phone.replace(/\D/g, '').slice(-10) === phone.replace(/\D/g, '').slice(-10);
      const matchesEmail = email && (order.email || '').toLowerCase() === email.toLowerCase();
      if (!matchesPhone && !matchesEmail) {
        throw new Error('Order verification failed');
      }

      // Idempotency: return early if already verified
      if (order.paymentStatus === 'paid') {
        return { order, alreadyPaid: true };
      }

      // Anti-replay: verify this payment ID hasn't been credited to another order
      if (db.processedPaymentIds?.includes(razorpay_payment_id)) {
        throw new Error('This payment reference has already been claimed for another transaction.');
      }

      if (!order.razorpayOrderId || order.razorpayOrderId !== razorpay_order_id) {
        throw new Error('Payment does not belong to this order.');
      }

      // 1. Cryptographic HMAC-SHA256 signature verification
      const isValidSignature = verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isValidSignature) {
        throw new Error('Invalid payment signature. Payment verification rejected.');
      }

      // 2. Fetch payment details from Razorpay where credentials configured
      const rpConfig = getRazorpayConfig();
      if (rpConfig.keyId && rpConfig.keySecret && !rpConfig.keyId.startsWith('mock_')) {
        const paymentData = await fetchRazorpayPayment(razorpay_payment_id);
        if (paymentData.order_id && paymentData.order_id !== razorpay_order_id) {
          throw new Error('Payment does not correspond to the requested Razorpay order.');
        }
        const expectedPaise = Math.round(order.grandTotal * 100);
        if (paymentData.amount && paymentData.amount !== expectedPaise) {
          throw new Error(`Payment amount mismatch. Expected ₹${order.grandTotal}, received ${paymentData.amount / 100}`);
        }
      }

      // 3. Atomic State transition
      order.paymentStatus = 'paid';
      order.paymentId = razorpay_payment_id;
      order.razorpayOrderId = razorpay_order_id;
      order.paymentGateway = 'razorpay';
      if (order.orderStatus === 'New') {
        order.orderStatus = 'Confirmed';
      }

      order.statusHistory.push({
        status: 'Confirmed',
        timestamp: new Date().toISOString(),
        note: `Online payment of ₹${order.grandTotal} verified via Razorpay (Payment Ref: ${razorpay_payment_id})`,
      });
      order.updatedAt = new Date().toISOString();

      if (!db.processedPaymentIds) db.processedPaymentIds = [];
      db.processedPaymentIds.push(razorpay_payment_id);

      logActivity('Payment Verified', 'Orders', order.id, `Payment ${razorpay_payment_id} verified for order ${order.id}`);
      return { order, alreadyPaid: false };
    });

    res.json({
      success: true,
      verified: true,
      alreadyPaid: verifiedOrder.alreadyPaid,
      order: verifiedOrder.order,
      message: 'Payment verified and order confirmed successfully',
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Razorpay Webhook Handler with Raw Body HMAC-SHA256 Verification & Idempotency
app.post('/api/webhooks/payment', async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const rawBody = (req as any).rawBody as Buffer;

  if (!signature || !rawBody) {
    return res.status(401).json({ error: 'Missing webhook signature or raw payload' });
  }

  const isValid = verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid Razorpay webhook signature' });
  }

  const event = req.body;
  const eventId = (req.headers['x-razorpay-event-id'] as string) || event.id || `evt_${Date.now()}`;

  try {
    await withDatabaseLock((db: DatabaseSchema) => {
      if (!db.processedWebhookKeys) db.processedWebhookKeys = [];
      if (db.processedWebhookKeys.includes(eventId)) {
        return; // Idempotent: already processed
      }

      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.notes?.order_id || event.order_id;
      const paymentId = paymentEntity?.id || event.payment_id;

      if (orderId) {
        const order = db.orders.find((o) => o.id === orderId);
        if (order) {
          if (event.event === 'payment.captured' && order.paymentStatus !== 'paid') {
            order.paymentStatus = 'paid';
            order.paymentId = paymentId;
            order.orderStatus = 'Confirmed';
            order.statusHistory.push({
              status: 'Confirmed',
              timestamp: new Date().toISOString(),
              note: `Payment confirmed via Razorpay Webhook [${event.event}] (Ref: ${paymentId})`,
            });
            order.updatedAt = new Date().toISOString();
            if (!db.processedPaymentIds) db.processedPaymentIds = [];
            db.processedPaymentIds.push(paymentId);
          } else if (event.event === 'payment.failed' && order.paymentStatus !== 'paid') {
            order.paymentStatus = 'failed';
            order.orderStatus = 'Payment Failed';
            order.statusHistory.push({
              status: 'Payment Failed',
              timestamp: new Date().toISOString(),
              note: `Payment failed notification via Webhook (Ref: ${paymentId})`,
            });
            // Release reserved stock on payment failure
            if (order.stockReserved && !order.stockRestored) {
              for (const item of order.items) {
                const prod = db.products.find((p) => p.id === item.productId);
                if (prod && prod.trackInventory) {
                  prod.stockQuantity += item.quantity;
                }
              }
              order.stockRestored = true;
            }
            order.updatedAt = new Date().toISOString();
          }
        }
      }

      db.processedWebhookKeys.push(eventId);
    });

    const db = getDatabase();
    if (db.processedWebhookKeys && db.processedWebhookKeys.includes(eventId)) {
      return res.status(200).json({ received: true, status: 'already_processed' });
    }

    res.status(200).json({ received: true, status: 'processed' });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: 'Internal webhook handling error' });
  }
});

// Admin Order Status Update & State Machine Enforcement
app.patch('/api/admin/orders/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const order = db.orders.find((o) => o.id === id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const {
    orderStatus,
    paymentStatus,
    note,
    trackingNumber,
    courierPartner,
    courierTrackingUrl,
    estimatedDeliveryDate,
    dispatchDate,
    currentLocation,
  } = req.body;

  if (trackingNumber !== undefined) {
    order.trackingNumber = trackingNumber ? trackingNumber.trim() : undefined;
  }
  if (courierPartner !== undefined) {
    order.courierPartner = courierPartner ? courierPartner.trim() : undefined;
  }
  if (courierTrackingUrl !== undefined) {
    order.courierTrackingUrl = courierTrackingUrl ? courierTrackingUrl.trim() : undefined;
  }
  if (estimatedDeliveryDate !== undefined) {
    order.estimatedDeliveryDate = estimatedDeliveryDate || undefined;
  }
  if (dispatchDate !== undefined) {
    order.dispatchDate = dispatchDate || undefined;
  }
  if (currentLocation !== undefined) {
    order.currentLocation = currentLocation ? currentLocation.trim() : undefined;
  }

  // Auto-generate official carrier URL if missing
  if (order.trackingNumber && !order.courierTrackingUrl && order.courierPartner) {
    const partner = order.courierPartner.toLowerCase();
    if (partner.includes('delhivery')) {
      order.courierTrackingUrl = `https://www.delhivery.com/track/package/${order.trackingNumber}`;
    } else if (partner.includes('blue dart') || partner.includes('bluedart')) {
      order.courierTrackingUrl = `https://www.bluedart.com/tracking`;
    } else if (partner.includes('dtdc')) {
      order.courierTrackingUrl = `https://www.dtdc.in/`;
    } else if (partner.includes('india post')) {
      order.courierTrackingUrl = `https://www.indiapost.gov.in/`;
    }
  }

  if (orderStatus && orderStatus !== order.orderStatus) {
    const prevStatus = order.orderStatus;

    // Prevent moving from terminal failure to active without explicit reconciliation
    if (prevStatus === 'Payment Failed' && orderStatus !== 'Cancelled' && order.paymentStatus !== 'paid') {
      return res.status(400).json({ error: 'Cannot activate an unpaid failed order without verified payment.' });
    }

    order.orderStatus = orderStatus;

    if (orderStatus === 'Shipped' && !order.dispatchDate) {
      order.dispatchDate = new Date().toISOString().split('T')[0];
    }

    const trackingNote =
      order.trackingNumber && order.courierPartner
        ? ` [Carrier: ${order.courierPartner} • AWB: ${order.trackingNumber}]`
        : '';

    order.statusHistory.push({
      status: orderStatus,
      timestamp: new Date().toISOString(),
      note: (note || `Status updated to ${orderStatus}`) + trackingNote,
    });

    // Idempotent inventory restock on Cancelled or Returned
    const isNowCancelled = orderStatus === 'Cancelled' || orderStatus === 'Returned';
    const wasCancelled = prevStatus === 'Cancelled' || prevStatus === 'Returned';

    if (isNowCancelled && !wasCancelled && !order.stockRestored) {
      for (const item of order.items) {
        const prod = db.products.find((p) => p.id === item.productId);
        if (prod && prod.trackInventory) {
          const prevStock = prod.stockQuantity;
          prod.stockQuantity += item.quantity;
          const adj: InventoryAdjustment = {
            id: `adj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            previousStock: prevStock,
            newStock: prod.stockQuantity,
            change: item.quantity,
            reason: `Order ${order.id} ${orderStatus.toLowerCase()} - inventory restored`,
            adjustedBy: 'System / Admin',
            timestamp: new Date().toISOString(),
          };
          db.inventoryAdjustments.unshift(adj);
        }
      }
      order.stockRestored = true;
    } else if (!isNowCancelled && wasCancelled && order.stockRestored) {
      for (const item of order.items) {
        const prod = db.products.find((p) => p.id === item.productId);
        if (prod && prod.trackInventory) {
          const prevStock = prod.stockQuantity;
          prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
          const adj: InventoryAdjustment = {
            id: `adj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            previousStock: prevStock,
            newStock: prod.stockQuantity,
            change: -item.quantity,
            reason: `Order ${order.id} reopened - inventory deducted`,
            adjustedBy: 'System / Admin',
            timestamp: new Date().toISOString(),
          };
          db.inventoryAdjustments.unshift(adj);
        }
      }
      order.stockRestored = false;
    }
  }

  if (paymentStatus) {
    order.paymentStatus = paymentStatus;
  }

  if (note && !orderStatus) {
    order.notes = (order.notes ? order.notes + '\n' : '') + note;
  }

  order.updatedAt = new Date().toISOString();
  logActivity('Updated Order', 'Orders', order.id, `Order status changed to ${order.orderStatus}`);
  saveDatabase(db);

  res.json({ success: true, order });
});

// Admin Refund Flow
app.post('/api/admin/orders/:id/refund', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount } = req.body;

  try {
    const updatedOrder = await withDatabaseLock(async (db: DatabaseSchema) => {
      const order = db.orders.find((o) => o.id === id);
      if (!order) throw new Error('Order not found');
      if (order.paymentStatus !== 'paid') throw new Error('Cannot refund an unpaid order');

      const amountPaise = amount ? Math.round(Number(amount) * 100) : Math.round(order.grandTotal * 100);

      if (order.paymentId) {
        const rfnd = await createRazorpayRefund(order.paymentId, amountPaise);
        order.refundId = rfnd.id;
        order.refundAmount = rfnd.amount / 100;
        order.refundStatus = rfnd.status;
      }

      order.paymentStatus = 'refunded';
      order.orderStatus = 'Refunded';
      order.statusHistory.push({
        status: 'Refunded',
        timestamp: new Date().toISOString(),
        note: `Payment refund processed for ₹${order.grandTotal}`,
      });

      // Restore stock if not already restored
      if (!order.stockRestored) {
        for (const item of order.items) {
          const prod = db.products.find((p) => p.id === item.productId);
          if (prod && prod.trackInventory) {
            prod.stockQuantity += item.quantity;
          }
        }
        order.stockRestored = true;
      }

      order.updatedAt = new Date().toISOString();
      return order;
    });

    res.json({ success: true, order: updatedOrder });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 6. INVENTORY API
// ----------------------------------------------------
app.get('/api/admin/inventory/adjustments', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.inventoryAdjustments);
});

app.post('/api/admin/inventory/adjust', (req: Request, res: Response) => {
  const db = getDatabase();
  const { productId, newStock, reason } = req.body;

  const product = db.products.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const prev = product.stockQuantity;
  const next = Math.max(0, Number(newStock));
  product.stockQuantity = next;

  const adj: InventoryAdjustment = {
    id: `adj-${Date.now()}`,
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    previousStock: prev,
    newStock: next,
    change: next - prev,
    reason: reason || 'Inventory cycle count',
    adjustedBy: 'Shagufi Hussain',
    timestamp: new Date().toISOString(),
  };

  db.inventoryAdjustments.unshift(adj);
  logActivity('Stock Adjusted', 'Inventory', product.id, `${product.name}: ${prev} -> ${next} (${reason})`);
  saveDatabase(db);

  res.json({ success: true, product, adjustment: adj });
});

// ----------------------------------------------------
// 7. BLOG & CMS API
// ----------------------------------------------------
app.get('/api/blog', (req: Request, res: Response) => {
  const db = getDatabase();
  const { includeDrafts } = req.query;
  let posts = [...db.blogPosts];
  if (includeDrafts !== 'true') {
    posts = posts.filter((b) => b.status === 'published');
  }
  posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  res.json(posts);
});

app.get('/api/blog/:slugOrId', (req: Request, res: Response) => {
  const db = getDatabase();
  const { slugOrId } = req.params;
  const post = db.blogPosts.find((b) => b.slug === slugOrId || b.id === slugOrId);

  if (!post) return res.status(404).json({ error: 'Post not found' });

  let relatedProducts: Product[] = [];
  if (post.relatedProductIds && post.relatedProductIds.length > 0) {
    relatedProducts = db.products.filter((p) => post.relatedProductIds!.includes(p.id));
  }

  res.json({ post, relatedProducts });
});

app.post('/api/admin/blog', (req: Request, res: Response) => {
  const db = getDatabase();
  const raw = req.body;
  if (!raw.title) return res.status(400).json({ error: 'Title is required' });

  const id = `blog-${Date.now()}`;
  const slug = generateSlug(raw.title);

  const newPost: BlogPost = {
    id,
    title: sanitizeString(raw.title.trim()),
    slug,
    excerpt: raw.excerpt ? sanitizeString(raw.excerpt) : '',
    content: raw.content || '',
    coverImage:
      raw.coverImage || 'https://images.unsplash.com/photo-1512290900672-1f4861219b67?q=80&w=800&auto=format&fit=crop',
    author: raw.author ? sanitizeString(raw.author) : 'Shagufi Hussain',
    category: raw.category || 'Glow Rituals',
    tags: Array.isArray(raw.tags) ? raw.tags.map(sanitizeString) : ['Skincare'],
    status: raw.status || 'published',
    publishedAt: raw.publishedAt || new Date().toISOString(),
    readTime: raw.readTime || '4 min read',
    seoTitle: raw.seoTitle || `${raw.title} | GlowWithSH Journal`,
    seoDescription: raw.seoDescription || raw.excerpt || '',
    relatedProductIds: Array.isArray(raw.relatedProductIds) ? raw.relatedProductIds : [],
  };

  db.blogPosts.unshift(newPost);
  logActivity('Created Blog Article', 'Blog', newPost.id, `Created article "${newPost.title}"`);
  saveDatabase(db);
  res.status(201).json(newPost);
});

app.patch('/api/admin/blog/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const index = db.blogPosts.findIndex((b) => b.id === id);
  if (index === -1) return res.status(404).json({ error: 'Article not found' });

  db.blogPosts[index] = { ...db.blogPosts[index], ...req.body };
  logActivity('Updated Blog Article', 'Blog', id, `Updated article "${db.blogPosts[index].title}"`);
  saveDatabase(db);
  res.json(db.blogPosts[index]);
});

app.delete('/api/admin/blog/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const post = db.blogPosts.find((b) => b.id === id);
  db.blogPosts = db.blogPosts.filter((b) => b.id !== id);
  logActivity('Deleted Blog Article', 'Blog', id, `Deleted article "${post?.title}"`);
  saveDatabase(db);
  res.json({ success: true });
});

// ----------------------------------------------------
// 8. HOMEPAGE & CMS
// ----------------------------------------------------
app.get('/api/homepage', (_req: Request, res: Response) => {
  res.json(getDatabase().homepageCMS);
});

app.patch('/api/admin/homepage', (req: Request, res: Response) => {
  const db = getDatabase();
  db.homepageCMS = {
    ...db.homepageCMS,
    ...req.body,
    announcementBar: { ...db.homepageCMS.announcementBar, ...(req.body.announcementBar || {}) },
    hero: { ...db.homepageCMS.hero, ...(req.body.hero || {}) },
    editorialStatement: { ...db.homepageCMS.editorialStatement, ...(req.body.editorialStatement || {}) },
    sectionVisibility: { ...db.homepageCMS.sectionVisibility, ...(req.body.sectionVisibility || {}) },
  };
  logActivity('Updated Homepage CMS', 'Homepage', undefined, 'Modified hero, announcements, or section layout');
  saveDatabase(db);
  res.json({ success: true, homepageCMS: db.homepageCMS });
});

app.get('/api/founder', (_req: Request, res: Response) => {
  res.json(getDatabase().founderCMS);
});

app.patch('/api/admin/founder', (req: Request, res: Response) => {
  const db = getDatabase();
  db.founderCMS = { ...db.founderCMS, ...req.body };
  logActivity('Updated Founder Story', 'Founder', undefined, 'Modified founder copy or imagery');
  saveDatabase(db);
  res.json({ success: true, founderCMS: db.founderCMS });
});

// ----------------------------------------------------
// 9. AWARDS CMS
// ----------------------------------------------------
app.get('/api/awards', (req: Request, res: Response) => {
  const db = getDatabase();
  const { all } = req.query;
  const awards = all === 'true' ? db.awards : db.awards.filter((a) => a.published && a.verified);
  res.json(awards);
});

app.post('/api/admin/awards', (req: Request, res: Response) => {
  const db = getDatabase();
  const raw = req.body;
  if (!raw.title || !raw.organization) {
    return res.status(400).json({ error: 'Title and organization are required' });
  }

  const newAward: Award = {
    id: `award-${Date.now()}`,
    title: sanitizeString(raw.title.trim()),
    organization: sanitizeString(raw.organization.trim()),
    year: raw.year ? String(raw.year).trim() : new Date().getFullYear().toString(),
    description: raw.description ? sanitizeString(raw.description) : '',
    image: raw.image || '',
    externalLink: raw.externalLink || '',
    verified: Boolean(raw.verified),
    published: Boolean(raw.published),
  };

  db.awards.push(newAward);
  logActivity('Added Award Entry', 'Awards', newAward.id, `Added award "${newAward.title}"`);
  saveDatabase(db);
  res.status(201).json(newAward);
});

app.patch('/api/admin/awards/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const index = db.awards.findIndex((a) => a.id === id);
  if (index === -1) return res.status(404).json({ error: 'Award entry not found' });

  db.awards[index] = { ...db.awards[index], ...req.body };
  logActivity('Updated Award', 'Awards', id, `Updated award "${db.awards[index].title}"`);
  saveDatabase(db);
  res.json(db.awards[index]);
});

app.delete('/api/admin/awards/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  db.awards = db.awards.filter((a) => a.id !== id);
  logActivity('Deleted Award', 'Awards', id, 'Removed award entry');
  saveDatabase(db);
  res.json({ success: true });
});

// ----------------------------------------------------
// 10. SOCIAL & SITE SETTINGS
// ----------------------------------------------------
app.get('/api/social', (_req: Request, res: Response) => {
  res.json(getDatabase().instagramSettings);
});

app.patch('/api/admin/social', (req: Request, res: Response) => {
  const db = getDatabase();
  db.instagramSettings = { ...db.instagramSettings, ...req.body };
  logActivity('Updated Instagram Settings', 'Social', undefined, 'Modified handle or curated grid');
  saveDatabase(db);
  res.json(db.instagramSettings);
});

// Public site-settings: NEVER leak admin password, password hash, or token version!
app.get('/api/site-settings', (_req: Request, res: Response) => {
  const { adminPassword, adminPasswordHash, adminTokenVersion, ...safeSettings } = getDatabase().siteSettings as any;
  res.json(safeSettings);
});

app.patch('/api/admin/site-settings', (req: Request, res: Response) => {
  const db = getDatabase();
  const { adminPassword, adminPasswordHash, adminTokenVersion, ...updates } = req.body;
  db.siteSettings = { ...db.siteSettings, ...updates };
  logActivity('Updated Site Settings', 'Settings', undefined, 'Modified business address or contact data');
  saveDatabase(db);
  const { adminPassword: _, adminPasswordHash: __, adminTokenVersion: ___, ...safeSettings } = db.siteSettings as any;
  res.json(safeSettings);
});

// ----------------------------------------------------
// 11. CONTACT INQUIRIES
// ----------------------------------------------------
app.post('/api/contacts', contactsRateLimiter, (req: Request, res: Response) => {
  const parseResult = contactSubmissionSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid contact form information' });
  }

  const { name, phone, email, subject, message } = parseResult.data;
  const db = getDatabase();

  const inquiry: ContactInquiry = {
    id: `cnt-${Date.now()}`,
    name: sanitizeString(name),
    phone,
    email: email || undefined,
    subject: sanitizeString(subject),
    message: sanitizeString(message),
    status: 'unread',
    createdAt: new Date().toISOString(),
  };

  db.contacts.unshift(inquiry);
  logActivity('Customer Inquiry', 'Contacts', inquiry.id, `New inquiry from ${inquiry.name}`);
  saveDatabase(db);
  res.status(201).json({ success: true, inquiry });
});

app.get('/api/admin/contacts', (_req: Request, res: Response) => {
  res.json(getDatabase().contacts);
});

app.patch('/api/admin/contacts/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const inquiry = db.contacts.find((c) => c.id === id);
  if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

  if (req.body.status) inquiry.status = req.body.status;
  saveDatabase(db);
  res.json(inquiry);
});

app.delete('/api/admin/contacts/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const initialLen = db.contacts.length;
  db.contacts = db.contacts.filter((c) => c.id !== id);
  if (db.contacts.length === initialLen) return res.status(404).json({ error: 'Inquiry not found' });
  logActivity('Deleted Inquiry', 'Contacts', id, `Removed inquiry ${id}`);
  saveDatabase(db);
  res.json({ success: true, message: `Inquiry ${id} deleted` });
});

// ----------------------------------------------------
// 12. REVIEWS & DISCOUNTS
// ----------------------------------------------------
app.get('/api/reviews', (req: Request, res: Response) => {
  const db = getDatabase();
  const { productId, all } = req.query;
  let reviews = [...db.reviews];
  if (all !== 'true') {
    reviews = reviews.filter((r) => r.status === 'approved');
  }
  if (productId) {
    reviews = reviews.filter((r) => r.productId === productId);
  }
  res.json(reviews);
});

app.post('/api/reviews', reviewsRateLimiter, (req: Request, res: Response) => {
  const parseResult = reviewSubmissionSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid review data' });
  }

  const { productId, productName, customerName, rating, reviewText } = parseResult.data;
  const db = getDatabase();

  const newReview: Review = {
    id: `rev-${Date.now()}`,
    productId,
    productName: productName ? sanitizeString(productName) : 'GlowWithSH Product',
    customerName: sanitizeString(customerName),
    rating,
    reviewText: sanitizeString(reviewText),
    verifiedPurchase: true,
    status: 'pending', // Requires admin moderation
    createdAt: new Date().toISOString(),
  };

  db.reviews.unshift(newReview);
  logActivity('New Customer Review', 'Reviews', newReview.id, `Review submitted for ${newReview.productName}`);
  saveDatabase(db);
  res.status(201).json({ success: true, message: 'Review submitted for verification', review: newReview });
});

app.patch('/api/admin/reviews/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const review = db.reviews.find((r) => r.id === id);
  if (!review) return res.status(404).json({ error: 'Review not found' });

  if (req.body.status) review.status = req.body.status;
  saveDatabase(db);
  res.json(review);
});

app.delete('/api/admin/reviews/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const initialLen = db.reviews.length;
  db.reviews = db.reviews.filter((r) => r.id !== id);
  if (db.reviews.length === initialLen) return res.status(404).json({ error: 'Review not found' });
  logActivity('Deleted Review', 'Reviews', id, `Removed review ${id}`);
  saveDatabase(db);
  res.json({ success: true, message: `Review ${id} deleted` });
});

// Discount code validation
app.get('/api/discounts/validate/:code', (req: Request, res: Response) => {
  const db = getDatabase();
  const code = (req.params.code || '').trim().toUpperCase();
  if (!code) {
    return res.status(400).json({ valid: false, error: 'Promo code is required' });
  }

  const discount = db.discounts.find((d) => d.code.toUpperCase() === code && d.active);
  if (!discount) {
    return res.status(404).json({ valid: false, error: 'Invalid or inactive promotional code' });
  }

  const now = new Date().toISOString();
  if (discount.startDate && discount.startDate > now) {
    return res.status(400).json({ valid: false, error: 'Promo code is not yet active' });
  }
  if (discount.endDate && discount.endDate < now) {
    return res.status(400).json({ valid: false, error: 'Promo code has expired' });
  }
  if (discount.usageLimit && (discount.usageCount || 0) >= discount.usageLimit) {
    return res.status(400).json({ valid: false, error: 'Promo code usage limit reached' });
  }

  const subtotal = Number(req.query.subtotal) || 0;
  const minSpend = discount.minSpend || 0;
  if (minSpend > 0 && subtotal > 0 && subtotal < minSpend) {
    return res.status(400).json({
      valid: false,
      error: `Minimum ritual order value of ₹${minSpend} required for code ${discount.code}.`,
    });
  }

  let discountAmount = 0;
  if (subtotal > 0) {
    if (discount.discountType === 'percentage') {
      discountAmount = Math.round((subtotal * discount.discountValue) / 100);
      if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
        discountAmount = discount.maxDiscount;
      }
    } else {
      discountAmount = Math.min(subtotal, discount.discountValue);
    }
  }

  res.json({
    valid: true,
    code: discount.code,
    discountType: discount.discountType,
    discountValue: discount.discountValue,
    discountAmount,
    minSpend,
  });
});

app.post('/api/discounts/validate', (req: Request, res: Response) => {
  const code = ((req.body.code || '') as string).trim().toUpperCase();
  const subtotal = Number(req.body.subtotal) || 0;

  if (!code) {
    return res.status(400).json({ valid: false, message: 'Please enter a promo code' });
  }

  const db = getDatabase();
  const discount = db.discounts.find((d) => d.code.toUpperCase() === code && d.active);
  if (!discount) {
    return res.status(404).json({ valid: false, message: 'Invalid or inactive promotional code' });
  }

  const now = new Date().toISOString();
  if (discount.startDate && discount.startDate > now) {
    return res.status(400).json({ valid: false, message: 'Promo code is not yet active' });
  }
  if (discount.endDate && discount.endDate < now) {
    return res.status(400).json({ valid: false, message: 'Promo code has expired' });
  }
  if (discount.usageLimit && (discount.usageCount || 0) >= discount.usageLimit) {
    return res.status(400).json({ valid: false, message: 'Promo code usage limit reached' });
  }

  const minSpend = discount.minSpend || 0;
  if (minSpend > 0 && subtotal > 0 && subtotal < minSpend) {
    return res.status(400).json({
      valid: false,
      message: `Minimum ritual order value of ₹${minSpend} required for code ${code}.`,
    });
  }

  let discountAmount = 0;
  if (discount.discountType === 'percentage') {
    discountAmount = Math.round((subtotal * discount.discountValue) / 100);
    if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
      discountAmount = discount.maxDiscount;
    }
  } else {
    discountAmount = Math.min(subtotal, discount.discountValue);
  }

  res.json({
    valid: true,
    code: discount.code,
    discountType: discount.discountType,
    discountValue: discount.discountValue,
    discountAmount,
    minSpend,
    description:
      discount.discountType === 'percentage'
        ? `${discount.discountValue}% Ritual Privilege`
        : `₹${discount.discountValue} Atelier Courtesy`,
  });
});

app.get('/api/admin/discounts', (_req: Request, res: Response) => {
  res.json(getDatabase().discounts);
});

app.post('/api/admin/discounts', (req: Request, res: Response) => {
  const parseResult = discountMutationSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid promo code data' });
  }

  const data = parseResult.data;
  const db = getDatabase();

  const newDisc = {
    id: `disc-${Date.now()}`,
    code: data.code,
    discountType: data.discountType,
    discountValue: data.discountValue,
    minSpend: data.minSpend,
    usageLimit: data.usageLimit,
    usageCount: 0,
    startDate: data.startDate,
    endDate: data.endDate,
    active: data.active,
  };

  db.discounts.push(newDisc);
  logActivity('Created Discount', 'Discounts', newDisc.id, `Promo code ${newDisc.code} created`);
  saveDatabase(db);
  res.status(201).json(newDisc);
});

app.patch('/api/admin/discounts/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const index = db.discounts.findIndex((d) => d.id === id);
  if (index === -1) return res.status(404).json({ error: 'Discount code not found' });

  const existing = db.discounts[index];
  const updated = {
    ...existing,
    ...req.body,
    code: req.body.code ? req.body.code.trim().toUpperCase() : existing.code,
  };
  db.discounts[index] = updated;
  logActivity('Updated Discount', 'Discounts', id, `Promo code ${updated.code} updated`);
  saveDatabase(db);
  res.json(updated);
});

app.delete('/api/admin/discounts/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  db.discounts = db.discounts.filter((d) => d.id !== id);
  logActivity('Deleted Discount', 'Discounts', id, `Discount ${id} removed`);
  saveDatabase(db);
  res.json({ success: true });
});

// ----------------------------------------------------
// 13. MEDIA LIBRARY & SECURE FILE UPLOAD
// ----------------------------------------------------
app.get('/api/admin/media', (_req: Request, res: Response) => {
  res.json(getDatabase().media);
});

// Secure file upload: Strict MIME, magic bytes, safe filename, path traversal protection
app.post('/api/admin/upload', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { filename, data, category, title, altText } = req.body;
    if (!filename || !data) {
      return res.status(400).json({ error: 'Filename and file data are required.' });
    }

    const matches = typeof data === 'string' ? data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/) : null;
    let buffer: Buffer;
    let declaredMime = '';

    if (matches && matches.length === 3) {
      declaredMime = matches[1].toLowerCase();
      buffer = Buffer.from(matches[2], 'base64');
    } else if (typeof data === 'string') {
      buffer = Buffer.from(data, 'base64');
    } else {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    // Size limit: 5MB maximum
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds maximum 5MB limit.' });
    }

    const rawExt = path.extname(filename).toLowerCase();
    // Strictly reject executable, web scripts, SVG
    const rejectedExtensions = ['.svg', '.html', '.htm', '.js', '.ts', '.php', '.exe', '.sh', '.py'];
    if (rejectedExtensions.includes(rawExt) || declaredMime.includes('svg') || declaredMime.includes('html')) {
      return res.status(400).json({ error: 'Only JPG, PNG, and WebP raster images are allowed. SVG and scripts are rejected.' });
    }

    // Magic Bytes Verification
    let safeExt = '';
    const isJpeg = buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng =
      buffer.length > 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;
    const isWebp =
      buffer.length > 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP';

    if (isJpeg) {
      safeExt = '.jpg';
    } else if (isPng) {
      safeExt = '.png';
    } else if (isWebp) {
      safeExt = '.webp';
    } else {
      return res.status(400).json({ error: 'File magic bytes do not match a valid JPEG, PNG, or WebP image.' });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Safe random filename to prevent collisions and path traversal
    const safeBaseName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const uniqueName = `${safeBaseName}${safeExt}`;
    const filePath = path.join(uploadsDir, uniqueName);

    // Verify resolved path stays inside uploadsDir
    if (!filePath.startsWith(uploadsDir)) {
      return res.status(400).json({ error: 'Path traversal detected.' });
    }

    fs.writeFileSync(filePath, buffer);
    const publicUrl = `/uploads/${uniqueName}`;

    const db = getDatabase();
    const mediaItem: MediaItem = {
      id: `med-${Date.now()}`,
      title: title ? sanitizeString(title) : safeBaseName,
      url: publicUrl,
      altText: altText ? sanitizeString(altText) : title ? sanitizeString(title) : 'Product Photography',
      category: category || 'products',
      sizeBytes: buffer.length,
      dimensions: `${Math.round(buffer.length / 1024)} KB`,
      uploadedAt: new Date().toISOString(),
    };

    db.media.unshift(mediaItem);
    saveDatabase(db);
    logActivity('Uploaded Image', 'Media', mediaItem.id, `Uploaded ${uniqueName} (${Math.round(buffer.length / 1024)} KB)`);

    return res.status(201).json({
      success: true,
      url: publicUrl,
      filename: uniqueName,
      size: buffer.length,
      mediaItem,
    });
  } catch (err: any) {
    console.error('File upload error:', err);
    return res.status(500).json({ error: 'Failed to process file upload: ' + err.message });
  }
});

app.post('/api/admin/media', (req: Request, res: Response) => {
  const db = getDatabase();
  const { title, url, altText, category, dimensions } = req.body;
  if (!title || !url) return res.status(400).json({ error: 'Title and URL required' });

  const newMedia: MediaItem = {
    id: `med-${Date.now()}`,
    title: sanitizeString(title.trim()),
    url: url.trim(),
    altText: altText ? sanitizeString(altText) : sanitizeString(title),
    category: category || 'products',
    dimensions: dimensions || '1600x1200',
    uploadedAt: new Date().toISOString(),
  };

  db.media.unshift(newMedia);
  logActivity('Uploaded Media', 'Media', newMedia.id, `Asset ${newMedia.title} added`);
  saveDatabase(db);
  res.status(201).json(newMedia);
});

app.delete('/api/admin/media/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  db.media = db.media.filter((m) => m.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

app.get('/api/admin/activity-logs', (_req: Request, res: Response) => {
  res.json(getDatabase().activityLogs.slice(0, 100));
});

app.post('/api/admin/reset-database', (_req: Request, res: Response) => {
  const freshDb = resetDatabase();
  logActivity('Database Reset', 'System', undefined, 'Restored all seed products and catalog content');
  res.json({ success: true, message: 'Database reset to initial verified catalog', count: freshDb.products.length });
});

// ----------------------------------------------------
// 14. SEO: ROBOTS.TXT & SITEMAP.XML
// ----------------------------------------------------
app.get('/robots.txt', (_req: Request, res: Response) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin-login
Disallow: /api/

Sitemap: https://www.glowwithsh.com/sitemap.xml
`);
});

app.get('/sitemap.xml', (_req: Request, res: Response) => {
  const db = getDatabase();
  const domain = process.env.APP_URL || 'https://www.glowwithsh.com';
  const now = new Date().toISOString().split('T')[0];

  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/shop', priority: '0.9', changefreq: 'daily' },
    { url: '/about', priority: '0.7', changefreq: 'monthly' },
    { url: '/founder', priority: '0.8', changefreq: 'monthly' },
    { url: '/awards', priority: '0.7', changefreq: 'monthly' },
    { url: '/journal', priority: '0.8', changefreq: 'weekly' },
    { url: '/contact', priority: '0.6', changefreq: 'monthly' },
    { url: '/policies/shipping', priority: '0.4', changefreq: 'yearly' },
    { url: '/policies/refunds', priority: '0.4', changefreq: 'yearly' },
    { url: '/policies/privacy', priority: '0.4', changefreq: 'yearly' },
    { url: '/policies/terms', priority: '0.4', changefreq: 'yearly' },
  ];

  const categoryUrls = db.categories.map((c) => ({
    url: `/shop/category/${c.slug}`,
    priority: '0.8',
    changefreq: 'weekly',
  }));

  const productUrls = db.products
    .filter((p) => p.status === 'published' && p.visible !== false)
    .map((p) => ({
      url: `/product/${p.slug}`,
      priority: '0.9',
      changefreq: 'weekly',
    }));

  const blogUrls = db.blogPosts
    .filter((b) => b.status === 'published')
    .map((b) => ({
      url: `/journal/${b.slug}`,
      priority: '0.7',
      changefreq: 'monthly',
    }));

  const allUrls = [...staticPages, ...categoryUrls, ...productUrls, ...blogUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${domain}${u.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  res.type('application/xml');
  res.send(xml);
});

// ----------------------------------------------------
// 15. STATIC ASSET SERVING & SPA ROUTER
// ----------------------------------------------------
async function start() {
  const publicPath = path.join(process.cwd(), 'public');

  const mediaOptions = {
    setHeaders: (res: Response) => {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    },
  };

  const uploadsDir = path.join(publicPath, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  app.use('/videos', express.static(path.join(publicPath, 'videos'), mediaOptions));
  app.use('/images', express.static(path.join(publicPath, 'images'), mediaOptions));
  app.use('/uploads', express.static(uploadsDir, {
    setHeaders: (res: Response) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    },
  }));
  app.use(express.static(publicPath, { maxAge: '1d' }));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: ['**/*.zip', '**/data/**', '**/*.bak', '**/public/uploads/**', '**/docs/**'],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');

    app.use('/assets', express.static(path.join(distPath, 'assets'), {
      maxAge: '1y',
      immutable: true,
    }));

    app.use(express.static(distPath, { maxAge: '1h' }));

    app.get('*', (_req: Request, res: Response) => {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const storefrontServer = app.listen(STOREFRONT_PORT, '0.0.0.0', () => {
    console.log(`🛍️  GlowWithSH Storefront running on http://0.0.0.0:${STOREFRONT_PORT} (Main Domain)`);
  });

  // Managed hosts expose one public HTTP port. In production, host-based routing
  // above serves the admin console through the same server. Keep a second local
  // listener only for convenient development at localhost:5174.
  const adminServer = process.env.NODE_ENV !== 'production'
    ? app.listen(ADMIN_PORT, '0.0.0.0', () => {
        console.log(`🔐 GlowWithSH Admin Console running on http://0.0.0.0:${ADMIN_PORT} (Admin Subdomain)`);
      })
    : undefined;

  const shutdown = () => {
    console.log('Gracefully terminating GlowWithSH servers...');
    storefrontServer.close(() => {
      if (!adminServer) {
        console.log('Storefront HTTP server stopped.');
        process.exit(0);
        return;
      }
      adminServer.close(() => {
        console.log('Both Storefront and Admin HTTP servers stopped.');
        process.exit(0);
      });
    });
    setTimeout(() => {
      console.error('Force closing servers on timeout.');
      process.exit(1);
    }, 5000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start();
export default app;
