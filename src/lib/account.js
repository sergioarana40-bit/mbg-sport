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

// Cambia la contraseña del usuario con sesión activa (cliente o admin).
export async function changePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

// Preferencia de notificaciones.
export async function setNotifications(userId, enabled) {
  const { error } = await supabase
    .from('profiles')
    .update({ notifications_enabled: enabled })
    .eq('id', userId)
  if (error) throw error
}

/* ------------------------- Direcciones ------------------------- */

export async function getAddresses(userId) {
  if (!userId) return []
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function saveAddress(userId, addr) {
  const payload = {
    user_id: userId,
    label: addr.label || null,
    recipient: addr.recipient || null,
    phone: addr.phone || null,
    full_address: addr.full_address,
    is_default: !!addr.is_default,
  }
  // Si se marca como predeterminada, quita el flag de las demás.
  if (payload.is_default) {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId)
  }
  if (addr.id) {
    const { error } = await supabase.from('addresses').update(payload).eq('id', addr.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('addresses').insert(payload)
    if (error) throw error
  }
}

export async function deleteAddress(id) {
  const { error } = await supabase.from('addresses').delete().eq('id', id)
  if (error) throw error
}
