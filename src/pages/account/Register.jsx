import { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { User, Mail, Phone, Lock, AlertCircle, CheckCircle2 } from 'lucide-react'
import Spinner from '../../components/Spinner'
import { useAuth } from '../../context/AuthContext'

export default function Register() {
  const { user, signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/cuenta" replace />

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return setError('Escribe tu nombre.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Correo no válido.')
    if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.')

    setLoading(true)
    setError('')
    const { data, error } = await signUp(form.email.trim(), form.password, {
      full_name: form.name.trim(),
      phone: form.phone.trim(),
    })
    if (error) {
      setError(
        error.message?.includes('already registered')
          ? 'Ya existe una cuenta con ese correo.'
          : error.message || 'No se pudo crear la cuenta.'
      )
      setLoading(false)
      return
    }
    // Si Supabase requiere confirmación de correo, no hay sesión todavía.
    if (data.session) {
      navigate('/cuenta')
    } else {
      setMessage('Te enviamos un correo para confirmar tu cuenta. Confírmalo e inicia sesión.')
      setLoading(false)
    }
  }

  // Tarjeta amarilla con puntos del póster 1b.
  const DOTS_STYLE = {
    backgroundImage: 'radial-gradient(rgba(0,0,0,.06) 1.5px, transparent 1.5px)',
    backgroundSize: '14px 14px',
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      {message ? (
        <div className="sticker mt-2 flex flex-col items-center gap-3 rounded-xl p-7 text-center">
          <CheckCircle2 className="h-10 w-10 text-state-paid" />
          <p className="text-sm font-medium text-[#4a4a4a]">{message}</p>
          <Link to="/cuenta/login" className="btn-primary mt-2 w-full">
            Ir a iniciar sesión
          </Link>
        </div>
      ) : (
        <>
          <form
            onSubmit={handleSubmit}
            className="sticker space-y-3 rounded-xl bg-accent-400 p-7"
            style={DOTS_STYLE}
          >
            <h1 className="font-display text-xl font-black uppercase text-fg">Crear cuenta</h1>
            <p className="!mt-1.5 text-[12.5px] font-semibold text-fg">
              Guarda tus datos y sigue tus pedidos.
            </p>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Nombre completo"
                className="field pl-10"
                autoComplete="name"
              />
            </div>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="Correo electrónico"
                className="field pl-10"
                autoComplete="email"
              />
            </div>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
              <input
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="Teléfono (opcional)"
                className="field pl-10"
                autoComplete="tel"
              />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="Contraseña (mín. 6 caracteres)"
                className="field pl-10"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p className="flex items-center gap-2 rounded-lg border-2 border-ink bg-brand-600 p-3 text-sm font-semibold text-white">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary !mt-5 h-12 w-full">
              {loading ? (
                <Spinner size={5} className="border-white/40 border-t-white" />
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-[12.5px] font-medium text-[#4a4a4a]">
            ¿Ya tienes cuenta?{' '}
            <Link to="/cuenta/login" className="font-bold text-brand-600 hover:text-brand-700">
              Iniciar sesión
            </Link>
          </p>
        </>
      )}
    </div>
  )
}
