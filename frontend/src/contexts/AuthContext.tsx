import { useCallback, useMemo, useState } from 'react'
import { AuthContext, AuthUser, LoginPayload, LoginResponse } from '@/contexts/AuthContextValue'
import { api } from '@/api/client'

const TOKEN_STORAGE_KEY = 'auth_token'
const USER_STORAGE_KEY = 'auth_user'

type AuthProviderProps = {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  })
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY)
    if (storedUser) {
      try {
        return JSON.parse(storedUser) as AuthUser
      } catch {
        localStorage.removeItem(USER_STORAGE_KEY)
        return null
      }
    }
    return null
  })

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const refreshMe = useCallback(async () => {
    const currentToken = token
    if (!currentToken) return

    type MeResponse = { user: AuthUser }
    const response = await api.get<MeResponse>('/api/me', {
      headers: { Authorization: `Bearer ${currentToken}` },
    })

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data.user))
    setUser(response.data.user)
  }, [token])

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await api.post<LoginResponse>('/api/login', payload)

    localStorage.setItem(TOKEN_STORAGE_KEY, response.data.token)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data.user))

    setToken(response.data.token)
    setUser(response.data.user)
  }, [])

  const register = useCallback(async (payload: LoginPayload & { name?: string }) => {
    const response = await api.post<LoginResponse>('/api/register', payload)

    localStorage.setItem(TOKEN_STORAGE_KEY, response.data.token)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data.user))

    setToken(response.data.token)
    setUser(response.data.user)
  }, [])

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      login,
      register,
      refreshMe,
      logout,
    }),
    [token, user, login, register, refreshMe, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
