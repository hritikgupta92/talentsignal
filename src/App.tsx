import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { DiscoveryPage } from './pages/DiscoveryPage'
import { LandingPage } from './pages/LandingPage'
import { RecruiterProfilePage } from './pages/RecruiterProfilePage'
import { ProtectedRoute } from './features/auth/components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/discover" element={<DiscoveryPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/r/:slug" element={<RecruiterProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
