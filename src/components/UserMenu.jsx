import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, LogIn, UserPlus, ShieldCheck, LogOut, Package } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function UserMenu() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function handleLogout() {
    setOpen(false)
    await signOut()
    navigate('/tienda')
  }

  const itemClass =
    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-fg-muted transition hover:bg-surface-2 hover:text-fg'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`grid h-10 w-10 place-items-center rounded-lg transition hover:bg-white/10 ${
          user ? 'text-accent-400' : 'text-white'
        }`}
        aria-label="Cuenta"
        aria-expanded={open}
      >
        <User className="h-5.5 w-5.5" />
      </button>

      {open && (
        <div className="sticker absolute right-0 top-12 z-50 w-56 p-2">
          {user ? (
            <>
              <div className="px-3 py-2">
                <p className="truncate text-sm font-semibold text-fg">
                  {profile?.full_name || 'Mi cuenta'}
                </p>
                <p className="truncate text-xs text-fg-subtle">{user.email}</p>
              </div>
              <div className="my-1 h-px bg-line" />
              <Link to="/cuenta" onClick={() => setOpen(false)} className={itemClass}>
                <Package className="h-4.5 w-4.5" />
                Mi cuenta y pedidos
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setOpen(false)} className={itemClass}>
                  <ShieldCheck className="h-4.5 w-4.5" />
                  Panel de administración
                </Link>
              )}
              <button onClick={handleLogout} className={`w-full ${itemClass}`}>
                <LogOut className="h-4.5 w-4.5" />
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/cuenta/login" onClick={() => setOpen(false)} className={itemClass}>
                <LogIn className="h-4.5 w-4.5" />
                Iniciar sesión
              </Link>
              <Link to="/cuenta/registro" onClick={() => setOpen(false)} className={itemClass}>
                <UserPlus className="h-4.5 w-4.5" />
                Crear cuenta
              </Link>
              <div className="my-1 h-px bg-line" />
              <Link to="/admin/login" onClick={() => setOpen(false)} className={itemClass}>
                <ShieldCheck className="h-4.5 w-4.5" />
                Acceso administrador
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
