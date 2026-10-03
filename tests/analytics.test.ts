import test from 'node:test';
import assert from 'node:assert/strict';
import { analyticsItem, trackCommerce, trackPurchase, setAnalyticsConsent } from '../src/utils/analytics';
import type { Product, Order } from '../src/types';

test('commerce measurement requires explicit consent, excludes PII and deduplicates completed purchases', () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const stored = new Map<string, string>();
  const browser = { dataLayer: [] as unknown[] };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: browser });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => stored.get(key), setItem: (key: string, value: string) => stored.set(key, value) } });
  try {
    const product = { id: 'p', sku: 'sku', name: 'Product', categoryName: 'Serums', price: 300, costPrice: 20 } as Product;
    trackCommerce('view_item', [analyticsItem(product)], 300);
    assert.equal(browser.dataLayer.length, 0);
    setAnalyticsConsent(true);
    trackCommerce('view_item', [analyticsItem(product)], 300);
    assert.equal(browser.dataLayer.length, 2);
    const order = { id: 'o', paymentMethod: 'online_ready', paymentStatus: 'pending_online', subtotal: 300, discount: 10, deliveryFee: 99, grandTotal: 389, phone: 'private', address: 'private', items: [{ productId: 'p', sku: 'sku', name: 'Product', price: 300, quantity: 1 }] } as Order;
    trackPurchase(order); assert.equal(browser.dataLayer.length, 2);
    order.paymentStatus = 'paid'; trackPurchase(order); trackPurchase(order);
    assert.equal(browser.dataLayer.length, 4);
    assert.equal((browser.dataLayer[3] as any).ecommerce.value, 290);
    const serialized = JSON.stringify(browser.dataLayer);
    assert.equal(serialized.includes('private'), false);
    assert.equal(serialized.includes('costPrice'), false);
    setAnalyticsConsent(false); trackCommerce('view_cart', []);
    assert.equal(browser.dataLayer.length, 4);
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow); else Reflect.deleteProperty(globalThis, 'window');
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage); else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
