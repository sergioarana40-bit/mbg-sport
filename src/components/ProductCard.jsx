import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Check } from 'lucide-react'
import ProductImage from './ProductImage'
import { formatPrice } from '../config'
import { useCart } from '../context/CartContext'

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const outOfStock = product.stock === 0

  function handleAdd(e) {
    e.preventDefault()
    if (outOfStock) return
    addItem(product, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <Link
      to={`/producto/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-0.5 hover:border-brand-500/40"
    >
      <div className="relative">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          className="aspect-square"
        />
        {product.featured && (
          <span className="badge-featured absolute left-2 top-2">Destacado</span>
        )}
        {outOfStock && <span className="badge-out absolute right-2 top-2">Agotado</span>}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        {product.category_name && (
          <span className="mb-1 text-[11px] font-medium uppercase tracking-wide text-brand-400">
            {product.category_name}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold text-fg transition group-hover:text-brand-400">
          {product.name}
        </h3>
        <div className="mt-auto flex items-end justify-between pt-3">
          <span className="font-display text-lg font-bold text-fg">
            {formatPrice(product.price)}
          </span>
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            aria-label="Agregar al carrito"
            className={`grid h-9 w-9 place-items-center rounded-lg transition ${
              outOfStock
                ? 'cursor-not-allowed bg-surface-2 text-fg-subtle'
                : added
                  ? 'bg-emerald-600 text-white'
                  : 'bg-brand-600 text-white hover:bg-brand-700 active:scale-95'
            }`}
          >
            {added ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </Link>
  )
}
