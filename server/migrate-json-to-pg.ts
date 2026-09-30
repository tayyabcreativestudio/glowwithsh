/**
 * Migration Script: data/db.json -> PostgreSQL Schema
 * Can be executed with: npx tsx server/migrate-json-to-pg.ts [optional-output.sql]
 */
import fs from 'fs';
import path from 'path';
import { DatabaseSchema } from './db';

const DB_PATH = path.resolve(process.cwd(), 'data', 'db.json');
const OUTPUT_SQL = path.resolve(process.cwd(), 'data', 'migrated_pg_dump.sql');

function escapeSql(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return isNaN(val) ? '0' : String(val);
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

export function generateMigrationSql(): string {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Cannot find database file at: ${DB_PATH}`);
  }

  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  const db: DatabaseSchema = JSON.parse(raw);
  const statements: string[] = [];

  statements.push('-- Auto-generated JSON DB to PostgreSQL Migration');
  statements.push('BEGIN;\n');

  // 1. Admins
  statements.push('-- Admins');
  for (const admin of db.admins || []) {
    statements.push(
      `INSERT INTO admins (id, email, username, name, role, password_hash, token_version, avatar_url) VALUES (` +
        `${escapeSql(admin.id)}, ${escapeSql(admin.email)}, ${escapeSql(admin.username || 'admin')}, ` +
        `${escapeSql(admin.name)}, ${escapeSql(admin.role)}, ${escapeSql(admin.passwordHash || db.siteSettings.adminPasswordHash || '')}, ` +
        `${escapeSql(admin.tokenVersion || 1)}, ${escapeSql(admin.avatar)}) ` +
        `ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;`
    );
  }

  // 2. Categories
  statements.push('\n-- Categories');
  for (const cat of db.categories || []) {
    statements.push(
      `INSERT INTO categories (id, name, slug, description, image_url) VALUES (` +
        `${escapeSql(cat.id)}, ${escapeSql(cat.name)}, ${escapeSql(cat.slug)}, ${escapeSql(cat.description)}, ${escapeSql(cat.image)}) ` +
        `ON CONFLICT (id) DO NOTHING;`
    );
  }

  // 3. Collections
  statements.push('\n-- Collections');
  for (const col of db.collections || []) {
    statements.push(
      `INSERT INTO collections (id, name, slug, description, image_url, featured) VALUES (` +
        `${escapeSql(col.id)}, ${escapeSql(col.name)}, ${escapeSql(col.slug)}, ${escapeSql(col.description)}, ${escapeSql(col.image)}, ${escapeSql(col.featured)}) ` +
        `ON CONFLICT (id) DO NOTHING;`
    );
  }

  // 4. Products & Inventory
  statements.push('\n-- Products & Inventory');
  for (const p of db.products || []) {
    statements.push(
      `INSERT INTO products (id, sku, name, slug, category_id, collection_id, short_description, description, ` +
        `ingredients, benefits, how_to_use, skin_type, product_type, size, price, compare_at_price, cost_price, ` +
        `track_inventory, allow_backorders, low_stock_threshold, status, visible, featured, best_seller, ` +
        `primary_image, media_gallery, seo_title, seo_description) VALUES (` +
        `${escapeSql(p.id)}, ${escapeSql(p.sku)}, ${escapeSql(p.name)}, ${escapeSql(p.slug)}, ${escapeSql(p.categoryId)}, ` +
        `${escapeSql(p.collectionId || null)}, ${escapeSql(p.shortDescription)}, ${escapeSql(p.description)}, ` +
        `${escapeSql(p.ingredients || [])}, ${escapeSql(p.benefits || [])}, ${escapeSql(p.howToUse)}, ${escapeSql(p.skinType)}, ` +
        `${escapeSql(p.productType)}, ${escapeSql(p.size)}, ${escapeSql(p.price)}, ${escapeSql(p.compareAtPrice)}, ${escapeSql(p.costPrice)}, ` +
        `${escapeSql(p.trackInventory !== false)}, ${escapeSql(Boolean(p.allowBackorders))}, ${escapeSql(p.lowStockThreshold || 10)}, ` +
        `${escapeSql(p.status || 'published')}, ${escapeSql(p.visible !== false)}, ${escapeSql(Boolean(p.featured))}, ${escapeSql(Boolean(p.bestSeller))}, ` +
        `${escapeSql(p.primaryImage)}, ${escapeSql(p.mediaGallery || [])}, ${escapeSql(p.seoTitle)}, ${escapeSql(p.seoDescription)}) ` +
        `ON CONFLICT (id) DO NOTHING;`
    );

    statements.push(
      `INSERT INTO inventory (product_id, available_quantity, reserved_quantity) VALUES (` +
        `${escapeSql(p.id)}, ${escapeSql(p.stockQuantity || 0)}, 0) ` +
        `ON CONFLICT (product_id) DO UPDATE SET available_quantity = EXCLUDED.available_quantity;`
    );
  }

  // 5. Coupons
  statements.push('\n-- Coupons');
  for (const d of db.discounts || []) {
    statements.push(
      `INSERT INTO coupons (id, code, discount_type, discount_value, min_spend, max_discount, usage_limit, usage_count, active) VALUES (` +
        `${escapeSql(d.id)}, ${escapeSql(d.code)}, ${escapeSql(d.discountType)}, ${escapeSql(d.discountValue)}, ` +
        `${escapeSql(d.minSpend || 0)}, ${escapeSql(d.maxDiscount || null)}, ${escapeSql(d.usageLimit || null)}, ` +
        `${escapeSql(d.usageCount || 0)}, ${escapeSql(d.active)}) ` +
        `ON CONFLICT (id) DO NOTHING;`
    );
  }

  // 6. Orders & Order Items
  statements.push('\n-- Orders & Line Items');
  for (const o of db.orders || []) {
    statements.push(
      `INSERT INTO orders (id, public_order_number, customer_name, phone, email, currency, subtotal, ` +
        `discount_total, coupon_code, shipping_total, tax_total, cgst_amount, sgst_amount, igst_amount, grand_total, ` +
        `payment_method, payment_status, payment_gateway, order_status, razorpay_order_id, razorpay_payment_id, ` +
        `stock_reserved, courier_partner, tracking_number, courier_tracking_url, notes, created_at) VALUES (` +
        `${escapeSql(o.id)}, ${escapeSql(o.id)}, ${escapeSql(o.customerName)}, ${escapeSql(o.phone)}, ${escapeSql(o.email)}, ` +
        `'INR', ${escapeSql(o.subtotal)}, ${escapeSql(o.discountAmount ?? o.discount ?? 0)}, ${escapeSql(o.couponCode || null)}, ` +
        `${escapeSql(o.deliveryFee || 0)}, ${escapeSql(o.taxSummary?.taxableAmount ? (o.subtotal - o.taxSummary.taxableAmount) : 0)}, ` +
        `${escapeSql(o.taxSummary?.cgst || 0)}, ${escapeSql(o.taxSummary?.sgst || 0)}, ${escapeSql(o.taxSummary?.igst || 0)}, ` +
        `${escapeSql(o.grandTotal)}, ${escapeSql(o.paymentMethod)}, ${escapeSql(o.paymentStatus)}, ${escapeSql(o.paymentGateway)}, ` +
        `${escapeSql(o.orderStatus)}, ${escapeSql(o.razorpayOrderId)}, ${escapeSql(o.paymentId)}, ${escapeSql(o.stockReserved !== false)}, ` +
        `${escapeSql(o.courierPartner)}, ${escapeSql(o.trackingNumber)}, ${escapeSql(o.courierTrackingUrl)}, ${escapeSql(o.notes)}, ` +
        `${escapeSql(o.createdAt || new Date().toISOString())}) ` +
        `ON CONFLICT (id) DO NOTHING;`
    );

    for (let i = 0; i < (o.items || []).length; i++) {
      const it = o.items[i];
      statements.push(
        `INSERT INTO order_items (id, order_id, product_id, sku, product_name_snapshot, unit_price, quantity, tax_rate, line_total) VALUES (` +
          `${escapeSql(`${o.id}-item-${i + 1}`)}, ${escapeSql(o.id)}, ${escapeSql(it.productId)}, ${escapeSql(it.sku)}, ` +
          `${escapeSql(it.name)}, ${escapeSql(it.price)}, ${escapeSql(it.quantity)}, 18.00, ${escapeSql(it.price * it.quantity)}) ` +
          `ON CONFLICT (id) DO NOTHING;`
      );
    }
  }

  // 7. Reviews
  statements.push('\n-- Reviews');
  for (const r of db.reviews || []) {
    statements.push(
      `INSERT INTO reviews (id, product_id, product_name, customer_name, rating, review_text, verified_purchase, status, created_at) VALUES (` +
        `${escapeSql(r.id)}, ${escapeSql(r.productId)}, ${escapeSql(r.productName)}, ${escapeSql(r.customerName)}, ` +
        `${escapeSql(r.rating)}, ${escapeSql(r.reviewText)}, ${escapeSql(r.verifiedPurchase)}, ${escapeSql(r.status)}, ` +
        `${escapeSql(r.createdAt)}) ON CONFLICT (id) DO NOTHING;`
    );
  }

  // 8. Contacts
  statements.push('\n-- Contacts');
  for (const c of db.contacts || []) {
    statements.push(
      `INSERT INTO contacts (id, name, phone, email, subject, message, status, created_at) VALUES (` +
        `${escapeSql(c.id)}, ${escapeSql(c.name)}, ${escapeSql(c.phone)}, ${escapeSql(c.email)}, ` +
        `${escapeSql(c.subject)}, ${escapeSql(c.message)}, ${escapeSql(c.status)}, ${escapeSql(c.createdAt)}) ` +
        `ON CONFLICT (id) DO NOTHING;`
    );
  }

  statements.push('\nCOMMIT;\n');
  return statements.join('\n');
}

// When executed directly via CLI
if (process.argv[1] && process.argv[1].endsWith('migrate-json-to-pg.ts')) {
  try {
    const sql = generateMigrationSql();
    fs.writeFileSync(OUTPUT_SQL, sql, 'utf-8');
    console.log(`Successfully generated PostgreSQL migration dump at: ${OUTPUT_SQL}`);
  } catch (err) {
    console.error('Migration script failed:', err);
    process.exit(1);
  }
}
