import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'db.json');
const raw = fs.readFileSync(dbPath, 'utf8');
const db = JSON.parse(raw);

// Scrypt hash for default password "glow2026"
const defaultPasswordHash =
  'scrypt$16384$8$1$4c984df31626c5a6f991d6ddaec8fda7$8854804fc04e92d4f43652314273b6f330ff08c7183fb63392252ab394d2ebb8a28b399b6fa6a13ed0be0832c6b553601919d8fc2af2060d214e38e5f1fc8126';

console.log('--- PURGING FAKE DATA ---');
console.log(`Original orders: ${db.orders ? db.orders.length : 0}`);
console.log(`Original reviews: ${db.reviews ? db.reviews.length : 0}`);
console.log(`Original contacts: ${db.contacts ? db.contacts.length : 0}`);
console.log(`Original activity logs: ${db.activityLogs ? db.activityLogs.length : 0}`);

// Purge fake orders, reviews, contacts, logs, adjustments
db.orders = [];
db.reviews = [];
db.contacts = [];
db.activityLogs = [];
db.inventoryAdjustments = [];
db.processedPaymentIds = [];
db.processedWebhookKeys = [];

// Remove test uploads from media array
if (Array.isArray(db.media)) {
  db.media = db.media.filter(
    (m: any) =>
      !m.url?.includes('test-serum') &&
      !m.url?.includes('debon-gourmet') &&
      !m.id?.includes('179059')
  );
}

// Ensure clean administrator credentials with default password "glow2026"
db.admins = [
  {
    id: 'admin-1',
    email: 'admin@glowwithsh.com',
    name: 'Administrator',
    role: 'Super Admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    username: 'admin',
    tokenVersion: 1,
    passwordHash: defaultPasswordHash,
  },
  {
    id: 'admin-2',
    email: 'care@glowwithsh.com',
    name: 'Shagufi Hussain',
    role: 'Founder & Master Formulator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    username: 'shagufi',
    tokenVersion: 1,
    passwordHash: defaultPasswordHash,
  },
];

// Update siteSettings with default password hash and tokenVersion
if (db.siteSettings) {
  db.siteSettings.adminPasswordHash = defaultPasswordHash;
  db.siteSettings.adminTokenVersion = 1;
  db.siteSettings.adminUsername = 'admin';
  delete db.siteSettings.adminPassword; // Ensure no plaintext
}

// Reset stock quantities to healthy initial inventory (70 units per product)
if (Array.isArray(db.products)) {
  for (const prod of db.products) {
    if (prod.stockQuantity < 10) {
      prod.stockQuantity = 50;
    }
  }
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('✅ Successfully purged fake data and reset default admin password to "glow2026"');
