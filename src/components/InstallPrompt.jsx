import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

const DISMISS_KEY = 'mbg_install_dismissed'

// Ícono nativo de "Compartir" (para las instrucciones en iPhone/iPad).
function ShareIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 15V3" />
      <path d="m7 8 5-5 5 5" />
      <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7" />
    </svg>
  )
}

// Detecta el tipo de dispositivo para mostrar el banner solo en móvil/tablet.
function getDeviceInfo() {
  if (typeof navigator === 'undefined') return { mobileOrTablet: false, ios: false }
  const ua = navigator.userAgent || ''
  // iPadOS 13+ se identifica como "Macintosh" pero es táctil.
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
  const ios = /iPhone|iPad|iPod/.test(ua) || iPadOS
  const other =
    /Android|Windows Phone|webOS|BlackBerry|Opera Mini|IEMobile|Mobile|Tablet|Silk|Kindle|PlayBook/i.test(
      ua
    )
  return { mobileOrTablet: ios || other, ios }
}

// Banner "Instalar app": solo en celulares y tablets/iPads (no en escritorio).
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [hidden, setHidden] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')
  const [device] = useState(getDeviceInfo)
  const [standalone] = useState(
    () =>
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(display-mode: standalone)').matches ||
        window.navigator.standalone === true)
  )

  useEffect(() => {
    function onPrompt(e) {
      e.preventDefault()
      setDeferred(e)
    }
    function onInstalled() {
      setDeferred(null)
      setHidden(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  // No mostrar: descartado, ya instalada, o en escritorio.
  if (hidden || standalone || !device.mobileOrTablet) return null
  // En Android/Chrome dependemos del evento; en iOS mostramos instrucciones.
  if (!device.ios && !deferred) return null

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setHidden(true)
  }

  async function install() {
    if (!deferred) return
    deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  return (
    <div className="fixed inset-x-3 bottom-24 z-40 mx-auto max-w-md rounded-2xl border border-line bg-surface p-4 shadow-2xl md:inset-x-auto md:bottom-4 md:right-4 md:left-auto">
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

      {device.ios ? (
        <p className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-surface-2 px-3 py-2.5 text-center text-xs text-fg-muted">
          Toca <ShareIcon className="inline h-4 w-4 text-brand-400" /> y luego
          <b className="text-fg">“Añadir a inicio”</b>
        </p>
      ) : (
        <button onClick={install} className="btn-primary mt-3 w-full py-2.5 text-sm">
          <Download className="h-4.5 w-4.5" />
          Instalar app
        </button>
      )}
    </div>
  )
}
