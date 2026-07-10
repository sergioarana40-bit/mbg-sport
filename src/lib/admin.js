import { supabase, isSupabaseConfigured } from './supabase'
import { DEMO_CATEGORIES, DEMO_PRODUCTS, withCategoryNames } from '../data/demo'

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

/* ------------------------- Estadísticas ------------------------- */

const PAID_STATES = ['paid', 'processing', 'shipped', 'delivered']

export async function getStats() {
  if (!isSupabaseConfigured) {
    return {
      revenue: 0,
      orderCount: 0,
      pending: 0,
      productCount: DEMO_PRODUCTS.length,
      recentOrders: [],
      salesByDay: [],
      demo: true,
    }
  }
  const [{ data: orders, error }, { count: productCount }] = await Promise.all([
    supabase.from('orders').select('id, total, status, created_at, customer_name'),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('active', true),
  ])
  if (error) throw error

  const paid = orders.filter((o) => PAID_STATES.includes(o.status))
  const revenue = paid.reduce((sum, o) => sum + Number(o.total), 0)

  // Ventas por día (últimos 14 días).
  const days = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const total = paid
      .filter((o) => o.created_at?.slice(0, 10) === key)
      .reduce((sum, o) => sum + Number(o.total), 0)
    days.push({ date: key, total })
  }

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6)

  return {
    revenue,
    orderCount: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    productCount: productCount || 0,
    recentOrders,
    salesByDay: days,
    demo: false,
  }
}
