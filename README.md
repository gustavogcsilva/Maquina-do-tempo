# Máquina do Tempo

Aplicação web em desenvolvimento para criar cápsulas do tempo digitais: mensagens que ficam guardadas e podem ser abertas em uma data futura. O projeto reúne uma interface React, uma API Express e uma estrutura PostgreSQL acessada por Prisma.

## Estado atual

A base do projeto está configurada com validação dos dados da cápsula, endpoint de saúde da API, proxy de desenvolvimento entre Vite e Express e modelos Prisma para usuários e cápsulas. A interface atual exibe o estado de conexão com a API. Os fluxos de cadastro, autenticação, criação de cápsulas e abertura por data ainda precisam ser implementados.

## Tecnologias

- Node.js e Express 5
- React 19 e Vite 8
- Axios para chamadas HTTP no frontend
- Zod para validar título, mensagem e data ISO 8601
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

Crie o arquivo `.env` na raiz usando `.env.example` como referência. Configure ao menos `DATABASE_URL` antes de executar comandos Prisma ou conectar ao banco. Exemplo:

```env
PORT=5000
DATABASE_URL="postgresql://usuario:senha@localhost:5432/maquina_do_tempo?schema=public"
```

Nunca publique credenciais reais. O arquivo `.env` está ignorado pelo Git; mantenha chaves de serviço e senhas apenas no ambiente local ou no gerenciador de segredos do ambiente de deploy.

## Desenvolvimento

Abra dois terminais na raiz do projeto.

Terminal 1, API:

```bash
npm run dev:server
```

Terminal 2, frontend:

```bash
cd frontend
npm run dev
```

A interface ficará disponível em `http://localhost:5173` e a API em `http://localhost:5000`. O Vite encaminha requisições `/api` para o backend. A rota `GET /api/health` retorna o estado da API. O CORS do Express permite `http://localhost:5173` e `http://127.0.0.1:5173`.

## Comandos úteis

Na raiz:

```bash
npm test                 # valida dados válidos e rejeita entradas inválidas
npm run validate:capsule # executa os testes do schema Zod
npm run check:db         # verifica a configuração/conectividade do banco
npx prisma validate      # valida o schema Prisma
npx prisma generate      # gera o Prisma Client
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
- A validação Zod deve ser aplicada no backend quando as rotas de criação de cápsulas forem implementadas; validação no cliente não substitui validação no servidor.
- Antes de publicar, implemente autenticação e autorização para proteger cápsulas e dados pessoais.