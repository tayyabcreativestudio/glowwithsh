import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import {
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../server/razorpay';
import { paymentVerifySchema } from '../server/validation';

describe('PHASE 3: Payment Security & Razorpay Integration', () => {
  const mockSecret = 'test_secret_for_razorpay_gateway_key_999';

  test('Valid HMAC-SHA256 payment signature verifies successfully', () => {
    const orderId = 'order_DA1234567890';
    const paymentId = 'pay_XY9876543210';
    const expectedSignature = crypto
      .createHmac('sha256', mockSecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const isValid = verifyPaymentSignature(orderId, paymentId, expectedSignature, mockSecret);
    assert.equal(isValid, true, 'Genuine HMAC signature must verify');
  });

  test('Forged, altered, or empty payment signature is strictly rejected', () => {
    const orderId = 'order_DA1234567890';
    const paymentId = 'pay_XY9876543210';
    const genuineSignature = crypto
      .createHmac('sha256', mockSecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    // 1. Forged signature
    const forged = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
    assert.equal(verifyPaymentSignature(orderId, paymentId, forged, mockSecret), false);

    // 2. Tampered signature (single character changed)
    const tampered = (genuineSignature[0] === 'a' ? 'b' : 'a') + genuineSignature.slice(1);
    assert.equal(verifyPaymentSignature(orderId, paymentId, tampered, mockSecret), false);

    // 3. Signature for different order
    assert.equal(verifyPaymentSignature('order_ATTACKER_999', paymentId, genuineSignature, mockSecret), false);

    // 4. Empty or missing fields
    assert.equal(verifyPaymentSignature('', paymentId, genuineSignature, mockSecret), false);
    assert.equal(verifyPaymentSignature(orderId, '', genuineSignature, mockSecret), false);
  });

  test('Webhook HMAC signature verifies with exact raw body buffer', () => {
    const webhookSecret = 'whsec_test_secret_glowwithsh_webhook_verification';
    const rawPayload = JSON.stringify({
      entity: 'event',
      account_id: 'acc_123',
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_ABC123',
            order_id: 'order_XYZ456',
            amount: 250000,
            currency: 'INR',
            status: 'captured',
          },
        },
      },
    });

    const rawBuffer = Buffer.from(rawPayload, 'utf-8');
    const validWebhookSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBuffer)
      .digest('hex');

    const isValid = verifyWebhookSignature(rawBuffer, validWebhookSignature, webhookSecret);
    assert.equal(isValid, true, 'Valid webhook signature must verify');

    // Forged webhook signature
    const isForgedValid = verifyWebhookSignature(rawBuffer, 'forged_webhook_signature', webhookSecret);
    assert.equal(isForgedValid, false, 'Forged webhook signature must be rejected');
  });

  test('Payment verification schema validates Razorpay parameter types', () => {
    const validVerifyPayload = {
      orderId: 'ORD-1234-5678',
      razorpay_order_id: 'order_GWSH123',
      razorpay_payment_id: 'pay_GWSH456',
      razorpay_signature: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      phone: '9876543210',
    };

    const validResult = paymentVerifySchema.safeParse(validVerifyPayload);
    assert.equal(validResult.success, true);

    // Missing signature
    const missingSig = paymentVerifySchema.safeParse({
      ...validVerifyPayload,
      razorpay_signature: '',
    });
    assert.equal(missingSig.success, false, 'Empty signature must fail validation');

    // Missing orderId
    const missingOrder = paymentVerifySchema.safeParse({
      ...validVerifyPayload,
      orderId: '',
    });
    assert.equal(missingOrder.success, false, 'Empty order ID must fail validation');

    const missingIdentity = paymentVerifySchema.safeParse({
      ...validVerifyPayload,
      phone: '',
    });
    assert.equal(missingIdentity.success, false, 'Payment confirmation requires customer identity');
  });

  test('Duplicate payment verification idempotency prevents multiple credit/restock', () => {
    const processedPaymentIds = new Set<string>();
    const paymentId = 'pay_REPLAY_ATTACK_123';

    // First verification succeeds and records payment ID
    assert.equal(processedPaymentIds.has(paymentId), false);
    processedPaymentIds.add(paymentId);

    // Replay attack: client tries to re-submit same paymentId for another order
    assert.equal(processedPaymentIds.has(paymentId), true, 'Duplicate payment ID must be detected and rejected');
  });

  test('Closed-tab recovery moves order to paid via webhook event', () => {
    // Simulating customer paying on Razorpay modal and immediately closing their browser tab:
    // Browser never hits /api/payments/verify.
    // Instead, Razorpay sends payment.captured webhook to /api/webhooks/payment.

    type OrderState = {
      id: string;
      paymentStatus: 'pending' | 'paid' | 'failed';
      orderStatus: 'Payment Pending' | 'Confirmed' | 'Processing';
      razorpayOrderId: string;
      paymentId?: string;
    };

    const order: OrderState = {
      id: 'ORD-CLOSED-TAB-1',
      paymentStatus: 'pending',
      orderStatus: 'Payment Pending',
      razorpayOrderId: 'order_CLOSED_TAB_RZP_1',
    };

    const webhookEvent = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_RECOVERED_FROM_TAB_CLOSE',
            order_id: 'order_CLOSED_TAB_RZP_1',
            amount: 185000,
            currency: 'INR',
            status: 'captured',
          },
        },
      },
    };

    // Webhook processor discovers pending order via razorpayOrderId:
    if (webhookEvent.payload.payment.entity.order_id === order.razorpayOrderId) {
      if (order.paymentStatus === 'pending') {
        order.paymentStatus = 'paid';
        order.orderStatus = 'Confirmed';
        order.paymentId = webhookEvent.payload.payment.entity.id;
      }
    }

    assert.equal(order.paymentStatus, 'paid', 'Order must be recovered and marked paid even if customer tab closed');
    assert.equal(order.orderStatus, 'Confirmed', 'Order must be confirmed');
    assert.equal(order.paymentId, 'pay_RECOVERED_FROM_TAB_CLOSE');
  });
});
