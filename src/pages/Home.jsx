import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Truck, ShieldCheck, CreditCard, Store } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import CategoryIcon from '../components/CategoryIcon'
import Spinner from '../components/Spinner'
import { getCategories, getProducts } from '../lib/api'
import { STORE } from '../config'

const BENEFITS = [
  { icon: CreditCard, title: 'Pago seguro', text: 'Paga con tarjeta vía MercadoPago' },
  { icon: Truck, title: 'Envíos', text: 'A todo México · gratis desde $1,500' },
  { icon: Store, title: 'Tienda física', text: 'Visítanos en Toluca' },
  { icon: ShieldCheck, title: 'Garantía', text: 'Productos originales' },
]

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

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-fg">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 100% at 85% 0%, rgba(220,38,38,0.45) 0%, rgba(220,38,38,0) 60%), radial-gradient(50% 80% at 0% 100%, rgba(234,179,8,0.12) 0%, rgba(234,179,8,0) 55%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-accent-400">
            {STORE.city}
          </span>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Todo para tu <span className="text-brand-500">entrenamiento</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-fg-muted sm:text-lg">
            {STORE.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/catalogo" className="btn-primary">
              Ver catálogo
              <ArrowRight className="h-4.5 w-4.5" />
            </Link>
            <a href="#categorias" className="btn-ghost">
              Categorías
            </a>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 py-6 sm:grid-cols-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex items-center gap-3 px-2 py-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-600/15 text-brand-400">
                <b.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-fg">{b.title}</p>
                <p className="text-xs text-fg-subtle">{b.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categorías */}
      <section id="categorias" className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold tracking-tight text-fg">
            Categorías
          </h2>
          <Link to="/catalogo" className="text-sm font-medium text-brand-400 hover:text-brand-300">
            Ver todo
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/catalogo/${c.slug}`}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-5 text-center transition hover:-translate-y-0.5 hover:border-brand-500/40"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-2 text-fg-muted transition group-hover:bg-brand-600 group-hover:text-white">
                <CategoryIcon category={c} className="h-7 w-7" />
              </span>
              <span className="text-sm font-semibold text-fg">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Productos destacados */}
      <section className="mx-auto max-w-7xl px-4 pb-4">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold tracking-tight text-fg">
            Destacados
          </h2>
          <Link to="/catalogo" className="text-sm font-medium text-brand-400 hover:text-brand-300">
            Ver todo
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
