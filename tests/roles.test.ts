import test from 'node:test';
import assert from 'node:assert/strict';
import { adminRoleAllows } from '../server/security';
test('server role permissions prevent content/support roles from refunding or changing credentials', () => {
  assert.equal(adminRoleAllows('Super Admin', '/api/admin/orders/o/refund', 'POST'), true);
  assert.equal(adminRoleAllows('Manager', '/api/admin/reset-database', 'POST'), false);
  assert.equal(adminRoleAllows('Editor', '/api/admin/products/p', 'PATCH'), true);
  assert.equal(adminRoleAllows('Editor', '/api/admin/orders/o/refund', 'POST'), false);
  assert.equal(adminRoleAllows('Support', '/api/admin/orders', 'GET'), true);
  assert.equal(adminRoleAllows('Support', '/api/admin/orders/o', 'PATCH'), false);
  assert.equal(adminRoleAllows('Support', '/api/admin/auth/change-password', 'POST'), false);
  assert.equal(adminRoleAllows('unknown', '/api/admin/products', 'GET'), false);
});
