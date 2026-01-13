# dnc-sales-dashboard-api (backend)

API Express local para suportar o frontend do dashboard quando a API antiga não estiver disponível.

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

Endpoints:
- `GET /health`
- `POST /api/login`

Body do login:
```json
{ "email": "user@ex.com", "password": "1234" }
```
