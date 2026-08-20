import { Link } from 'react-router-dom'
import { MapPin, Phone, Clock, Mail, ExternalLink } from 'lucide-react'
import Logo from './Logo'
import { STORE } from '../config'

// lucide-react removió los logos de marca; usamos SVGs propios para las redes.
// Se exportan para reutilizarlos en la landing (sección "Visítanos").
export function InstagramIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}
export function FacebookIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}
export function TikTokIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21 7.917v4.034a9.948 9.948 0 0 1-5-1.951v4.5a6.5 6.5 0 1 1-8-6.326v4.326a2.5 2.5 0 1 0 4 2V2h4.083A6.005 6.005 0 0 0 21 7.917z" />
    </svg>
  )
}
export function YouTubeIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="4" />
      <path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor" stroke="none" />
    </svg>
  )
}

const SOCIALS = [
  { name: 'Facebook', href: STORE.facebook, Icon: FacebookIcon },
  { name: 'Instagram', href: STORE.instagram, Icon: InstagramIcon },
  { name: 'TikTok', href: STORE.tiktok, Icon: TikTokIcon },
  { name: 'YouTube', href: STORE.youtube, Icon: YouTubeIcon },
].filter((s) => s.href)

function SocialRow({ className = '' }) {
  return (
    <div className={`flex gap-3 ${className}`}>
      {SOCIALS.map(({ name, href, Icon }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={name}
          title={name}
          className="grid h-9 w-9 place-items-center rounded-lg border border-ink-line text-[#a3a3a8] transition hover:border-accent-400 hover:text-accent-400"
        >
          <Icon className="h-4.5 w-4.5" />
        </a>
      ))}
    </div>
  )
}

// `bottomNavSpace`: deja aire para la barra inferior móvil de la tienda;
// la landing no la tiene, así que lo desactiva.
export default function Footer({ bottomNavSpace = true }) {
  return (
    <footer className={`mt-16 bg-ink text-[#a3a3a8] ${bottomNavSpace ? 'pb-20 md:pb-0' : ''}`}>
      {/* Franja de marca amarillo → rojo (diseño 1b) */}
      <div className="h-[3px] bg-gradient-to-r from-accent-400 to-brand-600" />

      {/* Versión completa (escritorio) */}
      <div className="mx-auto hidden max-w-7xl gap-10 px-4 py-12 md:grid md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo size={30} />
          <p className="mt-3.5 max-w-[280px] text-[13px] leading-relaxed text-fg-subtle">
            {STORE.description}
          </p>
          <SocialRow className="mt-4" />
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
              <Link to="/catalogo/refacciones" className="transition hover:text-white">
                Refacciones
              </Link>
            </li>
            <li>
              <Link to="/cables" className="transition hover:text-white">
                Arma tu cable
              </Link>
            </li>
            <li>
              <Link to="/reparaciones" className="transition hover:text-white">
                Servicio técnico
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
            <li>
              <a
                href={STORE.maps}
                target="_blank"
                rel="noreferrer"
                className="flex gap-2.5 transition hover:text-white"
                title="Abrir en Google Maps"
              >
                <MapPin className="h-4 w-4 shrink-0 text-brand-600" />
                <span>
                  {STORE.address}
                  <span className="mt-0.5 flex items-center gap-1 text-[11.5px] font-semibold text-accent-400">
                    Cómo llegar <ExternalLink className="h-3 w-3" />
                  </span>
                </span>
              </a>
            </li>
            <li className="flex gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-brand-600" />
              <a
                href={`tel:+52${STORE.phone.replace(/\D/g, '')}`}
                className="transition hover:text-white"
              >
                {STORE.phone}
              </a>
            </li>
            <li className="flex gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-brand-600" />
              <a href={`mailto:${STORE.email}`} className="transition hover:text-white">
                {STORE.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-xs font-bold uppercase tracking-[.1em] text-accent-400">
            Horario
          </h4>
          <ul className="mt-4 space-y-3 text-[13px]">
            {STORE.hoursLines.map((line) => (
              <li key={line} className="flex gap-2.5">
                <Clock className="h-4 w-4 shrink-0 text-brand-600" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Versión compacta (móvil): redes + ubicación */}
      <div className="flex flex-col items-center gap-4 px-4 py-8 text-center md:hidden">
        <Logo size={26} />
        <SocialRow />
        <a
          href={STORE.maps}
          target="_blank"
          rel="noreferrer"
          className="flex max-w-xs flex-col items-center gap-1 text-xs leading-relaxed"
        >
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-600" />
            {STORE.address}
          </span>
          <span className="flex items-center gap-1 text-[11.5px] font-semibold text-accent-400">
            Cómo llegar <ExternalLink className="h-3 w-3" />
          </span>
        </a>
        <p className="flex items-center gap-1.5 text-xs">
          <Phone className="h-3.5 w-3.5 text-brand-600" />
          <a href={`tel:+52${STORE.phone.replace(/\D/g, '')}`}>{STORE.phone}</a>
          <span className="px-1 text-fg-subtle">·</span>
          <Mail className="h-3.5 w-3.5 text-brand-600" />
          <a href={`mailto:${STORE.email}`}>{STORE.email}</a>
        </p>
        <div className="flex flex-col items-center gap-1 text-xs">
          {STORE.hoursLines.map((line) => (
            <span key={line} className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-brand-600" />
              {line}
            </span>
          ))}
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
