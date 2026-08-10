import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
// Secreto del webhook (panel de MercadoPago → Webhooks). Si está configurado,
// se valida la firma HMAC de cada notificación. Si no, se omite la validación
// (comportamiento anterior) y se confía solo en la re-consulta a la API de MP.
const WEBHOOK_SECRET = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET')
// En producción real conviene exigir pagos live_mode. Se deja apagado por
// defecto para no romper pruebas en sandbox. Pon MP_REQUIRE_LIVE_MODE=true al lanzar.
const REQUIRE_LIVE_MODE = Deno.env.get('MP_REQUIRE_LIVE_MODE') === 'true'

// Comparación en tiempo constante para no filtrar la firma por timing.
function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}

// Valida el header x-signature según el esquema HMAC-SHA256 de MercadoPago:
// manifest = "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
async function validSignature(req: Request, paymentId: string, secret: string) {
  const sig = req.headers.get('x-signature') || ''
  const requestId = req.headers.get('x-request-id') || ''
  const parts: Record<string, string> = {}
  for (const kv of sig.split(',')) {
    const [k, v] = kv.split('=')
    if (k && v) parts[k.trim()] = v.trim()
  }
  const ts = parts['ts']
  const v1 = parts['v1']
  if (!ts || !v1) return false

  const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest))
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return timingSafeEqual(hex, v1)
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url)

    let type = url.searchParams.get('type') || url.searchParams.get('topic')
    let paymentId = url.searchParams.get('data.id') || url.searchParams.get('id')

    if (!paymentId || !type) {
      const body = await req.json().catch(() => ({}) as any)
      type = type || body.type || body.action || ''
      paymentId = paymentId || body?.data?.id
    }

    if (type && !String(type).includes('payment')) {
      return new Response('ignored', { status: 200 })
    }
    if (!paymentId) return new Response('no payment id', { status: 200 })

    // Validación de firma (si hay secreto configurado). Rechaza notificaciones
    // falsas ANTES de gastar una llamada a la API de MP.
    if (WEBHOOK_SECRET) {
      const ok = await validSignature(req, String(paymentId), WEBHOOK_SECRET)
      if (!ok) return new Response('invalid signature', { status: 401 })
    }

    // Defensa en profundidad: se consulta el pago REAL en la API de MP con el
    // Access Token secreto; nunca se confía en el estado que llega en la notificación.
    const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    })
    if (!payRes.ok) return new Response('payment not found', { status: 200 })

    const payment = await payRes.json()
    const orderId = payment.external_reference
    const paymentStatus = String(payment.status || '')

    if (!orderId || !SUPABASE_URL || !SERVICE_ROLE) return new Response('ok', { status: 200 })
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

    const { data: order } = await supabase
      .from('orders')
      .select('status, total')
      .eq('id', orderId)
      .maybeSingle()
    if (!order) return new Response('order not found', { status: 200 })

    // Solo se actúa sobre pedidos que siguen 'pending'. Un pedido ya avanzado
    // por el admin (processing/shipped/delivered) o cancelado NO se reescribe
    // desde el webhook: evita que un replay del pago revierta el estado.
    if (order.status !== 'pending') return new Response('ok', { status: 200 })

    if (paymentStatus === 'approved') {
      // Verifica que el monto pagado cubra el total del pedido y la moneda.
      const paid = Number(
        payment.transaction_amount ?? payment.transaction_details?.total_paid_amount ?? 0
      )
      const okAmount = paid + 0.01 >= Number(order.total)   // tolerancia de 1 centavo por redondeo
      const okCurrency = (payment.currency_id ?? 'MXN') === 'MXN'
      const okLive = !REQUIRE_LIVE_MODE || payment.live_mode === true

      if (okAmount && okCurrency && okLive) {
        await supabase
          .from('orders')
          .update({ payment_status: paymentStatus, status: 'paid', payment_id: String(paymentId) })
          .eq('id', orderId)
      } else {
        // Pago aprobado PERO con discrepancia (monto/moneda/entorno): NO se marca
        // pagado. Se registra el pago para que el admin lo revise; el pedido sigue
        // 'pending' (un pago 'approved' sobre un pedido 'pending' es la señal).
        await supabase
          .from('orders')
          .update({ payment_status: paymentStatus, payment_id: String(paymentId) })
          .eq('id', orderId)
      }
      return new Response('ok', { status: 200 })
    }

    if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(paymentStatus)) {
      await supabase
        .from('orders')
        .update({ payment_status: paymentStatus, status: 'cancelled', payment_id: String(paymentId) })
        .eq('id', orderId)
    }

    return new Response('ok', { status: 200 })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 200 })
  }
})
