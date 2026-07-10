import { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Logo from '../../components/Logo'
import Spinner from '../../components/Spinner'
import { isSupabaseConfigured } from '../../lib/supabase'

export default function Login() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/admin" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isSupabaseConfigured) {
      setError('Conecta Supabase para habilitar el acceso de administrador.')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) {
      setError('Correo o contraseña incorrectos.')
      setLoading(false)
    } else {
      navigate('/admin')
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-ink px-4">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(50% 60% at 50% 0%, rgba(220,38,38,0.35) 0%, rgba(220,38,38,0) 70%)',
        }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo light />
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-2xl">
          <h1 className="font-display text-xl font-bold text-fg">Acceso administrador</h1>
          <p className="mt-1 text-sm text-fg-muted">Ingresa para gestionar tu tienda.</p>

          {!isSupabaseConfigured && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Backend no configurado. El acceso se habilita al conectar Supabase.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@mbgsport.com.mx"
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
        </div>

        <Link
          to="/"
          className="mt-5 flex items-center justify-center gap-2 text-sm text-fg-muted transition hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la tienda
        </Link>
      </div>
    </div>
  )
}
