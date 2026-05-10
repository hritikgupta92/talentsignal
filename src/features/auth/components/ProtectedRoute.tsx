import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Skeleton } from '../../../components/ui/skeleton'
import { useAuthStore } from '../../../store/authStore'
import type { UserRole } from '../../../types/recruiter'

export function ProtectedRoute({ children, role }: { children: ReactNode; role?: UserRole }) {
  const location = useLocation()
  const { appUser, isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-72" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }

  if (role && appUser?.role !== role) {
    return <Navigate to={appUser?.role === 'jobseeker' ? '/discover' : '/dashboard'} replace />
  }

  return children
}
