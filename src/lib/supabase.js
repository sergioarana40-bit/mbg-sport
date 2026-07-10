import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Aviso útil en desarrollo si faltan las variables de entorno.
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[MBG Sport] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env. ' +
      'La app cargará pero las llamadas a Supabase fallarán hasta configurarlas.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)

// ¿Está configurado el backend? Se usa para mostrar datos de demo si aún no.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
