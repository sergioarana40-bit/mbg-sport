import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Sitio oficial y orígenes permitidos (CORS + back_urls de retorno).
const SITE_URL = 'https://mbgsport.com.mx'
const ALLOWED_ORIGINS = [
  'https://mbgsport.com.mx',
  'https://www.mbgsport.com.mx',
  'http://localhost:5173',
  'http://localhost:4173',
]
// Costo de envío server-side; debe reflejar src/config.js (STORE.shippingCost).
const SHIPPING_COST = 120

function corsHeaders(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : SITE_URL
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

// Evalúa un cupón contra un subtotal (espejo server-side de src/lib/coupons.js).
function evalCoupon(coupon: any, subtotal: number) {
  if (!coupon || coupon.active === false) return { discount: 0, freeShipping: false }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
    return { discount: 0, freeShipping: false }
  if (subtotal < Number(coupon.min_subtotal || 0)) return { discount: 0, freeShipping: false }
  let discount = 0
  let freeShipping = false
  if (coupon.type === 'percent') discount = (subtotal * Number(coupon.value)) / 100
  else if (coupon.type === 'fixed') discount = Number(coupon.value)
  else if (coupon.type === 'free_shipping') freeShipping = true
  discount = Math.min(Math.round(discount * 100) / 100, subtotal)
  return { discount, freeShipping }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')
  const cors = corsHeaders(origin)
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    if (!MP_ACCESS_TOKEN) {
      return json({ error: 'Falta configurar MERCADOPAGO_ACCESS_TOKEN.' }, 500)
    }

    // El cliente ya SOLO manda el id del pedido y el origen de retorno.
    // Precios, cupón, envío y total se reconstruyen aquí desde la base de datos:
    // nunca se confía en importes enviados por el navegador.
    const { order_id, back_url_base } = await req.json()
    if (!order_id) return json({ error: 'Pedido inválido.' }, 400)

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

    // 1) Pedido real. Debe existir y estar pendiente (no re-cobrar pedidos pagados).
    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select('id, user_id, status, delivery_method, coupon_code, customer_name, customer_email')
      .eq('id', order_id)
      .single()
    if (orderErr || !order) return json({ error: 'Pedido no encontrado.' }, 404)
    if (order.status !== 'pending') return json({ error: 'El pedido ya no está pendiente de pago.' }, 409)

    // 2) Propiedad: si el pedido pertenece a un usuario, solo ese usuario puede pagarlo.
    const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '')
    let callerId: string | null = null
    try {
      const { data } = await admin.auth.getUser(jwt)
      callerId = data.user?.id ?? null
    } catch (_) {
      /* invitado */
    }
    if (order.user_id && order.user_id !== callerId) {
      return json({ error: 'No autorizado para pagar este pedido.' }, 403)
    }

    // 3) Items del pedido + precios REALES desde products (ignora order_items.price).
    const { data: orderItems, error: itemsErr } = await admin
      .from('order_items')
      .select('id, product_id, product_name, quantity')
      .eq('order_id', order_id)
    if (itemsErr || !orderItems || orderItems.length === 0) {
      return json({ error: 'El pedido no tiene artículos.' }, 400)
    }

    const ids = [...new Set(orderItems.map((i) => i.product_id).filter(Boolean))]
    const { data: products } = await admin
      .from('products')
      .select('id, name, price, active')
      .in('id', ids as string[])
    const byId = new Map((products || []).map((p) => [p.id, p]))

    let subtotal = 0
    const priced = orderItems.map((i) => {
      const p = i.product_id ? byId.get(i.product_id) : null
      if (!p || p.active === false) {
        throw new Error(`Producto no disponible: ${i.product_name || i.product_id}`)
      }
      const quantity = Math.max(1, Math.floor(Number(i.quantity) || 1))
      const unit_price = Number(p.price)
      subtotal += unit_price * quantity
      return { itemId: i.id, title: p.name as string, quantity, unit_price }
    })

    // 4) Cupón y envío también server-side.
    let coupon: any = null
    if (order.coupon_code) {
      const { data: c } = await admin
        .from('coupons')
        .select('*')
        .eq('code', String(order.coupon_code).trim().toUpperCase())
        .eq('active', true)
        .maybeSingle()
      coupon = c
    }
    const { discount, freeShipping } = evalCoupon(coupon, subtotal)
    const shipping = order.delivery_method === 'pickup' ? 0 : freeShipping ? 0 : SHIPPING_COST
    const total = Math.max(0, Math.round((subtotal - discount + shipping) * 100) / 100)

    // 5) Persiste los totales reconstruidos para que lo almacenado == lo cobrado,
    //    y corrige el precio guardado de cada línea.
    await admin
      .from('orders')
      .update({ subtotal, discount, shipping, total })
      .eq('id', order_id)
    for (const it of priced) {
      await admin.from('order_items').update({ price: it.unit_price }).eq('id', it.itemId)
    }

    // 6) Preferencia de MercadoPago con los precios reales. El descuento se
    //    reparte en los precios (MP no admite importes negativos).
    const factor = discount > 0 && subtotal > 0 ? Math.max(0, (subtotal - discount) / subtotal) : 1
    const prefItems = priced.map((i) => ({
      title: i.title.slice(0, 250),
      quantity: i.quantity,
      unit_price: Math.round(i.unit_price * factor * 100) / 100,
      currency_id: 'MXN',
    }))
    if (shipping > 0) {
      prefItems.push({ title: 'Envío', quantity: 1, unit_price: shipping, currency_id: 'MXN' })
    }

    // back_url_base validado contra la lista blanca (no se confía en el cliente).
    const base = ALLOWED_ORIGINS.includes(back_url_base) ? back_url_base : SITE_URL
    const preference = {
      items: prefItems,
      payer: { name: order.customer_name, email: order.customer_email },
      external_reference: String(order_id),
      back_urls: {
        success: `${base}/pedido/${order_id}?status=approved`,
        failure: `${base}/pedido/${order_id}?status=failure`,
        pending: `${base}/pedido/${order_id}?status=pending`,
      },
      auto_return: 'approved',
      notification_url: `${SUPABASE_URL}/functions/v1/mercadopago-webhook`,
      statement_descriptor: 'MBG SPORT',
    }

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    })
    const data = await mpRes.json()
    if (!mpRes.ok) {
      return json({ error: data.message || 'Error al crear la preferencia.', details: data }, 400)
    }

    await admin.from('orders').update({ preference_id: data.id }).eq('id', order_id)

    return json({ init_point: data.init_point, preference_id: data.id })
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
