import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'mbg_cart_v1'
const COUPON_KEY = 'mbg_coupon'

function loadCoupon() {
  try {
    return JSON.parse(localStorage.getItem(COUPON_KEY)) || null
  } catch {
    return null
  }
}

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Identidad de una línea del carrito: el mismo producto con distinta variante
// (color, talla…) ocupa líneas separadas. Carritos guardados antes de las
// variantes no traen `key`, por eso los lectores caen a `i.key ?? i.id`.
function lineKey(productId, variant) {
  if (!variant) return productId
  const sig = Object.entries(variant)
    .map(([name, value]) => `${name}=${value}`)
    .sort()
    .join('|')
  return `${productId}::${sig}`
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const { product, quantity = 1, variant = null } = action
      const key = lineKey(product.id, variant)
      const existing = state.find((i) => (i.key ?? i.id) === key)
      const maxStock = product.stock ?? 99
      if (existing) {
        return state.map((i) =>
          (i.key ?? i.id) === key
            ? { ...i, quantity: Math.min(i.quantity + quantity, maxStock) }
            : i
        )
      }
      return [
        ...state,
        {
          key,
          id: product.id,
          name: product.name,
          price: Number(product.price),
          image_url: product.image_url,
          stock: maxStock,
          quantity: Math.min(quantity, maxStock),
          variant,
        },
      ]
    }
    case 'REMOVE':
      return state.filter((i) => (i.key ?? i.id) !== action.key)
    case 'SET_QTY': {
      const qty = Math.max(1, Math.min(action.quantity, 99))
      return state.map((i) =>
        (i.key ?? i.id) === action.key
          ? { ...i, quantity: Math.min(qty, i.stock ?? 99) }
          : i
      )
    }
    case 'CLEAR':
      return []
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, undefined, loadInitial)
  const [coupon, setCoupon] = useState(loadCoupon)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* almacenamiento no disponible */
    }
  }, [items])

  useEffect(() => {
    try {
      if (coupon) localStorage.setItem(COUPON_KEY, JSON.stringify(coupon))
      else localStorage.removeItem(COUPON_KEY)
    } catch {
      /* noop */
    }
  }, [coupon])

  const value = useMemo(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0)
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    return {
      items,
      count,
      subtotal,
      appliedCoupon: coupon,
      applyCoupon: setCoupon,
      removeCoupon: () => setCoupon(null),
      addItem: (product, quantity = 1, variant = null) =>
        dispatch({ type: 'ADD', product, quantity, variant }),
      removeItem: (key) => dispatch({ type: 'REMOVE', key }),
      setQuantity: (key, quantity) => dispatch({ type: 'SET_QTY', key, quantity }),
      clearCart: () => {
        dispatch({ type: 'CLEAR' })
        setCoupon(null)
      },
    }
  }, [items, coupon])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}
