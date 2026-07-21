// Configuración central de MBG Sport.
// Edita aquí los datos del negocio; se usan en toda la app.

export const STORE = {
  name: 'MBG Sport',
  tagline: 'Todo para tu entrenamiento',
  description:
    'Pesas, barras, cardio, ropa y refacciones. Los mejores precios en Toluca.',
  address: 'Av. Independencia Oriente 612, Col. Santa Clara, Toluca, México 50090',
  city: 'Toluca, Estado de México',
  // Rellena con el número real (formato internacional, sin +, ni espacios) para el contacto por WhatsApp.
  whatsapp: '5217221234567',
  phone: '722 123 4567',
  email: 'contacto@mbgsport.com.mx',
  website: 'https://www.mbgsport.com.mx',
  instagram: 'https://instagram.com/mbgsport',
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
