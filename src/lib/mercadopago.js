import { supabase } from './supabase'

// Invoca la Edge Function que crea una preferencia de pago en MercadoPago.
// La función corre en Supabase y usa el Access Token secreto (nunca en el front).
// Devuelve { init_point, preference_id } — init_point es la URL del checkout de MP.
export async function createMercadoPagoPreference({ order, items }) {
  const { data, error } = await supabase.functions.invoke('create-preference', {
    body: {
      order_id: order.id,
      items: items.map((i) => ({
        title: i.name,
        quantity: i.quantity,
        unit_price: Number(i.price),
      })),
      shipping: order.shipping,
      discount: order.discount || 0,
      payer: {
        name: order.customer_name,
        email: order.customer_email,
      },
      // URL base para construir las back_urls de retorno de MercadoPago.
      back_url_base: window.location.origin,
    },
  })
  if (error) throw error
  if (!data?.init_point) {
    throw new Error(data?.error || 'No se pudo iniciar el pago con MercadoPago.')
  }
  return data
}
