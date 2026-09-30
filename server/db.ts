import fs from 'fs';
import path from 'path';
import {
  Product,
  Category,
  Collection,
  Order,
  InventoryAdjustment,
  BlogPost,
  Award,
  InstagramSettings,
  FounderCMS,
  HomepageCMS,
  SiteSettings,
  ContactInquiry,
  Review,
  DiscountCode,
  MediaItem,
  AdminUser,
  ActivityLog,
} from '../src/types';
import {
  initialProducts,
  initialCategories,
  initialCollections,
  initialBlogPosts,
  initialAwards,
  initialInstagramSettings,
  initialFounderCMS,
  initialHomepageCMS,
  initialSiteSettings,
  initialAdminUser,
  initialOrders,
} from '../src/data/seedData';
import { hashPassword, verifyPassword } from './security';

export interface DatabaseSchema {
  products: Product[];
  categories: Category[];
  collections: Collection[];
  orders: Order[];
  inventoryAdjustments: InventoryAdjustment[];
  blogPosts: BlogPost[];
  awards: Award[];
  instagramSettings: InstagramSettings;
  founderCMS: FounderCMS;
  homepageCMS: HomepageCMS;
  siteSettings: SiteSettings;
  contacts: ContactInquiry[];
  reviews: Review[];
  discounts: DiscountCode[];
  media: MediaItem[];
  admins: AdminUser[];
  activityLogs: ActivityLog[];
  processedPaymentIds?: string[];
  processedWebhookKeys?: string[];
}

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const DB_BACKUP_FILE = path.join(DATA_DIR, 'db.json.bak');
const DB_LOCK_FILE = path.join(DATA_DIR, '.db.lock');
const DB_LOCK_TIMEOUT_MS = 10_000;
const DB_LOCK_STALE_MS = 30_000;

const defaultDatabase: DatabaseSchema = {
  products: initialProducts,
  categories: initialCategories,
  collections: initialCollections,
  orders: initialOrders,
  inventoryAdjustments: [],
  blogPosts: initialBlogPosts,
  awards: initialAwards,
  instagramSettings: initialInstagramSettings,
  founderCMS: initialFounderCMS,
  homepageCMS: initialHomepageCMS,
  siteSettings: {
    ...initialSiteSettings,
    adminPasswordHash: hashPassword(process.env.ADMIN_PASSWORD || 'development-only-password'),
    adminTokenVersion: 1,
    legalBusinessName: 'GlowWithSH Atelier Botanique',
    grievanceOfficerName: 'Shagufi Hussain',
    grievanceOfficerEmail: 'grievance@glowwithsh.com',
    gstin: process.env.SITE_GSTIN?.trim().toUpperCase() || '',
  },
  contacts: [],
  reviews: [],
  discounts: [
    {
      id: 'disc-1',
      code: 'GLOW10',
      discountType: 'percentage',
      discountValue: 10,
      minSpend: 999,
      usageLimit: 1000,
      usageCount: 0,
      active: true,
    },
    {
      id: 'disc-2',
      code: 'FIRST10',
      discountType: 'percentage',
      discountValue: 10,
      minSpend: 0,
      usageLimit: 5000,
      usageCount: 0,
      active: true,
    },
    {
      id: 'disc-3',
      code: 'GLOW20',
      discountType: 'percentage',
      discountValue: 20,
      minSpend: 1499,
      usageLimit: 500,
      usageCount: 0,
      active: true,
    },
    {
      id: 'disc-4',
      code: 'SHAGUFI',
      discountType: 'percentage',
      discountValue: 15,
      minSpend: 999,
      usageLimit: 1000,
      usageCount: 0,
      active: true,
    },
    {
      id: 'disc-5',
      code: 'RITUAL100',
      discountType: 'fixed',
      discountValue: 100,
      minSpend: 1200,
      usageLimit: 500,
      usageCount: 0,
      active: true,
    },
  ],
  media: [
    {
      id: 'med-1',
      title: 'Golden Facewash Hero Photography',
      url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop',
      altText: 'GlowWithSH Golden Facewash bottle on stone backdrop',
      category: 'products',
      dimensions: '1600x1200',
      uploadedAt: '2026-01-10T10:00:00Z',
    },
    {
      id: 'med-2',
      title: 'Bridal Cream Texture Shot',
      url: 'https://images.unsplash.com/photo-1512290900672-1f4861219b67?q=80&w=800&auto=format&fit=crop',
      altText: 'Rich bridal cream texture swirl',
      category: 'editorial',
      dimensions: '1600x1200',
      uploadedAt: '2026-01-14T10:00:00Z',
    },
    {
      id: 'med-3',
      title: 'Shagufi Hussain Founder Portrait',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop',
      altText: 'Shagufi Hussain, Founder of GlowWithSH',
      category: 'founder',
      dimensions: '1200x1600',
      uploadedAt: '2026-01-01T10:00:00Z',
    },
    {
      id: 'med-4',
      title: 'Korean Rice Serum Dropper',
      url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop',
      altText: 'Glass dropper with fermented rice elixir',
      category: 'products',
      dimensions: '1600x1200',
      uploadedAt: '2026-01-28T10:00:00Z',
    },
  ],
  admins: [
    {
      ...initialAdminUser,
      username: process.env.ADMIN_USERNAME?.trim() || 'shagufi',
      tokenVersion: 1,
      passwordHash: hashPassword(process.env.ADMIN_PASSWORD || 'development-only-password'),
    },
  ],
  activityLogs: [],
  processedPaymentIds: [],
  processedWebhookKeys: [],
};

let memoryDb: DatabaseSchema = defaultDatabase;

function migrateDatabaseSecurity(db: DatabaseSchema): boolean {
  let modified = false;

  // Never keep plaintext admin passwords in siteSettings
  if (db.siteSettings.adminPassword) {
    if (!db.siteSettings.adminPasswordHash) {
      db.siteSettings.adminPasswordHash = hashPassword(db.siteSettings.adminPassword);
    }
    delete db.siteSettings.adminPassword;
    modified = true;
  }

  // Ensure default legal and business settings
  if (!db.siteSettings.legalBusinessName) {
    db.siteSettings.legalBusinessName = 'GlowWithSH Atelier Botanique';
    modified = true;
  }
  if (!db.siteSettings.grievanceOfficerName) {
    db.siteSettings.grievanceOfficerName = 'Shagufi Hussain';
    db.siteSettings.grievanceOfficerEmail = 'grievance@glowwithsh.com';
    modified = true;
  }
  if (process.env.SITE_GSTIN && db.siteSettings.gstin !== process.env.SITE_GSTIN.trim().toUpperCase()) {
    db.siteSettings.gstin = process.env.SITE_GSTIN.trim().toUpperCase();
    modified = true;
  }

  // If environment variable ADMIN_PASSWORD is set, update master password hash
  if (process.env.ADMIN_PASSWORD) {
    const password = process.env.ADMIN_PASSWORD.trim();
    // scrypt hashes contain a random salt, so equality is not a valid comparison.
    const passwordMatches = db.siteSettings.adminPasswordHash
      ? verifyPassword(password, db.siteSettings.adminPasswordHash)
      : false;
    if (!passwordMatches) {
      const envHash = hashPassword(password);
      db.siteSettings.adminPasswordHash = envHash;
      db.siteSettings.adminTokenVersion = (db.siteSettings.adminTokenVersion || 1) + 1;
      for (const admin of db.admins || []) {
        admin.passwordHash = envHash;
        admin.tokenVersion = db.siteSettings.adminTokenVersion;
      }
      modified = true;
    }
  } else if (!db.siteSettings.adminPasswordHash && process.env.NODE_ENV !== 'production') {
    db.siteSettings.adminPasswordHash = hashPassword('development-only-password');
    modified = true;
  }

  if (typeof db.siteSettings.adminTokenVersion !== 'number') {
    db.siteSettings.adminTokenVersion = 1;
    modified = true;
  }

  // Initialize tracking arrays
  if (!Array.isArray(db.processedPaymentIds)) {
    db.processedPaymentIds = [];
    modified = true;
  }
  if (!Array.isArray(db.processedWebhookKeys)) {
    db.processedWebhookKeys = [];
    modified = true;
  }

  // Ensure admin user has username, passwordHash, and tokenVersion
  if (Array.isArray(db.admins) && db.admins.length > 0) {
    const admin = db.admins[0];
    const configuredUsername = process.env.ADMIN_USERNAME?.trim();
    if (configuredUsername && admin.username !== configuredUsername) {
      admin.username = configuredUsername;
      modified = true;
    } else if (!admin.username) {
      admin.username = 'shagufi';
      modified = true;
    }
    if (!admin.tokenVersion) {
      admin.tokenVersion = db.siteSettings.adminTokenVersion || 1;
      modified = true;
    }
    if (!admin.passwordHash && db.siteSettings.adminPasswordHash) {
      admin.passwordHash = db.siteSettings.adminPasswordHash;
      modified = true;
    }
  }

  return modified;
}

export function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      if (content && content.trim().length > 0) {
        try {
          memoryDb = JSON.parse(content);
          if (!memoryDb.orders || !Array.isArray(memoryDb.orders)) memoryDb.orders = [];
          if (!Array.isArray(memoryDb.processedPaymentIds)) memoryDb.processedPaymentIds = [];
          if (!Array.isArray(memoryDb.processedWebhookKeys)) memoryDb.processedWebhookKeys = [];

          const migrated = migrateDatabaseSecurity(memoryDb);
          if (migrated) {
            saveDatabase(memoryDb);
          }

          // Keep backup on clean read
          try {
            fs.copyFileSync(DB_FILE, DB_BACKUP_FILE);
          } catch (_) {}

          return memoryDb;
        } catch (jsonErr) {
          console.error('Corruption detected in db.json, attempting backup restoration...', jsonErr);
        }
      }
    }

    // Attempt backup recovery
    if (fs.existsSync(DB_BACKUP_FILE)) {
      const backupContent = fs.readFileSync(DB_BACKUP_FILE, 'utf-8');
      if (backupContent && backupContent.trim().length > 0) {
        memoryDb = JSON.parse(backupContent);
        migrateDatabaseSecurity(memoryDb);
        saveDatabase(memoryDb);
        return memoryDb;
      }
    }

    // Fallback to initial seed database
    saveDatabase(defaultDatabase);
    return defaultDatabase;
  } catch (err) {
    console.error('Error loading db.json, using in-memory default:', err);
    return defaultDatabase;
  }
}

export function saveDatabase(data: DatabaseSchema): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    memoryDb = data;
    const jsonStr = JSON.stringify(data, null, 2);

    // Atomic write strategy: write to temporary file, then rename atomically
    const tempFile = path.join(
      DATA_DIR,
      `.db.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 8)}`
    );
    fs.writeFileSync(tempFile, jsonStr, 'utf-8');
    fs.renameSync(tempFile, DB_FILE);

    // Keep periodic backup
    try {
      fs.copyFileSync(DB_FILE, DB_BACKUP_FILE);
    } catch (_) {}
    return true;
  } catch (err) {
    console.error('Error saving db.json:', err);
    return false;
  }
}

export function getDatabase(): DatabaseSchema {
  if (!memoryDb || !memoryDb.products || memoryDb.products.length === 0) {
    return loadDatabase();
  }
  return memoryDb;
}

export function resetDatabase(): DatabaseSchema {
  memoryDb = JSON.parse(JSON.stringify(defaultDatabase));
  migrateDatabaseSecurity(memoryDb);
  saveDatabase(memoryDb);
  return memoryDb;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Concurrency guard: Re-reads database immediately inside mutex lock before mutation,
 * executes atomic logic, saves database, and releases lock.
 */
export async function withDatabaseLock<T>(fn: (db: DatabaseSchema) => T | Promise<T>): Promise<T> {
  const startedAt = Date.now();

  while (true) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const fd = fs.openSync(DB_LOCK_FILE, 'wx');
      fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }));
      fs.closeSync(fd);
      break;
    } catch (err: any) {
      if (err?.code !== 'EEXIST') throw err;
      try {
        const stat = fs.statSync(DB_LOCK_FILE);
        if (Date.now() - stat.mtimeMs > DB_LOCK_STALE_MS) {
          fs.unlinkSync(DB_LOCK_FILE);
          continue;
        }
      } catch {}

      if (Date.now() - startedAt > DB_LOCK_TIMEOUT_MS) {
        throw new Error('Database write lock timeout: high concurrency limit reached. Please retry.');
      }
      await sleep(20);
    }
  }

  try {
    loadDatabase();
    const result = await fn(getDatabase());
    saveDatabase(getDatabase());
    return result;
  } finally {
    try {
      fs.unlinkSync(DB_LOCK_FILE);
    } catch {}
  }
}
