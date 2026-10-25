import 'dotenv/config';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

async function run() {
  try {
    console.log('🔄 Conectando via Adapter PG + Prisma...');
    const users = await prisma.user.findMany();
    console.log('✅ CONECTADO COM SUCESSO AO SUPABASE!');
    console.log('Registros encontrados:', users);
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();