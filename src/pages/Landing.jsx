import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Bike,
  Check,
  Clock,
  CreditCard,
  Dumbbell,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  PackageCheck,
  Phone,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Wrench,
  X,
} from 'lucide-react'
import ProductCard from '../components/ProductCard'
import Spinner from '../components/Spinner'
import Footer, {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  YouTubeIcon,
} from '../components/Footer'
import { getProducts } from '../lib/api'
import { STORE } from '../config'

// Contorno blanco con borde negro para la palabra destacada del hero (póster 1b).
const OUTLINE_STYLE = {
  color: '#fff',
  textShadow:
    '-3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 3px 3px 0 #000, 8px 8px 0 rgba(0,0,0,.18)',
}

// Patrón de puntos de las bandas amarillas.
const DOTS_STYLE = {
  backgroundImage: 'radial-gradient(rgba(0,0,0,.07) 1.5px, transparent 1.5px)',
  backgroundSize: '16px 16px',
}

const NAV_LINKS = [
  { label: 'Tienda en línea', to: '/tienda' },
  { label: 'Refacciones', to: '/catalogo/refacciones' },
  { label: 'Servicio técnico', to: '/reparaciones' },
  { label: 'Contacto', href: '#visitanos' },
]

const BENEFITS = [
  { icon: CreditCard, title: 'Pago seguro', text: 'MercadoPago', short: 'MercadoPago' },
  { icon: PackageCheck, title: 'Recoge en tienda', text: 'Tu pedido listo hoy', short: 'Listo hoy' },
  { icon: Store, title: 'Tienda física', text: 'Visítanos en Toluca', short: 'Toluca' },
  { icon: ShieldCheck, title: 'Garantía', text: 'Productos originales', short: 'Originales' },
]

const WHAT_WE_DO = [
  {
    icon: ShoppingCart,
    title: 'Tienda en línea',
    text: 'Pesas, barras, máquinas, accesorios, suplementación y ropa deportiva. Compra con MercadoPago y recoge en tienda el mismo día.',
    short: 'Pesas, máquinas, accesorios y ropa. Recoge en tienda el mismo día.',
    linkLabel: 'Ver catálogo',
    to: '/catalogo',
  },
  {
    icon: Settings,
    title: 'Refacciones',
    text: 'Refacciones originales y de alta precisión para caminadoras, bicicletas, elípticas y multiestaciones. En stock o sobre pedido para tu equipo.',
    short: 'Originales y de alta precisión. En stock o sobre pedido para tu equipo.',
    linkLabel: 'Ver refacciones',
    to: '/catalogo/refacciones',
  },
  {
    icon: Wrench,
    title: 'Reparación y mantenimiento',
    text: 'Diagnóstico en tienda, mantenimiento preventivo y correctivo. Atención a gimnasios, estudios y equipo de casa.',
    short: 'Diagnóstico en tienda y servicio a gimnasios y equipo de casa.',
    linkLabel: 'Conocer el servicio',
    to: '/reparaciones',
  },
]

const SERVICE_STEPS = [
  {
    n: 1,
    title: 'Revisión técnica',
    text: 'Trae tu equipo o agenda la visita para diagnosticar con precisión.',
  },
  {
    n: 2,
    title: 'Cotización',
    text: 'Recibes cotización de mano de obra y refacciones, clara y por escrito.',
  },
  {
    n: 3,
    title: 'Refacciones',
    text: 'Se piden sobre pedido para tu equipo; también puedes recogerlas en tienda.',
  },
  {
    n: 4,
    title: 'Reparación y entrega',
    text: 'Reparamos y confirmamos contigo el funcionamiento correcto del equipo.',
  },
]

const PART_CHIPS = [
  { icon: Activity, label: 'Caminadoras' },
  { icon: Bike, label: 'Bicicletas fijas y spinning' },
  { icon: Settings, label: 'Elípticas y escaladoras' },
  { icon: Dumbbell, label: 'Multiestaciones y racks' },
  { icon: Wrench, label: 'Bancos, prensas y poleas' },
]

const SOCIALS = [
  { name: 'Facebook', href: STORE.facebook, Icon: FacebookIcon },
  { name: 'Instagram', href: STORE.instagram, Icon: InstagramIcon },
  { name: 'TikTok', href: STORE.tiktok, Icon: TikTokIcon },
  { name: 'YouTube', href: STORE.youtube, Icon: YouTubeIcon },
].filter((s) => s.href)

const waService = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(
  'Hola, quiero cotizar el servicio técnico / mantenimiento de mi equipo.'
)}`
const waParts = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(
  'Hola, busco una refacción para mi equipo de gimnasio. Les comparto el modelo / una foto:'
)}`

// Cabecera propia de la landing: sin buscador (el buscador vive en la tienda).
function LandingHeader() {
  const [open, setOpen] = useState(false)

  const ctaRing = { boxShadow: '3px 3px 0 rgba(255,215,0,.9)' }

  return (
    <header className="sticky top-0 z-40">
      {/* Barra superior roja: dirección + horario + teléfono */}
      <div className="bg-brand-600 text-white">
        {/* Escritorio */}
        <div className="mx-auto hidden max-w-7xl items-center justify-between gap-4 px-4 py-[7px] text-xs font-bold lg:flex">
          <span className="flex min-w-0 items-center gap-[7px]">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{STORE.address}</span>
          </span>
          <span className="flex shrink-0 items-center gap-[18px]">
            <span className="flex items-center gap-[7px]">
              <Clock className="h-3.5 w-3.5" />
              {STORE.hours}
            </span>
            <span className="flex items-center gap-[7px]">
              <Phone className="h-3.5 w-3.5" />
              {STORE.phone}
            </span>
          </span>
        </div>
        {/* Móvil: una sola línea centrada */}
        <div className="flex items-center justify-center gap-[7px] px-4 py-[7px] text-[11px] font-bold lg:hidden">
          <Clock className="h-[13px] w-[13px] shrink-0" />
          <span className="truncate">
            {STORE.hours} · Toluca, Edo. Méx.
          </span>
        </div>
      </div>

      {/* Banda negra: logo + navegación + CTA */}
      <div className="relative bg-ink">
        <div className="mx-auto flex h-[60px] max-w-7xl items-center gap-3 px-4 lg:h-[76px] lg:gap-7">
          <Link to="/" className="inline-flex shrink-0 items-center">
            <img
              src="/brand/logotipo.png"
              alt={STORE.name}
              className="block h-[26px] w-auto lg:h-10"
            />
          </Link>

          <nav className="ml-3 hidden items-center gap-[26px] text-xs font-bold uppercase tracking-[.08em] lg:flex">
            <Link to="/" className="border-b-2 border-accent-400 pb-0.5 text-white">
              Inicio
            </Link>
            {NAV_LINKS.map((l) =>
              l.href ? (
                <a key={l.label} href={l.href} className="text-white/65 transition hover:text-white">
                  {l.label}
                </a>
              ) : (
                <Link key={l.label} to={l.to} className="text-white/65 transition hover:text-white">
                  {l.label}
                </Link>
              )
            )}
          </nav>

          {/* CTA: sticker rojo con doble contorno y sombra amarilla */}
          <Link
            to="/tienda"
            style={ctaRing}
            className="ml-auto hidden items-center gap-[9px] rounded-[10px] border-[3px] border-ink bg-brand-600 px-[18px] py-2.5 font-display text-xs font-extrabold uppercase tracking-[.08em] text-white outline-2 outline-brand-600 transition hover:bg-brand-700 lg:inline-flex"
          >
            <ShoppingCart className="h-4 w-4" />
            Ir a la tienda
          </Link>

          {/* Móvil: botón Tienda + hamburguesa */}
          <Link
            to="/tienda"
            style={{ boxShadow: '2px 2px 0 rgba(255,215,0,.9)' }}
            className="ml-auto inline-flex items-center gap-[7px] rounded-lg border-2 border-ink bg-brand-600 px-[13px] py-2 font-display text-[10.5px] font-extrabold uppercase tracking-[.06em] text-white transition hover:bg-brand-700 lg:hidden"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Tienda
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="grid h-10 w-10 place-items-center text-white lg:hidden"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          >
            {open ? <X className="h-[22px] w-[22px]" /> : <Menu className="h-[22px] w-[22px]" />}
          </button>
        </div>

        {/* Menú móvil desplegable */}
        {open && (
          <nav className="absolute inset-x-0 top-full border-t border-ink-line bg-ink lg:hidden">
            <div className="flex flex-col px-4 py-2 text-xs font-bold uppercase tracking-[.08em]">
              <Link to="/" onClick={() => setOpen(false)} className="py-3 text-white">
                Inicio
              </Link>
              {NAV_LINKS.map((l) =>
                l.href ? (
                  <a
                    key={l.label}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="py-3 text-white/65 transition hover:text-white"
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    key={l.label}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="py-3 text-white/65 transition hover:text-white"
                  >
                    {l.label}
                  </Link>
                )
              )}
            </div>
            <div className="h-[3px] bg-gradient-to-r from-accent-400 to-brand-600" />
          </nav>
        )}
      </div>
    </header>
  )
}

// Landing corporativa (diseño "Entrega MBGSPORT", pantallas 01 y 02):
// presenta los tres frentes del negocio y antecede a la tienda (/tienda).
export default function Landing() {
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    getProducts({ featured: true })
      .then((prods) => setFeatured(prods.slice(0, 4)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-white text-fg">
      <LandingHeader />

      <main className="flex-1">
        {/* Hero amarillo con patrón de puntos */}
        <section className="relative overflow-hidden bg-accent-400" style={DOTS_STYLE}>
          <div className="mx-auto flex max-w-7xl flex-col px-5 pb-9 pt-8 lg:flex-row lg:items-center lg:gap-8 lg:px-12 lg:pb-[60px] lg:pt-14">
            <div className="min-w-0 flex-1">
              <span className="inline-block bg-ink px-2.5 py-1.5 font-display text-[10px] font-extrabold uppercase tracking-[.14em] text-accent-400 lg:px-3 lg:text-xs">
                <span className="lg:hidden">{STORE.name} · Toluca</span>
                <span className="hidden lg:inline">
                  {STORE.name} · {STORE.tagline}
                </span>
              </span>
              <h1 className="mt-3.5 font-display text-[34px] font-black uppercase leading-[.95] tracking-[-.01em] text-fg lg:mt-[18px] lg:text-[62px] lg:leading-[.94]">
                Venta, refacciones y <span style={OUTLINE_STYLE}>reparación</span> de equipo de
                gimnasio
              </h1>
              <p className="mt-[18px] hidden max-w-[500px] text-base font-semibold leading-relaxed text-fg lg:block">
                El aliado integral del mundo fitness en Toluca. Equipo, refacciones, suplementación
                y ropa deportiva — con servicio técnico especializado para gimnasios y equipo de
                casa.
              </p>

              {/* Isotipo (solo móvil, entre el titular y los CTAs) */}
              <div className="relative mx-auto mt-5 w-[210px] lg:hidden">
                <img
                  src="/brand/isotipo.png"
                  alt={`Isotipo ${STORE.name}`}
                  className="block w-[210px]"
                  style={{ filter: 'drop-shadow(0 16px 16px rgba(0,0,0,.28))' }}
                />
              </div>

              <div className="mt-[22px] flex flex-col gap-3 lg:mt-[26px] lg:flex-row lg:gap-4">
                <Link to="/tienda" className="btn-primary w-full lg:w-auto lg:px-7 lg:py-4">
                  Entrar a la tienda
                  <ArrowRight className="h-4 w-4 text-accent-400" strokeWidth={2.5} />
                </Link>
                <Link to="/reparaciones" className="btn-sticker w-full lg:w-auto">
                  <Wrench className="h-4 w-4" />
                  Cotizar reparación
                </Link>
              </div>
            </div>

            {/* Isotipo (escritorio) */}
            <div className="relative hidden w-[430px] shrink-0 lg:block">
              <img
                src="/brand/isotipo.png"
                alt={`Isotipo ${STORE.name}`}
                className="mx-auto block w-[400px]"
                style={{ filter: 'drop-shadow(0 24px 24px rgba(0,0,0,.28))' }}
              />
            </div>
          </div>
        </section>

        {/* Banda negra de beneficios */}
        <section className="bg-ink">
          <div className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b, i) => (
              <div
                key={b.title}
                className={`flex items-center gap-[11px] px-4 py-3.5 lg:gap-3.5 lg:px-6 lg:py-[18px] ${
                  i % 2 === 1 ? 'border-l border-ink-line' : ''
                } ${i >= 2 ? 'border-t border-ink-line lg:border-t-0' : ''} ${
                  i > 0 ? 'lg:border-l lg:border-ink-line' : ''
                }`}
              >
                <b.icon
                  className="h-5 w-5 shrink-0 text-accent-400 lg:h-[22px] lg:w-[22px]"
                  strokeWidth={1.8}
                />
                <div className="min-w-0">
                  <p className="text-[11.5px] font-bold uppercase tracking-[.04em] text-white lg:text-[13px]">
                    {b.title}
                  </p>
                  <p className="truncate text-[10.5px] font-medium text-[#9a9aa0] lg:text-xs">
                    <span className="lg:hidden">{b.short}</span>
                    <span className="hidden lg:inline">{b.text}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ¿Qué hacemos?: los tres frentes del negocio */}
        <section className="mx-auto max-w-7xl px-4 pt-9 lg:px-6 lg:pt-14">
          <h2 className="title-stamp text-lg lg:text-2xl">
            <span>¿Qué hacemos?</span>
          </h2>
          <div className="mt-5 flex flex-col gap-4 lg:mt-7 lg:grid lg:grid-cols-3 lg:gap-5">
            {WHAT_WE_DO.map((item) => (
              <div
                key={item.title}
                className="flex gap-3.5 rounded-[10px] border-2 border-ink bg-white p-4 shadow-hard-sm lg:flex-col lg:p-6 lg:shadow-hard"
              >
                <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-lg border-2 border-ink bg-accent-400 text-fg lg:h-[52px] lg:w-[52px]">
                  <item.icon className="h-[21px] w-[21px] lg:h-6 lg:w-6" strokeWidth={1.75} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col lg:gap-3.5">
                  <h3 className="font-display text-sm font-extrabold uppercase text-fg lg:text-[17px]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-[#4a4a4a] lg:mt-0 lg:text-[13.5px]">
                    <span className="lg:hidden">{item.short}</span>
                    <span className="hidden lg:inline">{item.text}</span>
                  </p>
                  <Link
                    to={item.to}
                    className="mt-auto hidden items-center gap-2 pt-3 text-[13px] font-bold text-fg underline underline-offset-4 transition hover:text-brand-600 lg:inline-flex"
                  >
                    {item.linkLabel}
                    <ArrowRight className="h-3.5 w-3.5 text-brand-600" strokeWidth={2.5} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Directo de la tienda: productos destacados reales */}
        <section className="mx-auto max-w-7xl px-4 pt-9 lg:px-6 lg:pt-14">
          <div className="flex items-center justify-between">
            <h2 className="title-stamp text-lg lg:text-2xl">
              <span>
                <span className="lg:hidden">La tienda</span>
                <span className="hidden lg:inline">Directo de la tienda</span>
              </span>
            </h2>
            <Link to="/catalogo" className="text-xs font-bold text-fg underline lg:text-[13px]">
              <span className="lg:hidden">Ver todo</span>
              <span className="hidden lg:inline">Ver todo el catálogo</span>
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-14">
              <Spinner />
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 lg:mt-7 lg:grid-cols-4 lg:gap-5">
              {featured.map((p, i) => (
                <div key={p.id} className={i >= 2 ? 'hidden lg:block' : ''}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
          <Link
            to="/catalogo"
            className="btn-primary mt-4 flex w-full py-3.5 text-xs lg:hidden"
          >
            Ver todo el catálogo
            <ArrowRight className="h-[15px] w-[15px] text-accent-400" strokeWidth={2.5} />
          </Link>
        </section>

        {/* Servicio técnico: banda roja con el proceso en 4 pasos */}
        <section className="mt-9 bg-brand-600 lg:mt-14">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-9 lg:grid-cols-[1.05fr_.95fr] lg:gap-10 lg:px-12 lg:py-14">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[.18em] text-accent-400 lg:text-xs">
                Servicio técnico
              </span>
              <h3 className="mt-2.5 font-display text-[26px] font-black uppercase leading-none text-white lg:mt-3 lg:text-[38px]">
                Reparación y mantenimiento de equipos
              </h3>
              <p className="mt-3 max-w-[480px] text-[13px] font-medium leading-relaxed text-white/90 lg:mt-3.5 lg:text-[15px]">
                Diagnóstico en tienda, refacciones de alta precisión y mantenimiento preventivo o
                correctivo para gimnasios y equipo de casa.
              </p>
              <ul className="mt-3.5 space-y-[9px] lg:mt-4 lg:space-y-2.5">
                <li className="flex items-center gap-2.5 text-[12.5px] font-semibold text-white lg:text-[13.5px]">
                  <Check className="h-4 w-4 shrink-0 text-accent-400" strokeWidth={3} />
                  Refacciones originales en stock
                </li>
                <li className="flex items-center gap-2.5 text-[12.5px] font-semibold text-white lg:text-[13.5px]">
                  <Check className="h-4 w-4 shrink-0 text-accent-400" strokeWidth={3} />
                  Atención a gimnasios, estudios y hogar
                </li>
                <li className="flex items-center gap-2.5 text-[12.5px] font-semibold text-white lg:text-[13.5px]">
                  <Check className="h-4 w-4 shrink-0 text-accent-400" strokeWidth={3} />
                  <span className="lg:hidden">Funcionamiento confirmado contigo</span>
                  <span className="hidden lg:inline">
                    El funcionamiento se confirma contigo al entregar
                  </span>
                </li>
              </ul>
              <div className="mt-5 flex flex-col gap-4 lg:mt-[26px] lg:flex-row lg:items-center lg:gap-5">
                <a
                  href={waService}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-sticker-yellow w-full lg:w-auto"
                >
                  <MessageCircle className="h-[17px] w-[17px]" />
                  Cotizar por WhatsApp
                </a>
                <Link
                  to="/reparaciones"
                  className="hidden text-[12.5px] font-bold text-white underline underline-offset-4 transition hover:text-accent-300 lg:inline"
                >
                  Ver refacciones
                </Link>
              </div>
            </div>

            {/* Pasos numerados (solo escritorio) */}
            <div className="hidden content-center gap-[18px] lg:grid lg:grid-cols-2">
              {SERVICE_STEPS.map((s) => (
                <div
                  key={s.n}
                  className="relative rounded-[10px] border-2 border-ink bg-white px-[18px] pb-[18px] pt-[26px] shadow-hard"
                >
                  <span className="absolute -top-4 left-3.5 grid h-[34px] w-[34px] place-items-center rounded-full border-2 border-ink bg-accent-400 font-display text-[15px] font-black text-fg shadow-hard-sm">
                    {s.n}
                  </span>
                  <p className="font-display text-[13.5px] font-extrabold uppercase text-fg">
                    {s.title}
                  </p>
                  <p className="mt-[7px] text-xs font-medium leading-relaxed text-[#4a4a4a]">
                    {s.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Refacciones: banda amarilla (solo escritorio, según diseño) */}
        <section
          className="hidden border-y-2 border-ink bg-accent-400 lg:block"
          style={DOTS_STYLE}
        >
          <div className="mx-auto grid max-w-7xl grid-cols-[1fr_340px] gap-12 px-12 py-12">
            <div>
              <h2 className="font-display text-[30px] font-black uppercase text-fg">
                Refacciones para todo tu equipo
              </h2>
              <p className="mt-3 max-w-[560px] text-sm font-semibold leading-relaxed text-fg">
                Piezas de alta precisión, solicitadas específicamente para tu equipo o disponibles
                en stock:
              </p>
              <div className="mt-[18px] flex flex-wrap gap-2.5">
                {PART_CHIPS.map((c) => (
                  <span
                    key={c.label}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-[15px] py-[7px] text-xs font-bold uppercase text-fg"
                  >
                    <c.icon className="h-[15px] w-[15px]" strokeWidth={2} />
                    {c.label}
                  </span>
                ))}
              </div>
              <Link to="/catalogo/refacciones" className="btn-primary mt-6 px-[26px]">
                Ver refacciones en la tienda
                <ArrowRight className="h-4 w-4 text-accent-400" strokeWidth={2.5} />
              </Link>
            </div>
            <div className="sticker self-center p-[22px]">
              <p className="font-display text-sm font-extrabold uppercase text-fg">
                ¿No encuentras la pieza?
              </p>
              <p className="mt-2 text-[13px] font-medium leading-relaxed text-[#4a4a4a]">
                La pedimos por ti. Escríbenos con una foto o el modelo de tu equipo y te cotizamos
                la refacción exacta.
              </p>
              <a
                href={waParts}
                target="_blank"
                rel="noreferrer"
                className="mt-3.5 inline-flex w-full items-center justify-center gap-[9px] rounded-[10px] border-[3px] border-ink bg-brand-600 px-4 py-[11px] font-display text-xs font-extrabold uppercase tracking-[.06em] text-white shadow-hard-sm transition hover:bg-brand-700 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                <MessageCircle className="h-4 w-4" />
                Cotizar por WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* Visítanos: datos de contacto + mapa */}
        <section id="visitanos" className="mx-auto max-w-7xl scroll-mt-32 px-4 pt-9 lg:px-6 lg:pt-14">
          <h2 className="title-stamp text-lg lg:text-2xl">
            <span>Visítanos</span>
          </h2>

          {/* Escritorio: texto + lista + redes | mapa */}
          <div className="mt-7 hidden grid-cols-[1fr_1.1fr] items-start gap-10 lg:grid">
            <div>
              <p className="max-w-[460px] text-[15px] font-semibold leading-[1.7] text-fg">
                {STORE.name} es una tienda física en Toluca con venta en línea a todo México. Ven a
                conocer el equipo, recoger tu pedido o dejar tu máquina en servicio.
              </p>
              <ul className="mt-[22px] space-y-3.5 text-[13.5px] font-medium text-[#4a4a4a]">
                <li className="flex gap-[11px]">
                  <MapPin className="mt-0.5 h-[17px] w-[17px] shrink-0 text-brand-600" strokeWidth={2} />
                  <span>{STORE.address}</span>
                </li>
                <li className="flex gap-[11px]">
                  <Clock className="h-[17px] w-[17px] shrink-0 text-brand-600" strokeWidth={2} />
                  {STORE.hours}
                </li>
                <li className="flex gap-[11px]">
                  <Phone className="h-[17px] w-[17px] shrink-0 text-brand-600" strokeWidth={2} />
                  {STORE.phone}
                </li>
                <li className="flex gap-[11px]">
                  <Mail className="h-[17px] w-[17px] shrink-0 text-brand-600" strokeWidth={2} />
                  {STORE.email}
                </li>
              </ul>
              <div className="mt-6 flex gap-3">
                {SOCIALS.map(({ name, href, Icon }) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={name}
                    title={name}
                    className="grid h-[38px] w-[38px] place-items-center rounded-lg border-2 border-ink bg-white text-fg shadow-hard-sm transition hover:-translate-y-0.5"
                  >
                    <Icon className="h-[17px] w-[17px]" />
                  </a>
                ))}
              </div>
            </div>

            <div className="sticker overflow-hidden">
              <iframe
                title={`Mapa · ${STORE.name}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(STORE.address)}&output=embed`}
                className="block h-[280px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="flex items-center justify-between gap-3.5 border-t-2 border-ink px-[18px] py-3.5">
                <span className="text-[12.5px] font-semibold text-[#4a4a4a]">
                  Plaza Zamarrero · estacionamiento disponible
                </span>
                <a
                  href={STORE.maps}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-ink px-4 py-2.5 font-display text-[11px] font-extrabold uppercase tracking-[.06em] text-white transition hover:bg-ink-2"
                >
                  <MapPin className="h-[13px] w-[13px] text-accent-400" strokeWidth={2} />
                  Cómo llegar
                </a>
              </div>
            </div>
          </div>

          {/* Móvil: tarjeta única con mapa + datos */}
          <div className="sticker-sm mt-5 overflow-hidden lg:hidden">
            <iframe
              title={`Mapa · ${STORE.name}`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(STORE.address)}&output=embed`}
              className="block h-[150px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="border-t-2 border-ink p-4">
              <ul className="space-y-[11px] text-[12.5px] font-medium text-[#4a4a4a]">
                <li className="flex gap-2.5">
                  <MapPin className="mt-0.5 h-[15px] w-[15px] shrink-0 text-brand-600" strokeWidth={2} />
                  {STORE.address}
                </li>
                <li className="flex gap-2.5">
                  <Clock className="h-[15px] w-[15px] shrink-0 text-brand-600" strokeWidth={2} />
                  {STORE.hours}
                </li>
                <li className="flex gap-2.5">
                  <Phone className="h-[15px] w-[15px] shrink-0 text-brand-600" strokeWidth={2} />
                  {STORE.phone}
                </li>
              </ul>
              <a
                href={STORE.maps}
                target="_blank"
                rel="noreferrer"
                className="mt-3.5 flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-[11px] font-display text-[11px] font-extrabold uppercase tracking-[.06em] text-white transition hover:bg-ink-2"
              >
                <MapPin className="h-[13px] w-[13px] text-accent-400" strokeWidth={2} />
                Cómo llegar
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer bottomNavSpace={false} />
    </div>
  )
}
