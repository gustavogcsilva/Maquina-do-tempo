import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptCapsuleContent } from './capsuleEncryption.js';
import { serializeCapsule } from './capsuleRoutes.js';

const key = Buffer.alloc(32, 3);

function createCapsule(unlockAt) {
  return {
    id: 'capsule-1',
    title: 'Mensagem futura',
    content: encryptCapsuleContent('conteúdo privado', key),
    unlockAt: new Date(unlockAt),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    recipientEmail: 'owner@example.com',
    mood: null,
    priority: 'Média',
    actionItems: [],
    isOpened: false,
    deliveries: [],
  };
}

test('capsule content stays hidden until its scheduled release time', () => {
  const capsule = createCapsule('2026-11-01T00:00:00.000Z');
  const beforeRelease = serializeCapsule(
    capsule,
    new Date('2026-10-31T23:59:59.999Z'),
    key,
  );
  const atRelease = serializeCapsule(
    capsule,
    new Date('2026-11-01T00:00:00.000Z'),
    key,
  );

  assert.equal(beforeRelease.message, null);
  assert.equal(beforeRelease.isUnlocked, false);
  assert.equal(atRelease.message, 'conteúdo privado');
  assert.equal(atRelease.isUnlocked, true);
});
