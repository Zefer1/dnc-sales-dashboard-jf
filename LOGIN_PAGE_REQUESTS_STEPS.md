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

Depois:

- Cria `backend/.env.example` (exemplo):

```env
PORT=3000
JWT_SECRET=change-me
DEMO_USER_EMAIL=user@ex.com
DEMO_USER_PASSWORD=1234
```

- Cria `backend/src/server.ts` com um endpoint mínimo de login (`POST /api/login`).

Arranca o backend:

```bash
npm run dev
```

> O backend deve ficar disponível em `http://localhost:3000`.

## 3) Instalar Axios

Na raiz do projeto (onde está o `package.json` do frontend):

```bash
npm install axios
```

## 4) Criar variáveis de ambiente no frontend

Na raiz do frontend, cria o ficheiro `.env.example` com:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Preenche com o URL base da API (ex.: `http://localhost:3000` ou um domínio remoto).

Depois, cria o teu `.env` local (não commitar) a partir do `.env.example` e ajusta se necessário.

> Nota: o nome recomendado é `VITE_API_BASE_URL` (sem “L” extra) porque o Vite só expõe variáveis com prefixo `VITE_`.

## 5) Criar `src/hooks/useAxiots.ts` com o código do hook

Cria a pasta `src/hooks` e dentro cria o ficheiro `useAxiots.ts` com este conteúdo:

```ts
import { useState } from 'react'
import axios, { AxiosRequestConfig } from 'axios'

const axioInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/`,
})

export const usePost = <T, P>(endpoint: string) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<number | null>(null)

  const postData = async (postData: P, config?: AxiosRequestConfig) => {
    setData(null)
    setLoading(true)
    setError(null)

    try {
      const response = await axioInstance({
        url: endpoint,
        method: 'POST',
        data: postData,
        headers: {
          'Content-Type': 'application/json',
          ...config?.headers,
        },
        ...config,
      })

      setData(response.data)
    } catch (e: any) {
      setError(e.response.status ?? 500)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, postData }
}
```

### Como usar (exemplo rápido)

- `usePost<LoginResponse, LoginPayload>('/api/login')`
- chamar `postData(payload)` no submit do formulário.
- ler `data`, `loading` e `error` para feedback do utilizador.

---

Quando estes passos estiverem completos, abre um Pull Request de `feat/login-page-requests` para `dev`.
