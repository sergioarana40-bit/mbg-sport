import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Cable,
  Check,
  ChevronRight,
  MessageCircle,
  Minus,
  Plus,
  Ruler,
  Wrench,
} from 'lucide-react'
import Spinner from '../components/Spinner'
import ProductImage from '../components/ProductImage'
import { STORE } from '../config'
import { getCableOptions } from '../lib/api'

// Armador de cables a la medida (inspirado en el CableForm de gympart.com):
// 1 tipo de cable → 2 terminal #1 → 3 terminal #2 → 4 medida → 5 resumen.
// Las terminales incompatibles con el grosor del cable elegido se bloquean.
// Al final, la especificación se envía por WhatsApp para cotizarse.

const STEP_LABELS = ['Cable', 'Terminal 1', 'Terminal 2', 'Medida', 'Resumen']

// Una terminal sin grosores marcados es compatible con cualquier cable.
function isCompatible(end, type) {
  if (!type) return true
  const list = end.compatible ?? []
  return list.length === 0 || list.includes(type.thickness)
}

// Tarjeta seleccionable de tipo de cable o terminal.
function OptionCard({ option, selected, disabled, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      title={disabled ? 'No compatible con el cable elegido' : option.name}
      className={`relative flex flex-col overflow-hidden rounded-[10px] border-2 text-left transition ${
        disabled
          ? 'cursor-not-allowed border-[#d9d9d9] bg-surface-2 opacity-50'
          : selected
            ? 'border-ink bg-accent-400 shadow-hard-sm'
            : 'border-ink bg-white hover:-translate-y-0.5 hover:shadow-hard-sm'
      }`}
    >
      <ProductImage
        src={option.image_url}
        alt={option.name}
        className="aspect-[4/3] border-b-2 border-ink"
      />
      {selected && (
        <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-ink">
          <Check className="h-4 w-4 text-accent-400" strokeWidth={3} />
        </span>
      )}
      <span className="flex flex-1 flex-col p-3">
        <span className="text-[13px] font-bold leading-snug text-fg">{option.name}</span>
        {option.description && (
          <span className="mt-1 text-[11.5px] font-medium leading-relaxed text-[#4a4a4a]">
            {option.description}
          </span>
        )}
        {disabled && (
          <span className="mt-1.5 text-[10.5px] font-bold uppercase text-brand-600">
            No compatible con el cable elegido
          </span>
        )}
      </span>
    </button>
  )
}

export default function CableBuilder() {
  const [loading, setLoading] = useState(true)
  const [types, setTypes] = useState([])
  const [ends, setEnds] = useState([])

  const [step, setStep] = useState(0)
  const [type, setType] = useState(null)
  const [endA, setEndA] = useState(null)
  const [endB, setEndB] = useState(null)
  const [length, setLength] = useState('')
  const [qty, setQty] = useState(1)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    getCableOptions()
      .then(({ types, ends }) => {
        setTypes(types)
        setEnds(ends)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Al cambiar el cable, descarta terminales que dejen de ser compatibles.
  function pickType(t) {
    setType(t)
    if (endA && !isCompatible(endA, t)) setEndA(null)
    if (endB && !isCompatible(endB, t)) setEndB(null)
    setStep(1)
  }

  const lengthOk = Number(length) > 0
  const stepReady = [!!type, !!endA, !!endB, lengthOk, true]

  const waText = [
    'Hola, quiero cotizar un cable a la medida 💪',
    `• Cable: ${type?.name ?? ''}`,
    `• Terminal 1: ${endA?.name ?? ''}`,
    `• Terminal 2: ${endB?.name ?? ''}`,
    `• Largo total: ${length} cm (punta a punta)`,
    `• Cantidad: ${qty}`,
    notes.trim() ? `• Notas: ${notes.trim()}` : null,
  ]
    .filter(Boolean)
    .join('\n')
  const waLink = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(waText)}`

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner />
      </div>
    )
  }

  // Sin opciones configuradas: se cotiza directo por WhatsApp.
  if (types.length === 0 || ends.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="sticker mx-auto grid h-16 w-16 place-items-center rounded-full">
          <Cable className="h-8 w-8 text-fg" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-black uppercase text-fg">
          Cables a la medida
        </h1>
        <p className="mt-3 text-sm font-medium leading-relaxed text-[#4a4a4a]">
          Fabricamos o duplicamos el cable de tu equipo. Escríbenos con una foto del cable
          (aunque esté roto) y te cotizamos al momento.
        </p>
        <a
          href={`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(
            'Hola, necesito un cable a la medida para mi equipo de gimnasio. Les comparto una foto:'
          )}`}
          target="_blank"
          rel="noreferrer"
          className="btn-sticker-yellow mt-6"
        >
          <MessageCircle className="h-[17px] w-[17px]" />
          Cotizar por WhatsApp
        </a>
      </div>
    )
  }

  const stepContent = [
    // Paso 1 · Tipo de cable
    <div key="type">
      <h2 className="font-display text-lg font-extrabold uppercase text-fg">
        Elige el tipo de cable
      </h2>
      <p className="mt-1 text-[13px] font-medium text-fg-subtle">
        Color / recubrimiento y grosor. Si no estás seguro del grosor, mide el diámetro del
        cable viejo o mándanos una foto en las notas.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {types.map((t) => (
          <OptionCard
            key={t.id}
            option={t}
            selected={type?.id === t.id}
            onSelect={() => pickType(t)}
          />
        ))}
      </div>
    </div>,

    // Paso 2 · Terminal #1
    <div key="endA">
      <h2 className="font-display text-lg font-extrabold uppercase text-fg">
        Elige la terminal #1
      </h2>
      <p className="mt-1 text-[13px] font-medium text-fg-subtle">
        El herraje de un extremo del cable. Las opciones no compatibles con tu cable quedan
        bloqueadas.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ends.map((e) => (
          <OptionCard
            key={e.id}
            option={e}
            selected={endA?.id === e.id}
            disabled={!isCompatible(e, type)}
            onSelect={() => {
              setEndA(e)
              setStep(2)
            }}
          />
        ))}
      </div>
    </div>,

    // Paso 3 · Terminal #2
    <div key="endB">
      <h2 className="font-display text-lg font-extrabold uppercase text-fg">
        Elige la terminal #2
      </h2>
      <p className="mt-1 text-[13px] font-medium text-fg-subtle">
        El herraje del otro extremo (puede ser igual a la terminal #1).
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ends.map((e) => (
          <OptionCard
            key={e.id}
            option={e}
            selected={endB?.id === e.id}
            disabled={!isCompatible(e, type)}
            onSelect={() => {
              setEndB(e)
              setStep(3)
            }}
          />
        ))}
      </div>
    </div>,

    // Paso 4 · Medida y cantidad
    <div key="measure" className="max-w-[520px]">
      <h2 className="font-display text-lg font-extrabold uppercase text-fg">
        Largo y cantidad
      </h2>
      <div className="mt-4 flex items-start gap-2.5 rounded-[10px] border-2 border-ink bg-accent-400 px-4 py-3">
        <Ruler className="mt-0.5 h-[18px] w-[18px] shrink-0 text-fg" strokeWidth={2} />
        <p className="text-[12.5px] font-semibold leading-relaxed text-fg">
          Mide el cable completo de punta a punta, incluyendo las terminales. Si el cable
          viejo está roto, suma los tramos.
        </p>
      </div>
      <div className="mt-5 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.06em] text-[#4a4a4a]">
            Largo total (cm)
          </label>
          <input
            type="number"
            min="1"
            step="0.5"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            placeholder="Ej. 152.5"
            className="field w-40"
          />
        </div>
        <div>
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.06em] text-[#4a4a4a]">
            Cantidad
          </span>
          <div className="flex items-center overflow-hidden rounded-[10px] border-2 border-ink">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="grid h-11 w-11 place-items-center text-fg hover:bg-surface-2 disabled:opacity-40"
              aria-label="Quitar uno"
            >
              <Minus className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <span className="grid h-11 w-11 place-items-center border-x-2 border-ink text-[15px] font-bold text-fg">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(99, q + 1))}
              className="grid h-11 w-11 place-items-center text-fg hover:bg-surface-2"
              aria-label="Agregar uno"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.06em] text-[#4a4a4a]">
          Notas (opcional)
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Marca y modelo del equipo, dudas de medida, etc."
          className="field"
        />
      </div>
      <button
        type="button"
        onClick={() => setStep(4)}
        disabled={!lengthOk}
        className="btn-primary mt-6 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Ver resumen
        <ChevronRight className="h-4 w-4 text-accent-400" strokeWidth={2.5} />
      </button>
    </div>,

    // Paso 5 · Resumen → WhatsApp
    <div key="summary" className="max-w-[520px]">
      <h2 className="font-display text-lg font-extrabold uppercase text-fg">Tu cable</h2>
      <div className="sticker mt-4 p-5">
        <ul className="space-y-2.5 text-[13.5px] font-medium text-[#4a4a4a]">
          <li className="flex justify-between gap-3">
            <span>Cable</span>
            <span className="text-right font-bold text-fg">{type?.name}</span>
          </li>
          <li className="flex justify-between gap-3">
            <span>Terminal #1</span>
            <span className="text-right font-bold text-fg">{endA?.name}</span>
          </li>
          <li className="flex justify-between gap-3">
            <span>Terminal #2</span>
            <span className="text-right font-bold text-fg">{endB?.name}</span>
          </li>
          <li className="flex justify-between gap-3">
            <span>Largo total</span>
            <span className="font-bold text-fg">{length} cm</span>
          </li>
          <li className="flex justify-between gap-3">
            <span>Cantidad</span>
            <span className="font-bold text-fg">{qty}</span>
          </li>
          {notes.trim() && (
            <li className="border-t-2 border-ink pt-2.5">
              <span className="block text-[11px] font-bold uppercase text-fg-subtle">Notas</span>
              <span className="text-fg">{notes.trim()}</span>
            </li>
          )}
        </ul>
      </div>
      <a href={waLink} target="_blank" rel="noreferrer" className="btn-sticker-yellow mt-5 w-full">
        <MessageCircle className="h-[17px] w-[17px]" />
        Cotizar por WhatsApp
      </a>
      <p className="mt-2.5 text-center text-[12.5px] font-medium text-fg-subtle">
        Te respondemos con el precio y el tiempo de entrega. También puedes traer tu cable
        viejo a la {STORE.branch}.
      </p>
    </div>,
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="title-stamp text-lg sm:text-2xl">
            <span>Arma tu cable</span>
          </h1>
          <p className="mt-2.5 max-w-[560px] text-[13px] font-medium text-fg-subtle">
            Fabricamos o duplicamos el cable de tu máquina: elige el cable, las terminales y el
            largo, y cotízalo por WhatsApp.
          </p>
        </div>
        <Link
          to="/reparaciones"
          className="inline-flex items-center gap-2 text-[12.5px] font-bold text-fg underline underline-offset-4 transition hover:text-brand-600"
        >
          <Wrench className="h-4 w-4 text-brand-600" />
          ¿Necesitas también servicio técnico?
        </Link>
      </div>

      {/* Pasos: los completados o el actual son navegables */}
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
        {STEP_LABELS.map((label, i) => {
          const done = stepReady[i] && i < step
          const reachable = i <= step || stepReady.slice(0, i).every(Boolean)
          return (
            <button
              key={label}
              type="button"
              onClick={() => reachable && setStep(i)}
              disabled={!reachable}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 font-display text-[10.5px] font-extrabold uppercase tracking-[.06em] transition ${
                i === step
                  ? 'border-ink bg-ink text-white'
                  : done
                    ? 'border-ink bg-accent-400 text-fg'
                    : reachable
                      ? 'border-ink bg-white text-fg hover:bg-surface-2'
                      : 'cursor-not-allowed border-[#d9d9d9] bg-white text-fg-subtle'
              }`}
            >
              {done && <Check className="h-3 w-3" strokeWidth={3.5} />}
              {i + 1} · {label}
            </button>
          )
        })}
      </div>

      {/* Contenido del paso */}
      <div className="mt-7">{stepContent[step]}</div>

      {/* Volver */}
      {step > 0 && (
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          className="mt-8 inline-flex items-center gap-2 text-[12.5px] font-bold text-fg-muted transition hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" />
          Paso anterior
        </button>
      )}
    </div>
  )
}
