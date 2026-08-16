// Importación de productos por CSV (panel admin).
// Tolerante a Excel en español: separador , o ; · BOM · encabezados con
// acentos y mayúsculas · precios con "$" y coma decimal.

// Parser CSV con soporte de comillas dobles y detección de separador.
export function parseCsv(text) {
  const clean = String(text).replace(/^﻿/, '')
  const nl = clean.indexOf('\n')
  const firstLine = nl === -1 ? clean : clean.slice(0, nl)
  const commas = (firstLine.match(/,/g) || []).length
  const semis = (firstLine.match(/;/g) || []).length
  const delim = semis > commas ? ';' : ','

  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i]
    if (inQuotes) {
      if (c === '"') {
        if (clean[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === delim) {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && clean[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.some((f) => f.trim() !== '')) rows.push(row)
      row = []
    } else {
      field += c
    }
  }
  row.push(field)
  if (row.some((f) => f.trim() !== '')) rows.push(row)
  return rows
}

// minúsculas y sin acentos, para comparar encabezados y nombres.
export function norm(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

// Encabezados aceptados (español e inglés) → campo interno.
const HEADER_MAP = {
  nombre: 'name',
  producto: 'name',
  name: 'name',
  precio: 'price',
  price: 'price',
  descripcion: 'description',
  description: 'description',
  stock: 'stock',
  existencias: 'stock',
  inventario: 'stock',
  cantidad: 'stock',
  categoria: 'category',
  category: 'category',
  destacado: 'featured',
  featured: 'featured',
  activo: 'active',
  visible: 'active',
  active: 'active',
  imagen: 'image',
  foto: 'image',
  imagen_url: 'image',
  image: 'image',
  image_url: 'image',
}

const YES = ['si', 'sí', '1', 'true', 'x', 'yes', 'verdadero']

// Convierte el texto del CSV en productos listos para importar.
// Devuelve { items, errors } con números de línea para reportar.
export function productsFromCsv(text) {
  const rows = parseCsv(text)
  if (rows.length < 2) {
    return { items: [], errors: [{ line: 1, message: 'El archivo no tiene filas de datos.' }] }
  }

  const headers = rows[0].map((h) => HEADER_MAP[norm(h)] || null)
  if (!headers.includes('name')) {
    return {
      items: [],
      errors: [{ line: 1, message: 'Falta la columna obligatoria "nombre".' }],
    }
  }

  const items = []
  const errors = []
  rows.slice(1).forEach((r, idx) => {
    const line = idx + 2
    const obj = {}
    headers.forEach((key, i) => {
      if (key) obj[key] = (r[i] ?? '').trim()
    })

    if (!obj.name) {
      errors.push({ line, message: 'Falta el nombre del producto.' })
      return
    }
    // Precio: admite "$1,299.50" y "1299,50". Es opcional: vacío = 0 = "por
    // confirmar" (el producto se publica pero no se puede comprar todavía).
    let raw = (obj.price || '').replace(/[$\s]/g, '')
    if (/,\d{1,2}$/.test(raw) && !raw.includes('.')) raw = raw.replace(',', '.')
    else raw = raw.replace(/,/g, '')
    const price = raw === '' ? 0 : Number(raw)
    if (Number.isNaN(price) || price < 0) {
      errors.push({ line, message: `Precio no válido para "${obj.name}".` })
      return
    }

    items.push({
      name: obj.name,
      price,
      description: obj.description || '',
      stock: Number(String(obj.stock || '').replace(/[^\d]/g, '')) || 0,
      categoryName: obj.category || '',
      featured: YES.includes(norm(obj.featured)),
      active: obj.active === undefined || obj.active === '' ? true : YES.includes(norm(obj.active)),
      image_url: /^https?:\/\//i.test(obj.image || '') ? obj.image : '',
    })
  })

  return { items, errors }
}

// Escapa un valor para CSV (comillas cuando hace falta) y neutraliza la
// inyección de fórmulas: una celda que empieza por = + - @ (o TAB/CR) podría
// ejecutarse como fórmula en Excel/LibreOffice, así que se le antepone un
// apóstrofo. Los datos vienen del checkout (nombre, notas…) sin autenticar.
function cell(v) {
  let s = v === null || v === undefined ? '' : String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// Descarga un CSV (con BOM para que Excel abra los acentos correctamente).
export function downloadCsv(fileName, rows) {
  const lines = rows.map((r) => r.map(cell).join(','))
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

// Plantilla de ejemplo para descargar desde el botón de ayuda.
export function downloadCsvTemplate() {
  downloadCsv('plantilla-productos.csv', [
    ['nombre', 'precio', 'stock', 'categoria', 'descripcion', 'destacado', 'activo', 'imagen'],
    [
      'Mancuerna hexagonal 15 kg',
      '850',
      '10',
      'Pesas y Mancuernas',
      'Recubrimiento de hule, mango antideslizante',
      'si',
      'si',
      '',
    ],
    [
      'Banda para caminadora ProForm',
      '1250',
      '4',
      'Refacciones',
      'Banda de repuesto 45 cm, instalación disponible',
      'no',
      'si',
      'https://ejemplo.com/foto-banda.jpg',
    ],
  ])
}

const stamp = () => new Date().toISOString().slice(0, 10)

// Exporta el catálogo con las mismas columnas que acepta la importación
// (editar el archivo y volverlo a subir = actualización masiva).
export function exportProductsCsv(products) {
  downloadCsv(`productos-${stamp()}.csv`, [
    ['nombre', 'precio', 'stock', 'categoria', 'descripcion', 'destacado', 'activo', 'imagen'],
    ...products.map((p) => [
      p.name,
      p.price,
      p.stock ?? 0,
      p.category_name || '',
      p.description || '',
      p.featured ? 'si' : 'no',
      p.active !== false ? 'si' : 'no',
      p.image_url || '',
    ]),
  ])
}

// Exporta pedidos para respaldo/contabilidad.
export function exportOrdersCsv(orders, statusLabels = {}) {
  downloadCsv(`pedidos-${stamp()}.csv`, [
    [
      'pedido',
      'fecha',
      'cliente',
      'correo',
      'telefono',
      'articulos',
      'subtotal',
      'descuento',
      'cupon',
      'total',
      'estado',
      'entrega',
    ],
    ...orders.map((o) => [
      `#${o.id.slice(0, 8).toUpperCase()}`,
      o.created_at ? new Date(o.created_at).toLocaleString('es-MX') : '',
      o.customer_name || '',
      o.customer_email || '',
      o.customer_phone || '',
      (o.order_items ?? [])
        .map((i) => `${i.quantity}x ${i.product_name}`)
        .join(' | '),
      o.subtotal,
      o.discount || 0,
      o.coupon_code || '',
      o.total,
      statusLabels[o.status]?.label || o.status,
      o.delivery_method === 'pickup' ? 'Recoge en tienda' : 'Envío a domicilio',
    ]),
  ])
}
