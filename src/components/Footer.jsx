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
    <footer className="mt-16 hidden bg-ink text-[#a3a3a8] md:block">
      {/* Franja de marca amarillo → rojo (diseño 1b) */}
      <div className="h-[3px] bg-gradient-to-r from-accent-400 to-brand-600" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo size={30} />
          <p className="mt-3.5 max-w-[280px] text-[13px] leading-relaxed text-fg-subtle">
            {STORE.description}
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href={STORE.instagram}
              target="_blank"
              rel="noreferrer"
              className="grid h-9 w-9 place-items-center rounded-lg border border-ink-line text-[#a3a3a8] transition hover:border-accent-400 hover:text-accent-400"
              aria-label="Instagram"
            >
              <InstagramIcon className="h-4.5 w-4.5" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-display text-xs font-bold uppercase tracking-[.1em] text-accent-400">
            Tienda
          </h4>
          <ul className="mt-4 space-y-2.5 text-[13px]">
            <li>
              <Link to="/catalogo" className="transition hover:text-white">
                Todo el catálogo
              </Link>
            </li>
            <li>
              <Link to="/#servicio" className="transition hover:text-white">
                Servicio técnico
              </Link>
            </li>
            <li>
              <Link to="/carrito" className="transition hover:text-white">
                Mi carrito
              </Link>
            </li>
            <li>
              <Link to="/terminos" className="transition hover:text-white">
                Términos y condiciones
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-xs font-bold uppercase tracking-[.1em] text-accent-400">
            Contacto
          </h4>
          <ul className="mt-4 space-y-3 text-[13px]">
            <li className="flex gap-2.5">
              <MapPin className="h-4 w-4 shrink-0 text-brand-600" />
              <span>{STORE.address}</span>
            </li>
            <li className="flex gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-brand-600" />
              <span>{STORE.phone}</span>
            </li>
            <li className="flex gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-brand-600" />
              <span>{STORE.email}</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-xs font-bold uppercase tracking-[.1em] text-accent-400">
            Horario
          </h4>
          <ul className="mt-4 space-y-3 text-[13px]">
            <li className="flex gap-2.5">
              <Clock className="h-4 w-4 shrink-0 text-brand-600" />
              <span>{STORE.hours}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#222]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 text-[11.5px] text-fg-subtle">
          <span>
            © {new Date().getFullYear()} {STORE.name} ® · Todos los derechos reservados
          </span>
          <Link to="/admin/login" className="transition hover:text-white">
            Acceso administrador
          </Link>
        </div>
      </div>
    </footer>
  )
}
