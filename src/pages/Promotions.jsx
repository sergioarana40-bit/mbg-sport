import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Check, Truck, Store, CreditCard, AlertCircle } from 'lucide-react'
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

// Franja izquierda del cupón según su tipo (diseño 07).
function CouponStripe({ coupon }) {
  if (coupon.type === 'percent') {
    return (
      <div className="flex w-16 shrink-0 items-center justify-center bg-brand-600 text-white">
        <span className="-rotate-90 whitespace-nowrap font-display text-[22px] font-bold">
          -{Number(coupon.value)}%
        </span>
      </div>
    )
  }
  if (coupon.type === 'fixed') {
    return (
      <div className="flex w-16 shrink-0 items-center justify-center bg-accent-500 text-ink">
        <span className="-rotate-90 whitespace-nowrap font-display text-lg font-bold">
          -{money(coupon.value)}
        </span>
      </div>
    )
  }
  return (
    <div className="flex w-16 shrink-0 items-center justify-center bg-green-600 text-white">
      <Truck className="h-[26px] w-[26px]" strokeWidth={1.7} />
    </div>
  )
}

// Tarjeta de cupón (diseño 07): franja de color + código + Copiar.
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
    <div className="flex overflow-hidden rounded-[14px] border border-line bg-surface">
      <CouponStripe coupon={coupon} />
      <div className="min-w-0 flex-1 p-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate font-mono text-[15px] font-bold tracking-[.05em] text-fg">
            {coupon.code}
          </span>
          <button
            onClick={copy}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
              copied ? 'bg-emerald-600 text-white' : 'bg-surface-3 text-fg hover:bg-surface-2'
            }`}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <p className="mt-1.5 text-[11.5px] text-fg-muted">
          {couponLabel(coupon)}
          {Number(coupon.min_subtotal) > 0 && ` · mínimo ${money(coupon.min_subtotal)}`}
        </p>
        <p className="mt-0.5 text-[11px] text-fg-subtle">
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
      <h1 className="mb-5 font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
        Promociones
      </h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Hero promocional (diseño 07) */}
          <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(80% 130% at 92% 0%, rgba(220,38,38,.55) 0%, rgba(220,38,38,0) 62%)',
              }}
            />
            <div className="relative">
              <span className="rounded-full bg-accent-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.05em] text-ink">
                Bienvenida
              </span>
              <h2 className="mt-2.5 font-display text-[26px] font-bold uppercase leading-none text-fg">
                {hero
                  ? `-${Number(hero.value)}% en tu compra`
                  : 'Ofertas MBG Sport'}
              </h2>
              <p className="mt-1.5 text-xs text-[#d4d4d8]">
                {hero ? (
                  <>
                    Con el código <b className="text-accent-400">{hero.code}</b>
                    {Number(hero.min_subtotal) > 0
                      ? ` · pedido mínimo ${money(hero.min_subtotal)}`
                      : ' · sin monto mínimo'}
                  </>
                ) : (
                  'Vuelve pronto para ver cupones y descuentos.'
                )}
              </p>
            </div>
          </div>

          {/* Cupones activos */}
          {coupons.map((c) => (
            <CouponCard key={c.id} coupon={c} />
          ))}

          {/* Beneficios permanentes (diseño 07) */}
          {STORE.pickupOnly ? (
            <div className="flex items-center gap-3 rounded-[15px] border border-line bg-surface p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[11px] bg-brand-600/15 text-brand-500">
                <Store className="h-[22px] w-[22px]" strokeWidth={1.7} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-fg">Recoge en tienda sin costo</p>
                <p className="mt-0.5 text-[11.5px] text-fg-muted">
                  Tu pedido listo hoy · {STORE.city}
                </p>
              </div>
            </div>
          ) : (
            STORE.freeShippingFrom && (
              <div className="flex items-center gap-3 rounded-[15px] border border-line bg-surface p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[11px] bg-brand-600/15 text-brand-500">
                  <Truck className="h-[22px] w-[22px]" strokeWidth={1.7} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-fg">
                    Envío gratis desde {money(STORE.freeShippingFrom)}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-fg-muted">
                    En todos los pedidos · a todo México
                  </p>
                </div>
              </div>
            )
          )}
          <div className="flex items-center gap-3 rounded-[15px] border border-line bg-surface p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[11px] bg-blue-400/15 text-blue-400">
              <CreditCard className="h-[22px] w-[22px]" strokeWidth={1.7} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-fg">Meses sin intereses</p>
              <p className="mt-0.5 text-[11.5px] text-fg-muted">
                Paga a meses con MercadoPago
              </p>
            </div>
          </div>

          {/* Aplicar un código (diseño 07) */}
          <form onSubmit={handleApply} className="flex items-center gap-2.5 pt-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ingresa un código…"
              className="h-[46px] min-w-0 flex-1 rounded-xl border border-dashed border-white/20 bg-surface px-3.5 font-mono text-[13px] uppercase text-fg placeholder:text-fg-subtle focus:border-brand-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={applying || !code.trim()}
              className="grid h-[46px] shrink-0 place-items-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {applying ? <Spinner size={4} className="border-white/40 border-t-white" /> : 'Aplicar'}
            </button>
          </form>
          {error && (
            <p className="flex items-center gap-2 text-xs text-brand-400">
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
