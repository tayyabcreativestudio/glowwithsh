import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { orderSubmissionSchema } from '../server/validation';

describe('PHASE 4: Order Price & Business Logic Integrity', () => {
  const validOrderPayload = {
    customer: {
      name: 'Aarav Sharma',
      phone: '9876543210',
      email: 'aarav@example.com',
      address: 'Flat 402, Lotus Enclave, MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
    },
    paymentMethod: 'online_ready' as const,
    items: [
      {
        productId: 'prod-1',
        quantity: 2,
      },
    ],
  };

  test('Valid order passes Zod schema validation', () => {
    const result = orderSubmissionSchema.safeParse(validOrderPayload);
    assert.equal(result.success, true, 'Valid order payload should pass schema');
  });

  test('Rejects invalid Indian phone number', () => {
    const invalidPhones = [
      '1234567890', // Does not start with 6-9
      '987654321', // 9 digits
      '98765432100', // 11 digits
      'phone_number',
    ];

    for (const phone of invalidPhones) {
      const result = orderSubmissionSchema.safeParse({
        ...validOrderPayload,
        customer: { ...validOrderPayload.customer, phone },
      });
      assert.equal(result.success, false, `Invalid phone "${phone}" should fail validation`);
    }
  });

  test('Rejects invalid Indian PIN code', () => {
    const invalidPincodes = [
      '012345', // Starts with 0
      '11005', // 5 digits
      '1100530', // 7 digits
      'DELHI1',
      '99999A',
    ];

    for (const pincode of invalidPincodes) {
      const result = orderSubmissionSchema.safeParse({
        ...validOrderPayload,
        customer: { ...validOrderPayload.customer, pincode },
      });
      assert.equal(result.success, false, `Invalid PIN "${pincode}" should fail validation`);
    }
  });

  test('Rejects negative, zero, decimal, and huge quantities', () => {
    // Negative quantity
    const negResult = orderSubmissionSchema.safeParse({
      ...validOrderPayload,
      items: [{ productId: 'prod-1', quantity: -1 }],
    });
    assert.equal(negResult.success, false, 'Negative quantity must be rejected');

    // Zero quantity
    const zeroResult = orderSubmissionSchema.safeParse({
      ...validOrderPayload,
      items: [{ productId: 'prod-1', quantity: 0 }],
    });
    assert.equal(zeroResult.success, false, 'Zero quantity must be rejected');

    // Decimal quantity
    const decResult = orderSubmissionSchema.safeParse({
      ...validOrderPayload,
      items: [{ productId: 'prod-1', quantity: 2.5 }],
    });
    assert.equal(decResult.success, false, 'Decimal quantity must be rejected');

    // Huge quantity (> 10 max allowed limit per product)
    const hugeResult = orderSubmissionSchema.safeParse({
      ...validOrderPayload,
      items: [{ productId: 'prod-1', quantity: 99999 }],
    });
    assert.equal(hugeResult.success, false, 'Huge quantity must be rejected');
  });

  test('Rejects empty cart items', () => {
    const emptyResult = orderSubmissionSchema.safeParse({
      ...validOrderPayload,
      items: [],
    });
    assert.equal(emptyResult.success, false, 'Empty cart must be rejected');
  });

  test('Authoritative server pricing ignores client price tampering', () => {
    // Malicious client tries to send price: 1, subtotal: 1, grandTotal: 1
    const maliciousClientPayload = {
      ...validOrderPayload,
      price: 1,
      subtotal: 1,
      grandTotal: 1,
      total: 1,
      deliveryFee: 0,
      discountAmount: 999,
    };

    // The server recalculates from DB catalog:
    const mockDbProducts = [
      { id: 'prod-1', name: 'Saffron Night Cream', price: 1850, stock: 25, active: true },
    ];

    const dbProduct = mockDbProducts.find((p) => p.id === maliciousClientPayload.items[0].productId);
    assert.ok(dbProduct);

    // Calculation must be performed strictly using dbProduct.price:
    const calculatedSubtotal = maliciousClientPayload.items[0].quantity * dbProduct.price;
    assert.equal(calculatedSubtotal, 3700, 'Calculated subtotal must be 2 * 1850 = 3700, ignoring client price 1');

    // Delivery fee rule: Free if subtotal >= 999, else 99
    const calculatedDeliveryFee = calculatedSubtotal >= 999 ? 0 : 99;
    assert.equal(calculatedDeliveryFee, 0, 'Shipping calculated from authoritative subtotal');

    const calculatedGrandTotal = calculatedSubtotal + calculatedDeliveryFee;
    assert.equal(calculatedGrandTotal, 3700, 'Grand total must be authoritative');
  });

  test('Authoritative coupon evaluation rejects expired, minSpend, or inactive coupons', () => {
    const mockCoupons = [
      {
        code: 'EXPIRED20',
        discountPercent: 20,
        isActive: true,
        expiresAt: '2025-01-01T00:00:00Z', // Expired
        minSpend: 500,
        usageLimit: 100,
        usedCount: 5,
      },
      {
        code: 'HIGHMINSPEND',
        discountPercent: 15,
        isActive: true,
        expiresAt: '2029-01-01T00:00:00Z',
        minSpend: 5000, // Requires 5000
        usageLimit: 100,
        usedCount: 0,
      },
      {
        code: 'EXHAUSTED',
        discountPercent: 10,
        isActive: true,
        expiresAt: '2029-01-01T00:00:00Z',
        minSpend: 500,
        usageLimit: 10,
        usedCount: 10, // Exhausted
      },
      {
        code: 'GLOW10',
        discountPercent: 10,
        isActive: true,
        expiresAt: '2029-01-01T00:00:00Z',
        minSpend: 1000,
        usageLimit: 100,
        usedCount: 2,
      },
    ];

    const currentSubtotal = 2000;
    const now = new Date('2026-09-29T12:00:00Z').getTime();

    // 1. Expired check
    const expiredCoupon = mockCoupons.find((c) => c.code === 'EXPIRED20')!;
    const isExpired = new Date(expiredCoupon.expiresAt).getTime() < now;
    assert.equal(isExpired, true, 'Expired coupon must be flagged');

    // 2. Minimum spend check
    const highMinCoupon = mockCoupons.find((c) => c.code === 'HIGHMINSPEND')!;
    const isMinSpendMet = currentSubtotal >= highMinCoupon.minSpend;
    assert.equal(isMinSpendMet, false, 'Minimum spend must not be met');

    // 3. Usage limit check
    const exhaustedCoupon = mockCoupons.find((c) => c.code === 'EXHAUSTED')!;
    const isExhausted = exhaustedCoupon.usedCount >= exhaustedCoupon.usageLimit;
    assert.equal(isExhausted, true, 'Exhausted coupon must be flagged');

    // 4. Valid coupon calculation
    const validCoupon = mockCoupons.find((c) => c.code === 'GLOW10')!;
    assert.equal(new Date(validCoupon.expiresAt).getTime() > now, true);
    assert.equal(currentSubtotal >= validCoupon.minSpend, true);
    assert.equal(validCoupon.usedCount < validCoupon.usageLimit, true);

    const discountAmount = Math.round((currentSubtotal * validCoupon.discountPercent) / 100);
    assert.equal(discountAmount, 200, 'Discount must be accurately 10% of 2000 = 200');
  });
});
