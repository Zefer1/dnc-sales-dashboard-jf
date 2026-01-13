# UrbanCRM API (backend)

API Express local para suportar o frontend do UrbanCRM.

## Setup

```bash
cd backend
npm install
```

Cria um `.env` a partir do `.env.example`:

```bash
copy .env.example .env
```

## Run

```bash
npm run dev
```

## Testes

```bash
npm test
```

## Endpoints

- `GET /health`
- `POST /api/register`
- `POST /api/login`
- `GET /api/profile` (Bearer)
- `GET /api/leads` (Bearer)
- `POST /api/leads/create` (Bearer)
- `PUT /api/leads/update` (Bearer)
- `DELETE /api/leads/delete` (Bearer)

Body do login:
```json
{ "email": "user@ex.com", "password": "1234" }
```
