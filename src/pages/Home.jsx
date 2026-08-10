import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, MessageCircle } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import CategoryIcon from '../components/CategoryIcon'
import Spinner from '../components/Spinner'
import StoreBanner from '../components/StoreBanner'
import { getCategories, getProducts } from '../lib/api'
import { STORE } from '../config'

const SERVICE_POINTS = [
  'Refacciones originales en stock',
  'Atención a gimnasios y estudios',
  'Mantenimiento preventivo y correctivo',
]

// Home de la tienda (diseño "Entrega MBGSPORT", pantallas 03/04): banner comercial
// administrable en lugar del hero de marca — el hero vive ahora en la landing (/).
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
      {/* Banner comercial administrable (carrusel) */}
      <StoreBanner fallbackProducts={featured} />

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
              <Link to="/reparaciones" className="self-center text-[12.5px] font-bold text-white underline underline-offset-4 transition hover:text-accent-300">
                Conoce el servicio completo
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
    </div>
  )
}
