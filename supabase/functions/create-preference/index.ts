// Edge Function: create-preference
// Crea una preferencia de pago en MercadoPago y devuelve el init_point
// (URL del checkout). El Access Token vive aquí como secret, nunca en el front.
//
// Secrets requeridos (supabase secrets set ...):
//   MERCADOPAGO_ACCESS_TOKEN   Access Token de tu cuenta de MercadoPago
// Disponibles automáticamente en el runtime:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (!MP_ACCESS_TOKEN) {
      return json({ error: 'Falta configurar MERCADOPAGO_ACCESS_TOKEN.' }, 500)
    }

    const { order_id, items, shipping, payer, back_url_base } = await req.json()

    if (!order_id || !Array.isArray(items) || items.length === 0) {
      return json({ error: 'Pedido inválido.' }, 400)
    }

    const prefItems = items.map((i: any) => ({
      title: String(i.title).slice(0, 250),
      quantity: Number(i.quantity),
      unit_price: Number(i.unit_price),
      currency_id: 'MXN',
    }))

    if (shipping && Number(shipping) > 0) {
      prefItems.push({
        title: 'Envío',
        quantity: 1,
        unit_price: Number(shipping),
        currency_id: 'MXN',
      })
    }

    const base = (back_url_base || '').replace(/\/$/, '')
    const preference = {
      items: prefItems,
      payer: payer ? { name: payer.name, email: payer.email } : undefined,
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

    // Guarda el preference_id en el pedido (best-effort).
    if (SUPABASE_URL && SERVICE_ROLE) {
      try {
        const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)
        await supabase.from('orders').update({ preference_id: data.id }).eq('id', order_id)
      } catch (_) {
        /* no bloquea el pago */
      }
    }

    return json({ init_point: data.init_point, preference_id: data.id })
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
