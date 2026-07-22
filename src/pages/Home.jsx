import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  PackageCheck,
  ShieldCheck,
  CreditCard,
  Store,
  Check,
  MessageCircle,
  Wrench,
} from 'lucide-react'
import ProductCard from '../components/ProductCard'
import CategoryIcon from '../components/CategoryIcon'
import Spinner from '../components/Spinner'
import { getCategories, getProducts } from '../lib/api'
import { STORE } from '../config'

const BENEFITS = [
  { icon: CreditCard, title: 'Pago seguro', text: 'MercadoPago' },
  { icon: PackageCheck, title: 'Recoge en tienda', text: 'Tu pedido listo hoy' },
  { icon: Store, title: 'Tienda física', text: 'Visítanos en Toluca' },
  { icon: ShieldCheck, title: 'Garantía', text: 'Productos originales' },
]

const SERVICE_POINTS = [
  'Refacciones originales en stock',
  'Diagnóstico sin costo en tienda',
  'Atención a gimnasios y estudios',
]

// Contorno blanco con borde negro para la palabra destacada del hero (póster 1b).
const OUTLINE_STYLE = {
  color: '#fff',
  textShadow:
    '-3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 3px 3px 0 #000, 8px 8px 0 rgba(0,0,0,.18)',
}

// Patrón de puntos del hero amarillo.
const DOTS_STYLE = {
  backgroundImage: 'radial-gradient(rgba(0,0,0,.07) 1.5px, transparent 1.5px)',
  backgroundSize: '16px 16px',
}

export default function Home() {
  const [categories, setCategories] = useState([])
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getCategories(), getProducts({ featured: true })])
      .then(([cats, prods]) => {
        setCategories(cats)
        setFeatured(prods.slice(0, 8))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const waLink = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(
    'Hola, quiero cotizar el servicio técnico / mantenimiento de mi equipo.'
  )}`

  return (
    <div>
      {/* Hero amarillo con patrón de puntos (diseño 1b) */}
      <section className="relative overflow-hidden bg-accent-400" style={DOTS_STYLE}>
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 py-10 lg:flex-row lg:gap-8 lg:py-14">
          <div className="w-full min-w-0 flex-1">
            <span className="inline-block bg-ink px-3 py-1.5 font-display text-[10px] font-extrabold uppercase tracking-[.14em] text-accent-400 sm:text-xs">
              {STORE.name} · Toluca
            </span>
            <h1 className="mt-4 font-display text-[35px] font-black uppercase leading-[.92] tracking-[-.01em] text-fg sm:text-6xl lg:text-[74px]">
              El <span style={OUTLINE_STYLE}>estándar</span> en tu entrenamiento
            </h1>
            <p className="mt-4 hidden max-w-[480px] text-base font-semibold leading-relaxed text-fg sm:block">
              {STORE.description}
            </p>
            <div className="mt-6 flex flex-col gap-4 sm:flex-row">
              <Link to="/catalogo" className="btn-primary">
                Ver catálogo
                <ArrowRight className="h-4 w-4 text-accent-400" strokeWidth={2.5} />
              </Link>
              <a href="#servicio" className="btn-sticker">
                <Wrench className="h-4 w-4" />
                Servicio técnico
              </a>
            </div>
          </div>

          {/* Isotipo con sticker de promo */}
          <div className="relative w-[240px] shrink-0 lg:w-[430px]">
            <img
              src="/brand/isotipo.png"
              alt={`Isotipo ${STORE.name}`}
              className="mx-auto block w-[210px] lg:w-[400px]"
              style={{ filter: 'drop-shadow(0 24px 24px rgba(0,0,0,.28))' }}
            />
            <Link
              to="/promociones"
              className="absolute -left-1.5 top-1.5 rotate-[-8deg] rounded-[10px] border-[3px] border-ink bg-brand-600 px-3 py-2 font-display text-[11px] font-extrabold uppercase text-white shadow-hard-sm transition hover:bg-brand-700 lg:px-4 lg:py-2.5 lg:text-[15px]"
            >
              −15% en tu 1ª compra
            </Link>
          </div>
        </div>
      </section>

      {/* Beneficios: banda negra con iconos amarillos */}
      <section className="bg-ink">
        <div className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b, i) => (
            <div
              key={b.title}
              className={`flex items-center gap-3.5 px-4 py-4 lg:px-6 ${
                i > 0 ? 'lg:border-l lg:border-ink-line' : ''
              }`}
            >
              <b.icon className="h-[22px] w-[22px] shrink-0 text-accent-400" strokeWidth={1.8} />
              <div className="min-w-0">
                <p className="text-[13px] font-bold uppercase tracking-[.04em] text-white">
                  {b.title}
                </p>
                <p className="truncate text-xs font-medium text-[#9a9aa0]">{b.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categorías */}
      <section id="categorias" className="mx-auto max-w-7xl scroll-mt-32 px-4 pt-10 lg:pt-14">
        <div className="flex items-center justify-between">
          <h2 className="title-stamp text-lg sm:text-2xl">
            <span>Categorías</span>
          </h2>
          <Link to="/catalogo" className="text-[13px] font-bold text-fg underline">
            Ver todo
          </Link>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/catalogo/${c.slug}`}
              className="sticker group flex flex-col items-center gap-3 p-5 text-center transition hover:-translate-y-0.5"
            >
              <span className="grid h-[52px] w-[52px] place-items-center rounded-lg border-2 border-ink bg-accent-400 text-fg">
                <CategoryIcon category={c} className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <span className="text-[12.5px] font-bold uppercase text-fg">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Productos destacados */}
      <section className="mx-auto max-w-7xl px-4 pt-10 lg:pt-14">
        <div className="flex items-center justify-between">
          <h2 className="title-stamp text-lg sm:text-2xl">
            <span>Destacados</span>
          </h2>
          <Link to="/catalogo" className="text-[13px] font-bold text-fg underline">
            Ver todo
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Servicio técnico (banda roja, diseño 1b) */}
      <section id="servicio" className="mt-12 scroll-mt-24 bg-brand-600 lg:mt-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-10 lg:py-14">
          <div>
            <span className="text-xs font-bold uppercase tracking-[.18em] text-accent-400">
              Servicio técnico
            </span>
            <h3 className="mt-3 font-display text-3xl font-black uppercase leading-none text-white lg:text-[38px]">
              Reparación y mantenimiento de equipos
            </h3>
            <p className="mt-3.5 max-w-[480px] text-[15px] font-medium leading-relaxed text-white/90">
              Diagnóstico en tienda, refacciones de alta precisión y mantenimiento preventivo para
              gimnasios y equipo de casa.
            </p>
            <ul className="mt-4 space-y-2.5">
              {SERVICE_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-2.5 text-[13.5px] font-semibold text-white"
                >
                  <Check className="h-4 w-4 shrink-0 text-accent-400" strokeWidth={3} />
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-4">
              <a href={waLink} target="_blank" rel="noreferrer" className="btn-sticker-yellow">
                <MessageCircle className="h-[17px] w-[17px]" />
                Cotizar por WhatsApp
              </a>
              <Link to="/terminos" className="self-center text-[12.5px] font-bold text-white underline underline-offset-4 transition hover:text-accent-300">
                Términos del servicio
              </Link>
            </div>
          </div>
          <div className="grid min-h-[220px] place-items-center border-[3px] border-ink bg-black/20 lg:min-h-[300px]">
            <img
              src="/brand/isotipo.png"
              alt=""
              className="w-[170px] opacity-90 lg:w-[220px]"
              style={{ filter: 'drop-shadow(0 12px 14px rgba(0,0,0,.35))' }}
            />
          </div>
        </div>
      </section>

      {/* Cupón de bienvenida (banda negra, diseño 1b) */}
      <section className="bg-ink">
        <Link
          to="/promociones"
          className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 px-4 py-10 text-center sm:flex-row sm:gap-11 sm:py-12 sm:text-left"
        >
          <span className="font-display text-6xl font-black leading-none text-accent-400 sm:text-8xl">
            −15%
          </span>
          <div>
            <h3 className="font-display text-xl font-extrabold uppercase text-white sm:text-[26px]">
              En tu primera compra
            </h3>
            <p className="mt-1 text-sm font-medium text-[#9a9aa0]">con el código</p>
            <span className="mt-2.5 inline-block rounded-lg bg-white px-4 py-2 font-mono text-base font-bold tracking-[.18em] text-fg">
              MBG15
            </span>
          </div>
        </Link>
      </section>
    </div>
  )
}
