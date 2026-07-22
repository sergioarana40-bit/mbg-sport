import { useCallback, useRef } from 'react'

// Slider doble de precio (póster 1b): pista gris clara, tramo negro y
// pulgares cuadrados amarillos con borde negro. Con inputs "Desde / Hasta" debajo.
export default function PriceRange({ min, max, value, onChange, step = 10 }) {
  const trackRef = useRef(null)
  const [lo, hi] = value
  const span = Math.max(1, max - min)
  const pct = (v) => Math.min(100, Math.max(0, ((v - min) / span) * 100))

  const valueFromPointer = useCallback(
    (clientX) => {
      const rect = trackRef.current.getBoundingClientRect()
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width)
      const raw = min + (x / rect.width) * span
      return Math.round(raw / step) * step
    },
    [min, span, step]
  )

  // Arrastre de un pulgar ('lo' | 'hi'). El otro extremo queda fijo durante el gesto.
  function startDrag(which) {
    return (e) => {
      e.preventDefault()
      const move = (ev) => {
        const v = valueFromPointer(ev.clientX ?? ev.touches?.[0]?.clientX ?? 0)
        if (which === 'lo') onChange([Math.min(Math.max(v, min), hi - step), hi])
        else onChange([lo, Math.max(Math.min(v, max), lo + step)])
      }
      const stop = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', stop)
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', stop)
    }
  }

  // Clic directo sobre la pista: mueve el pulgar más cercano.
  function onTrackDown(e) {
    const v = valueFromPointer(e.clientX)
    if (Math.abs(v - lo) <= Math.abs(v - hi)) onChange([Math.min(v, hi - step), hi])
    else onChange([lo, Math.max(v, lo + step)])
  }

  function keyStep(which) {
    return (e) => {
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0
      if (!dir) return
      e.preventDefault()
      if (which === 'lo') onChange([Math.min(Math.max(lo + dir * step, min), hi - step), hi])
      else onChange([lo, Math.max(Math.min(hi + dir * step, max), lo + step)])
    }
  }

  function clampInput(which, raw) {
    const n = Number(raw)
    if (Number.isNaN(n)) return
    if (which === 'lo') onChange([Math.min(Math.max(n, min), hi - step), hi])
    else onChange([lo, Math.max(Math.min(n, max), lo + step)])
  }

  const thumb =
    'absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab border-2 border-ink bg-accent-400 outline-none focus-visible:ring-2 focus-visible:ring-brand-600'

  return (
    <div>
      <div
        ref={trackRef}
        onPointerDown={onTrackDown}
        className="relative mx-1.5 h-1 cursor-pointer bg-[#e5e5e5]"
      >
        <span
          className="absolute inset-y-0 bg-ink"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        <span
          role="slider"
          tabIndex={0}
          aria-label="Precio mínimo"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={lo}
          onPointerDown={startDrag('lo')}
          onKeyDown={keyStep('lo')}
          className={thumb}
          style={{ left: `${pct(lo)}%` }}
        />
        <span
          role="slider"
          tabIndex={0}
          aria-label="Precio máximo"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={hi}
          onPointerDown={startDrag('hi')}
          onKeyDown={keyStep('hi')}
          className={thumb}
          style={{ left: `${pct(hi)}%` }}
        />
      </div>
      <div className="mt-3 flex gap-2.5">
        <input
          type="number"
          inputMode="numeric"
          value={lo}
          min={min}
          max={hi - step}
          onChange={(e) => clampInput('lo', e.target.value)}
          aria-label="Precio desde"
          className="w-full min-w-0 flex-1 rounded-lg border-2 border-ink bg-white px-3 py-1.5 font-mono text-[12px] text-fg outline-none transition focus:border-brand-600"
        />
        <input
          type="number"
          inputMode="numeric"
          value={hi}
          min={lo + step}
          max={max}
          onChange={(e) => clampInput('hi', e.target.value)}
          aria-label="Precio hasta"
          className="w-full min-w-0 flex-1 rounded-lg border-2 border-ink bg-white px-3 py-1.5 font-mono text-[12px] text-fg outline-none transition focus:border-brand-600"
        />
      </div>
    </div>
  )
}
