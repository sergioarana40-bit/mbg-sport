import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'

// Ruta solo para administradores: exige sesión Y rol admin.
export default function ProtectedRoute({ children }) {
  const { user, isAdmin, loading, profileLoading } = useAuth()

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <Spinner />
      </div>
    )
  }
  if (!user) return <Navigate to="/admin/login" replace />
  // Sesión de cliente (no admin): fuera del panel.
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}
