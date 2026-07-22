import { useEffect, useState } from 'react'
import { WifiOff, RotateCw } from 'lucide-react'

// Aviso fijo cuando el dispositivo pierde la conexión. El service worker
// mantiene el catálogo y las imágenes en caché, así que la tienda sigue navegable.
export default function OfflineBanner() {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOffline(false)
    const goOffline = () => setOffline(true)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (!offline) return null

  return (
    /* Banner sin conexión (póster 1b: banda negra con texto amarillo) */
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 border-b-2 border-ink bg-ink px-4 py-2.5 text-center text-xs font-bold text-accent-400">
      <WifiOff className="h-[15px] w-[15px]" strokeWidth={2} />
      Sin conexión · estás viendo el catálogo guardado
      <button
        onClick={() => window.location.reload()}
        className="ml-1.5 inline-flex items-center gap-1 rounded-full border border-accent-400 px-2.5 py-1 font-bold text-accent-400 transition hover:bg-accent-400 hover:text-fg"
      >
        <RotateCw className="h-3 w-3" />
        Reintentar
      </button>
    </div>
  )
}
