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

  // Fondo negro con puntos amarillos del póster 1b.
  const DOTS_STYLE = {
    backgroundImage: 'radial-gradient(rgba(255,215,0,.08) 1.5px, transparent 1.5px)',
    backgroundSize: '18px 18px',
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4" style={DOTS_STYLE}>
      <div className="w-full max-w-sm py-12">
        <div className="mb-7 flex justify-center">
          <Logo size={36} />
        </div>

        {/* Tarjeta blanca con sombra dura roja (diseño 1b) */}
        <div
          className="rounded-xl border-[3px] border-ink bg-white p-7"
          style={{ boxShadow: '6px 6px 0 #FF0000' }}
        >
          <h1 className="font-display text-[19px] font-black uppercase text-fg">
            Acceso administrador
          </h1>
          <p className="mt-1.5 text-[12.5px] font-medium text-fg-subtle">
            Ingresa para gestionar tu tienda.
          </p>

          {!isSupabaseConfigured && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border-2 border-ink bg-accent-400/50 p-3 text-xs font-medium text-fg">
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
              <p className="flex items-center gap-2 rounded-lg border-2 border-ink bg-brand-600 p-3 text-sm font-semibold text-white">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-sticker h-12 w-full">
              {loading ? <Spinner size={5} className="border-white/40 border-t-white" /> : 'Entrar'}
            </button>
          </form>
        </div>

        <Link
          to="/tienda"
          className="mt-5 flex items-center justify-center gap-2 text-[12.5px] font-semibold text-[#9a9aa0] transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
          Volver a la tienda
        </Link>
      </div>
    </div>
  )
}
