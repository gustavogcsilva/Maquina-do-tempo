import { z } from 'zod';

const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:?\d{2})$/;

const isValidIsoDate = (value) => {
  if (!isoDateRegex.test(value)) {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

export const createCapsuleSchema = z.object({
  title: z
    .string({ required_error: 'O título é obrigatório.' })
    .trim()
    .min(3, 'O título deve ter no mínimo 3 caracteres.')
    .max(100, 'O título não deve ultrapassar 100 caracteres.'),

  message: z
    .string({ required_error: 'A mensagem é obrigatória.' })
    .trim()
    .min(1, 'A mensagem é obrigatória.')
    .max(10000, 'A mensagem contém muitos caracteres (longa demais).'),

  unlockDate: z
    .string({ required_error: 'A data precisa estar no padrão ISO 8601.' })
    .trim()
    .refine((value) => isValidIsoDate(value), {
      message: 'A data precisa estar no padrão ISO 8601 válido.',
    }),

  scope: z
    .enum(['pessoal', 'profissional'], {
      message: 'O escopo deve ser pessoal ou profissional.',
    })
    .optional(),

  theme: z
    .enum(['amor', 'trabalho', 'crescimento_pessoal', 'religiao'], {
      message: 'A categoria deve ser amor, trabalho, crescimento_pessoal ou religiao.',
    })
    .optional(),

  recipientEmail: z
    .string()
    .trim()
    .email('Informe um endereço de e-mail válido.')
    .nullable()
    .optional(),

  mood: z.string().trim().max(50).optional(),

  priority: z.enum(['Alta', 'Média', 'Baixa']).optional(),

  actionItems: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        text: z.string().trim().min(1, 'A meta não pode ser vazia.').max(250),
        done: z.boolean().default(false),
      }),
    )
    .max(50, 'A cápsula pode ter no máximo 50 metas.')
    .optional(),

  deliveryChannels: z
    .array(z.enum(['email', 'whatsapp']))
    .max(2)
    .refine((channels) => new Set(channels).size === channels.length, {
      message: 'Os canais de entrega não podem se repetir.',
    })
    .optional(),
});
