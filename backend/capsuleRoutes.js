import { Router } from 'express';
import { z } from 'zod';
import { createCapsuleSchema } from '../capsuleValidator.js';
import {
  decryptCapsuleContent,
  encryptCapsuleContent,
  getCapsuleEncryptionKey,
} from './capsuleEncryption.js';

const whatsappProfileSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{7,14}$/, 'Use o formato internacional, por exemplo +5511999999999.')
    .nullable(),
  whatsappConsent: z.boolean(),
}).refine((profile) => !profile.whatsappConsent || profile.phoneNumber, {
  message: 'Informe o número de WhatsApp para aceitar o envio.',
});

const actionItemsSchema = z
  .array(
    z.object({
      id: z.string().min(1).max(80),
      text: z.string().trim().min(1).max(250),
      done: z.boolean(),
    }),
  )
  .max(50);

function getChannels(capsule) {
  return capsule.deliveries.map(({ channel, status, scheduledAt, sentAt }) => ({
    channel: channel.toLowerCase(),
    status: status.toLowerCase(),
    scheduledAt: scheduledAt.toISOString(),
    sentAt: sentAt?.toISOString() ?? null,
  }));
}

export function serializeCapsule(capsule, now, key) {
  const isUnlocked = capsule.unlockAt.getTime() <= now.getTime();

  return {
    id: capsule.id,
    title: capsule.title,
    message: isUnlocked ? decryptCapsuleContent(capsule.content, key) : null,
    scope: capsule.scope,
    theme: capsule.theme,
    unlockDate: capsule.unlockAt.toISOString(),
    createdAt: capsule.createdAt.toISOString(),
    recipientEmail: capsule.recipientEmail,
    mood: capsule.mood,
    priority: capsule.priority,
    actionItems: capsule.actionItems,
    isOpened: capsule.isOpened,
    isUnlocked,
    deliveries: getChannels(capsule),
  };
}

export function createCapsuleRouter(requireAllowedOrigin) {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      let key;
      try {
        key = getCapsuleEncryptionKey();
      } catch {
        return res.status(503).json({ message: 'A criptografia das cápsulas não está configurada.' });
      }

      const { prisma } = await import('../src/lib/prisma.js');
      const capsules = await prisma.capsule.findMany({
        where: { userId: req.userId },
        include: { deliveries: true },
        orderBy: [{ unlockAt: 'asc' }, { createdAt: 'desc' }],
      });
      const now = new Date();

      return res.json({
        capsules: capsules.map((capsule) => serializeCapsule(capsule, now, key)),
      });
    } catch (error) {
      return next(error);
    }
  });

  router.post('/', requireAllowedOrigin, async (req, res, next) => {
    const parsedCapsule = createCapsuleSchema.safeParse(req.body);
    if (!parsedCapsule.success) {
      return res.status(400).json({
        message: 'Os dados da cápsula são inválidos.',
        errors: parsedCapsule.error.issues.map(({ path, message }) => ({
          field: path.join('.'),
          message,
        })),
      });
    }

    const capsuleInput = parsedCapsule.data;
    const unlockAt = new Date(capsuleInput.unlockDate);
    if (unlockAt.getTime() <= Date.now()) {
      return res.status(400).json({ message: 'A data de abertura precisa estar no futuro.' });
    }

    try {
      let key;
      try {
        key = getCapsuleEncryptionKey();
      } catch {
        return res.status(503).json({ message: 'A criptografia das cápsulas não está configurada.' });
      }

      const { prisma } = await import('../src/lib/prisma.js');
      const channels = capsuleInput.deliveryChannels ?? ['email', 'whatsapp'];
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { email: true, phoneNumber: true, whatsappConsentAt: true },
      });

      if (!user) {
        return res.status(401).json({ message: 'Usuário da sessão não encontrado.' });
      }

      if (channels.includes('whatsapp') && (!user.phoneNumber || !user.whatsappConsentAt)) {
        return res.status(400).json({
          message: 'Configure seu WhatsApp e aceite o envio nas preferências da conta.',
          field: 'deliveryChannels',
        });
      }

      const deliveries = channels.map((channel) => ({
        channel: channel.toUpperCase(),
        recipient: channel === 'email' ? user.email : user.phoneNumber,
        scheduledAt: unlockAt,
      }));

      const capsule = await prisma.capsule.create({
        data: {
          userId: req.userId,
          title: capsuleInput.title,
          content: encryptCapsuleContent(capsuleInput.message, key),
          unlockAt,
          recipientEmail: user.email,
          scope: capsuleInput.scope ?? 'pessoal',
          theme: capsuleInput.theme ?? 'amor',
          mood: capsuleInput.mood ?? null,
          priority: capsuleInput.priority ?? 'Média',
          actionItems: capsuleInput.actionItems ?? [],
          deliveries: { create: deliveries },
        },
        include: { deliveries: true },
      });

      return res.status(201).json({
        capsule: serializeCapsule(capsule, new Date(), key),
        deliveryNotice:
          'Cápsula e notificações agendadas com sucesso! O envio por e-mail e WhatsApp será disparado automaticamente na data programada.',
      });
    } catch (error) {
      return next(error);
    }
  });

  router.patch('/:capsuleId/actions', requireAllowedOrigin, async (req, res, next) => {
    const parsedActions = actionItemsSchema.safeParse(req.body.actionItems);
    if (!parsedActions.success) {
      return res.status(400).json({ message: 'A lista de metas é inválida.' });
    }

    try {
      const { prisma } = await import('../src/lib/prisma.js');
      const capsule = await prisma.capsule.findFirst({
        where: { id: req.params.capsuleId, userId: req.userId },
        include: { deliveries: true },
      });

      if (!capsule) {
        return res.status(404).json({ message: 'Cápsula não encontrada.' });
      }

      const updatedCapsule = await prisma.capsule.update({
        where: { id: capsule.id },
        data: { actionItems: parsedActions.data },
        include: { deliveries: true },
      });

      return res.json({
        capsule: serializeCapsule(
          updatedCapsule,
          new Date(),
          getCapsuleEncryptionKey(),
        ),
      });
    } catch (error) {
      return next(error);
    }
  });

  router.delete('/:capsuleId', requireAllowedOrigin, async (req, res, next) => {
    try {
      const { prisma } = await import('../src/lib/prisma.js');
      const result = await prisma.capsule.deleteMany({
        where: { id: req.params.capsuleId, userId: req.userId },
      });

      if (result.count === 0) {
        return res.status(404).json({ message: 'Cápsula não encontrada.' });
      }

      return res.status(204).end();
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

export function createProfileRouter(requireAllowedOrigin) {
  const router = Router();

  router.patch('/whatsapp', requireAllowedOrigin, async (req, res, next) => {
    const parsedProfile = whatsappProfileSchema.safeParse(req.body);
    if (!parsedProfile.success) {
      return res.status(400).json({
        message: parsedProfile.error.issues[0]?.message ?? 'Os dados do WhatsApp são inválidos.',
      });
    }

    try {
      const { prisma } = await import('../src/lib/prisma.js');
      const user = await prisma.$transaction(async (transaction) => {
        const updatedUser = await transaction.user.update({
          where: { id: req.userId },
          data: {
            phoneNumber: parsedProfile.data.phoneNumber,
            whatsappConsentAt: parsedProfile.data.whatsappConsent ? new Date() : null,
          },
          select: {
            id: true,
            email: true,
            name: true,
            phoneNumber: true,
            whatsappConsentAt: true,
          },
        });

        if (parsedProfile.data.whatsappConsent && parsedProfile.data.phoneNumber) {
          await transaction.capsuleDelivery.updateMany({
            where: {
              channel: 'WHATSAPP',
              status: { in: ['SCHEDULED', 'READY'] },
              capsule: { userId: req.userId },
            },
            data: { recipient: parsedProfile.data.phoneNumber },
          });
        } else {
          await transaction.capsuleDelivery.updateMany({
            where: {
              channel: 'WHATSAPP',
              status: { in: ['SCHEDULED', 'READY'] },
              capsule: { userId: req.userId },
            },
            data: {
              status: 'FAILED',
              lastError: 'Envio cancelado porque o consentimento para WhatsApp foi removido.',
            },
          });
        }

        return updatedUser;
      });

      return res.json({ user });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
