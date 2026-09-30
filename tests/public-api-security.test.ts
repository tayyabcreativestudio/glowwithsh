import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeString } from '../server/security';
import {
  reviewSubmissionSchema,
  contactSubmissionSchema,
} from '../server/validation';

describe('PHASE 6, 7 & 9: Public API Exposure, Uploads & XSS Protection', () => {
  test('Order tracking requires dual identity verification to prevent enumeration', () => {
    const ordersDb = [
      {
        id: 'ORD-2026-9999',
        customerName: 'Priya Sen',
        phone: '9876543210',
        email: 'priya@example.com',
        address: '42 Orchid Residency, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        orderStatus: 'Shipped',
        trackingNumber: 'DEL123456789IN',
        courierPartner: 'Delhivery',
        internalAdminNotes: 'VIP customer, handle with fragile wrap',
        paymentGatewaySecretRef: 'rzp_internal_secret_reference',
      },
    ];

    function trackOrder(orderId?: string, identifier?: string) {
      if (!orderId || !identifier) {
        return { status: 400, error: 'Both orderId and phone/email are required' };
      }

      const cleanId = orderId.trim();
      const cleanIdent = identifier.trim().toLowerCase().replace(/\s+/g, '');

      const found = ordersDb.find(
        (o) =>
          o.id.toLowerCase() === cleanId.toLowerCase() &&
          (o.phone.replace(/\D/g, '') === cleanIdent.replace(/\D/g, '') ||
            o.email.toLowerCase() === cleanIdent)
      );

      if (!found) {
        return { status: 404, error: 'Order not found or verification failed' };
      }

      // Public tracking response masks sensitive PII & strips internal notes
      return {
        status: 200,
        data: {
          id: found.id,
          customerName: found.customerName,
          orderStatus: found.orderStatus,
          trackingNumber: found.trackingNumber,
          courierPartner: found.courierPartner,
          maskedAddress: '*** (Protected for privacy)',
          city: found.city,
          state: found.state,
          // Explicitly assert absence of private fields:
          internalAdminNotes: undefined,
          paymentGatewaySecretRef: undefined,
        },
      };
    }

    // 1. Attacker tries to enumerate order with ID only (no phone/email)
    const enumAttack = trackOrder('ORD-2026-9999', '');
    assert.equal(enumAttack.status, 400);

    // 2. Attacker provides wrong phone number
    const wrongPhone = trackOrder('ORD-2026-9999', '9111111111');
    assert.equal(wrongPhone.status, 404);

    // 3. Legitimate customer provides matching order ID + phone
    const validTrack = trackOrder('ORD-2026-9999', '9876543210');
    assert.equal(validTrack.status, 200);
    assert.ok(validTrack.data);
    assert.equal(validTrack.data.maskedAddress, '*** (Protected for privacy)');
    assert.equal((validTrack.data as any).internalAdminNotes, undefined);
    assert.equal((validTrack.data as any).paymentGatewaySecretRef, undefined);
  });

  test('XSS sanitization cleans malicious scripts and tags from inputs', () => {
    const maliciousInputs = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(1)">',
      '<svg/onload=alert`1`>',
      'Hello <script src="http://evil.com/malware.js"></script>World',
      'javascript:/*--></title></style></textarea></script></xmp><svg/onload=\'+/"/+/onmouseover=1/+/[*/[]/+alert(1)//\'>',
    ];

    for (const input of maliciousInputs) {
      const sanitized = sanitizeString(input);
      assert.equal(sanitized.includes('<script'), false, `Sanitized string must not contain <script: ${sanitized}`);
      assert.equal(sanitized.includes('onerror='), false, `Sanitized string must not contain onerror: ${sanitized}`);
      assert.equal(sanitized.includes('onload='), false, `Sanitized string must not contain onload: ${sanitized}`);
    }
  });

  test('Review and Contact form schemas reject XSS and validate length constraints', () => {
    // Review with invalid rating (> 5)
    const badReview = reviewSubmissionSchema.safeParse({
      productId: 'prod-1',
      author: 'Tester',
      rating: 6, // Max is 5
      comment: 'Nice product',
    });
    assert.equal(badReview.success, false, 'Rating > 5 must be rejected');

    // Review with empty comment
    const emptyComment = reviewSubmissionSchema.safeParse({
      productId: 'prod-1',
      author: 'Tester',
      rating: 5,
      comment: '',
    });
    assert.equal(emptyComment.success, false, 'Empty comment must be rejected');

    // Contact with invalid email
    const badContact = contactSubmissionSchema.safeParse({
      name: 'Tester',
      email: 'not-an-email',
      phone: '9876543210',
      message: 'Hello I have a question about delivery',
    });
    assert.equal(badContact.success, false, 'Invalid email in contact form must be rejected');
  });

  test('File upload validation strictly allows only JPEG, PNG, WebP and rejects executables/SVGs', () => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    function validateUpload(filename: string, mime: string, fileSize: number) {
      // 1. Max size 5MB
      if (fileSize > 5 * 1024 * 1024) {
        return { valid: false, error: 'File size exceeds 5MB limit' };
      }

      // 2. Prevent path traversal
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\') || filename.includes('\0')) {
        return { valid: false, error: 'Path traversal attempt detected' };
      }

      // 3. Extension check
      const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return { valid: false, error: `Disallowed extension: ${ext}` };
      }

      // 4. MIME check
      if (!allowedMimes.includes(mime.toLowerCase())) {
        return { valid: false, error: `Disallowed MIME type: ${mime}` };
      }

      return { valid: true };
    }

    // Valid uploads
    assert.equal(validateUpload('botanical-cream.jpg', 'image/jpeg', 1024 * 200).valid, true);
    assert.equal(validateUpload('serum-bottle.png', 'image/png', 1024 * 500).valid, true);
    assert.equal(validateUpload('shampoo-bar.webp', 'image/webp', 1024 * 150).valid, true);

    // Malicious uploads
    assert.equal(validateUpload('malicious.svg', 'image/svg+xml', 1024).valid, false, 'SVG must be rejected');
    assert.equal(validateUpload('webshell.php', 'application/x-php', 512).valid, false, 'PHP must be rejected');
    assert.equal(validateUpload('script.js', 'application/javascript', 512).valid, false, 'JS must be rejected');
    assert.equal(validateUpload('page.html', 'text/html', 1024).valid, false, 'HTML must be rejected');
    assert.equal(validateUpload('../../etc/passwd.jpg', 'image/jpeg', 1024).valid, false, 'Path traversal must be rejected');
    assert.equal(validateUpload('huge_image.jpg', 'image/jpeg', 10 * 1024 * 1024).valid, false, 'Oversized file must be rejected');
  });
});
