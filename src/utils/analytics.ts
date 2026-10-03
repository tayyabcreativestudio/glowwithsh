import type { CartItem, Product, Order } from '../types';
type CommerceEvent = 'view_item' | 'view_item_list' | 'select_item' | 'add_to_cart' | 'remove_from_cart' | 'view_cart' | 'begin_checkout' | 'add_payment_info' | 'purchase';
const consentKey = 'glowwithsh_analytics_consent';
export function setAnalyticsConsent(granted: boolean) {
  try { localStorage.setItem(consentKey, granted ? 'granted' : 'denied'); } catch {}
}
export function analyticsItem(product: Product, quantity = 1) {
  return { item_id: product.sku || product.id, item_name: product.name, item_category: product.categoryName, price: product.price, quantity };
}
export function trackCommerce(event: CommerceEvent, items: ReturnType<typeof analyticsItem>[], value?: number, transactionId?: string) {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem(consentKey) !== 'granted') return;
    if (event === 'purchase' && transactionId) {
      const key = `glowwithsh_measured_order_${transactionId}`;
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
    }
    const target = window as Window & { dataLayer?: unknown[] };
    target.dataLayer ||= [];
    target.dataLayer.push({ ecommerce: null });
    target.dataLayer.push({ event, ecommerce: { currency: 'INR', items, ...(value !== undefined ? { value } : {}), ...(transactionId ? { transaction_id: transactionId } : {}) } });
  } catch { /* Measurement never interrupts checkout. */ }
}
export const trackCart = (event: CommerceEvent, items: CartItem[]) => trackCommerce(event, items.map(item => analyticsItem(item.product, item.quantity)), items.reduce((sum, item) => sum + item.product.price * item.quantity, 0));
export function trackPurchase(order: Order) {
  // A WhatsApp enquiry or unverified online intent is not a completed purchase.
  if (order.paymentStatus !== 'paid' && order.paymentMethod !== 'cod') return;
  trackCommerce('purchase', order.items.map(item => ({ item_id: item.sku || item.productId, item_name: item.name, item_category: '', price: item.price, quantity: item.quantity })), Math.max(0, order.subtotal - order.discount), order.id);
}
