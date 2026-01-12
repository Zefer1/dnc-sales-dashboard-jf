# API Endpoints (anotados)

Lista dos endpoints fornecidos (originais) e anotações rápidas para implementação no backend Express.

---

## Autenticação

### POST /api/login
- URL exemplo: `https://reactts.dnc.group/api/login`
- Método: POST
- Auth: pública (gera token)
- Body (exemplo):
  {
    "email": "user@example.com",
    "password": "secret"
  }
- Response (exemplo):
  {
    "token": "<jwt>",
    "user": { "id": 1, "name": "User", "email": "user@example.com" }
  }
- Notas: usar `bcrypt` para comparar passwordHash e `jsonwebtoken` para assinar token.

---

## Profiles

### POST /api/profile/create
- URL exemplo: `https://reactts.dnc.group/api/profile/create`
- Método: POST
- Auth: protected (Bearer token)
- Body (exemplo):
  {
    "name": "João Silva",
    "email": "joao@ex.com",
    "role": "seller",
    // outros campos do profile
  }
- Response: objeto do profile criado
- Notas: validar payload (Zod/Joi); associar profile a `userId` se aplicável.

### PUT /api/profile/update
- URL exemplo: `https://reactts.dnc.group/api/profile/update`
- Método: PUT (ou PATCH)
- Auth: protected
- Body (exemplo):
  {
    "id": 123,
    "name": "João A. Silva",
    // campos a atualizar
  }
- Response: objeto do profile atualizado

### DELETE /api/profile/delete
- URL exemplo: `https://reactts.dnc.group/api/profile/delete`  (ou `DELETE /api/profile/:id`)
- Método: DELETE
- Auth: protected
- Body/Params: `{ "id": 123 }` ou param `:id`
- Response: { "success": true }

---

## Leads

### POST /api/leads/create
- URL exemplo: `https://reactts.dnc.group/api/leads/create`
- Método: POST
- Auth: protected
- Body (exemplo):
  {
    "name": "Cliente X",
    "contact": "+351 9xx xxx xxx",
    "source": "Web",
    "ownerId": 12
  }
- Response: lead criado

### DELETE /api/leads/delete
- URL exemplo: `https://reactts.dnc.group/api/leads/delete` (ou `DELETE /api/leads/:id`)
- Método: DELETE
- Auth: protected
- Body/Params: `{ "id": 456 }` ou param `:id`
- Response: { "success": true }

### (Sugestão) GET /api/leads
- Método: GET
- Auth: protected
- Query params: `?page=1&limit=20&ownerId=12`
- Response: lista paginada de leads

---

## Sales (agregados / relatórios)

### GET /api/sales/highlights
- URL exemplo: `https://reactts.dnc.group/api/sales/highlights`
- Método: GET
- Auth: protected
- Query params (opcional): `?from=2026-01-01&to=2026-01-31`
- Response (exemplo): {
    "total": 12345,
    "avgTicket": 234.5,
    "bestSeller": { "id": 7, "name": "Rep A", "value": 3456 }
  }

### GET /api/sales/month
- URL exemplo: `https://reactts.dnc.group/api/sales/month`
- Método: GET
- Auth: protected
- Query params: `?year=2026&month=1`
- Response (exemplo): `{ "total": 1234, "byDay": [ { "day": 1, "value": 100 }, ... ] }`

### GET /api/sales/stars
- URL exemplo: `https://reactts.dnc.group/api/sales/stars`
- Método: GET
- Auth: protected
- Response: top sellers / MVPs (ex.: array de representantes com número de vendas/valor)

### GET /api/sales/year
- URL exemplo: `https://reactts.dnc.group/api/sales/year`
- Método: GET
- Auth: protected
- Query params: `?year=2026`
- Response: `{ "byMonth": [ { "month": 1, "value": 123 }, ... ], "total": 15000 }`

---

## News

### GET /api/news
- URL exemplo: `https://reactts.dnc.group/api/news`
- Método: GET
- Auth: público (ou protected, conforme necessidade)
- Response: lista de notícias/announcements

### (Opcional) POST /api/news
- Método: POST
- Auth: protected (roles: admin/editor)
- Body: `{ "title": "Novo lançamento", "body": "..." }`

---

## Notas gerais para reimplementação com Express

- Prefixo: prefixar rotas por versão (`/api/v1/...`) facilita evolução.
- Auth: `Authorization: Bearer <token>` nos endpoints protegidos; middleware `auth` para verificar JWT.
- Validação: `zod` ou `joi` em `controllers` para validar requests antes de chamar services.
- Erros: usar middleware de erro centralizado e códigos HTTP apropriados (400, 401, 403, 404, 500).
- Segurança: `helmet`, `cors` com `origin` do frontend, `express-rate-limit` para proteger `POST /api/login`.
- Seed: criar dados para `sales` que alimentem gráficos (mês/dia/representante) e `leads`/`profiles`.

---

> Este ficheiro foi criado para referência rápida ao implementar o backend Express que substituirá os endpoints existentes.
