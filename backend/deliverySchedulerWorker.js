import 'dotenv/config';
import { disconnectPrisma, prisma } from '../src/lib/prisma.js';
import { markDueDeliveriesReady } from './deliveryScheduler.js';
import { decryptCapsuleContent, getCapsuleEncryptionKey } from './capsuleEncryption.js';
import { sendEmail } from './services/emailService.js';
import { sendWhatsappMessage } from './services/whatsappService.js';

const intervalMs = Number(process.env.CAPSULE_SCHEDULER_INTERVAL_MS || 30000);
let stopped = false;

if (!Number.isInteger(intervalMs) || intervalMs < 1000) {
  throw new Error('CAPSULE_SCHEDULER_INTERVAL_MS deve ser um inteiro de pelo menos 1000 ms.');
}

async function dispatchReadyDeliveries() {
  let encryptionKey;
  try {
    encryptionKey = getCapsuleEncryptionKey();
  } catch (err) {
    console.warn('[Agendador]: CAPSULE_ENCRYPTION_KEY não configurada. Despacho aguardando chave.');
    return;
  }

  const readyDeliveries = await prisma.capsuleDelivery.findMany({
    where: { status: 'READY' },
    include: { capsule: true },
    take: 10,
  });

  for (const delivery of readyDeliveries) {
    const { capsule } = delivery;

    try {
      const decryptedMessage = decryptCapsuleContent(capsule.content, encryptionKey);

      if (delivery.channel === 'EMAIL') {
        await sendEmail({
          to: delivery.recipient,
          subject: `⌛ Sua Cápsula do Tempo foi aberta: "${capsule.title}"`,
          text: `Olá!\n\nA cápsula do tempo "${capsule.title}" programada para hoje foi oficialmente destrancada.\n\n📜 Mensagem Preservada:\n"${decryptedMessage}"\n\nAcesse sua conta na Máquina do Tempo para revisitar todas as suas metas e memórias!`,
        });
      } else if (delivery.channel === 'WHATSAPP') {
        await sendWhatsappMessage({
          to: delivery.recipient,
          message: `⌛ *Máquina do Tempo*\n\nSua cápsula *"${capsule.title}"* foi aberta!\n\n📜 *Mensagem:*\n"${decryptedMessage}"`,
        });
      }

      await prisma.capsuleDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          lastError: null,
        },
      });

      console.info(`[Agendador]: Entrega ${delivery.id} (${delivery.channel}) enviada com sucesso para ${delivery.recipient}.`);
    } catch (deliveryError) {
      console.error(`[Agendador]: Falha no envio da entrega ${delivery.id}:`, deliveryError.message);
      await prisma.capsuleDelivery.update({
        where: { id: delivery.id },
        data: {
          attempts: { increment: 1 },
          lastError: deliveryError.message,
          status: delivery.attempts >= 4 ? 'FAILED' : 'READY',
        },
      });
    }
  }
}

async function poll() {
  try {
    const readyCount = await markDueDeliveriesReady(prisma);
    if (readyCount > 0) {
      console.info(`${readyCount} entrega(s) marcada(s) como PRONTA(S) para despacho.`);
    }

    await dispatchReadyDeliveries();
  } catch (error) {
    console.error('Falha ao atualizar a fila de entregas agendadas:', error);
  }
}

async function stop() {
  stopped = true;
  await disconnectPrisma();
}

process.once('SIGINT', stop);
process.once('SIGTERM', stop);

console.info(`Agendador de cápsulas e despacho ativo; ciclo de ${intervalMs} ms.`);

while (!stopped) {
  await poll();
  if (!stopped) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
