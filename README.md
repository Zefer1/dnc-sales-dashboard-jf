# DNC Sales Dashboard (Frontend + Backend)

Projeto full-stack para um dashboard com autenticação (JWT) e CRUD de Leads.

## Requisitos

- Node.js (LTS recomendado)
- npm

## Estrutura

- `./` (frontend React + Vite)
- `backend/` (API Express + Prisma)

## Configuração de ambiente

### Backend

Crie um `.env` em `backend/` baseado no exemplo:

```bash
cd backend
copy .env.example .env
```

### Frontend

Crie um `.env` na raiz do frontend baseado no exemplo:

```bash
copy .env.example .env
```

Variável importante:

- `VITE_API_BASE_URL` (ex: `http://localhost:3000`)

## Rodar localmente (dev)

### 1) Backend

```bash
cd backend
npm install
npm run dev
```

API: `http://localhost:3000`

### 2) Frontend

Em outro terminal:

```bash
cd ..
npm install
npm run dev
```

App: `http://localhost:5173`

## Scripts úteis

### Frontend

- `npm run dev`
- `npm run build`

### Backend

- `npm run dev`
- `npm run build`
- `npm test`

## Endpoints principais

- `GET /health`
- `POST /api/register`
- `POST /api/login`
- `GET /api/profile` (Bearer)
- `GET /api/leads` (Bearer)
- `POST /api/leads/create` (Bearer)
- `PUT /api/leads/update` (Bearer)
- `DELETE /api/leads/delete` (Bearer)
