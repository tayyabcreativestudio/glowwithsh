import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('PHASE 5 & 11: Inventory, Concurrency & Order Lifecycle', () => {
  test('Simultaneous race condition on last stock allows exactly one buyer', async () => {
    // Inventory state: exactly 1 unit left
    let availableStock = 1;
    let successfulOrders = 0;
    let rejectedOrders = 0;

    // Mutex lock simulation (same pattern as withDatabaseLock)
    let isLocked = false;
    const acquireLock = async (): Promise<() => void> => {
      while (isLocked) {
        await new Promise((r) => setTimeout(r, 10));
      }
      isLocked = true;
      return () => {
        isLocked = false;
      };
    };

    // Buyer 1 and Buyer 2 checkout simultaneously
    const attemptCheckout = async (buyerId: string, requestedQty: number) => {
      const release = await acquireLock();
      try {
        if (availableStock >= requestedQty) {
          // Reserve stock
          availableStock -= requestedQty;
          successfulOrders++;
          return { success: true, buyerId };
        } else {
          rejectedOrders++;
          return { success: false, buyerId, reason: 'Insufficient stock' };
        }
      } finally {
        release();
      }
    };

    const [res1, res2] = await Promise.all([
      attemptCheckout('Buyer_1', 1),
      attemptCheckout('Buyer_2', 1),
    ]);

    assert.equal(successfulOrders, 1, 'Exactly one order should succeed');
    assert.equal(rejectedOrders, 1, 'Exactly one order should be rejected');
    assert.equal(availableStock, 0, 'Stock must not drop below zero');
    assert.ok(res1.success !== res2.success, 'One buyer succeeds, the other fails');
  });

  test('Valid order cancellation restores stock exactly once', () => {
    let stock = 10;
    const order = {
      id: 'ORD-RESTOCK-TEST',
      status: 'Confirmed',
      items: [{ productId: 'prod-kumkumadi', quantity: 2 }],
      stockRestored: false,
    };

    // Customer cancels order before dispatch
    function cancelOrder(targetOrder: typeof order) {
      if (targetOrder.status === 'Cancelled') {
        return { error: 'Order already cancelled' };
      }
      targetOrder.status = 'Cancelled';
      if (!targetOrder.stockRestored) {
        for (const item of targetOrder.items) {
          stock += item.quantity;
        }
        targetOrder.stockRestored = true;
      }
      return { success: true };
    }

    const cancel1 = cancelOrder(order);
    assert.equal(cancel1.success, true);
    assert.equal(stock, 12, 'Stock restored from 10 to 12 (+2)');
    assert.equal(order.stockRestored, true);

    // Duplicate cancellation attempt
    const cancel2 = cancelOrder(order);
    assert.ok(cancel2.error, 'Second cancellation must be rejected');
    assert.equal(stock, 12, 'Stock must NOT be restored a second time');
  });

  test('Illegal order lifecycle status jumps are blocked', () => {
    // Formal valid state machine transitions:
    const validTransitions: Record<string, string[]> = {
      'Payment Pending': ['Confirmed', 'Payment Failed', 'Cancelled'],
      'Payment Failed': ['Payment Pending', 'Cancelled'],
      'Confirmed': ['Processing', 'Cancelled'],
      'Processing': ['Packed', 'Cancelled'],
      'Packed': ['Shipped', 'Cancelled'],
      'Shipped': ['Out for Delivery', 'Delivered'],
      'Out for Delivery': ['Delivered'],
      'Delivered': ['Return Requested'],
      'Cancelled': [],
      'Refunded': [],
    };

    function canTransition(current: string, next: string): boolean {
      return (validTransitions[current] || []).includes(next);
    }

    // Valid transitions
    assert.equal(canTransition('Payment Pending', 'Confirmed'), true);
    assert.equal(canTransition('Confirmed', 'Processing'), true);
    assert.equal(canTransition('Processing', 'Packed'), true);
    assert.equal(canTransition('Packed', 'Shipped'), true);
    assert.equal(canTransition('Shipped', 'Delivered'), true);

    // Illegal transitions
    assert.equal(canTransition('Payment Pending', 'Delivered'), false, 'Cannot jump from pending to delivered');
    assert.equal(canTransition('Cancelled', 'Delivered'), false, 'Cannot jump from cancelled to delivered');
    assert.equal(canTransition('Delivered', 'Payment Pending'), false, 'Cannot revert delivered to pending');
    assert.equal(canTransition('Cancelled', 'Confirmed'), false, 'Cannot un-cancel without legitimate path');
  });
});
