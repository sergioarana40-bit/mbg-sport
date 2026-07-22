import { Link } from 'react-router-dom'
import {
  Wrench,
  MessageCircle,
  Check,
  ClipboardList,
  FileText,
  Cog,
  Activity,
  Dumbbell,
  Bike,
  ArrowRight,
  MapPin,
  Clock,
} from 'lucide-react'
import { STORE } from '../config'

// Página de Servicio técnico / Reparaciones (lenguaje póster 1b).
// Contenido basado en la sección de servicio de la Home y en los
// términos del servicio de mantenimiento (documento del cliente).

const DOTS_STYLE = {
  backgroundImage: 'radial-gradient(rgba(0,0,0,.07) 1.5px, transparent 1.5px)',
  backgroundSize: '16px 16px',
}

const EQUIPMENT = [
  { icon: Activity, name: 'Caminadoras' },
  { icon: Bike, name: 'Bicicletas fijas y spinning' },
  { icon: Cog, name: 'Elípticas y escaladoras' },
  { icon: Dumbbell, name: 'Multiestaciones y racks' },
  { icon: Wrench, name: 'Bancos, prensas y poleas' },
  { icon: ClipboardList, name: 'Equipo residencial y de gimnasio' },
]

const STEPS = [
  {
    title: 'Revisión técnica',
    text: 'Trae tu equipo o agenda la visita. La revisión tiene un costo y nos permite diagnosticar con precisión.',
  },
  {
    title: 'Cotización',
    text: 'Te entregamos la cotización de mano de obra y refacciones. La mano de obra tiene vigencia de 5 días naturales.',
  },
  {
    title: 'Refacciones',
    text: 'Las refacciones se piden sobre pedido y se pagan al ordenarlas. También puedes recogerlas en nuestras sucursales.',
  },
  {
    title: 'Reparación y entrega',
    text: 'Reparamos y confirmamos contigo el funcionamiento correcto del equipo al concluir el servicio.',
  },
]

const CONDITIONS = [
  'Mantenimiento preventivo y correctivo para gimnasios y equipo de casa',
  'Refacciones de alta precisión, solicitadas específicamente para tu equipo',
  'La mano de obra se liquida al concluir el servicio',
  'El funcionamiento se confirma en presencia del cliente',
]

export default function Repairs() {
  const waLink = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(
    'Hola, quiero cotizar la reparación / mantenimiento de mi equipo de gimnasio.'
  )}`

  return (
    <div>
      {/* Hero rojo (como la banda de servicio del póster 1b) */}
      <section className="bg-brand-600">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[1.1fr_.9fr] lg:gap-10 lg:py-16">
          <div>
            <span className="inline-block bg-ink px-3 py-1.5 font-display text-[10px] font-extrabold uppercase tracking-[.14em] text-accent-400 sm:text-xs">
              Servicio técnico · {STORE.city.split(',')[0]}
            </span>
            <h1 className="mt-4 font-display text-4xl font-black uppercase leading-[.95] text-white lg:text-[56px]">
              Reparaciones y <span className="text-accent-400">mantenimiento</span>
            </h1>
            <p className="mt-4 max-w-[520px] text-[15px] font-medium leading-relaxed text-white/90">
              Diagnóstico en tienda, refacciones de alta precisión y mantenimiento preventivo o
              correctivo para gimnasios y equipo de casa. El aliado integral del mundo fitness.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <a href={waLink} target="_blank" rel="noreferrer" className="btn-sticker-yellow">
                <MessageCircle className="h-[17px] w-[17px]" />
                Cotizar por WhatsApp
              </a>
              <Link
                to="/catalogo/refacciones"
                className="btn-primary border-[3px] border-ink"
              >
                Ver refacciones
                <ArrowRight className="h-4 w-4 text-accent-400" strokeWidth={2.5} />
              </Link>
            </div>
          </div>
          <div className="grid min-h-[220px] place-items-center border-[3px] border-ink bg-black/20 lg:min-h-[300px]">
            <img
              src="/brand/isotipo.png"
              alt=""
              className="w-[180px] lg:w-[230px]"
              style={{ filter: 'drop-shadow(0 12px 14px rgba(0,0,0,.35))' }}
            />
          </div>
        </div>
      </section>

      {/* Qué reparamos */}
      <section className="mx-auto max-w-7xl px-4 pt-10 lg:pt-14">
        <h2 className="title-stamp text-lg sm:text-2xl">
          <span>¿Qué reparamos?</span>
        </h2>
        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {EQUIPMENT.map((e) => (
            <div
              key={e.name}
              className="sticker flex flex-col items-center gap-3 p-5 text-center"
            >
              <span className="grid h-[52px] w-[52px] place-items-center rounded-lg border-2 border-ink bg-accent-400 text-fg">
                <e.icon className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <span className="text-[12.5px] font-bold uppercase text-fg">{e.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona (pasos numerados) */}
      <section className="mx-auto max-w-7xl px-4 pt-10 lg:pt-14">
        <h2 className="title-stamp text-lg sm:text-2xl">
          <span>¿Cómo funciona?</span>
        </h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="sticker relative p-5 pt-7">
              <span className="absolute -top-4 left-4 grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-brand-600 font-display text-base font-black text-white shadow-hard-sm">
                {i + 1}
              </span>
              <p className="font-display text-[15px] font-extrabold uppercase text-fg">
                {s.title}
              </p>
              <p className="mt-2 text-[13px] font-medium leading-relaxed text-[#4a4a4a]">
                {s.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Franja amarilla: condiciones + términos */}
      <section className="mt-12 border-y-2 border-ink bg-accent-400 lg:mt-14" style={DOTS_STYLE}>
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr_340px] lg:gap-12">
          <div>
            <h2 className="font-display text-2xl font-black uppercase text-fg">
              Claro y directo
            </h2>
            <ul className="mt-4 space-y-2.5">
              {CONDITIONS.map((c) => (
                <li key={c} className="flex items-start gap-2.5 text-[13.5px] font-semibold text-fg">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={3} />
                  {c}
                </li>
              ))}
            </ul>
            <Link
              to="/terminos"
              className="mt-5 inline-flex items-center gap-2 text-[13px] font-bold text-fg underline underline-offset-4 transition hover:opacity-70"
            >
              <FileText className="h-4 w-4" />
              Consulta los términos y condiciones del servicio
            </Link>
          </div>
          <div className="sticker self-start p-5">
            <p className="font-display text-[13px] font-extrabold uppercase text-fg">
              Visítanos
            </p>
            <ul className="mt-3 space-y-2.5 text-[13px] font-medium text-[#4a4a4a]">
              <li className="flex gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-brand-600" strokeWidth={2} />
                {STORE.address}
              </li>
              <li className="flex gap-2.5">
                <Clock className="h-4 w-4 shrink-0 text-brand-600" strokeWidth={2} />
                {STORE.hours}
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA final (banda negra) */}
      <section className="bg-ink">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 py-12 text-center">
          <h2 className="font-display text-2xl font-black uppercase text-white sm:text-3xl">
            ¿Tu equipo está fuera de servicio?
          </h2>
          <p className="max-w-md text-sm font-medium text-[#9a9aa0]">
            Escríbenos por WhatsApp con fotos o video del equipo y te orientamos con el siguiente
            paso.
          </p>
          <a href={waLink} target="_blank" rel="noreferrer" className="btn-sticker-yellow">
            <MessageCircle className="h-[17px] w-[17px]" />
            Cotizar ahora
          </a>
        </div>
      </section>
    </div>
  )
}
