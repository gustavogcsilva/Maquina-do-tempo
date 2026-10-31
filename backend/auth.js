import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const sessionDurationSeconds = 7 * 24 * 60 * 60;

export function createSessionCookieOptions(nodeEnv) {
  const isLocalDevelopment = nodeEnv === 'development';

  return {
    httpOnly: true,
    secure: !isLocalDevelopment,
    sameSite: isLocalDevelopment ? 'lax' : 'none',
    path: '/',
  };
}

function sign(value, secret) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

export function createSessionToken(userId, secret, now = Date.now()) {
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('SESSION_SECRET deve conter pelo menos 32 bytes.');
  }

  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      exp: Math.floor(now / 1000) + sessionDurationSeconds,
    }),
  ).toString('base64url');

  return `${payload}.${sign(payload, secret)}`;
}

export function readSessionToken(token, secret, now = Date.now()) {
  if (!secret || Buffer.byteLength(secret) < 32 || typeof token !== 'string') {
    return null;
  }

  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra !== undefined) {
    return null;
  }

  const expectedSignature = Buffer.from(sign(payload, secret));
  const actualSignature = Buffer.from(signature);

  if (
    expectedSignature.length !== actualSignature.length ||
    !timingSafeEqual(expectedSignature, actualSignature)
  ) {
    return null;
  }

  let claims;
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (
    !claims ||
    typeof claims !== 'object' ||
    typeof claims.sub !== 'string' ||
    claims.sub.length === 0 ||
    !Number.isInteger(claims.exp) ||
    claims.exp <= Math.floor(now / 1000)
  ) {
    return null;
  }

  return { userId: claims.sub, expiresAt: claims.exp };
}

/**
 * Criptografia unidirecional de senhas com salting e KDF Scrypt (resistente a GPUs/ASICs)
 */
export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 6) {
    throw new Error('A senha deve conter no mínimo 6 caracteres.');
  }
  if (password.length > 128) {
    throw new Error('A senha não deve ultrapassar 128 caracteres.');
  }

  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Validação segura de senha em tempo constante contra ataques de temporização
 */
export async function verifyPassword(password, storedHash) {
  if (
    !storedHash ||
    typeof storedHash !== 'string' ||
    !storedHash.includes(':') ||
    typeof password !== 'string'
  ) {
    return false;
  }

  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) {
    return false;
  }

  try {
    const keyBuffer = Buffer.from(keyHex, 'hex');
    const derivedKey = await scryptAsync(password, salt, keyBuffer.length);
    if (derivedKey.length !== keyBuffer.length) {
      return false;
    }
    return timingSafeEqual(derivedKey, keyBuffer);
  } catch {
    return false;
  }
}
