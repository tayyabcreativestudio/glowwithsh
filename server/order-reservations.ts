import type { DatabaseSchema } from './db';

/** Run inside the datastore lock; late captures require manual reconciliation. */
export function expireUnpaidReservations(db: DatabaseSchema, now = Date.now()) {
  for (const order of db.orders) {
    if (order.paymentMethod !== 'online_ready' || order.paymentStatus === 'paid' || order.paymentStatus === 'refunded' || !order.stockReserved || order.stockRestored) continue;
    const created = Date.parse(order.createdAt);
    if (!Number.isFinite(created) || now - created < 30 * 60_000) continue;
    for (const item of order.items) {
      const product = db.products.find(product => product.id === item.productId);
      if (product?.trackInventory) product.stockQuantity += item.quantity;
    }
    order.stockRestored = true;
    order.orderStatus = 'Cancelled';
    order.paymentStatus = 'failed';
    order.updatedAt = new Date(now).toISOString();
    order.statusHistory.push({ status: 'Cancelled', timestamp: order.updatedAt, note: 'Unpaid reservation expired after 30 minutes. Reconcile any late gateway capture before fulfilment.' });
  }
}
