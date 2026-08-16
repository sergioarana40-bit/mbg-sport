import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Check } from 'lucide-react'
import ProductImage from './ProductImage'
import FavoriteButton from './FavoriteButton'
import { formatPrice, hasPrice } from '../config'
import { useCart } from '../context/CartContext'

// Tarjeta de producto estilo sticker (borde negro + sombra dura, diseño 1b).
export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const noPrice = !hasPrice(product.price)
  const outOfStock = product.stock === 0

  function handleAdd(e) {
    e.preventDefault()
    if (outOfStock || noPrice) return
    addItem(product, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <Link
      to={`/producto/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-[10px] border-2 border-ink bg-white shadow-hard-sm transition hover:-translate-y-0.5 lg:shadow-hard"
    >
      <div className="relative">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          className="aspect-square border-b-2 border-ink"
        />
        {product.featured && (
          <span className="badge-featured absolute left-2 top-2">Destacado</span>
        )}
        {outOfStock && !noPrice && (
          <span className="badge-out absolute bottom-2 left-2">Agotado</span>
        )}
        <FavoriteButton
          productId={product.id}
          size={4}
          className="absolute right-2 top-2 h-[34px] w-[34px] rounded-lg border-2 border-ink bg-white text-fg"
        />
      </div>

      <div className="flex flex-1 flex-col p-3 lg:p-4">
        {product.category_name && (
          <span className="text-[10px] font-bold uppercase tracking-[.12em] text-fg-subtle">
            {product.category_name}
          </span>
        )}
        <h3 className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug text-fg lg:text-[14.5px]">
          {product.name}
        </h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3.5">
          {noPrice ? (
            <span className="rounded-md border-2 border-ink bg-accent-400 px-2 py-1 font-display text-[9.5px] font-extrabold uppercase leading-none text-fg">
              Precio por confirmar
            </span>
          ) : (
            <>
              <span className="price-tag text-sm lg:text-base">
                {formatPrice(product.price)}
              </span>
              <button
                onClick={handleAdd}
                disabled={outOfStock}
                aria-label="Agregar al carrito"
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition ${
                  outOfStock
                    ? 'cursor-not-allowed bg-surface-3 text-fg-subtle'
                    : added
                      ? 'bg-state-paid text-white'
                      : 'bg-ink text-white hover:bg-ink-2 active:scale-95'
                }`}
              >
                {added ? (
                  <Check className="h-[18px] w-[18px]" strokeWidth={2.5} />
                ) : (
                  <Plus className="h-[18px] w-[18px]" strokeWidth={2.5} />
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
