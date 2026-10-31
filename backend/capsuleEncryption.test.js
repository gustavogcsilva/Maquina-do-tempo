import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decryptCapsuleContent,
  encryptCapsuleContent,
  getCapsuleEncryptionKey,
} from './capsuleEncryption.js';

const key = Buffer.alloc(32, 7);

test('capsule content encrypts and decrypts with authenticated encryption', () => {
  const encrypted = encryptCapsuleContent('memória reservada', key);

  assert.notEqual(encrypted, 'memória reservada');
  assert.equal(decryptCapsuleContent(encrypted, key), 'memória reservada');
});

test('capsule content rejects tampering and invalid encryption keys', () => {
  const [version, iv, tag, content] = encryptCapsuleContent('texto', key).split('.');
  const tampered = `${version}.${iv}.${tag}.${content.slice(0, -1)}A`;

  assert.throws(() => decryptCapsuleContent(tampered, key));
  assert.throws(() => getCapsuleEncryptionKey(''));
  assert.throws(() => getCapsuleEncryptionKey('too-short'));
});
