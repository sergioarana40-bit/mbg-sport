import { supabase, isSupabaseConfigured } from './supabase'
import { DEMO_CATEGORIES, DEMO_PRODUCTS, withCategoryNames } from '../data/demo'
import { norm } from './csv'

// Error uniforme cuando se intenta mutar sin backend configurado.
function needBackend() {
  throw new Error('Conecta Supabase para guardar cambios reales.')
}

/* ------------------------- Productos ------------------------- */

export async function getAllProducts() {
  if (!isSupabaseConfigured) {
    return withCategoryNames(DEMO_PRODUCTS, DEMO_CATEGORIES)
  }
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map((p) => ({ ...p, category_name: p.categories?.name ?? 'General' }))
}

export async function saveProduct(product) {
  if (!isSupabaseConfigured) return needBackend()
  const payload = {
    name: product.name,
    description: product.description,
    price: Number(product.price),
    category_id: product.category_id || null,
    stock: Number(product.stock) || 0,
    featured: !!product.featured,
    active: product.active !== false,
    image_url: product.image_url || null,
  }
  if (product.id) {
    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', product.id)
      .select()
      .single()
    if (error) throw error
    return data
  }
  const { data, error } = await supabase.from('products').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function deleteProduct(id) {
  if (!isSupabaseConfigured) return needBackend()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

// Edición rápida desde la tabla (precio/stock inline) sin mandar todo el producto.
export async function updateProductFields(id, fields) {
  if (!isSupabaseConfigured) return needBackend()
  const { error } = await supabase.from('products').update(fields).eq('id', id)
  if (error) throw error
}

/* --------------------- Acciones en lote (productos) --------------------- */

export async function bulkUpdateProducts(ids, fields) {
  if (!isSupabaseConfigured) return needBackend()
  if (!ids.length) return
  const { error } = await supabase.from('products').update(fields).in('id', ids)
  if (error) throw error
}

export async function bulkDeleteProducts(ids) {
  if (!isSupabaseConfigured) return needBackend()
  if (!ids.length) return
  const { error } = await supabase.from('products').delete().in('id', ids)
  if (error) throw error
}

// Sube una imagen al bucket 'products' y devuelve su URL pública.
export async function uploadProductImage(file) {
  if (!isSupabaseConfigured) return needBackend()
  const ext = file.name.split('.').pop()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('products').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from('products').getPublicUrl(path)
  return data.publicUrl
}

// Importa productos desde CSV: si el nombre ya existe se ACTUALIZA (precio,
// stock, etc.); si no, se crea. Las categorías que no existan se crean solas.
// En actualizaciones, la imagen solo se toca si el CSV trae una URL.
export async function importProducts(items) {
  if (!isSupabaseConfigured) return needBackend()

  // Mapa de categorías por nombre/slug normalizados; crea las faltantes.
  const { data: cats, error: catErr } = await supabase.from('categories').select('*')
  if (catErr) throw catErr
  const catMap = new Map()
  cats.forEach((c) => {
    catMap.set(norm(c.name), c)
    catMap.set(norm(c.slug), c)
  })
  const missing = [
    ...new Set(
      items.map((i) => i.categoryName).filter((n) => n && !catMap.has(norm(n)))
    ),
  ]
  let nextOrder = cats.length + 1
  for (const catName of missing) {
    const slug = norm(catName)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    const { data: created, error } = await supabase
      .from('categories')
      .insert({ name: catName, slug, sort_order: nextOrder++ })
      .select()
      .single()
    if (error) throw error
    catMap.set(norm(catName), created)
    catMap.set(norm(slug), created)
  }

  // Productos existentes por nombre normalizado (para actualizar en vez de duplicar).
  const { data: prods, error: prodErr } = await supabase.from('products').select('id, name')
  if (prodErr) throw prodErr
  const prodMap = new Map(prods.map((p) => [norm(p.name), p.id]))

  let created = 0
  let updated = 0
  const inserts = []
  for (const item of items) {
    const payload = {
      name: item.name,
      description: item.description || null,
      price: item.price,
      stock: item.stock,
      featured: item.featured,
      active: item.active,
      category_id: item.categoryName ? (catMap.get(norm(item.categoryName))?.id ?? null) : null,
    }
    if (item.image_url) payload.image_url = item.image_url

    const existingId = prodMap.get(norm(item.name))
    if (existingId) {
      const { error } = await supabase.from('products').update(payload).eq('id', existingId)
      if (error) throw error
      updated++
    } else {
      inserts.push({ ...payload, image_url: item.image_url || null })
      created++
    }
  }
  if (inserts.length > 0) {
    const { error } = await supabase.from('products').insert(inserts)
    if (error) throw error
  }

  return { created, updated, newCategories: missing.length }
}

/* ------------------- Trabajos del servicio técnico ------------------- */

export async function getAllRepairWorks() {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('repair_works')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function saveRepairWork(work) {
  if (!isSupabaseConfigured) return needBackend()
  const payload = {
    title: work.title,
    description: work.description || null,
    image_url: work.image_url || null,
    sort_order: Number(work.sort_order) || 0,
    active: work.active !== false,
  }
  if (work.id) {
    const { data, error } = await supabase
      .from('repair_works')
      .update(payload)
      .eq('id', work.id)
      .select()
      .single()
    if (error) throw error
    return data
  }
  const { data, error } = await supabase.from('repair_works').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function deleteRepairWork(id) {
  if (!isSupabaseConfigured) return needBackend()
  const { error } = await supabase.from('repair_works').delete().eq('id', id)
  if (error) throw error
}

// Sube la foto de un trabajo al bucket 'products' (carpeta repairs/) y devuelve su URL.
export async function uploadRepairImage(file) {
  if (!isSupabaseConfigured) return needBackend()
  const ext = file.name.split('.').pop()
  const path = `repairs/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('products').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from('products').getPublicUrl(path)
  return data.publicUrl
}

/* ------------------------- Categorías ------------------------- */

export async function getAllCategories() {
  if (!isSupabaseConfigured) return DEMO_CATEGORIES
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

export async function saveCategory(category) {
  if (!isSupabaseConfigured) return needBackend()
  const slug =
    category.slug ||
    category.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  const payload = {
    name: category.name,
    slug,
    sort_order: Number(category.sort_order) || 0,
  }
  if (category.id) {
    const { data, error } = await supabase
      .from('categories')
      .update(payload)
      .eq('id', category.id)
      .select()
      .single()
    if (error) throw error
    return data
  }
  const { data, error } = await supabase.from('categories').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function deleteCategory(id) {
  if (!isSupabaseConfigured) return needBackend()
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

/* ------------------------- Pedidos ------------------------- */

export async function getAllOrders() {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateOrderStatus(id, status) {
  if (!isSupabaseConfigured) return needBackend()
  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) throw error
}

// Pedidos "por atender" para el aviso del sidebar: pendientes de pago o
// pagados que aún no entran a preparación.
export async function getPendingOrdersCount() {
  if (!isSupabaseConfigured) return 0
  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .in('status', ['pending', 'paid'])
  if (error) throw error
  return count ?? 0
}

// Suscripción en vivo a cambios en pedidos (Realtime). Devuelve una función
// para cancelarla. El callback se dispara en altas y cambios de estado.
// El nombre del canal debe ser único por suscriptor: si dos componentes
// (sidebar y lista de pedidos) comparten topic, el segundo `.on()` lanza
// "cannot add postgres_changes callbacks after subscribe()".
let channelSeq = 0
export function subscribeOrders(onChange) {
  if (!isSupabaseConfigured) return () => {}
  const channel = supabase
    .channel(`orders-admin-${++channelSeq}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange)
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}

/* ------------------------- Cupones ------------------------- */

export async function getAllCoupons() {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function saveCoupon(coupon) {
  if (!isSupabaseConfigured) return needBackend()
  const payload = {
    code: coupon.code.trim().toUpperCase(),
    type: coupon.type,
    value: Number(coupon.value) || 0,
    min_subtotal: Number(coupon.min_subtotal) || 0,
    active: coupon.active !== false,
    expires_at: coupon.expires_at || null,
  }
  if (coupon.id) {
    const { error } = await supabase.from('coupons').update(payload).eq('id', coupon.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('coupons').insert(payload)
    if (error) throw error
  }
}

export async function deleteCoupon(id) {
  if (!isSupabaseConfigured) return needBackend()
  const { error } = await supabase.from('coupons').delete().eq('id', id)
  if (error) throw error
}

/* ------------------------- Estadísticas ------------------------- */

const PAID_STATES = ['paid', 'processing', 'shipped', 'delivered']

export async function getStats() {
  if (!isSupabaseConfigured) {
    return {
      revenueMonth: 0,
      monthDelta: null,
      orderCount: 0,
      ordersToday: 0,
      pending: 0,
      productCount: DEMO_PRODUCTS.length,
      lowStock: [],
      clientCount: 0,
      clientsThisWeek: 0,
      recentOrders: [],
      salesByDay: [],
      demo: true,
    }
  }
  const [{ data: orders, error }, { data: products, error: prodError }] = await Promise.all([
    supabase.from('orders').select('id, total, status, created_at, customer_name, customer_email'),
    supabase.from('products').select('id, name, stock, active').eq('active', true),
  ])
  if (error) throw error
  if (prodError) throw prodError

  const paid = orders.filter((o) => PAID_STATES.includes(o.status))

  // Ventas del mes actual vs. mes anterior (para el delta del dashboard).
  const now = new Date()
  const monthKey = (d) => `${d.getFullYear()}-${d.getMonth()}`
  const thisMonth = monthKey(now)
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonth = monthKey(prev)
  const sumMonth = (key) =>
    paid
      .filter((o) => o.created_at && monthKey(new Date(o.created_at)) === key)
      .reduce((sum, o) => sum + Number(o.total), 0)
  const revenueMonth = sumMonth(thisMonth)
  const revenuePrevMonth = sumMonth(prevMonth)
  const monthDelta =
    revenuePrevMonth > 0
      ? Math.round(((revenueMonth - revenuePrevMonth) / revenuePrevMonth) * 100)
      : null

  // Pedidos de hoy.
  const todayKey = now.toISOString().slice(0, 10)
  const ordersToday = orders.filter((o) => o.created_at?.slice(0, 10) === todayKey).length

  // Ventas por día (últimos 7 días).
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const total = paid
      .filter((o) => o.created_at?.slice(0, 10) === key)
      .reduce((sum, o) => sum + Number(o.total), 0)
    days.push({ date: key, day: d.getDay(), total })
  }

  // Stock bajo (≤ 5 unidades).
  const lowStock = products
    .filter((p) => (p.stock ?? 0) <= 5)
    .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
    .slice(0, 5)

  // Clientes únicos por correo; nuevos = primer pedido en los últimos 7 días.
  const firstOrderByEmail = new Map()
  for (const o of orders) {
    const email = o.customer_email?.toLowerCase()
    if (!email) continue
    const t = new Date(o.created_at).getTime()
    if (!firstOrderByEmail.has(email) || t < firstOrderByEmail.get(email)) {
      firstOrderByEmail.set(email, t)
    }
  }
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const clientsThisWeek = [...firstOrderByEmail.values()].filter((t) => t >= weekAgo).length

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6)

  return {
    revenueMonth,
    monthDelta,
    orderCount: orders.length,
    ordersToday,
    pending: orders.filter((o) => o.status === 'pending').length,
    productCount: products.length,
    lowStock,
    clientCount: firstOrderByEmail.size,
    clientsThisWeek,
    recentOrders,
    salesByDay: days,
    demo: false,
  }
}
