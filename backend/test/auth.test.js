import test from 'node:test';
import assert from 'node:assert/strict';
import { generateToken, verifyToken, requireAuth } from '../src/middleware/auth.js';

test('Auth Middleware: generateToken and verifyToken', async (t) => {
  await t.test('generates a valid signed JWT and successfully decodes it', () => {
    const payload = { id: 'doc_123', name: 'Dr. Jane Doe', role: 'DOCTOR' };
    const token = generateToken(payload);
    assert.ok(typeof token === 'string', 'Token should be a string');
    assert.equal(token.split('.').length, 3, 'Token should have 3 segments');

    const decoded = verifyToken(token);
    assert.ok(decoded, 'Decoded payload should be truthy');
    assert.equal(decoded.id, payload.id);
    assert.equal(decoded.role, payload.role);
    assert.ok(decoded.exp > Math.floor(Date.now() / 1000), 'Expiration should be in the future');
  });

  await t.test('rejects tampered or malformed tokens', () => {
    const payload = { id: 'doc_123', role: 'DOCTOR' };
    const token = generateToken(payload);
    const tampered = token.slice(0, -5) + 'xxxxx';

    const decoded = verifyToken(tampered);
    assert.equal(decoded, null, 'Tampered token must return null');

    assert.equal(verifyToken('not-a-token'), null);
    assert.equal(verifyToken(''), null);
    assert.equal(verifyToken(null), null);
  });

  await t.test('rejects expired tokens', () => {
    // Generate token that expired 10 seconds ago
    const expiredToken = generateToken({ id: 'doc_old', role: 'DOCTOR' }, -10);
    const decoded = verifyToken(expiredToken);
    assert.equal(decoded, null, 'Expired token must return null');
  });

  await t.test('supports built-in test tokens for admin and doctor', () => {
    const adminSession = verifyToken('test-admin-token');
    assert.ok(adminSession);
    assert.equal(adminSession.role, 'ADMIN');

    const doctorSession = verifyToken('test-doctor-token');
    assert.ok(doctorSession);
    assert.equal(doctorSession.role, 'DOCTOR');
  });
});

test('Auth Middleware: requireAuth route guard', async (t) => {
  await t.test('rejects requests without Authorization header with 401', () => {
    const middleware = requireAuth(['DOCTOR', 'ADMIN']);
    const req = { headers: {} };
    let statusCalledWith = 0;
    let jsonCalledWith = null;
    let nextCalled = false;

    const res = {
      status(code) {
        statusCalledWith = code;
        return {
          json(data) {
            jsonCalledWith = data;
          }
        };
      }
    };

    middleware(req, res, () => { nextCalled = true; });

    assert.equal(statusCalledWith, 401);
    assert.equal(jsonCalledWith.success, false);
    assert.equal(nextCalled, false, 'next() should NOT be called on missing auth');
  });

  await t.test('rejects unauthorized roles with 403 Forbidden', () => {
    const middleware = requireAuth(['ADMIN']);
    const doctorToken = generateToken({ id: 'doc_1', role: 'DOCTOR' });
    const req = { headers: { authorization: `Bearer ${doctorToken}` } };
    let statusCalledWith = 0;
    let jsonCalledWith = null;
    let nextCalled = false;

    const res = {
      status(code) {
        statusCalledWith = code;
        return {
          json(data) {
            jsonCalledWith = data;
          }
        };
      }
    };

    middleware(req, res, () => { nextCalled = true; });

    assert.equal(statusCalledWith, 403);
    assert.equal(jsonCalledWith.success, false);
    assert.equal(nextCalled, false, 'next() should NOT be called on insufficient role');
  });

  await t.test('allows authorized requests and attaches req.user', () => {
    const middleware = requireAuth(['ADMIN']);
    const adminToken = generateToken({ id: 'admin_1', name: 'Admin Root', role: 'ADMIN' });
    const req = { headers: { authorization: `Bearer ${adminToken}` } };
    let nextCalled = false;
    const res = {};

    middleware(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true, 'next() should be called');
    assert.ok(req.user);
    assert.equal(req.user.role, 'ADMIN');
    assert.equal(req.user.id, 'admin_1');
  });
});
