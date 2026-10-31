# Guia Técnico de Arquitetura, Portfólio & Deploy • Máquina do Tempo

Este documento descreve detalhadamente a arquitetura, o inventário completo de arquivos, as soluções 100% gratuitas de integração (E-mail e WhatsApp), o relatório de segurança e o guia passo a passo para colocar a aplicação no ar para portfólio.

---

## 1. Visão Geral da Arquitetura

A aplicação é dividida em três pilares principais:

1. **Frontend (React 19 + Vite 8)**:
   * Interface imersiva sob o *Design System Temporal*: estética de bronze envelhecido, ouro fosco, pergaminho e vidro hermético (*glassmorphism* sobre preto cósmico `#08090d`).
   * Dashboard executivo no padrão **Microsoft Power BI** com gráficos analíticos interativos (gráfico de rosca por tema, comparativo Pessoal vs. Profissional, horizonte temporal e metas).
   * Engenharia responsiva sênior: cabeçalho mobile com gaveta de navegação deslizante (*drawer*), filtros por toque e alvos de interação acessíveis.
   * Tela de login/selamento dinâmico (`AuthPage`) com entrada social (Google OAuth) e credenciais tradicionais.

2. **Backend (Node.js + Express 5)**:
   * API RESTful com autenticação por cookies `HttpOnly` assinados com HMAC-SHA256 e `timingSafeEqual`.
   * Criptografia simétrica militar **AES-256-GCM** para o conteúdo das cápsulas: as mensagens só podem ser lidas no momento exato do desbloqueio.
   * Sistema de contas locais com hashing **Scrypt (KDF)** e salting criptográfico de 16 bytes.
   * Proteção contra ataques de força bruta com `authRateLimiter` e controle rigoroso de CORS/origem.

3. **Persistência & Mensageria (Supabase PostgreSQL + Workers)**:
   * PostgreSQL gerenciado no Supabase via Prisma ORM e adaptador de alta performance `@prisma/adapter-pg`.
   * Fila agendada de entregas (`CapsuleDelivery`) processada atomicamente pelo worker contínuo de despacho.

---

## 2. Inventário Completo de Arquivos

### Raiz do Projeto

| Arquivo | Finalidade |
|---|---|
| `.env` | Variáveis de ambiente locais (não versionadas). |
| `.env.example` | Modelo atualizado com todas as opções de provedores gratuitos (Resend, Meta WhatsApp, Supabase, Google). |
| `package.json` | Dependências do backend, scripts de execução, worker e testes (`npm test`). |
| `capsuleValidator.js` | Schemas Zod de validação rigorosa (título, mensagem, data ISO 8601, escopo, tema e metas). |
| `teste-zod.js` | Testes automatizados do validador de cápsulas. |
| `diagnostico.js` | Script de diagnóstico da conexão PostgreSQL no Supabase com máscara de senhas. |
| `test-conn.js` | Verificação de conectividade Prisma e consulta à tabela de usuários. |
| `prisma.config.ts` | Configuração do Prisma para localização do schema e variáveis de banco. |

### Backend (`backend/`)

| Arquivo | Finalidade |
|---|---|
| `backend/server.js` | Servidor Express principal. Centraliza rotas `/api/auth/*` (Google, registro de senha, login tradicional, sessão e logout), rate limiting, middleware `requireSession` e montagem de rotas de cápsulas e perfil. |
| `backend/auth.js` | Funções criptográficas de sessão (HMAC-SHA256), hashing de senhas Scrypt (`hashPassword`) e comparação em tempo constante (`verifyPassword`). |
| `backend/auth.test.js` | Testes unitários de geração e validação de tokens, cookies seguros e funções Scrypt. |
| `backend/credentialStore.js` | Cofre local seguro e isolado para armazenamento e persistência de senhas com hashing. |
| `backend/capsuleEncryption.js` | Cifragem e decifragem de texto de cápsula com AES-256-GCM e verificação de integridade (*auth tag*). |
| `backend/capsuleEncryption.test.js` | Testes automatizados da cifra e decifra AES-256-GCM. |
| `backend/capsuleRoutes.js` | Endpoints protegidos de CRUD de cápsulas, alternância de metas e consentimento de WhatsApp. |
| `backend/capsuleRoutes.test.js` | Testes do ciclo de vida e liberação de mensagens na data de abertura. |
| `backend/deliveryScheduler.js` | Função atômica que identifica cápsulas que atingiram o tempo de abertura e move as entregas para `READY`. |
| `backend/deliveryScheduler.test.js` | Testes de agendamento e identificação de entregas vencidas. |
| `backend/deliverySchedulerWorker.js` | Worker contínuo que decifra o conteúdo e dispara as mensagens por e-mail e WhatsApp. |
| `backend/services/emailService.js` | Adaptador gratuito de e-mail com suporte a Resend (3.000 envios grátis/mês), SMTP e modo sandbox. |
| `backend/services/whatsappService.js` | Adaptador gratuito de WhatsApp com suporte à Meta Cloud API (1.000 mensagens grátis/mês), CallMeBot e link direto wa.me. |

### Banco de Dados (`prisma/` e `src/lib/`)

| Arquivo | Finalidade |
|---|---|
| `prisma/schema.prisma` | Modelos `User`, `Capsule` e `CapsuleDelivery`, enums e índices otimizados. |
| `prisma/migrations/` | Histórico de migrações SQL aplicadas ao banco de dados PostgreSQL. |
| `src/lib/prisma.js` | Pool de conexão PostgreSQL e inicialização do cliente Prisma. |

### Frontend (`frontend/src/`)

| Arquivo | Finalidade |
|---|---|
| `frontend/src/main.jsx` | Ponto de entrada React com StrictMode. |
| `frontend/src/App.jsx` | Aplicação central com alternância entre Dashboard BI conectado e tela de autenticação, filtros e gaveta mobile. |
| `frontend/src/App.css` | Folha de estilos completa do dashboard executivo com tema escuro de cápsula do tempo e responsividade sênior. |
| `frontend/src/index.css` | Variáveis globais CSS, paleta de cores e tipografia (`Cinzel` e `Plus Jakarta Sans`). |
| `frontend/src/services/api.js` | Instância Axios com proxy e envio de cookies credenciados (`withCredentials: true`). |
| `frontend/src/constants/capsuleCategories.js` | Catálogo de categorias (Pessoal/Profissional), temas (Amor, Trabalho, Crescimento, Religião), 6 cápsulas de demonstração (`INITIAL_CAPSULES`) e utilitários temporais. |
| `frontend/src/components/AuthPage.jsx` | Componente imersivo de Login e Cadastro (Câmara de Selamento). |
| `frontend/src/components/AuthPage.css` | Estilos artesanais da tela de autenticação com animação de relógio astrolábio e visor hermético. |
| `frontend/src/components/BiCharts.jsx` | Painéis analíticos (Rosca, Comparativo Pessoal/Profissional, Linha do Tempo e Metas). |
| `frontend/src/components/CapsuleFormModal.jsx` | Modal de criação com atalhos de data, metas dinâmicas e validação em tempo real. |
| `frontend/src/components/CapsuleDetailModal.jsx` | Modal de visualização da cápsula, checklist de metas e botão de simulação de abertura imediata. |
| `frontend/src/components/WhatsappProfileModal.jsx` | Modal de preferências e registro de número de WhatsApp internacional. |

---

## 3. Integração Gratuita: E-mail e WhatsApp (Zero Custo para Portfólio)

Como o objetivo do projeto é servir de destaque em portfólio, ambas as integrações foram construídas para funcionar **sem gastar 1 centavo**:

### A. E-mail (Resend - 3.000 envios/mês gratuitos)
1. Crie uma conta gratuita em [resend.com](https://resend.com) (não pede cartão de crédito).
2. Em **API Keys**, clique em *Create API Key* e copie a chave gerada.
3. Coloque no `.env`:
   ```env
   RESEND_API_KEY=re_sua_chave_aqui
   EMAIL_FROM=Máquina do Tempo <onboarding@resend.dev>
   ```
4. O Resend permite enviar testes gratuitos para o próprio e-mail cadastrado imediatamente.
5. *Fallback Sandbox:* Se nenhuma chave for colocada, o serviço simula o envio no console com log detalhado e não quebra a aplicação.

### B. WhatsApp (Meta Cloud API Oficial ou CallMeBot)
* **Opção 1 (Meta Cloud API - Oficial):** A Meta disponibiliza **1.000 conversas gratuitas por mês** para qualquer conta de desenvolvedor no [developers.facebook.com](https://developers.facebook.com). Basta criar um aplicativo do tipo *Business*, ativar o WhatsApp e copiar o `WHATSAPP_ACCESS_TOKEN` e `WHATSAPP_PHONE_NUMBER_ID`.
* **Opção 2 (CallMeBot - Sem cadastro):** Gateway gratuito onde o usuário obtém uma chave em 30 segundos enviando uma mensagem no WhatsApp.
* **Opção 3 (Modo Demonstração com Link Direto):** Se nenhuma chave externa for configurada, o sistema gera o link oficial `https://api.whatsapp.com/send?phone=...&text=...`, permitindo que recrutadores e avaliadores testem o envio real no próprio celular com 1 clique!

---

## 4. Onde e Como Fazer o Deploy 100% Gratuito

Para colocar a Máquina do Tempo no ar publicamente, a melhor combinação moderna e gratuita é:

```
┌─────────────────────────────────┐
│     Vercel (Frontend React)     │  -> Gratuito, deploy via Git em 1 minuto
└────────────────┬────────────────┘
                 │ (Chamadas /api)
┌────────────────▼────────────────┐
│      Render (Backend Node.js)   │  -> Web Service Gratuito (Render Free Tier)
└────────────────┬────────────────┘
                 │ (Conexão Pooler)
┌────────────────▼────────────────┐
│   Supabase (Banco PostgreSQL)   │  -> Banco PostgreSQL 500MB Gratuito
└─────────────────────────────────┘
```

### Passo 1: Banco de Dados no Supabase (Gratuito)
1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. Em **Project Settings -> Database**, copie a `Connection String` (modo *Transaction* ou *Session*).
3. Execute localmente para aplicar as migrações:
   ```bash
   npx prisma migrate deploy
   ```

### Passo 2: Backend no Render (Gratuito)
1. Crie uma conta em [render.com](https://render.com) e conecte o repositório GitHub.
2. Crie um **New Web Service**:
   * **Root Directory:** raiz (`.`)
   * **Build Command:** `npm install && npx prisma generate`
   * **Start Command:** `node backend/server.js`
   * **Environment Variables:** Adicione as variáveis do `.env` (`DATABASE_URL`, `SESSION_SECRET`, `CAPSULE_ENCRYPTION_KEY`, etc.).
   * Defina `NODE_ENV=production` e `FRONTEND_ORIGINS=https://seu-front.vercel.app`.

### Passo 3: Frontend no Vercel (Gratuito)
1. Crie uma conta em [vercel.com](https://vercel.com) e importe o repositório.
2. Configure:
   * **Root Directory:** `frontend`
   * **Framework Preset:** Vite
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
   * **Environment Variables:**
     * `VITE_API_URL=https://seu-backend.onrender.com/api`
     * `VITE_GOOGLE_CLIENT_ID=seu_client_id`
3. Clique em **Deploy**. Sua aplicação estará no ar com HTTPS gratuito e CDN global!

---

## 5. Relatório da Varredura de Segurança

| Risco Avaliado | Status | Mitigação Implementada |
|---|---|---|
| **Vazamento de Mensagens Futuras** | Protegido | Mensagens salvas cifradas com **AES-256-GCM**. O backend oculta o campo `message` de qualquer requisição até que `unlockAt <= agora`. |
| **Ataques de Força Bruta (Login/Cadastro)** | Protegido | Middleware `authRateLimiter` bloqueia rajadas de requisições excedentes por IP com HTTP `429`. |
| **Ataques de Temporização (*Timing Attacks*)** | Protegido | Todas as assinaturas HMAC e hashes Scrypt utilizam `crypto.timingSafeEqual`. |
| **CSRF & Injeção de Origens** | Protegido | `requireAllowedOrigin` barra origens não autorizadas no CORS e restringe headers de escrita. |
| **Injeção de Código & XSS** | Protegido | Todos os componentes usam interpolação JSX padrão (sem `dangerouslySetInnerHTML`), com escape automático de tags. |
| **Validação de Carga Útil** | Protegido | Validações com Zod em todas as rotas (título até 100 caracteres, mensagens até 10.000 caracteres, data ISO 8601 estrita). |
