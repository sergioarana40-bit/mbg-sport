import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const FavoritesContext = createContext(null)
const LS_KEY = 'mbg_favorites'

function readLS() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  } catch {
    return []
  }
}
function writeLS(ids) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(ids))
  } catch {
    /* noop */
  }
}

export function FavoritesProvider({ children }) {
  const { user } = useAuth()
  const [ids, setIds] = useState(() => new Set(readLS()))

  // Al iniciar sesión: sube los favoritos locales y carga los del usuario.
  useEffect(() => {
    if (!user) {
      setIds(new Set(readLS()))
      return
    }
    let active = true
    ;(async () => {
      const local = readLS()
      if (local.length) {
        await supabase
          .from('favorites')
          .upsert(
            local.map((pid) => ({ user_id: user.id, product_id: pid })),
            { onConflict: 'user_id,product_id' }
          )
        writeLS([])
      }
      const { data } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', user.id)
      if (active && data) setIds(new Set(data.map((r) => r.product_id)))
    })()
    return () => {
      active = false
    }
  }, [user])

  const toggle = useCallback(
    async (productId) => {
      const has = ids.has(productId)
      const next = new Set(ids)
      if (has) next.delete(productId)
      else next.add(productId)
      setIds(next)

      if (user) {
        if (has)
          await supabase
            .from('favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', productId)
        else await supabase.from('favorites').insert({ user_id: user.id, product_id: productId })
      } else {
        writeLS([...next])
      }
    },
    [ids, user]
  )

  const value = {
    ids,
    count: ids.size,
    isFavorite: (id) => ids.has(id),
    toggle,
  }

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites debe usarse dentro de <FavoritesProvider>')
  return ctx
}
