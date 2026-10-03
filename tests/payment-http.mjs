import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'glow-payment-'));
const secret = crypto.randomBytes(32).toString('hex');
let gatewayOrders = 0, refunds = 0, payment;
const gateway = http.createServer(async (req, res) => {
  let raw = ''; for await (const chunk of req) raw += chunk;
  res.setHeader('Content-Type', 'application/json');
  const body = raw ? JSON.parse(raw) : {};
  if (req.url === '/orders') { gatewayOrders++; res.end(JSON.stringify({ id: `order_fixture_${gatewayOrders}`, amount: body.amount, currency: 'INR', status: 'created' })); }
  else if (req.url.endsWith('/refund')) { refunds++; res.end(JSON.stringify({ id: `refund_fixture_${refunds}`, amount: body.amount, status: 'processed' })); }
  else res.end(JSON.stringify(payment));
});
await new Promise(resolve => gateway.listen(5201, '127.0.0.1', resolve));
const env = { ...process.env, NODE_ENV: 'production', PORT: '5200', ADMIN_SAME_ORIGIN: 'true', PREVIEW_MODE: 'false', ONLINE_PAYMENTS_ENABLED: 'true', SITE_GSTIN: '', ADMIN_AUTH_SECRET: secret, ADMIN_USERNAME: 'fixture_admin', ADMIN_PASSWORD: secret, DATA_DIR: path.join(directory, 'data'), UPLOADS_DIR: path.join(directory, 'uploads'), DB_DRIVER: 'json', RAZORPAY_MODE: 'live', RAZORPAY_KEY_ID: 'rzp_live_fixture', RAZORPAY_KEY_SECRET: secret, RAZORPAY_WEBHOOK_SECRET: secret, RAZORPAY_API_BASE: 'http://127.0.0.1:5201' };
const child = spawn(process.execPath, ['dist/server.cjs'], { env, stdio: 'pipe' });
let cookie = '', checks = 0;
const check = (value, label) => { assert.ok(value, label); checks++; };
async function call(route, body) {
  const response = await fetch(`http://127.0.0.1:5200${route}`, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: body ? JSON.stringify(body) : undefined });
  return { status: response.status, data: await response.json(), response };
}
try {
  let ready = false;
  for (let i = 0; i < 80; i++) { try { ready = (await call('/api/health')).status === 200; if (ready) break; } catch {} await new Promise(resolve => setTimeout(resolve, 100)); }
  check(ready, 'fixture server started');
  const product = (await call('/api/products')).data.products.find(item => item.price < 1000 && item.stockQuantity > 4);
  const order = (await call('/api/orders', { customer: { name: 'Payment Fixture', phone: '9876543210', address: '123 Test Street', city: 'Delhi', state: 'Delhi', pincode: '110001' }, items: [{ productId: product.id, quantity: 1 }], paymentMethod: 'online_ready' })).data.order;
  const intent = await call('/api/payments/create-intent', { orderId: order.id, phone: order.phone });
  check(intent.status === 200, 'intent created through actual route');
  check((await call('/api/payments/create-intent', { orderId: order.id, phone: order.phone })).data.orderId === intent.data.orderId && gatewayOrders === 1, 'intent reuse makes one gateway request');
  const paymentId = 'pay_fixture_1';
  const signature = crypto.createHmac('sha256', secret).update(`${intent.data.orderId}|${paymentId}`).digest('hex');
  const verify = { orderId: order.id, phone: order.phone, razorpay_order_id: intent.data.orderId, razorpay_payment_id: paymentId, razorpay_signature: signature };
  const valid = { id: paymentId, order_id: intent.data.orderId, amount: intent.data.amount, currency: 'INR', status: 'captured', captured: true };
  for (const invalid of [{ amount: 0 }, { currency: 'USD' }, { order_id: 'other_order' }, { status: 'authorized', captured: false }]) {
    payment = { ...valid, ...invalid };
    check((await call('/api/payments/verify', verify)).status === 400, `gateway mismatch denied: ${JSON.stringify(invalid)}`);
  }
  payment = valid;
  check((await call('/api/payments/verify', verify)).data.verified, 'captured exact payment verified');
  check((await call('/api/payments/verify', verify)).data.alreadyPaid, 'duplicate verification idempotent');
  const webhook = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { ...valid, notes: { order_id: order.id } } } } });
  const webhookCall = () => fetch('http://127.0.0.1:5200/api/webhooks/payment', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': crypto.createHmac('sha256', secret).update(webhook).digest('hex') }, body: webhook }).then(response => response.json());
  check((await webhookCall()).status === 'processed', 'signed raw webhook processed');
  check((await webhookCall()).status === 'already_processed', 'webhook raw-hash replay idempotent');
  const recoveryOrder = (await call('/api/orders', { customer: { name: 'Recovery Fixture', phone: '9876543211', address: '123 Test Street', city: 'Delhi', state: 'Delhi', pincode: '110001' }, items: [{ productId: product.id, quantity: 1 }], paymentMethod: 'online_ready' })).data.order;
  const recoveryIntent = await call('/api/payments/create-intent', { orderId: recoveryOrder.id, phone: recoveryOrder.phone });
  const recoveryWebhook = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { ...valid, id: 'pay_fixture_2', order_id: recoveryIntent.data.orderId, amount: recoveryIntent.data.amount, notes: { order_id: recoveryOrder.id } } } } });
  const recoveryResponse = await fetch('http://127.0.0.1:5200/api/webhooks/payment', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': crypto.createHmac('sha256', secret).update(recoveryWebhook).digest('hex') }, body: recoveryWebhook });
  check(recoveryResponse.status === 200 && (await call(`/api/orders/lookup/${recoveryOrder.id}?phone=${recoveryOrder.phone}`)).data.order.paymentStatus === 'paid', 'captured webhook recovers order without browser verification');
  const login = await call('/api/admin/auth/login', { username: env.ADMIN_USERNAME, password: env.ADMIN_PASSWORD });
  cookie = login.response.headers.get('set-cookie').split(';')[0];
  check((await call(`/api/admin/orders/${order.id}/refund`, { amount: 1 })).status === 400 && refunds === 0, 'partial refund denied before gateway');
  check((await call(`/api/admin/orders/${order.id}/refund`, {})).data.order.paymentStatus === 'refunded', 'full processed refund committed');
  check((await call(`/api/admin/orders/${order.id}/refund`, {})).status === 400 && refunds === 1, 'duplicate refund sends no second gateway request');
  console.log(`Payment HTTP fixture passed: ${checks} assertions. Local fake gateway only; no real Razorpay transaction.`);
} finally {
  const exited = new Promise(resolve => child.once('exit', resolve)); child.kill(); await exited;
  await new Promise(resolve => gateway.close(resolve)); fs.rmSync(directory, { recursive: true, force: true });
}
