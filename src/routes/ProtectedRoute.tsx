import { useContext } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AuthContext } from '@/contexts/AuthContextValue'

type ProtectedRouteProps = {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const auth = useContext(AuthContext)
  const location = useLocation()

  if (!auth?.isAuthenticated) {
    return <Navigate to='/' replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
