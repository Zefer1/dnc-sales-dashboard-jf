# Fluxo do Login — Preparação (Express local + Axios + env + hook)

Este documento descreve os passos para começar a implementar o fluxo de login no frontend usando Axios e um hook `usePost`, apontando para uma API Express local (já que a API original deixou de funcionar).

## 1) Criar uma branch a partir de `dev`

A partir da branch `dev`, cria a branch de feature:

```bash
git checkout dev
git pull origin dev
git checkout -b feat/login-page-requests
```

> Objetivo: manter o trabalho do login isolado e fácil de revisar via Pull Request.

## 2) Criar e iniciar a API Express (backend)

Cria uma pasta `backend/` na raiz do repo e inicializa o projeto (TypeScript):

```bash
mkdir backend
cd backend
npm init -y
npm install express cors helmet bcrypt jsonwebtoken dotenv
npm install -D typescript ts-node-dev @types/express @types/node @types/cors @types/jsonwebtoken
```

Cria o teu `.env` a partir do exemplo:

```bash
copy .env.example .env
```

Arranca o backend:

```bash
npm run dev
```

> O backend deve ficar disponível em `http://localhost:3000`.

## 3) Instalar Axios (frontend)

Na raiz do projeto (frontend):

```bash
npm install axios
```

## 4) Criar variáveis de ambiente no frontend

Na raiz do frontend, mantém um ficheiro `.env.example` com:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Depois cria o teu `.env` local a partir do `.env.example` e ajusta se necessário.

> Nota: o Vite só expõe variáveis com prefixo `VITE_`.

## 5) Criar o hook `usePost`

Cria `src/hooks/useAxios.ts` com o hook `usePost` apontando para `VITE_API_BASE_URL`.

## 6) Validar o formulário e disparar o login

- Cria/usa o hook `useFormValidation` para validar email/senha.
- No `Login.tsx`, no submit do `FormComponent`, chama `auth.login({ email, password })`.
- Em caso de sucesso, redireciona para `/home`.

## 7) Rotas protegidas e logout

- Proteger `/home`, `/leads`, `/perfil` com `ProtectedRoute`.
- No `/perfil`, adicionar botão de logout (`auth.logout()`).

---

Quando estes passos estiverem completos, abre um Pull Request de `feat/login-page-requests` para `dev`.
