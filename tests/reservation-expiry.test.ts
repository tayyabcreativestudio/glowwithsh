import test from 'node:test';
import assert from 'node:assert/strict';
import { expireUnpaidReservations } from '../server/order-reservations';
import type { DatabaseSchema } from '../server/db';

test('unpaid online reservation expires once; paid/COD/recent orders retain stock', () => {
  const now = Date.parse('2026-10-03T10:00:00Z');
  const base = { id: 'o', paymentMethod: 'online_ready', paymentStatus: 'pending_online', stockReserved: true, stockRestored: false, createdAt: '2026-10-03T09:00:00Z', orderStatus: 'New', statusHistory: [], items: [{ productId: 'p', quantity: 2 }] };
  const db = { products: [{ id: 'p', stockQuantity: 1, trackInventory: true }], orders: [structuredClone(base), { ...structuredClone(base), id: 'paid', paymentStatus: 'paid' }, { ...structuredClone(base), id: 'cod', paymentMethod: 'cod' }, { ...structuredClone(base), id: 'recent', createdAt: '2026-10-03T09:50:00Z' }] } as unknown as DatabaseSchema;
  expireUnpaidReservations(db, now);
  assert.equal(db.products[0].stockQuantity, 3);
  assert.equal(db.orders[0].orderStatus, 'Cancelled');
  assert.equal(db.orders[0].stockRestored, true);
  assert.equal(db.orders[1].paymentStatus, 'paid');
  assert.equal(db.orders[2].stockRestored, false);
  assert.equal(db.orders[3].stockRestored, false);
  expireUnpaidReservations(db, now + 60_000);
  assert.equal(db.products[0].stockQuantity, 3);
  assert.equal(db.orders[0].statusHistory.length, 1);
});
