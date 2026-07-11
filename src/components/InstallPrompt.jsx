import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

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
    <div className="fixed inset-x-3.5 bottom-24 z-40 mx-auto max-w-md rounded-[22px] border border-white/10 bg-[#18181c] p-5 shadow-[0_-10px_40px_rgba(0,0,0,.5)] md:inset-x-auto md:bottom-4 md:right-4 md:left-auto">
      {/* Instalar app (diseño 10) */}
      <div className="flex items-center gap-3.5">
        <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[14px] bg-brand-600 font-display text-[19px] font-bold text-white shadow-[0_8px_18px_rgba(220,38,38,.4)]">
          MBG
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold uppercase leading-tight text-fg">
            Instala MBG Sport
          </p>
          <p className="text-xs text-fg-muted">mbgsport.com.mx</p>
        </div>
      </div>

      <p className="mt-3.5 text-[13px] leading-normal text-[#d4d4d8]">
        Añádela a tu pantalla de inicio: compra más rápido, recibe avisos de tu pedido y
        navega el catálogo sin conexión.
      </p>

      {device.ios ? (
        <div className="mt-4 flex gap-2.5">
          <button
            onClick={dismiss}
            className="flex h-[46px] flex-1 items-center justify-center rounded-xl border border-white/15 text-sm font-semibold text-[#d4d4d8] transition hover:bg-white/5"
          >
            Ahora no
          </button>
          <p className="flex h-[46px] flex-[1.4] items-center justify-center gap-1.5 rounded-xl bg-surface-2 px-3 text-center text-[11px] text-fg-muted">
            Toca <ShareIcon className="inline h-4 w-4 shrink-0 text-brand-400" /> y{' '}
            <b className="text-fg">“Añadir a inicio”</b>
          </p>
        </div>
      ) : (
        <div className="mt-4 flex gap-2.5">
          <button
            onClick={dismiss}
            className="flex h-[46px] flex-1 items-center justify-center rounded-xl border border-white/15 text-sm font-semibold text-[#d4d4d8] transition hover:bg-white/5"
          >
            Ahora no
          </button>
          <button
            onClick={install}
            className="flex h-[46px] flex-[1.4] items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-semibold text-white transition hover:bg-brand-700 active:scale-[.98]"
          >
            <Download className="h-[17px] w-[17px]" strokeWidth={1.9} />
            Instalar
          </button>
        </div>
      )}
    </div>
  )
}
