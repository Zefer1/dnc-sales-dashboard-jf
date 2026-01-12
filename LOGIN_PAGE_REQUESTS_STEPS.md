# Fluxo do Login — Preparação (branch + Axios + .env + hook)

Este documento descreve os passos para começar a implementar o fluxo de login no frontend usando Axios e um hook `usePost`.

## 1) Criar uma branch a partir de `dev`

A partir da branch `dev`, cria a branch de feature:

```bash
git checkout dev
git pull origin dev
git checkout -b feat/login-page-requests
```

> Objetivo: manter o trabalho do login isolado e fácil de revisar via Pull Request.

## 2) Instalar Axios

Na raiz do projeto (onde está o `package.json` do frontend):

```bash
npm install axios
```

## 3) Criar a variável de ambiente `.env`

Na raiz do frontend, cria (ou edita) o ficheiro `.env` com:

```env
VITE_API_BASE_URL=
```

Preenche com o URL base da API (ex.: `http://localhost:3000` ou um domínio remoto).

> Nota: o nome recomendado é `VITE_API_BASE_URL` (sem “L” extra) para bater com o hook abaixo e com a convenção do Vite.

## 4) Criar `src/hooks/useAxiots.ts` com o código do hook

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
