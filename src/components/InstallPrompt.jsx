import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

const DISMISS_KEY = 'mbg_install_dismissed'

// Banner "Instalar app": aparece cuando el navegador permite instalar la PWA.
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [hidden, setHidden] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')

  useEffect(() => {
    function onPrompt(e) {
      e.preventDefault()
      setDeferred(e)
    }
    function onInstalled() {
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!deferred || hidden) return null

  async function install() {
    deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setHidden(true)
  }

  return (
    <div className="fixed inset-x-3 bottom-24 z-40 mx-auto max-w-md rounded-2xl border border-line bg-surface p-4 shadow-2xl md:inset-x-auto md:right-4 md:bottom-4 md:left-auto">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 font-display text-sm font-bold text-white">
          MBG
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">Instala MBG Sport</p>
          <p className="text-xs text-fg-muted">Acceso rápido y compra sin conexión.</p>
        </div>
        <button
          onClick={dismiss}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-fg-subtle hover:bg-surface-2"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <button onClick={install} className="btn-primary mt-3 w-full py-2.5 text-sm">
        <Download className="h-4.5 w-4.5" />
        Instalar app
      </button>
    </div>
  )
}
