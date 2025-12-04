import { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'
import { useSupabase } from '../contexts/SupabaseContext'
import { LoadingScreen } from './LoadingScreen'

interface ProtectedRouteProps {
  children: ReactElement
  allowedRoles?: string[]
  redirectTo?: string
}

export function ProtectedRoute({ children, allowedRoles, redirectTo }: ProtectedRouteProps) {
  const { user, loading } = useSupabase()

  if (loading) {
    return <LoadingScreen user={user} message="Loading..." />
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  // Check role-based access if allowedRoles is specified
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.user_metadata?.role
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Redirect to specified page or home if not authorized
      return <Navigate to={redirectTo || "/"} replace />
    }
  }

  return children
}
