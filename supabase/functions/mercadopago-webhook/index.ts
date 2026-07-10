// Edge Function: mercadopago-webhook
// Recibe las notificaciones de pago de MercadoPago, consulta el estado real
// del pago y actualiza el pedido. Se despliega SIN verify_jwt porque MercadoPago
// no envía un JWT de Supabase.
//
// Secrets requeridos:
//   MERCADOPAGO_ACCESS_TOKEN
// Disponibles automáticamente:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Mapea el estado de pago de MercadoPago al estado del pedido.
function mapOrderStatus(paymentStatus: string) {
  if (paymentStatus === 'approved') return 'paid'
  if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(paymentStatus))
    return 'cancelled'
  return 'pending'
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url)

    // MercadoPago manda la notificación por query o por body, según el tipo.
    let type = url.searchParams.get('type') || url.searchParams.get('topic')
    let paymentId = url.searchParams.get('data.id') || url.searchParams.get('id')

    if (!paymentId || !type) {
      const body = await req.json().catch(() => ({} as any))
      type = type || body.type || body.action || ''
      paymentId = paymentId || body?.data?.id
    }

    // Solo nos interesan las notificaciones de pago.
    if (type && !String(type).includes('payment')) {
      return new Response('ignored', { status: 200 })
    }
    if (!paymentId) return new Response('no payment id', { status: 200 })

    // Consulta el pago real en la API de MercadoPago.
    const payRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
    )
    if (!payRes.ok) return new Response('payment not found', { status: 200 })

    const payment = await payRes.json()
    const orderId = payment.external_reference
    const paymentStatus = payment.status // approved | rejected | pending | in_process

    if (orderId && SUPABASE_URL && SERVICE_ROLE) {
      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)
      await supabase
        .from('orders')
        .update({
          payment_status: paymentStatus,
          status: mapOrderStatus(paymentStatus),
          payment_id: String(paymentId),
        })
        .eq('id', orderId)
    }

    return new Response('ok', { status: 200 })
  } catch (e) {
    // Responder 200 evita reintentos agresivos de MercadoPago.
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 200 })
  }
})
