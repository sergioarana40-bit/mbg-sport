import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ProductImage from './ProductImage'
import { formatPrice } from '../config'
import { getBanners } from '../lib/api'

// Banner comercial de la home de la tienda (diseño "Entrega MBGSPORT", pantallas 03/04).
// Los banners se administran desde /admin/banner; si no hay ninguno activo se usan
// los productos destacados como respaldo para que la portada nunca quede vacía.

const ROTATE_MS = 6000

// Normaliza un banner de Supabase (con join a products) al shape del carrusel.
function bannerToSlide(b) {
  const p = b.products
  const cat = p?.categories
  return {
    id: b.id,
    title: b.title,
    description: b.description || '',
    image: b.image_url || p?.image_url || '',
    price: p ? p.price : null,
    ctaLabel: b.cta_label || 'Ver producto',
    to: p ? `/producto/${p.id}` : '/catalogo',
    categoryName: cat?.name || null,
    categorySlug: cat?.slug || null,
  }
}

// Respaldo: convierte un producto destacado en banner.
function productToSlide(p) {
  return {
    id: p.id,
    title: p.name,
    description: p.description || '',
    image: p.image_url || '',
    price: p.price,
    ctaLabel: 'Ver producto',
    to: `/producto/${p.id}`,
    categoryName: p.categories?.name || p.category_name || null,
    categorySlug: p.categories?.slug || null,
  }
}

export default function StoreBanner({ fallbackProducts = [] }) {
  const [banners, setBanners] = useState(null) // null mientras carga
  const [index, setIndex] = useState(0)

  useEffect(() => {
    getBanners()
      .then((list) => setBanners(list.map(bannerToSlide)))
      .catch(() => setBanners([]))
  }, [])

  const slides =
    banners && banners.length > 0
      ? banners
      : fallbackProducts.slice(0, 3).map(productToSlide)

  // Si la lista cambia de tamaño (p. ej. llegan los banners), evita quedar fuera de rango.
  useEffect(() => {
    if (index >= slides.length && slides.length > 0) setIndex(0)
  }, [index, slides.length])

  // Rotación automática; se reinicia al cambiar manualmente de banner.
  useEffect(() => {
    if (slides.length <= 1) return undefined
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length)
    }, ROTATE_MS)
    return () => clearInterval(t)
  }, [slides.length, index])

  if (slides.length === 0) return null
  const current = Math.min(index, slides.length - 1)

  return (
    <section className="border-t border-ink-line bg-ink">
      <div className="mx-auto max-w-7xl px-5 pb-4 pt-6 lg:px-12 lg:py-10">
        {/* Los banners se apilan en la misma celda y se funden entre sí (fade 400 ms) */}
        <div className="grid">
          {slides.map((s, i) => (
            <div
              key={s.id}
              aria-hidden={i !== current}
              className={`col-start-1 row-start-1 transition-opacity duration-[400ms] ease-in-out ${
                i === current ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <div className="lg:grid lg:grid-cols-[1fr_400px] lg:items-center lg:gap-12">
                <div>
                  <span className="inline-block bg-accent-400 px-[9px] py-1 font-display text-[10px] font-extrabold uppercase tracking-[.14em] text-fg lg:px-[11px] lg:py-[5px] lg:text-[11px]">
                    Destacado de la semana
                  </span>
                  <h1 className="mt-3 font-display text-[26px] font-black uppercase leading-[.96] text-white lg:mt-4 lg:text-[46px]">
                    {s.title}
                  </h1>
                  {s.description && (
                    <p className="mt-3.5 hidden max-w-[460px] text-sm font-medium leading-relaxed text-[#9a9aa0] lg:block">
                      {s.description}
                    </p>
                  )}

                  {/* Foto (móvil): tarjeta 16:9 con sombra amarilla */}
                  <div
                    className="mt-4 overflow-hidden rounded-[10px] border-2 border-ink bg-white lg:hidden"
                    style={{ boxShadow: '4px 4px 0 #FFD700' }}
                  >
                    <ProductImage src={s.image} alt={s.title} className="aspect-video" />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3.5 lg:mt-[22px] lg:justify-start lg:gap-5">
                    {s.price != null && (
                      <span className="price-tag text-lg lg:text-2xl">{formatPrice(s.price)}</span>
                    )}
                    <Link
                      to={s.to}
                      style={{ boxShadow: '3px 3px 0 rgba(255,215,0,.9)' }}
                      className="inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-ink bg-brand-600 px-4 py-2.5 font-display text-[11px] font-extrabold uppercase tracking-[.06em] text-white transition hover:bg-brand-700 lg:gap-2.5 lg:rounded-[10px] lg:border-[3px] lg:px-6 lg:py-3 lg:text-[13px] lg:tracking-[.08em] lg:outline-2 lg:outline-brand-600"
                    >
                      {s.ctaLabel}
                      <ArrowRight className="h-[13px] w-[13px] lg:h-4 lg:w-4" strokeWidth={2.5} />
                    </Link>
                    {s.categorySlug && (
                      <Link
                        to={`/catalogo/${s.categorySlug}`}
                        className="hidden text-[12.5px] font-bold text-white underline underline-offset-4 transition hover:text-accent-300 lg:inline"
                      >
                        Ver todo {s.categoryName?.toLowerCase()}
                      </Link>
                    )}
                  </div>
                </div>

                {/* Foto (escritorio): tarjeta 4:3 con sombra amarilla */}
                <div
                  className="hidden overflow-hidden rounded-[10px] border-2 border-ink bg-white lg:block"
                  style={{ boxShadow: '5px 5px 0 #FFD700' }}
                >
                  <ProductImage src={s.image} alt={s.title} className="aspect-[4/3]" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dots del carrusel */}
        {slides.length > 1 && (
          <div className="mt-4 flex justify-center gap-1.5 lg:mt-[18px] lg:gap-[7px]">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIndex(i)}
                aria-label={`Ver banner ${i + 1}`}
                className={`h-[6px] rounded-full transition-all duration-300 lg:h-[7px] ${
                  i === current
                    ? 'w-[18px] bg-accent-400 lg:w-[22px]'
                    : 'w-[6px] bg-[#3a3a40] hover:bg-[#55555c] lg:w-[7px]'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
