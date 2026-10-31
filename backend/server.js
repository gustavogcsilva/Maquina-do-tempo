import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import {
  createSessionCookieOptions,
  createSessionToken,
  hashPassword,
  readSessionToken,
  verifyPassword,
} from './auth.js';
import { createCapsuleRouter, createProfileRouter } from './capsuleRoutes.js';
import { getUserPasswordHash, saveUserPasswordHash } from './credentialStore.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);
const allowedOrigins = (
  process.env.FRONTEND_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const googleClient = new OAuth2Client();
const sessionCookieName = 'maquina_do_tempo_session';
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;
const sessionCookieOptions = createSessionCookieOptions(process.env.NODE_ENV);

// Schemas Zod com higienização estrita de dados
const googleCredentialSchema = z.object({
  credential: z.string().trim().min(1).max(8192),
});

const registerSchema = z.object({
  name: z.string().trim().min(2, 'O nome deve ter no mínimo 2 caracteres.').max(80),
  email: z.string().trim().email('Informe um e-mail válido.').max(120),
  password: z.string().min(6, 'A senha deve conter pelo menos 6 caracteres.').max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.').max(120),
  password: z.string().min(1, 'A senha é obrigatória.').max(128),
});

// Middleware de verificação de Origem permitida (Anti-CSRF)
function requireAllowedOrigin(req, res, next) {
  const origin = req.get('origin');

  // Permite requisições internas/mesma origem ou das origens autorizadas
  if (!origin || allowedOrigins.includes(origin)) {
    return next();
  }

  return res.status(403).json({ message: 'Origem não permitida para esta operação.' });
}

// Middleware de Rate Limiting para rotas de autenticação (Proteção contra Brute Force / Credential Stuffing)
const authAttempts = new Map();

function authRateLimiter(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // Janela de 15 minutos
  const maxAttempts = 25;

  const record = authAttempts.get(ip);
  if (record) {
    if (now - record.firstAttempt < windowMs) {
      if (record.count >= maxAttempts) {
        return res.status(429).json({
          message: 'Muitas tentativas consecutivas de autenticação. Por segurança temporal, aguarde alguns minutos.',
        });
      }
      record.count += 1;
    } else {
      authAttempts.set(ip, { count: 1, firstAttempt: now });
    }
  } else {
    authAttempts.set(ip, { count: 1, firstAttempt: now });
  }

  return next();
}

// Middleware de Autenticação de Sessão Obrigatória
async function requireSession(req, res, next) {
  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret || Buffer.byteLength(sessionSecret) < 32) {
    return res.status(503).json({ message: 'Autenticação não configurada no servidor.' });
  }

  const cookie = req.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookieName}=`));
  const token = cookie?.slice(sessionCookieName.length + 1);
  const session = token ? readSessionToken(token, sessionSecret) : null;

  if (!session) {
    res.clearCookie(sessionCookieName, sessionCookieOptions);
    return res.status(401).json({ message: 'Autenticação necessária.' });
  }

  try {
    const { prisma } = await import('../src/lib/prisma.js');
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true },
    });

    if (!user) {
      res.clearCookie(sessionCookieName, sessionCookieOptions);
      return res.status(401).json({ message: 'Sessão inválida.' });
    }

    req.userId = user.id;
    return next();
  } catch (error) {
    return next(error);
  }
}

// Configuração de CORS com credenciais
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origem não permitida pelo CORS.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true }));

// Rota de Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'API Máquina do Tempo operando com sucesso.' });
});

// 1. Cadastro tradicional com E-mail e Senha (Criar uma senha)
app.post('/api/auth/register', requireAllowedOrigin, authRateLimiter, async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0]?.message || 'Dados de cadastro inválidos.',
    });
  }

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret || Buffer.byteLength(sessionSecret) < 32) {
    return res.status(503).json({
      message: 'Autenticação não configurada. Verifique SESSION_SECRET no arquivo .env.',
    });
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const { prisma } = await import('../src/lib/prisma.js');

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'Este e-mail já está registrado na Máquina do Tempo. Entre com sua senha ou com o Google.',
      });
    }

    // Hash seguro Scrypt com salt criptográfico
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
      },
    });

    await saveUserPasswordHash(user.id, passwordHash);

    const token = createSessionToken(user.id, sessionSecret);
    res.cookie(sessionCookieName, token, {
      ...sessionCookieOptions,
      maxAge: sessionDurationMs,
    });

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      message: 'Conta criada e cápsula vinculada com sucesso.',
    });
  } catch (error) {
    return next(error);
  }
});

// 2. Login tradicional com E-mail e Senha
app.post('/api/auth/login', requireAllowedOrigin, authRateLimiter, async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0]?.message || 'Credenciais inválidas.',
    });
  }

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret || Buffer.byteLength(sessionSecret) < 32) {
    return res.status(503).json({
      message: 'Autenticação não configurada no servidor.',
    });
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const { prisma } = await import('../src/lib/prisma.js');

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
    }

    const storedHash = await getUserPasswordHash(user.id);

    if (!storedHash) {
      return res.status(401).json({
        message: 'Esta conta foi associada via Google. Entre pelo botão do Google ou crie uma senha.',
      });
    }

    // Verificação em tempo constante contra timing attacks
    const isPasswordValid = await verifyPassword(password, storedHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
    }

    const token = createSessionToken(user.id, sessionSecret);
    res.cookie(sessionCookieName, token, {
      ...sessionCookieOptions,
      maxAge: sessionDurationMs,
    });

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        whatsappConsentAt: user.whatsappConsentAt,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// 3. Autenticação com Google OAuth
app.post('/api/auth/google', requireAllowedOrigin, authRateLimiter, async (req, res, next) => {
  const parsedBody = googleCredentialSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({ message: 'Credencial do Google inválida.' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!clientId || !sessionSecret || Buffer.byteLength(sessionSecret) < 32) {
    return res.status(503).json({
      message: 'Autenticação não configurada. Verifique GOOGLE_CLIENT_ID e SESSION_SECRET.',
    });
  }

  let googleProfile;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: parsedBody.data.credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return res.status(401).json({ message: 'A conta Google não possui um e-mail verificado.' });
    }

    googleProfile = {
      googleSub: payload.sub,
      email: payload.email.toLowerCase().trim(),
      name: payload.name || null,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith('Failed to retrieve verification certificates:')
    ) {
      console.error('Não foi possível consultar os certificados de login do Google.');
      return res.status(502).json({
        message: 'O serviço de autenticação do Google está temporariamente indisponível.',
      });
    }

    return res.status(401).json({ message: 'Não foi possível validar sua conta Google.' });
  }

  try {
    const { prisma } = await import('../src/lib/prisma.js');
    const user = await prisma.$transaction(async (transaction) => {
      const googleUser = await transaction.user.findUnique({
        where: { googleSub: googleProfile.googleSub },
      });

      if (googleUser) {
        return googleUser;
      }

      const emailUser = await transaction.user.findUnique({
        where: { email: googleProfile.email },
      });

      if (emailUser) {
        if (emailUser.googleSub && emailUser.googleSub !== googleProfile.googleSub) {
          return null;
        }

        return transaction.user.update({
          where: { id: emailUser.id },
          data: { googleSub: googleProfile.googleSub, name: googleProfile.name ?? emailUser.name },
        });
      }

      return transaction.user.create({ data: googleProfile });
    });

    if (!user) {
      return res.status(409).json({
        message: 'Este e-mail já está associado a outra conta Google.',
      });
    }

    const token = createSessionToken(user.id, sessionSecret);
    res.cookie(sessionCookieName, token, {
      ...sessionCookieOptions,
      maxAge: sessionDurationMs,
    });

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        whatsappConsentAt: user.whatsappConsentAt,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// 4. Verificação de Sessão Ativa
app.get('/api/auth/me', async (req, res, next) => {
  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret || Buffer.byteLength(sessionSecret) < 32) {
    return res.status(503).json({ message: 'Autenticação não configurada no servidor.' });
  }

  const cookie = req.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookieName}=`));
  const token = cookie?.slice(sessionCookieName.length + 1);
  const session = token ? readSessionToken(token, sessionSecret) : null;

  if (!session) {
    res.clearCookie(sessionCookieName, sessionCookieOptions);
    return res.status(401).json({ message: 'Autenticação necessária.' });
  }

  try {
    const { prisma } = await import('../src/lib/prisma.js');
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        whatsappConsentAt: true,
      },
    });

    if (!user) {
      res.clearCookie(sessionCookieName, sessionCookieOptions);
      return res.status(401).json({ message: 'Sessão inválida.' });
    }

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

// 5. Encerramento de Sessão (Logout seguro)
app.post('/api/auth/logout', requireAllowedOrigin, (req, res) => {
  res.clearCookie(sessionCookieName, sessionCookieOptions);
  return res.status(204).end();
});

// Rotas de Cápsulas e Perfil protegidas por sessão
app.use('/api/capsules', requireSession, createCapsuleRouter(requireAllowedOrigin));
app.use('/api/profile', requireSession, createProfileRouter(requireAllowedOrigin));

// Tratamento centralizado de erros (não expõe detalhes internos em produção)
app.use((err, req, res, next) => {
  if (err && err.message === 'Origem não permitida pelo CORS.') {
    return res.status(403).json({ message: 'Origem não permitida pelo CORS.' });
  }

  console.error('[ERRO DE SISTEMA]:', err);
  return res.status(500).json({ message: 'Erro interno no processamento do servidor.' });
});

app.listen(PORT, () => {
  console.log(`Servidor backend Máquina do Tempo rodando em http://localhost:${PORT}`);
  console.log('CORS habilitado para:', allowedOrigins.join(', '));
});
