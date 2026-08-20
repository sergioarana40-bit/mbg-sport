// Configuración central de MBG Sport.
// Edita aquí los datos del negocio; se usan en toda la app.

export const STORE = {
  name: 'MBGSPORT',
  tagline: 'El estándar en tu entrenamiento',
  description:
    'En mbgsport somos tus aliados expertos en el mantenimiento integral y reparación de aparatos de gimnasio, especialistas en reparación de tarjetas y equipos motorizados, además de ofrecerte una amplia gama de refacciones especializadas, accesorios, suplementos y ropa deportiva de alto rendimiento para que tu entrenamiento o negocio nunca se detengan.',
  address: 'Aztecas #203, Patio Zamarrero, San Luis Mextepec, Zinacantepec, Edo. Méx.',
  city: 'Toluca, Estado de México',
  // Sucursal (se muestra en los avisos de "recoge tu pedido").
  branch: 'Sucursal Patio Zamarrero',
  // Números de la tienda (formato internacional para WhatsApp: 521 + 10 dígitos).
  whatsapp: '5217225318431',
  phone: '722 531 84 31',
  // Línea exclusiva del servicio técnico / reparaciones.
  repairWhatsapp: '5217227910584',
  repairPhone: '722 791 05 84',
  email: 'mbgsport@mbgsport.com.mx',
  website: 'https://www.mbgsport.com.mx',
  // Ubicación en Google Maps (botones "Cómo llegar").
  maps: 'https://maps.app.goo.gl/n11znDUDo9wHzgeS9',
  // Redes sociales oficiales.
  facebook: 'https://www.facebook.com/share/18x2WCBiop/',
  instagram: 'https://www.instagram.com/mbgsport',
  tiktok: 'https://www.tiktok.com/@mbgsport',
  youtube: 'https://youtube.com/@mbgsport.toluca',
  // Horario de atención: versión corta (en línea) y por renglones (footer).
  hours: 'Lun a Vie 10:00 – 18:30 · Sáb 10:30 – 15:30',
  hoursLines: ['Lunes a viernes · 10:00 – 18:30 hrs', 'Sábado · 10:30 – 15:30 hrs'],
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

// Un producto puede publicarse sin precio (price 0 o vacío): la tienda muestra
// "Precio por confirmar", no se puede agregar al carrito y se consulta por WhatsApp.
export function hasPrice(value) {
  return Number(value) > 0
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

// Grupos de variantes válidos de un producto: [{name, options:[…]}, …] o [].
export function productVariants(product) {
  const groups = product?.variants
  if (!Array.isArray(groups)) return []
  return groups.filter(
    (g) => g && g.name && Array.isArray(g.options) && g.options.length > 0
  )
}

// Texto legible de una variante elegida: {Color:'Rojo',Talla:'M'} → 'Color: Rojo · Talla: M'
export function variantLabel(variant) {
  if (!variant) return ''
  return Object.entries(variant)
    .map(([name, value]) => `${name}: ${value}`)
    .join(' · ')
}

// Número de pedido para mostrar: folio corto (#0099) si existe; para pedidos
// anteriores al folio (o aún no leídos de la base) cae al código del UUID.
export function orderNumber(order) {
  if (order && Number(order.folio) > 0) {
    return `#${String(order.folio).padStart(4, '0')}`
  }
  const id = typeof order === 'string' ? order : order?.id
  return id ? `#${id.slice(0, 8).toUpperCase()}` : '#—'
}

// Estados posibles de un pedido, con etiqueta y color para la UI.
// El pago es presencial (al recoger en tienda): "Pagado" lo marca el admin al cobrar.
// Si algún día se reactivan los envíos, regresa la etiqueta de `shipped` a 'Enviado'.
export const ORDER_STATUS = {
  pending: { label: 'Pendiente', color: 'amber' },
  paid: { label: 'Pagado', color: 'emerald' },
  processing: { label: 'En preparación', color: 'blue' },
  shipped: { label: 'Listo para recoger', color: 'indigo' },
  delivered: { label: 'Entregado', color: 'green' },
  cancelled: { label: 'Cancelado', color: 'red' },
}
