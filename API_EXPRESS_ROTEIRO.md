# Roteiro didático: API Express para substituir endpoints antigos

Vou planear um roteiro didático, passo-a-passo, para criar a API Express que substitui os endpoints antigos e permitir que continue o trabalho do frontend.

## Passos principais (resumo rápido)

- Inicializar projeto (npm init) e configurar TypeScript.
- Escolher persistência (recomendo Prisma + SQLite para desenvolvimento rápido).
- Criar estrutura de pastas (src/ com routes, controllers, services, models, middleware, db).
- Implementar autenticação JWT (login/register, auth middleware).
- Implementar endpoints CRUD (profiles, leads, news) e endpoints de vendas/aggregates.
- Validar inputs (Zod/Joi), adicionar segurança (helmet, CORS, rate-limit).
- Seed de dados e collection Postman para testes.
- Testes básicos e documentação (OpenAPI/README).
- Deploy (Heroku/Vercel/Render) quando pronto.

## Ordem detalhada e porque (didático)

### 1) Inicializar e dependências
- Objetivo: ter um esqueleto rápido em TS com live-reload.
- Comandos:

```bash
mkdir backend && cd backend
npm init -y
npm install express cors helmet bcrypt jsonwebtoken dotenv
npm install -D typescript ts-node-dev @types/express @types/node @types/cors @types/jsonwebtoken
```

- Arquivos iniciais: `tsconfig.json`, `.env` (com JWT_SECRET, DATABASE_URL), `package.json` scripts (`dev`: `ts-node-dev --respawn src/server.ts`).

### 2) Estrutura de pastas (convencional)
- `src/server.ts` — bootstrap do Express e middlewares globais.
- `src/db/index.ts` — inicialização da conexão (Prisma client / sqlite).
- `src/routes/*` — define rotas e delega a controllers.
- `src/controllers/*` — lógica HTTP (recebe req/res).
- `src/services/*` — lógica de domínio (interage com DB).
- `src/middleware/auth.ts` — verifica JWT e adiciona `req.user`.
- `src/models/*` (opcional) — tipos/DTOs.
- `src/utils/*` — helpers (hashPassword, generateToken).
- `prisma/schema.prisma` (se usar Prisma).

### 3) Escolha do DB/ORM
- Recomendo Prisma + SQLite para aulas: simples, persistente em arquivo (`dev.db`), fácil migrar para Postgres depois.
- Alternativa: `json-server` para protótipo rápido (menos realista para auth).
- Instalar Prisma:

```bash
npm install prisma @prisma/client
npx prisma init --datasource-provider sqlite
```

- Definir `User`, `Profile`, `Lead`, `Sale`, `News` no `schema.prisma` e rodar `npx prisma migrate dev --name init`.

### 4) Implementar autenticação (essencial antes do restante)
- Endpoints:
  - `POST /api/login` → body `{ email, password }`, responde `{ token }`.
  - `POST /api/register` (opcional) → cria user, retorna `{ token }`.
- Segurança:
  - `bcrypt` para `passwordHash`.
  - `jsonwebtoken` para gerar token com `expiresIn` (ex.: `1h`).
  - Salvar refresh tokens se quiser fluxo refresh (opcional).
- Arquivos:
  - `src/routes/auth.ts`
  - `src/controllers/authController.ts`
  - `src/services/authService.ts`
  - `src/middleware/auth.ts` (verifica header `Authorization: Bearer <token>`)

### 5) Mapear e implementar endpoints listados
Mapeamento (sugestão de métodos e payloads):

- Autenticação
  - `POST /api/login` — body `{ email, password }` -> `{ token, user }`
- Profiles
  - `POST /api/profile/create` — body `{ name, email, ... }` -> created profile (protected)
  - `PUT /api/profile/update` — body `{ id, ... }` -> updated (protected)
  - `DELETE /api/profile/delete` — body `{ id }` or `DELETE /api/profile/:id` (protected)
- Leads
  - `POST /api/leads/create` — create lead (protected)
  - `DELETE /api/leads/delete` — `DELETE /api/leads/:id` (protected)
  - `GET /api/leads` — list leads (protected)
- Sales (agregados/relatórios)
  - `GET /api/sales/highlights` — resumo/chaves (protected)
  - `GET /api/sales/month` — vendas por mês (protected)
  - `GET /api/sales/stars` — top sellers (protected)
  - `GET /api/sales/year` — ano inteiro (protected)
- News
  - `GET /api/news` — lista notícias (público ou protegido)
  - `POST /api/news` — criar notícia (admin)

Implementação prática:
- Para cada recurso: `src/routes/<resource>.ts` -> `src/controllers/<resource>Controller.ts` -> `src/services/<resource>Service.ts` usando Prisma client.
- Use `auth` middleware nas rotas que exigem token.

### 6) Validação e segurança
- Input validation: `zod` ou `joi` em controllers (prévents bad payloads).
- Middlewares: `helmet()`, `cors({ origin: <frontend-url> })`, `express.json()`.
- Rate limiting: `express-rate-limit` para proteger login.
- Sanitização/escape onde necessário.

### 7) Seed e dados de teste
- Criar `prisma/seed.ts` ou um script `scripts/seed.ts` para popular `users`, `leads`, `sales`, `news`.
- Facilita testar o frontend sem cadastrar manualmente.

### 8) Testes e collection Postman
- Criar uma Postman collection com:
  - `Register` (opcional)
  - `Login` (salva token em ambiente)
  - CRUD `profiles`, `leads`, `news`
  - Sales endpoints
- Instruir a guardar token em variável `{{token}}` e usar `Authorization: Bearer {{token}}`.

### 9) Logs, erros e Dev UX
- Erros centralizados: `src/middleware/errorHandler.ts`.
- Logger leve: `morgan` em dev.
- Hot-reload: `ts-node-dev` para desenvolvimento.

### 10) Deploy e ambiente
- Produção: migrar para Postgres (Prisma facilita), usar `DATABASE_URL` no `.env`.
- Providers: Render / Railway / Heroku / Fly / Vercel (serverless) — para Express prefira Render/Railway/Heroku.
- Variáveis de ambiente: `JWT_SECRET`, `DATABASE_URL`, `PORT`, `FRONTEND_URL`.

## Exemplo de fluxo auth (didático)

1. Frontend -> POST `/api/login` with `{email,password}`.
2. Server valida, retorna `{ token }`.
3. Frontend guarda token (`localStorage`) e envia `Authorization: Bearer <token>` nas próximas requests.
4. Server `auth` middleware verifica token e permite acesso a endpoints protegidos.
5. Logout = remover token no frontend; opcionalmente invalidar refresh token no servidor.

## Especificações de payloads (sugestões rápidas)

- `POST /api/login` request: `{ "email":"a@b.com", "password":"senha" }` response: `{ "token":"<jwt>", "user": { id, name, email } }`
- `POST /api/profile/create` request: `{ "name","email","role" }` response: `{ "id","name","email","createdAt" }`
- `POST /api/leads/create` request: `{ "name","contact","source","ownerId" }`
- `GET /api/sales/month?year=2026&month=1` response: `{ total: 12345, byDay: [...], byRep: [...] }`

## Boas práticas didáticas a seguir

- Comece pequeno: primeiro `login` + middleware + `GET /api/profile/:id` protegido. Teste no Postman.
- Depois implemente `profile create/update/delete`.
- Em seguida `leads` CRUD.
- Depois os endpoints de `sales` (agregações) que só consultam e retornam JSON preparado para as chart components.
- Crie scripts de seed para os dados que alimentam os charts (vendas por mês, top sellers).
- Versionamento de API: prefira prefixar com `/api/v1/...` se pretender evoluir.

## Arquivos que você deverá criar (lista concreta)

- `src/server.ts`
- `src/db/index.ts`
- `src/routes/auth.ts`
- `src/controllers/authController.ts`
- `src/services/authService.ts`
- `src/middleware/auth.ts`
- `src/routes/profile.ts`, `src/controllers/profileController.ts`, `src/services/profileService.ts`
- `src/routes/leads.ts`, `src/controllers/leadsController.ts`, `src/services/leadsService.ts`
- `src/routes/sales.ts`, `src/controllers/salesController.ts`, `src/services/salesService.ts`
- `src/routes/news.ts`, `src/controllers/newsController.ts`, `src/services/newsService.ts`
- `prisma/schema.prisma` + `prisma/seed.ts`
- `postman/collection.json` (exportada)

---

Se quiser que eu gere já o esqueleto inicial em TypeScript (arquivos e `package.json` scripts + prisma schema minimal) com `login` e `profile GET` implementados e testáveis no Postman, diga “Sim — gera esqueleto” e eu creo os ficheiros sugeridos.