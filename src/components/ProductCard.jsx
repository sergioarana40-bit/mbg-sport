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
      className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          className="aspect-square"
        />
        {product.featured && (
          <span className="absolute left-2 top-2 rounded-full bg-accent-400 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-neutral-900">
            Destacado
          </span>
        )}
        {outOfStock && (
          <span className="absolute right-2 top-2 rounded-full bg-neutral-900/80 px-2 py-0.5 text-[11px] font-semibold text-white">
            Agotado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        {product.category_name && (
          <span className="mb-1 text-[11px] font-medium uppercase tracking-wide text-brand-600">
            {product.category_name}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold text-neutral-900 group-hover:text-brand-700">
          {product.name}
        </h3>
        <div className="mt-auto flex items-end justify-between pt-3">
          <span className="font-display text-lg font-bold text-neutral-900">
            {formatPrice(product.price)}
          </span>
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            aria-label="Agregar al carrito"
            className={`grid h-9 w-9 place-items-center rounded-lg transition ${
              outOfStock
                ? 'cursor-not-allowed bg-neutral-100 text-neutral-300'
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
