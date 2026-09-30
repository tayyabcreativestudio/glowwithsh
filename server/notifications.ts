import { Order } from '../src/types';
import { getDatabase, withDatabaseLock } from './db';

type EmailResult = { status: 'sent'; providerId?: string } | { status: 'failed'; error: string } | { status: 'skipped' };

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character] || character));

async function deliverOrderConfirmation(order: Order): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.ORDER_EMAIL_FROM?.trim();
  if (!order.email || !apiKey || !from) return { status: 'skipped' };

  const items = order.items.map((item) => `<li>${escapeHtml(item.name)} × ${item.quantity} — ₹${item.price * item.quantity}</li>`).join('');
  const name = escapeHtml(order.customerName);
  const id = escapeHtml(order.id);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `order-confirmation/${order.id}` },
      body: JSON.stringify({
        from,
        to: [order.email],
        subject: `Thank you for your GlowWithSH order ${order.id}`,
        text: `Dear ${order.customerName}, thank you for shopping with GlowWithSH. Your order ID is ${order.id}. Order total: ₹${order.grandTotal}. We will keep you updated as your order progresses.`,
        html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#2b211d;line-height:1.6"><h2>Thank you, ${name}.</h2><p>Your GlowWithSH order has been received.</p><p><strong>Order ID:</strong> ${id}<br><strong>Order total:</strong> ₹${order.grandTotal}</p><h3>Your ritual</h3><ul>${items}</ul><p>We will keep you updated as your order progresses.</p><p>With care,<br>GlowWithSH</p></body></html>`,
      }),
    });
    const payload = await response.json().catch(() => ({})) as { id?: string; message?: string };
    if (!response.ok) return { status: 'failed', error: payload.message || `Email provider returned ${response.status}` };
    return { status: 'sent', providerId: payload.id };
  } catch {
    return { status: 'failed', error: 'Email provider could not be reached' };
  }
}

/** Sends after the order is saved; a delivery failure never cancels an order. */
export function queueOrderConfirmationEmail(orderId: string): void {
  void (async () => {
    const order = getDatabase().orders.find((item) => item.id === orderId);
    if (!order || order.orderConfirmationEmail?.status === 'sent') return;
    const result = await deliverOrderConfirmation(order);
    await withDatabaseLock((db) => {
      const current = db.orders.find((item) => item.id === orderId);
      if (!current || current.orderConfirmationEmail?.status === 'sent') return;
      current.orderConfirmationEmail = { status: result.status, attemptedAt: new Date().toISOString(), ...(result.status === 'sent' && result.providerId ? { providerId: result.providerId } : {}), ...(result.status === 'failed' ? { error: result.error } : {}) };
      current.updatedAt = new Date().toISOString();
    });
  })().catch((error) => console.error('Order confirmation email failed:', error));
}
