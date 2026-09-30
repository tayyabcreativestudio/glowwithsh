// Demonstrates live security endpoints against running server on http://localhost:5173
const BASE = process.env.TEST_SERVER_URL || 'http://localhost:5173';

async function runDemo() {
  console.log('================================================================');
  console.log('PHASE 23: LIVE CRITICAL ENDPOINT SECURITY DEMONSTRATION');
  console.log(`Target: ${BASE}`);
  console.log('================================================================\n');

  const cases = [
    {
      name: 'Test 1: Health Check and Hardened HTTP Security Headers',
      url: `${BASE}/api/health`,
      method: 'GET',
      headers: {},
      body: null,
      expectedStatus: 200,
      validate: (res, body, headers) => {
        const nosniff = headers.get('x-content-type-options') === 'nosniff';
        const csp = !!headers.get('content-security-policy');
        return res.status === 200 && nosniff && csp && body.status === 'ok';
      },
    },
    {
      name: 'Test 2: Legacy "token" substring bypass in Authorization header',
      url: `${BASE}/api/admin/orders`,
      method: 'GET',
      headers: { Authorization: 'Bearer token' },
      body: null,
      expectedStatus: 401,
      validate: (res, body) => res.status === 401 && body.success === false,
    },
    {
      name: 'Test 3: Legacy "jwt_glowwithsh_" prefix bypass attempt',
      url: `${BASE}/api/admin/orders`,
      method: 'GET',
      headers: { Authorization: 'Bearer jwt_glowwithsh_fake_attacker_token' },
      body: null,
      expectedStatus: 401,
      validate: (res, body) => res.status === 401 && body.success === false,
    },
    {
      name: 'Test 4: Forged payment verification with fake signature',
      url: `${BASE}/api/payments/verify`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'ORD-UNKNOWN-999',
        razorpay_order_id: 'order_FAKE123',
        razorpay_payment_id: 'pay_ATTACKER_999',
        razorpay_signature: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      }),
      expectedStatus: 404, // Order not found, or 400 invalid signature
      validate: (res, body) => (res.status === 404 || res.status === 400) && body.success === false,
    },
    {
      name: 'Test 5: Order creation ignores client price tampering',
      url: `${BASE}/api/orders`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          name: 'Security Tester',
          phone: `987${Math.floor(1000000 + Math.random() * 9000000)}`,
          address: 'E Block street no 08, Subhash Vihar',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110053',
        },
        items: [{ productId: 'prod-1', quantity: 1 }],
        paymentMethod: 'cod',
        price: 1, // Tampered client price (1 rupee)
        grandTotal: 1, // Tampered client grand total
        deliveryFee: 0,
      }),
      expectedStatus: 201,
      validate: (res, body) => {
        // Price of Golden facewash is 300. With 99 shipping (since < 999):
        // Grand total must be 399, ignoring client tampered 1 rupee!
        const grandTotal = body.order?.grandTotal;
        const subtotal = body.order?.subtotal;
        return res.status === 201 && grandTotal === 399 && subtotal === 300;
      },
    },
    {
      name: 'Test 6: Order tracking lookup without identity proof (phone/email)',
      url: `${BASE}/api/orders/track?orderId=ORD-FAKE-ENUMERATION`,
      method: 'GET',
      headers: {},
      body: null,
      expectedStatus: 400,
      validate: (res, body) => res.status === 400 && body.success === false,
    },
  ];

  let passedAll = true;

  for (const c of cases) {
    console.log(`----------------------------------------------------------------`);
    console.log(`REQUEST: ${c.method} ${c.url}`);
    if (Object.keys(c.headers).length > 0) {
      console.log(`Headers: ${JSON.stringify(c.headers)}`);
    }
    if (c.body) {
      console.log(`Payload: ${c.body}`);
    }

    try {
      const res = await fetch(c.url, {
        method: c.method,
        headers: c.headers,
        body: c.body,
      });

      const text = await res.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }

      console.log(`RESPONSE STATUS: ${res.status} ${res.statusText}`);
      console.log(`RESPONSE BODY: ${typeof body === 'object' ? JSON.stringify(body, null, 2) : body}`);
      console.log(`EXPECTED RESULT: Status ${c.expectedStatus}, security assertions satisfied`);

      const passed = c.validate(res, body, res.headers);
      if (passed) {
        console.log(`RESULT: [ PASS ] — ${c.name}\n`);
      } else {
        console.log(`RESULT: [ FAIL ] — ${c.name}\n`);
        passedAll = false;
      }
    } catch (err) {
      console.error(`ERROR running test "${c.name}":`, err.message);
      passedAll = false;
    }
  }

  console.log('================================================================');
  if (passedAll) {
    console.log('ALL LIVE SECURITY DEMONSTRATION TESTS PASSED CLEANLY (6/6)');
  } else {
    console.log('SOME DEMONSTRATION TESTS FAILED');
  }
  console.log('================================================================');
}

runDemo().catch(console.error);
