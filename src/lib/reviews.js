import { supabase, isSupabaseConfigured } from './supabase'

// Reseñas de un producto (más recientes primero).
export async function getReviews(productId) {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Promedio, conteo y distribución (5→1 estrellas) a partir de la lista.
export function summarize(reviews) {
  const count = reviews.length
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0
  const dist = [5, 4, 3, 2, 1].map((star) => {
    const n = reviews.filter((r) => r.rating === star).length
    return { star, n, pct: count ? Math.round((n / count) * 100) : 0 }
  })
  return { count, avg, dist }
}

export async function addReview({ productId, userId, author, rating, body }) {
  if (!isSupabaseConfigured) throw new Error('Configura Supabase para publicar reseñas.')
  const { error } = await supabase.from('reviews').insert({
    product_id: productId,
    user_id: userId,
    author,
    rating,
    body: body || null,
  })
  if (error) throw error
}
