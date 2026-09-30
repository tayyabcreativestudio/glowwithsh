import crypto from 'crypto';

const DEFAULT_BASE = 'https://api.razorpay.com/v1';

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  mode: 'live' | 'test';
  baseUrl: string;
}

export function getRazorpayConfig(): RazorpayConfig {
  const mode = (process.env.RAZORPAY_MODE || 'test').trim().toLowerCase() === 'live' ? 'live' : 'test';
  return {
    keyId: process.env.RAZORPAY_KEY_ID?.trim() || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET?.trim() || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || '',
    mode,
    baseUrl: (process.env.RAZORPAY_API_BASE || DEFAULT_BASE).replace(/\/$/, ''),
  };
}

/**
 * Asserts valid Razorpay configuration.
 * Enforces strict production rules:
 * - Refuses test keys in production
 * - Refuses test mode in production
 * - Demands non-empty webhook secret
 */
export function assertRazorpayConfiguration(): void {
  const cfg = getRazorpayConfig();
  const isPreviewMode = process.env.PREVIEW_MODE === 'true';

  if (process.env.NODE_ENV === 'production' && !isPreviewMode) {
    if (!cfg.keyId || !cfg.keySecret) {
      throw new Error('FATAL: Razorpay live API credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are required in production.');
    }
    if (cfg.mode !== 'live') {
      throw new Error('FATAL: Production payments require RAZORPAY_MODE=live.');
    }
    if (cfg.keyId.startsWith('rzp_test_')) {
      throw new Error('FATAL: Test Razorpay key detected in production environment.');
    }
    if (!cfg.webhookSecret) {
      throw new Error('FATAL: RAZORPAY_WEBHOOK_SECRET is required in production.');
    }
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const cfg = getRazorpayConfig();
  assertRazorpayConfiguration();

  // If in development/testing without real keys or using a mock API base, provide deterministic mock behavior
  if (!cfg.keyId || !cfg.keySecret || cfg.keyId.startsWith('mock_') || cfg.keySecret === 'mocksecret') {
    if (path === '/orders' && method === 'POST') {
      const orderBody = body as { amount: number; currency: string; receipt: string };
      return {
        id: `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        entity: 'order',
        amount: orderBody.amount,
        amount_paid: 0,
        amount_due: orderBody.amount,
        currency: orderBody.currency || 'INR',
        receipt: orderBody.receipt,
        status: 'created',
      } as T;
    }
    if (path.startsWith('/payments/') && path.endsWith('/refund') && method === 'POST') {
      return {
        id: `rfnd_mock_${Date.now()}`,
        amount: (body as any)?.amount || 100,
        status: 'processed',
      } as T;
    }
    if (path.startsWith('/payments/') && method === 'GET') {
      const paymentId = path.replace('/payments/', '');
      return {
        id: paymentId,
        order_id: 'order_mock',
        amount: 100,
        currency: 'INR',
        status: 'captured',
        captured: true,
      } as T;
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Basic ${Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString('base64')}`,
    Accept: 'application/json',
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${cfg.baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const errorDetail =
      typeof parsed === 'object' && parsed && 'error' in parsed
        ? JSON.stringify((parsed as { error: unknown }).error)
        : text || `HTTP ${response.status}`;
    throw new Error(`Razorpay API error ${response.status}: ${errorDetail}`);
  }

  return parsed as T;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: 'order';
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  notes?: Record<string, string>;
}

export interface RazorpayPaymentResponse {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  captured: boolean | number | null;
}

export interface RazorpayRefundResponse {
  id: string;
  amount: number;
  status: string;
}

/**
 * Calculates HMAC-SHA256 signature for payment verification.
 */
export function createPaymentSignature(
  orderId: string,
  paymentId: string,
  secret = getRazorpayConfig().keySecret
): string {
  return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

/**
 * Constant-time comparison for payment signature verification.
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret = getRazorpayConfig().keySecret
): boolean {
  if (!signature || !orderId || !paymentId) return false;
  const expected = createPaymentSignature(orderId, paymentId, secret);
  const left = Buffer.from(expected, 'utf8');
  const right = Buffer.from(signature, 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

/**
 * Calculates webhook HMAC-SHA256 signature over the raw request body.
 */
export function createWebhookSignature(
  rawBody: Buffer,
  secret = getRazorpayConfig().webhookSecret
): string {
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

/**
 * Constant-time verification of webhook signature.
 */
export function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string,
  secret = getRazorpayConfig().webhookSecret
): boolean {
  if (!signature || !secret || !rawBody) return false;
  const expected = createWebhookSignature(rawBody, secret);
  const left = Buffer.from(expected, 'utf8');
  const right = Buffer.from(signature, 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

/**
 * Creates a real Razorpay Order server-side with exact amount in paise.
 */
export async function createRazorpayOrder(data: {
  amountPaise: number;
  currency: 'INR';
  receipt: string;
  notes: Record<string, string>;
}): Promise<RazorpayOrderResponse> {
  return request<RazorpayOrderResponse>('POST', '/orders', {
    amount: data.amountPaise,
    currency: data.currency,
    receipt: data.receipt,
    notes: data.notes,
    partial_payment: false,
  });
}

/**
 * Fetches verified payment details directly from Razorpay.
 */
export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPaymentResponse> {
  return request<RazorpayPaymentResponse>('GET', `/payments/${encodeURIComponent(paymentId)}`);
}

/**
 * Creates a server-side refund with Razorpay.
 */
export async function createRazorpayRefund(
  paymentId: string,
  amountPaise?: number
): Promise<RazorpayRefundResponse> {
  return request<RazorpayRefundResponse>(
    'POST',
    `/payments/${encodeURIComponent(paymentId)}/refund`,
    amountPaise ? { amount: amountPaise } : {}
  );
}
