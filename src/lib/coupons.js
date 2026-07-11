import { supabase, isSupabaseConfigured } from './supabase'
import { formatPrice, calcShipping } from '../config'

// Cupones activos y vigentes (para la página de promociones).
export async function getActiveCoupons() {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true })
  if (error) throw error
  const now = new Date()
  return data.filter((c) => !c.expires_at || new Date(c.expires_at) >= now)
}

// Busca un cupón activo por código.
export async function findCoupon(code) {
  if (!isSupabaseConfigured || !code) return null
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('active', true)
    .maybeSingle()
  if (error) throw error
  return data
}

// Evalúa el efecto de un cupón sobre un subtotal.
// Devuelve { valid, reason?, discount, freeShipping }.
export function evaluateCoupon(coupon, subtotal) {
  if (!coupon) return { valid: false, reason: 'Cupón no válido.', discount: 0, freeShipping: false }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
    return { valid: false, reason: 'El cupón ya expiró.', discount: 0, freeShipping: false }
  if (subtotal < Number(coupon.min_subtotal))
    return {
      valid: false,
      reason: `Aplica en compras desde ${formatPrice(coupon.min_subtotal)}.`,
      discount: 0,
      freeShipping: false,
    }

  let discount = 0
  let freeShipping = false
  if (coupon.type === 'percent') discount = (subtotal * Number(coupon.value)) / 100
  else if (coupon.type === 'fixed') discount = Number(coupon.value)
  else if (coupon.type === 'free_shipping') freeShipping = true

  discount = Math.min(Math.round(discount * 100) / 100, subtotal)
  return { valid: true, discount, freeShipping }
}

// Calcula los totales del pedido considerando el cupón aplicado.
export function computeTotals(subtotal, coupon) {
  const ev = coupon
    ? evaluateCoupon(coupon, subtotal)
    : { valid: true, discount: 0, freeShipping: false }
  const discount = ev.valid ? ev.discount : 0
  const freeShipping = ev.valid ? ev.freeShipping : false
  const shipping = freeShipping ? 0 : calcShipping(subtotal)
  const total = Math.max(0, subtotal - discount + shipping)
  return {
    discount,
    freeShipping,
    shipping,
    total,
    couponValid: ev.valid,
    couponReason: ev.reason,
  }
}

// Etiqueta descriptiva del cupón.
export function couponLabel(coupon) {
  if (!coupon) return ''
  if (coupon.type === 'percent') return `${Number(coupon.value)}% de descuento`
  if (coupon.type === 'fixed') return `${formatPrice(coupon.value)} de descuento`
  if (coupon.type === 'free_shipping') return 'Envío gratis'
  return ''
}
