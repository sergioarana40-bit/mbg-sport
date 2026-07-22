// Configuración central de MBG Sport.
// Edita aquí los datos del negocio; se usan en toda la app.

export const STORE = {
  name: 'MBGSPORT',
  tagline: 'El estándar en tu entrenamiento',
  description:
    'El aliado integral del mundo fitness. Refacciones, equipo, suplementación y ropa deportiva en Toluca.',
  address: 'Aztecas #203, Plaza Zamarrero, San Luis Mextepec, Zinacantepec, Edo. Méx.',
  city: 'Toluca, Estado de México',
  // Número real de la tienda (formato internacional para WhatsApp: 521 + 10 dígitos).
  whatsapp: '5217227910584',
  phone: '722 791 0584',
  email: 'contacto@mbgsport.com.mx',
  website: 'https://www.mbgsport.com.mx',
  // Ubicación en Google Maps (botones "Cómo llegar").
  maps: 'https://maps.app.goo.gl/n11znDUDo9wHzgeS9',
  // Redes sociales oficiales.
  facebook: 'https://www.facebook.com/share/18x2WCBiop/',
  instagram: 'https://www.instagram.com/mbgsport',
  tiktok: 'https://www.tiktok.com/@mbgsport',
  youtube: 'https://youtube.com/@mbgsport.toluca',
  // Horario de atención (se muestra en el footer).
  hours: 'Lun a Sáb · 10:00 – 20:00',
  // Por ahora solo hay recogida en tienda; pon false para reactivar el envío a domicilio.
  pickupOnly: true,
  // Envío gratis a partir de este monto (MXN). Pon null para desactivar.
  freeShippingFrom: null,
  shippingCost: 120,
  currency: 'MXN',
  locale: 'es-MX',
}

// Calcula el costo de envío según el subtotal (envío gratis desde cierto monto).
export function calcShipping(subtotal) {
  if (STORE.pickupOnly) return 0
  if (subtotal <= 0) return 0
  if (STORE.freeShippingFrom && subtotal >= STORE.freeShippingFrom) return 0
  return STORE.shippingCost
}

// Formatea un número como precio en pesos mexicanos.
export function formatPrice(value) {
  const n = Number(value) || 0
  return new Intl.NumberFormat(STORE.locale, {
    style: 'currency',
    currency: STORE.currency,
    minimumFractionDigits: 2,
  }).format(n)
}

// Estados posibles de un pedido, con etiqueta y color para la UI.
export const ORDER_STATUS = {
  pending: { label: 'Pendiente', color: 'amber' },
  paid: { label: 'Pagado', color: 'emerald' },
  processing: { label: 'En preparación', color: 'blue' },
  shipped: { label: 'Enviado', color: 'indigo' },
  delivered: { label: 'Entregado', color: 'green' },
  cancelled: { label: 'Cancelado', color: 'red' },
}
