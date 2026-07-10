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

function reducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const { product, quantity = 1 } = action
      const existing = state.find((i) => i.id === product.id)
      const maxStock = product.stock ?? 99
      if (existing) {
        return state.map((i) =>
          i.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + quantity, maxStock) }
            : i
        )
      }
      return [
        ...state,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          image_url: product.image_url,
          stock: maxStock,
          quantity: Math.min(quantity, maxStock),
        },
      ]
    }
    case 'REMOVE':
      return state.filter((i) => i.id !== action.id)
    case 'SET_QTY': {
      const qty = Math.max(1, Math.min(action.quantity, 99))
      return state.map((i) =>
        i.id === action.id
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
      addItem: (product, quantity = 1) => dispatch({ type: 'ADD', product, quantity }),
      removeItem: (id) => dispatch({ type: 'REMOVE', id }),
      setQuantity: (id, quantity) => dispatch({ type: 'SET_QTY', id, quantity }),
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
