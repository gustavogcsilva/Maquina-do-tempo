import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

async function testarConexao() {
  console.log('--- DIAGNÓSTICO SUPABASE ---');
  console.log('URL:', process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':****@'));

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('Tentando conectar via driver nativo do Postgres...');
    await client.connect();
    console.log(' Conectado com sucesso!');

    const res = await client.query('SELECT NOW() as agora, current_database() as banco');
    console.log(' Resposta do banco:', res.rows[0]);

    const tabelas = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(' Tabelas encontradas:', tabelas.rows.map(r => r.table_name));

    await client.end();
  } catch (err) {
    console.error(' Erro detalhado retornado pelo PostgreSQL:');
    console.error('Mensagem:', err.message);
    console.error('Código:', err.code);
    if (err.routine) console.error('Rotina interna:', err.routine);
  }
}

testarConexao();