import type { CartItem, Product, Order } from '../types';
type CommerceEvent = 'view_item' | 'view_item_list' | 'select_item' | 'add_to_cart' | 'remove_from_cart' | 'view_cart' | 'begin_checkout' | 'add_payment_info' | 'purchase';
const consentKey = 'glowwithsh_analytics_consent';
export const GOOGLE_ANALYTICS_ID = 'G-TZB3393QK0';
type AnalyticsWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
export function getAnalyticsConsent(): string | null {
  try { return localStorage.getItem(consentKey); } catch { return null; }
}
export function initializeGoogleAnalytics() {
  if (typeof document === 'undefined' || getAnalyticsConsent() !== 'granted') return;
  const target = window as AnalyticsWindow;
  if (target.gtag) return;
  target.dataLayer ||= [];
  target.gtag = function () { target.dataLayer!.push(arguments); };
  target.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  target.gtag('js', new Date());
  target.gtag('config', GOOGLE_ANALYTICS_ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: window.location.origin + window.location.pathname, page_referrer: '' });
  const script = document.createElement('script');
  script.id = 'glowwithsh-google-tag'; script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
  document.head.appendChild(script);
}
export function trackPageView() {
  if (typeof window === 'undefined' || getAnalyticsConsent() !== 'granted') return;
  const pathname = window.location.pathname;
  if (/^\/(admin|admin-login|checkout|order-confirmation|track-order|quiz)(\/|$)/.test(pathname)) return;
  initializeGoogleAnalytics();
  (window as AnalyticsWindow).gtag?.('event', 'page_view', { page_location: window.location.origin + pathname, page_referrer: '' });
}
export function setAnalyticsConsent(granted: boolean) {
  try { localStorage.setItem(consentKey, granted ? 'granted' : 'denied'); } catch {}
  if (typeof window !== 'undefined') {
    (window as AnalyticsWindow).gtag?.('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    (window as unknown as Record<string, unknown>)[`ga-disable-${GOOGLE_ANALYTICS_ID}`] = !granted;
  }
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
    const target = window as AnalyticsWindow;
    if (target.gtag) {
      target.gtag('event', event, { currency: 'INR', items, ...(value !== undefined ? { value } : {}), ...(transactionId ? { transaction_id: transactionId } : {}) });
      return;
    }
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
