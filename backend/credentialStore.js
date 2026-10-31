import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VAULT_FILE = path.join(__dirname, '.credentials_vault.json');

let inMemoryVault = null;

async function loadVault() {
  if (inMemoryVault !== null) {
    return inMemoryVault;
  }

  if (!existsSync(VAULT_FILE)) {
    inMemoryVault = {};
    return inMemoryVault;
  }

  try {
    const raw = await readFile(VAULT_FILE, 'utf8');
    inMemoryVault = JSON.parse(raw);
  } catch (err) {
    console.warn('Aviso: Não foi possível ler o cofre de credenciais local. Reiniciando cofre em memória.', err.message);
    inMemoryVault = {};
  }

  return inMemoryVault;
}

export async function saveUserPasswordHash(userId, passwordHash) {
  const vault = await loadVault();
  vault[userId] = passwordHash;

  try {
    await writeFile(VAULT_FILE, JSON.stringify(vault, null, 2), {
      encoding: 'utf8',
      mode: 0o600, // Leitura e escrita restrita ao proprietário
    });
  } catch (err) {
    console.error('Erro ao persistir cofre de senhas:', err.message);
  }
}

export async function getUserPasswordHash(userId) {
  const vault = await loadVault();
  return vault[userId] || null;
}

