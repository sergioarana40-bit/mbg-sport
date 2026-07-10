import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, ShoppingCart, Check, ChevronRight, Package } from 'lucide-react'
import ProductImage from '../components/ProductImage'
import Spinner from '../components/Spinner'
import { getProductById } from '../lib/api'
import { formatPrice, STORE } from '../config'
import { useCart } from '../context/CartContext'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    setLoading(true)
    setQty(1)
    getProductById(id)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Producto no encontrado</h1>
        <Link to="/catalogo" className="mt-4 inline-block text-brand-600 hover:underline">
          Volver al catálogo
        </Link>
      </div>
    )
  }

  const outOfStock = product.stock === 0
  const maxQty = Math.min(product.stock ?? 99, 99)

  function handleAdd() {
    addItem(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  function buyNow() {
    addItem(product, qty)
    navigate('/carrito')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-neutral-500">
        <Link to="/" className="hover:text-brand-600">
          Inicio
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link to="/catalogo" className="hover:text-brand-600">
          Catálogo
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="truncate text-neutral-700">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          className="aspect-square rounded-2xl border border-neutral-200"
        />

        <div>
          {product.category_name && (
            <span className="text-sm font-medium uppercase tracking-wide text-brand-600">
              {product.category_name}
            </span>
          )}
          <h1 className="mt-1 font-display text-3xl font-bold leading-tight text-neutral-900">
            {product.name}
          </h1>

          <p className="mt-4 font-display text-3xl font-bold text-neutral-900">
            {formatPrice(product.price)}
          </p>

          <div className="mt-2 flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-neutral-400" />
            {outOfStock ? (
              <span className="font-medium text-brand-600">Agotado</span>
            ) : (
              <span className="text-emerald-600">
                {product.stock} disponibles
              </span>
            )}
          </div>

          {product.description && (
            <p className="mt-5 leading-relaxed text-neutral-600">{product.description}</p>
          )}

          {/* Cantidad + acciones */}
          {!outOfStock && (
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-lg border border-neutral-300">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid h-11 w-11 place-items-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
                  disabled={qty <= 1}
                  aria-label="Quitar uno"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-semibold">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  className="grid h-11 w-11 place-items-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
                  disabled={qty >= maxQty}
                  aria-label="Agregar uno"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={handleAdd}
                className={`inline-flex h-11 items-center gap-2 rounded-lg px-5 font-semibold text-white transition ${
                  added ? 'bg-emerald-600' : 'bg-neutral-900 hover:bg-neutral-800'
                }`}
              >
                {added ? (
                  <>
                    <Check className="h-5 w-5" /> Agregado
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" /> Agregar
                  </>
                )}
              </button>

              <button
                onClick={buyNow}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-600 px-6 font-semibold text-white transition hover:bg-brand-700"
              >
                Comprar ahora
              </button>
            </div>
          )}

          <div className="mt-8 rounded-xl bg-neutral-100 p-4 text-sm text-neutral-600">
            <p className="font-semibold text-neutral-800">Recoge en tienda o recíbelo en casa</p>
            <p className="mt-1">{STORE.address}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
