import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSessionCookieOptions,
  createSessionToken,
  hashPassword,
  readSessionToken,
  verifyPassword,
} from './auth.js';

const secret = 'a-test-secret-that-is-long-enough-for-hmac';
const now = Date.UTC(2026, 9, 30);

test('session tokens can be created and verified', () => {
  const token = createSessionToken('user-123', secret, now);

  assert.deepEqual(readSessionToken(token, secret, now), {
    userId: 'user-123',
    expiresAt: Math.floor(now / 1000) + 7 * 24 * 60 * 60,
  });
});

test('session tokens reject tampering, wrong secrets, and expiration', () => {
  const token = createSessionToken('user-123', secret, now);
  const [payload, signature] = token.split('.');
  const tamperedPayload = Buffer.from(
    JSON.stringify({ sub: 'other-user', exp: Math.floor(now / 1000) + 3600 }),
  ).toString('base64url');

  assert.equal(readSessionToken(`${tamperedPayload}.${signature}`, secret, now), null);
  assert.equal(readSessionToken(token, `${secret}-wrong`, now), null);
  assert.equal(readSessionToken(token, secret, now + 8 * 24 * 60 * 60 * 1000), null);
});

test('session tokens require a sufficiently long secret', () => {
  assert.throws(() => createSessionToken('user-123', 'short', now));
  assert.equal(readSessionToken('not-a-token', 'short', now), null);
});

test('session cookies are secure by default and relaxed only in local development', () => {
  assert.deepEqual(createSessionCookieOptions(undefined), {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  });
  assert.deepEqual(createSessionCookieOptions('production'), {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  });
  assert.deepEqual(createSessionCookieOptions('development'), {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
  });
});

test('hashPassword and verifyPassword enforce security and timing-safety', async () => {
  const rawPassword = 'MinhaSenhaForte2026!';
  const hash = await hashPassword(rawPassword);

  assert.ok(hash.includes(':'), 'O hash deve conter salt e chave derivados');
  const isValid = await verifyPassword(rawPassword, hash);
  assert.equal(isValid, true, 'A senha correta deve ser validada');

  const isInvalid = await verifyPassword('SenhaErrada', hash);
  assert.equal(isInvalid, false, 'A senha incorreta deve ser rejeitada');

  const isInvalidTampered = await verifyPassword(rawPassword, 'saltInvalido:chaveInvalida');
  assert.equal(isInvalidTampered, false, 'Hashes adulterados devem retornar falso sem erro fatal');
});
