import test from 'node:test';
import assert from 'node:assert/strict';
import { markDueDeliveriesReady } from './deliveryScheduler.js';

test('scheduler marks only due capsule deliveries as ready', async () => {
  let update;
  const prisma = {
    capsuleDelivery: {
      async updateMany(options) {
        update = options;
        return { count: 2 };
      },
    },
  };
  const now = new Date('2026-10-30T12:00:00.000Z');

  assert.equal(await markDueDeliveriesReady(prisma, now), 2);
  assert.deepEqual(update, {
    where: {
      status: 'SCHEDULED',
      scheduledAt: { lte: now },
      capsule: { unlockAt: { lte: now } },
    },
    data: { status: 'READY' },
  });
});
