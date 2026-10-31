# Máquina do Tempo

Aplicação web em desenvolvimento para criar cápsulas do tempo digitais: mensagens que ficam guardadas e podem ser abertas em uma data futura. O projeto reúne uma interface React, uma API Express e uma estrutura PostgreSQL acessada por Prisma.

## Estado atual

A aplicação tem login Google, criação e persistência de cápsulas por usuário, metas, data de desbloqueio validada no servidor e conteúdo cifrado no banco. Ao chegar a data, a API libera o conteúdo e o painel atualiza automaticamente. As entregas por e-mail e WhatsApp ficam registradas na fila, mas ainda aguardam a integração com provedores externos.

## Tecnologias

- Node.js e Express 5
- React 19 e Vite 8
- Axios para chamadas HTTP no frontend
- Google Identity Services e verificação de credenciais no backend
- Zod para validar título, mensagem e data ISO 8601
- AES-256-GCM para cifrar o conteúdo das cápsulas no banco
- Prisma 7, PostgreSQL e `pg` adapter

## Requisitos

- Node.js compatível com Vite 8 (Node.js 20.19+ ou 22.12+)
- npm
- PostgreSQL para usar o banco de dados

## Instalação

Na raiz do projeto, instale as dependências do backend e do frontend:

```bash
npm install
cd frontend
npm install
cd ..
```

Crie o arquivo `.env` na raiz usando `.env.example` como referência. Configure `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `VITE_GOOGLE_CLIENT_ID`, `SESSION_SECRET` e `CAPSULE_ENCRYPTION_KEY`. Gere uma chave de criptografia Base64 com:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Mantenha a mesma `CAPSULE_ENCRYPTION_KEY` enquanto houver cápsulas cifradas no banco. Sem ela, o conteúdo não pode ser recuperado. Não versione chaves reais nem credenciais.

```env
PORT=5000
GOOGLE_CLIENT_ID=seu_client_id_google
VITE_GOOGLE_CLIENT_ID=seu_client_id_google
SESSION_SECRET=gere_uma_chave_aleatoria_com_ao_menos_32_bytes
CAPSULE_ENCRYPTION_KEY=gere_uma_chave_base64_de_32_bytes
DATABASE_URL="postgresql://usuario:senha@localhost:5432/maquina_do_tempo?schema=public"
```

Nunca publique credenciais reais. O arquivo `.env` deve permanecer fora do Git; use um gerenciador de segredos no ambiente de deploy.

Configure `GOOGLE_CLIENT_ID` e `VITE_GOOGLE_CLIENT_ID` com o mesmo OAuth Client ID do tipo aplicação Web criado no Google Cloud Console. Autorize `http://localhost:5173` e `http://127.0.0.1:5173` como origens JavaScript. Gere um `SESSION_SECRET` aleatório com pelo menos 32 bytes. O backend valida a credencial do Google e mantém a sessão em um cookie `HttpOnly`.

## Desenvolvimento

Abra dois terminais na raiz do projeto.

Terminal 1, API:

```bash
NODE_ENV=development
npm run dev:server
```

Terminal 2, frontend:

```bash
cd frontend
npm run dev
```

A interface ficará disponível em `http://localhost:5173` e a API em `http://localhost:5000`. O Vite encaminha requisições `/api` para o backend. A rota `GET /api/health` retorna o estado da API. O CORS do Express permite `http://localhost:5173` e `http://127.0.0.1:5173`.

Antes do primeiro login, aplique as migrações com `npx prisma migrate deploy` (ou `npx prisma migrate dev` em desenvolvimento). Em desenvolvimento local, inicie o backend com `NODE_ENV=development` para usar cookies compatíveis com HTTP local. Em qualquer outro ambiente, o cookie é `Secure` por padrão; publique a aplicação atrás de HTTPS.

As rotas de autenticação são `POST /api/auth/google`, `GET /api/auth/me` e `POST /api/auth/logout`. Em produção, defina `FRONTEND_ORIGINS` com as origens autorizadas e use HTTPS para que o cookie de sessão seja transmitido com segurança.

As cápsulas ficam no PostgreSQL e cada consulta exige uma sessão válida; o servidor oculta o conteúdo até `unlockAt`. As rotas são `GET/POST /api/capsules`, `PATCH /api/capsules/:id/actions`, `DELETE /api/capsules/:id` e `PATCH /api/profile/whatsapp`. O número de WhatsApp é guardado no perfil com consentimento explícito.

Para processar as datas da fila, execute `npm run schedule:capsules` em um processo separado e mantenha-o ativo junto com a API. Ele move entregas vencidas para `READY`; ainda não transmite mensagens. A integração e as credenciais de e-mail/WhatsApp serão configuradas em uma etapa posterior. O envio futuro deverá passar por verificação do número e manter os mesmos limites de acesso ao conteúdo.

## Comandos úteis

Na raiz:

```bash
npm test                 # testa sessão, criptografia, agendamento e validação de cápsulas
npm run validate:capsule # executa os testes do schema Zod
npm run check:db         # verifica a configuração/conectividade do banco
npm run schedule:capsules # processa datas vencidas da fila de entregas
npx prisma validate      # valida o schema Prisma
npx prisma generate      # gera o Prisma Client
npx prisma migrate deploy # aplica migrações pendentes
```

No diretório `frontend`:

```bash
npm run build
npm run lint
```

O banco deve estar acessível e `DATABASE_URL` configurada para os comandos de banco de dados. A configuração Prisma está em `prisma.config.ts`; os modelos estão em `prisma/schema.prisma`.

## Estrutura principal

```text
backend/server.js          API Express e configuração CORS
capsuleValidator.js        Schema Zod para entrada de cápsulas
prisma.config.ts           Configuração do Prisma 7 e URL do banco
prisma/schema.prisma       Modelos User e Capsule
src/lib/prisma.js          Cliente Prisma com adapter PostgreSQL
frontend/src/              Interface React e cliente Axios
frontend/vite.config.js    Servidor Vite e proxy /api
```

## Segurança

- Não versione `.env` nem credenciais.
- Mantenha a lista de origens CORS restrita aos domínios usados pela aplicação.
- Use HTTPS e credenciais fortes no banco em produção.
- O conteúdo das cápsulas é cifrado com `CAPSULE_ENCRYPTION_KEY`; faça backup seguro da chave.
- As rotas de cápsulas exigem sessão e filtram pelo proprietário; o conteúdo só é retornado após a data definida.
- A fila registra e agenda canais, mas não envia e-mails ou mensagens até que os provedores e a verificação de destinatário sejam integrados.