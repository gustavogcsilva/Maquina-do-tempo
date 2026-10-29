import 'dotenv/config';
import pg from 'pg';
import { pathToFileURL } from 'node:url';

const { Client } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL não definida. Configure a variável de ambiente antes de diagnosticar a conexão.');
}

const mascararUrl = (url) => {
  try {
    const parsed = new URL(url);
    parsed.password = '***';
    return parsed.toString();
  } catch {
    return '[URL inválida]';
  }
};

async function testarConexao() {
  console.log('--- DIAGNÓSTICO SUPABASE ---');
  console.log('URL:', mascararUrl(databaseUrl));

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: true },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('Tentando conectar via driver nativo do Postgres...');
    await client.connect();
    console.log('Conectado com sucesso!');

    const res = await client.query('SELECT NOW() as agora, current_database() as banco');
    console.log('Resposta do banco:', res.rows[0]);

    const tabelas = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    console.log('Tabelas encontradas:', tabelas.rows.map((r) => r.table_name));

    await client.end();
  } catch (err) {
    console.error('Erro detalhado retornado pelo PostgreSQL:');
    console.error('Mensagem:', err.message);
    console.error('Código:', err.code);
    if (err.routine) console.error('Rotina interna:', err.routine);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await testarConexao();
}

export { mascararUrl, testarConexao };
