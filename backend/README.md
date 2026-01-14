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

### Password reset

- `POST /api/password/forgot` — pede email de recuperação
- `POST /api/password/reset` — redefine a password via token

Para receberes mesmo o email (em vez de `devToken`), configura SMTP no `.env`.

#### CAPTCHA (produção)

O endpoint `POST /api/password/forgot` exige CAPTCHA em produção para prevenir abuso.
Usamos Cloudflare Turnstile.

Variáveis:
- `TURNSTILE_SECRET_KEY`
- No frontend: `VITE_TURNSTILE_SITE_KEY`

#### Gmail SMTP

O Gmail requer 2FA + "App Password" (não funciona com a password normal).

Variáveis mínimas:
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_USER=your.email@gmail.com`
- `SMTP_PASS=<app-password>`
- `SMTP_FROM` é opcional (se não estiver definido, usa `SMTP_USER`)

Para o link do email apontar para o frontend correto, define:
- `PASSWORD_RESET_BASE_URL` (recomendado) ou `FRONTEND_URL`

Dica (dev): para simular comportamento de produção localmente (não devolver `devToken`), define:
- `RETURN_DEV_PASSWORD_RESET_TOKEN=false`

Body do login:
```json
{ "email": "user@ex.com", "password": "1234" }
```
