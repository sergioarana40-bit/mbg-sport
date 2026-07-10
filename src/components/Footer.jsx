import { Link } from 'react-router-dom'
import { MapPin, Phone, Clock, Mail } from 'lucide-react'
import Logo from './Logo'
import { STORE } from '../config'

// lucide-react removió los logos de marca, usamos un SVG propio para Instagram.
function InstagramIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="mt-16 bg-neutral-900 text-neutral-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-400">
            {STORE.description}
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href={STORE.instagram}
              target="_blank"
              rel="noreferrer"
              className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-800 transition hover:bg-brand-600"
              aria-label="Instagram"
            >
              <InstagramIcon className="h-4.5 w-4.5" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wide text-white">
            Tienda
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/catalogo" className="transition hover:text-white">
                Todo el catálogo
              </Link>
            </li>
            <li>
              <Link to="/carrito" className="transition hover:text-white">
                Mi carrito
              </Link>
            </li>
            <li>
              <Link to="/admin/login" className="transition hover:text-white">
                Acceso administrador
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wide text-white">
            Contacto
          </h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2.5">
              <MapPin className="h-4.5 w-4.5 shrink-0 text-brand-500" />
              <span>{STORE.address}</span>
            </li>
            <li className="flex gap-2.5">
              <Phone className="h-4.5 w-4.5 shrink-0 text-brand-500" />
              <span>{STORE.phone}</span>
            </li>
            <li className="flex gap-2.5">
              <Mail className="h-4.5 w-4.5 shrink-0 text-brand-500" />
              <span>{STORE.email}</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wide text-white">
            Horario
          </h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2.5">
              <Clock className="h-4.5 w-4.5 shrink-0 text-brand-500" />
              <span>{STORE.hours}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-neutral-800">
        <div className="mx-auto max-w-7xl px-4 py-5 text-center text-xs text-neutral-500">
          © {new Date().getFullYear()} {STORE.name}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
}
