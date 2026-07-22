import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Check, PackageCheck, CreditCard, AlertCircle, Wrench } from 'lucide-react'
import Spinner from '../components/Spinner'
import { useCart } from '../context/CartContext'
import { getActiveCoupons, findCoupon, couponLabel } from '../lib/coupons'
import { formatPrice, STORE } from '../config'

function fmtDate(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

const money = (v) => formatPrice(v).replace(/\.00\b/, '')

// Patrón de puntos del póster (tarjeta hero).
const DOTS_STYLE = {
  backgroundImage: 'radial-gradient(rgba(0,0,0,.07) 1.5px, transparent 1.5px)',
  backgroundSize: '14px 14px',
}

// Franja izquierda del cupón según su tipo (diseño 1b).
function CouponStripe({ coupon }) {
  if (coupon.type === 'percent') {
    return (
      <div className="flex w-16 shrink-0 items-center justify-center border-r-2 border-ink bg-brand-600 text-white">
        <span className="-rotate-90 whitespace-nowrap font-display text-lg font-extrabold">
          −{Number(coupon.value)}%
        </span>
      </div>
    )
  }
  if (coupon.type === 'fixed') {
    return (
      <div className="flex w-16 shrink-0 items-center justify-center border-r-2 border-ink bg-accent-400 text-fg">
        <span className="-rotate-90 whitespace-nowrap font-display text-[15px] font-extrabold">
          −{money(coupon.value)}
        </span>
      </div>
    )
  }
  return (
    <div className="flex w-16 shrink-0 items-center justify-center border-r-2 border-ink bg-ink text-accent-400">
      <Wrench className="h-6 w-6" strokeWidth={1.7} />
    </div>
  )
}

// Tarjeta de cupón (sticker con franja de color + código + Copiar).
function CouponCard({ coupon }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(coupon.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      /* portapapeles no disponible */
    }
  }

  return (
    <div className="sticker flex overflow-hidden">
      <CouponStripe coupon={coupon} />
      <div className="min-w-0 flex-1 px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate font-mono text-[15px] font-bold tracking-[.05em] text-fg">
            {coupon.code}
          </span>
          <button
            onClick={copy}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 font-display text-[11px] font-extrabold uppercase text-white transition active:scale-95 ${
              copied ? 'bg-state-paid' : 'bg-ink hover:bg-ink-2'
            }`}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <p className="mt-1.5 text-xs font-medium text-[#4a4a4a]">
          {couponLabel(coupon)}
          {Number(coupon.min_subtotal) > 0 && ` · mínimo ${money(coupon.min_subtotal)}`}
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-fg-subtle">
          {coupon.expires_at ? `Vence ${fmtDate(coupon.expires_at)}` : 'Sin vencimiento'}
        </p>
      </div>
    </div>
  )
}

export default function Promotions() {
  const navigate = useNavigate()
  const { applyCoupon } = useCart()
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getActiveCoupons()
      .then(setCoupons)
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false))
  }, [])

  // Cupón estrella para el hero: el primero de tipo porcentaje.
  const hero = coupons.find((c) => c.type === 'percent')

  async function handleApply(e) {
    e.preventDefault()
    const value = code.trim()
    if (!value) return
    setApplying(true)
    setError('')
    try {
      const coupon = await findCoupon(value)
      if (!coupon) {
        setError('Cupón no válido.')
        return
      }
      applyCoupon(coupon)
      navigate('/carrito')
    } catch {
      setError('No se pudo validar el cupón.')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="title-stamp text-lg sm:text-2xl">
        <span>Promociones</span>
      </h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <div className="mt-5 space-y-3.5">
          {/* Hero promocional: tarjeta amarilla con puntos (diseño 1b) */}
          <div
            className="rounded-xl border-2 border-ink bg-accent-400 p-6 sm:p-7"
            style={DOTS_STYLE}
          >
            <span className="inline-block bg-ink px-2.5 py-1 font-display text-[10px] font-extrabold uppercase tracking-[.14em] text-accent-400">
              Bienvenida
            </span>
            <h2 className="mt-3 font-display text-2xl font-black uppercase leading-none text-fg sm:text-[34px]">
              {hero ? `−${Number(hero.value)}% en tu primera compra` : `Ofertas ${STORE.name}`}
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-3.5">
              {hero ? (
                <>
                  <span className="inline-block rounded-lg bg-ink px-4 py-2.5 font-mono text-base font-bold tracking-[.2em] text-accent-400">
                    {hero.code}
                  </span>
                  <span className="text-[12.5px] font-semibold text-fg">
                    {Number(hero.min_subtotal) > 0
                      ? `pedido mínimo ${money(hero.min_subtotal)}`
                      : 'sin monto mínimo'}
                    {hero.expires_at ? ` · vence ${fmtDate(hero.expires_at)}` : ''}
                  </span>
                </>
              ) : (
                <span className="text-[12.5px] font-semibold text-fg">
                  Vuelve pronto para ver cupones y descuentos.
                </span>
              )}
            </div>
          </div>

          {/* Cupones activos */}
          {coupons.map((c) => (
            <CouponCard key={c.id} coupon={c} />
          ))}

          {/* Beneficios permanentes */}
          <div className="grid gap-3.5 pt-1.5 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-[10px] border-2 border-ink bg-white p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border-2 border-ink bg-accent-400 text-fg">
                <PackageCheck className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold text-fg">
                  {STORE.pickupOnly ? 'Recoge en tienda sin costo' : 'Recoge en tienda'}
                </p>
                <p className="mt-0.5 text-[11.5px] font-medium text-fg-subtle">
                  Tu pedido listo hoy · {STORE.city.split(',')[0]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[10px] border-2 border-ink bg-white p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border-2 border-ink bg-accent-400 text-fg">
                <CreditCard className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold text-fg">Meses sin intereses</p>
                <p className="mt-0.5 text-[11.5px] font-medium text-fg-subtle">
                  Paga a meses con MercadoPago
                </p>
              </div>
            </div>
          </div>

          {/* Aplicar un código */}
          <form onSubmit={handleApply} className="flex items-center gap-2.5 pt-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ingresa un código…"
              className="h-[46px] min-w-0 flex-1 rounded-[10px] border-2 border-dashed border-ink bg-white px-3.5 font-mono text-[13px] font-semibold uppercase tracking-[.08em] text-fg placeholder:text-fg-subtle focus:border-solid focus:outline-none"
            />
            <button
              type="submit"
              disabled={applying || !code.trim()}
              className="grid h-[46px] shrink-0 place-items-center rounded-[10px] bg-ink px-5 font-display text-xs font-extrabold uppercase tracking-[.08em] text-white transition hover:bg-ink-2 disabled:opacity-50"
            >
              {applying ? <Spinner size={4} className="border-white/40 border-t-white" /> : 'Aplicar'}
            </button>
          </form>
          {error && (
            <p className="flex items-center gap-2 text-xs font-bold text-brand-600">
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
