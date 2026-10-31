export async function markDueDeliveriesReady(prisma, now = new Date()) {
  const result = await prisma.capsuleDelivery.updateMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: { lte: now },
      capsule: { unlockAt: { lte: now } },
    },
    data: { status: 'READY' },
  });

  return result.count;
}
