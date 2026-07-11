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
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-brand-700 px-4 py-1.5 text-center text-xs font-medium text-white">
      <WifiOff className="h-3.5 w-3.5" />
      Sin conexión · estás viendo el catálogo guardado
      <button
        onClick={() => window.location.reload()}
        className="ml-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 font-semibold hover:bg-white/30"
      >
        <RotateCw className="h-3 w-3" />
        Reintentar
      </button>
    </div>
  )
}
