import { supabase } from './supabase'

// Invoca la Edge Function que crea una preferencia de pago en MercadoPago.
// La función corre en Supabase, usa el Access Token secreto (nunca en el front)
// y — importante — reconstruye precios, cupón, envío y total desde la base de
// datos a partir del `order_id`: el navegador NO decide cuánto se cobra.
// Devuelve { init_point, preference_id } — init_point es la URL del checkout de MP.
export async function createMercadoPagoPreference({ order }) {
  const { data, error } = await supabase.functions.invoke('create-preference', {
    body: {
      order_id: order.id,
      // Solo para construir las back_urls de retorno (validado en el servidor).
      back_url_base: window.location.origin,
    },
  })
  if (error) throw error
  if (!data?.init_point) {
    throw new Error(data?.error || 'No se pudo iniciar el pago con MercadoPago.')
  }
  return data
}
