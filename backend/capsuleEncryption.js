import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const algorithm = 'aes-256-gcm';
const envelopeVersion = 'v1';

export function getCapsuleEncryptionKey(value = process.env.CAPSULE_ENCRYPTION_KEY) {
  if (!value) {
    throw new Error('CAPSULE_ENCRYPTION_KEY não está configurada.');
  }

  const key = Buffer.from(value, 'base64');
  if (key.length !== 32) {
    throw new Error('CAPSULE_ENCRYPTION_KEY deve ser uma chave Base64 de 32 bytes.');
  }

  return key;
}

export function encryptCapsuleContent(content, key) {
  if (typeof content !== 'string') {
    throw new TypeError('O conteúdo da cápsula precisa ser um texto.');
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(content, 'utf8'), cipher.final()]);
  const authenticationTag = cipher.getAuthTag();

  return [
    envelopeVersion,
    iv.toString('base64url'),
    authenticationTag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

export function decryptCapsuleContent(envelope, key) {
  const [version, encodedIv, encodedTag, encodedContent, extra] = envelope.split('.');

  if (
    version !== envelopeVersion ||
    !encodedIv ||
    !encodedTag ||
    encodedContent === undefined ||
    extra !== undefined
  ) {
    throw new Error('O conteúdo armazenado da cápsula possui um formato inválido.');
  }

  const iv = Buffer.from(encodedIv, 'base64url');
  const authenticationTag = Buffer.from(encodedTag, 'base64url');
  const encrypted = Buffer.from(encodedContent, 'base64url');

  if (iv.length !== 12 || authenticationTag.length !== 16) {
    throw new Error('O conteúdo armazenado da cápsula possui parâmetros inválidos.');
  }

  const decipher = createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authenticationTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
