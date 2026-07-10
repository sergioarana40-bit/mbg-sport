import { supabase } from './supabase'

// Pedidos del cliente autenticado (RLS ya restringe a los suyos; filtramos
// además por user_id para que un admin vea aquí solo los propios).
export async function getMyOrders(userId) {
  if (!userId) return []
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Actualiza el perfil del cliente.
export async function updateProfile(userId, { full_name, phone }) {
  const { error } = await supabase
    .from('profiles')
    .update({ full_name, phone })
    .eq('id', userId)
  if (error) throw error
}
