import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  checkLoginRateLimit,
  recordLoginFailure,
  clearLoginFailures,
  getAuthSecret,
} from '../server/security';
import crypto from 'crypto';

describe('PHASE 2: Admin Authentication & Security Suite', () => {
  const mockAdmin = {
    id: 'admin-uuid-1',
    email: 'admin@glowwithsh.com',
    name: 'Master Formulator',
    role: 'superadmin',
  };

  test('Password hashing produces secure scrypt hash and verifies correctly', () => {
    const rawPass = 'SuperSecurePass!2026';
    const hash = hashPassword(rawPass);

    assert.ok(hash.startsWith('scrypt$'), 'Hash must use scrypt$ format');
    assert.equal(hash.split('$').length, 6, 'Hash must contain scrypt, N, r, p, salt, and key');
    assert.equal(verifyPassword(rawPass, hash), true, 'Valid password must verify');
    assert.equal(verifyPassword('WrongPassword123', hash), false, 'Wrong password must fail');
    assert.equal(verifyPassword('', hash), false, 'Empty password must fail');
  });

  test('Session tokens are cryptographically signed with HMAC-SHA256 and verified', () => {
    const tokenVersion = 1;
    const token = createSessionToken(mockAdmin, tokenVersion);

    assert.ok(token, 'Session token must be generated');
    const verified = verifySessionToken(token, tokenVersion);
    assert.ok(verified, 'Valid token must be successfully verified');
    assert.equal(verified?.sub, mockAdmin.id);
    assert.equal(verified?.role, mockAdmin.role);
  });

  test('Fake or substring tokens (e.g. "token", "jwt_glowwithsh_...") are strictly rejected', () => {
    const tokenVersion = 1;

    // Legacy vulnerable bypass attempts
    const forgedTokens = [
      'token',
      'Bearer token',
      'jwt_glowwithsh_',
      'jwt_glowwithsh_admin',
      'admin',
      'Bearer jwt_glowwithsh_secret',
      'eyJhbGciOiJIUzI1NiJ9.e30.fake_signature',
    ];

    for (const forged of forgedTokens) {
      const result = verifySessionToken(forged, tokenVersion);
      assert.equal(result, null, `Forged token "${forged}" must be rejected`);
    }
  });

  test('Altered or tampered session token signature is rejected', () => {
    const token = createSessionToken(mockAdmin, 1);
    const parts = token.split('.');
    assert.equal(parts.length, 2, 'Token must have payload and signature');

    // Tamper with payload
    const tamperedPayload = Buffer.from(
      JSON.stringify({ sub: 'admin-uuid-1', role: 'superadmin', iat: 100, exp: 9999999999, ver: 1 })
    ).toString('base64url');
    const tamperedToken1 = `${tamperedPayload}.${parts[1]}`;
    assert.equal(verifySessionToken(tamperedToken1, 1), null, 'Tampered payload must be rejected');

    // Tamper with signature
    const tamperedToken2 = `${parts[0]}.invalid_signature_${parts[1].slice(10)}`;
    assert.equal(verifySessionToken(tamperedToken2, 1), null, 'Tampered signature must be rejected');
  });

  test('Expired session token is rejected', () => {
    // Generate manually crafted token with exp in the past
    const now = Math.floor(Date.now() / 1000);
    const expiredPayload = Buffer.from(
      JSON.stringify({
        sub: mockAdmin.id,
        role: mockAdmin.role,
        iat: now - 7200,
        exp: now - 3600, // Expired 1 hour ago
        ver: 1,
      })
    ).toString('base64url');

    const signature = Buffer.from(
      crypto.createHmac('sha256', getAuthSecret()).update(expiredPayload).digest()
    ).toString('base64url');

    const expiredToken = `${expiredPayload}.${signature}`;
    const result = verifySessionToken(expiredToken, 1);
    assert.equal(result, null, 'Expired session token must be rejected');
  });

  test('Password change invalidates existing sessions by bumping tokenVersion', () => {
    const currentVersion = 1;
    const token = createSessionToken(mockAdmin, currentVersion);

    // Verify token works with version 1
    assert.ok(verifySessionToken(token, currentVersion));

    // Admin changes password -> tokenVersion bumped to 2
    const bumpedVersion = 2;
    const resultAfterPasswordChange = verifySessionToken(token, bumpedVersion);
    assert.equal(resultAfterPasswordChange, null, 'Old session token must be invalid after tokenVersion bump');
  });

  test('Brute force rate limiting locks out attacker after 5 failed login attempts', () => {
    const mockReq = { ip: '198.51.100.42', socket: { remoteAddress: '198.51.100.42' } } as any;
    const username = 'admin';

    clearLoginFailures(mockReq, username);

    // Initial check should pass
    const initialCheck = checkLoginRateLimit(mockReq, username);
    assert.equal(initialCheck.allowed, true);

    // Record 4 failures -> still allowed
    for (let i = 0; i < 4; i++) {
      recordLoginFailure(mockReq, username);
    }
    const check4 = checkLoginRateLimit(mockReq, username);
    assert.equal(check4.allowed, true);

    // Record 5th failure -> lockout triggered
    recordLoginFailure(mockReq, username);
    const lockedCheck = checkLoginRateLimit(mockReq, username);
    assert.equal(lockedCheck.allowed, false, '5 failed attempts must lock out the account/IP');
    assert.ok((lockedCheck.retryAfterSeconds ?? 0) > 0, 'Retry after seconds must be provided');

    // Clear after legitimate resolution
    clearLoginFailures(mockReq, username);
    const resetCheck = checkLoginRateLimit(mockReq, username);
    assert.equal(resetCheck.allowed, true, 'Failures cleared upon valid resolution');
  });
});
