import 'dotenv/config';
import pg from 'pg';
import { pathToFileURL } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL não definida. Configure a variável de ambiente antes de testar a conexão.');
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
  connectionTimeoutMillis: 10000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ['error'] });

export async function runConnectionTest() {
  try {
    console.log('🔄 Conectando via Adapter PG + Prisma...');
    const users = await prisma.user.findMany();
    console.log('✅ CONECTADO COM SUCESSO AO SUPABASE!');
    console.log('Registros encontrados:', users);
  } catch (error) {
    console.error('❌ Erro ao testar a conexão com o banco:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runConnectionTest();
}
