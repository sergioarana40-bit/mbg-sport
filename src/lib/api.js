import { supabase, isSupabaseConfigured } from './supabase'
import {
  DEMO_CATEGORIES,
  DEMO_PRODUCTS,
  withCategoryNames,
} from '../data/demo'

// Normaliza un producto de Supabase (con join a categories) al shape que usa la UI.
function normalize(p) {
  return {
    ...p,
    category_name: p.categories?.name ?? p.category_name ?? 'General',
  }
}

/* ------------------------- Lectura pública ------------------------- */

export async function getCategories() {
  if (!isSupabaseConfigured) return DEMO_CATEGORIES
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

export async function getProducts({ categorySlug, featured, search } = {}) {
  if (!isSupabaseConfigured) {
    let list = withCategoryNames(
      DEMO_PRODUCTS.filter((p) => p.active),
      DEMO_CATEGORIES
    )
    if (featured) list = list.filter((p) => p.featured)
    if (categorySlug) {
      const cat = DEMO_CATEGORIES.find((c) => c.slug === categorySlug)
      list = list.filter((p) => p.category_id === cat?.id)
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q))
    }
    return list
  }

  let query = supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (featured) query = query.eq('featured', true)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error } = await query
  if (error) throw error
  let list = data.map(normalize)
  if (categorySlug) list = list.filter((p) => p.categories?.slug === categorySlug)
  return list
}

export async function getProductsByIds(ids) {
  const list = Array.isArray(ids) ? ids : []
  if (list.length === 0) return []
  if (!isSupabaseConfigured) {
    return withCategoryNames(
      DEMO_PRODUCTS.filter((p) => list.includes(p.id)),
      DEMO_CATEGORIES
    )
  }
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name, slug)')
    .in('id', list)
    .eq('active', true)
  if (error) throw error
  return data.map(normalize)
}

export async function getProductById(id) {
  if (!isSupabaseConfigured) {
    const p = DEMO_PRODUCTS.find((x) => x.id === id)
    if (!p) return null
    return withCategoryNames([p], DEMO_CATEGORIES)[0]
  }
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('id', id)
    .single()
  if (error) throw error
  return normalize(data)
}

/* ------------------- Trabajos del servicio técnico ------------------- */

// Galería "Trabajos recientes" de /reparaciones (contenido editable por el admin).
export async function getRepairWorks() {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('repair_works')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/* ------------------------- Pedidos ------------------------- */

// Crea un pedido con sus items. Devuelve el pedido creado.
export async function createOrder({
  customer,
  items,
  subtotal,
  shipping,
  total,
  notes,
  userId,
  deliveryMethod,
  discount,
  couponCode,
}) {
  if (!isSupabaseConfigured) {
    throw new Error('Configura Supabase para poder registrar pedidos.')
  }
  // Generamos el id en el cliente para no releer la fila tras insertar:
  // por privacidad, los clientes anónimos no tienen permiso de SELECT sobre orders.
  const orderId =
    (typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID()) ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`

  const order = {
    id: orderId,
    user_id: userId || null,
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone,
    customer_address: customer.address,
    notes: notes || null,
    subtotal,
    shipping,
    discount: discount || 0,
    coupon_code: couponCode || null,
    delivery_method: deliveryMethod || 'shipping',
    total,
    status: 'pending',
    payment_status: 'pending',
  }

  const { error } = await supabase.from('orders').insert(order)
  if (error) throw error

  const orderItems = items.map((i) => ({
    order_id: orderId,
    product_id: i.id,
    product_name: i.name,
    price: i.price,
    quantity: i.quantity,
  }))
  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  if (itemsError) throw itemsError

  return order
}

export async function getOrderById(id) {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}
