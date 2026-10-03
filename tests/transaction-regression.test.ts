import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { orderSubmissionSchema } from '../server/validation';
import { csrfOriginCheck } from '../server/security';

test('duplicate product lines cannot bypass the inventory quantity limit', () => {
  const result = orderSubmissionSchema.safeParse({
    customer: { name: 'Test Buyer', phone: '9876543210', address: 'Test street 123', city: 'Delhi', state: 'Delhi', pincode: '110001' },
    items: [{ productId: 'one', quantity: 6 }, { productId: 'one', quantity: 6 }], paymentMethod: 'cod',
  });
  assert.equal(result.success, false);
});

test('origin names containing localhost cannot bypass CSRF checks', () => {
  let status = 0;
  let continued = false;
  const req = { method: 'POST', protocol: 'https', headers: { origin: 'https://localhost.attacker.example' }, get: () => 'www.glowwithsh.com' };
  const res = { status(code: number) { status = code; return this; }, json() {} };
  csrfOriginCheck(req as any, res as any, () => { continued = true; });
  assert.equal(status, 403);
  assert.equal(continued, false);
});

test('real database transaction rolls back rejected checkout and serializes competing buyers', async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'glowwithsh-db-test-'));
  process.env.DATA_DIR = temp;
  const { loadDatabase, getDatabase, saveDatabase, withDatabaseLock } = await import('../server/db');
  try {
    const db = loadDatabase();
    db.products[0].stockQuantity = 1;
    saveDatabase(db);
    await assert.rejects(withDatabaseLock(current => {
      current.products[0].stockQuantity = 0;
      throw new Error('Invalid coupon');
    }), /Invalid coupon/);
    assert.equal(getDatabase().products[0].stockQuantity, 1);
    assert.equal(loadDatabase().products[0].stockQuantity, 1);
    const buy = () => withDatabaseLock(current => {
      if (current.products[0].stockQuantity < 1) throw new Error('Out of stock');
      current.products[0].stockQuantity -= 1;
    });
    const results = await Promise.allSettled([buy(), buy()]);
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal(loadDatabase().products[0].stockQuantity, 0);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
