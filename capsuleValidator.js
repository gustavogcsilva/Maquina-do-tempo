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
});
