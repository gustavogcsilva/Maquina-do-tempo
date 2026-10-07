//Importando a biblioteca zod para Verificação de dados
import {z} from 'zod';

//Esse export const torna possível importar de outro arquivo se caso queira usar para outra ocasião
export const createCapsuleSchema = z.object({
    title: z
    .string({ required_error: "O título é obrigatório."})
    .trim()
    .min(3, "O título deve ter no mínimo 3 caracteres.")
    .max(100, "O título não deve ultrpassar 100 Caracteres"),

    message: z
    .string({ required_error: "A mensagem é obrigatória."})
    .trim()
    .min(1, "A mensagem é obrigatória.")
    .max(10000, "A mensagem contém muitos caracteres (longa demais)."),

    unlockDate: z
    .string({ required_error: "A data precisar no padrão iso 8601."})
})

//Para resumir esse Bloco Validador ele tem por finalidade, assegurar que nenhum
//dados maliciosos ou indesejaveis entrem e passe para o banco de dados,
//assim Verificando os dados , para que só entro no banco de dados , informações necessárias e confiaveis.
