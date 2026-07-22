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
      {/* Tarjeta sticker (diseño 1b) */}
      <form onSubmit={handleSubmit} className="sticker rounded-xl p-7">
        <h1 className="font-display text-xl font-black uppercase text-fg">Iniciar sesión</h1>
        <p className="mt-1.5 text-[12.5px] font-medium text-fg-subtle">
          Accede a tu cuenta para ver tus pedidos.
        </p>

        <div className="relative mt-5">
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
        <div className="relative mt-3">
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
          <p className="mt-4 flex items-center gap-2 rounded-lg border-2 border-ink bg-brand-600 p-3 text-sm font-semibold text-white">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-sticker mt-5 h-12 w-full">
          {loading ? <Spinner size={5} className="border-white/40 border-t-white" /> : 'Entrar'}
        </button>

        <p className="mt-4 text-center text-[12.5px] font-medium text-[#4a4a4a]">
          ¿No tienes cuenta?{' '}
          <Link to="/cuenta/registro" className="font-bold text-brand-600 hover:text-brand-700">
            Crear cuenta
          </Link>
        </p>
      </form>
    </div>
  )
}
