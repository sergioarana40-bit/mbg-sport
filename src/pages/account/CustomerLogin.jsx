import { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { Mail, Lock, AlertCircle } from 'lucide-react'
import Spinner from '../../components/Spinner'
import { useAuth } from '../../context/AuthContext'

export default function CustomerLogin() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/cuenta" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) {
      setError('Correo o contraseña incorrectos.')
      setLoading(false)
    } else {
      navigate('/cuenta')
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-center font-display text-2xl font-bold text-fg">
        Iniciar sesión
      </h1>
      <p className="mt-1 text-center text-sm text-fg-muted">
        Accede a tu cuenta para ver tus pedidos.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-2xl border border-line bg-surface p-6"
      >
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico"
            className="field pl-10"
            autoComplete="email"
          />
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="field pl-10"
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p className="flex items-center gap-2 rounded-lg bg-brand-600/15 p-3 text-sm text-brand-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? (
            <Spinner size={5} className="border-white/40 border-t-white" />
          ) : (
            'Entrar'
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-fg-muted">
        ¿No tienes cuenta?{' '}
        <Link to="/cuenta/registro" className="font-medium text-brand-400 hover:text-brand-300">
          Crear cuenta
        </Link>
      </p>
    </div>
  )
}
