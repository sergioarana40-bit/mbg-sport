import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, AlertCircle } from 'lucide-react'
import StarRating from './StarRating'
import Spinner from './Spinner'
import { useAuth } from '../context/AuthContext'
import { getReviews, summarize, addReview } from '../lib/reviews'

function initials(name) {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
function fmtDate(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export default function ProductReviews({ productId, onSummary }) {
  const { user, profile } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      setReviews(await getReviews(productId))
    } catch {
      setReviews([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  const { count, avg, dist } = summarize(reviews)

  // Informa el resumen al padre (para la fila de estrellas junto al título).
  useEffect(() => {
    if (!loading) onSummary?.({ avg, count })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, avg, count])

  async function submit(e) {
    e.preventDefault()
    if (rating < 1) {
      setError('Elige una calificación.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await addReview({
        productId,
        userId: user.id,
        author: profile?.full_name || user.email.split('@')[0],
        rating,
        body: body.trim(),
      })
      setBody('')
      setRating(5)
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section id="resenas" className="mt-12 scroll-mt-32 pt-2">
      <h2 className="title-stamp text-xl">
        <span>Reseñas</span>
      </h2>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <div className="mt-5">
          {/* Resumen */}
          {count > 0 && (
            <div className="sticker flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:gap-8">
              <div className="text-center">
                <div className="font-display text-5xl font-black leading-none text-fg">
                  {avg.toFixed(1)}
                </div>
                <StarRating value={avg} size={3.75} className="mt-2.5 justify-center" />
                <div className="mt-2 text-xs font-medium text-fg-subtle">
                  {count} reseña{count === 1 ? '' : 's'}
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                {dist.map((d) => (
                  <div key={d.star} className="flex items-center gap-2">
                    <span className="w-3 text-xs font-bold text-fg">{d.star}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full border border-ink bg-white">
                      <span
                        className="block h-full bg-accent-400"
                        style={{ width: `${d.pct}%` }}
                      />
                    </span>
                    <span className="w-8 text-right text-xs text-fg-subtle">{d.n}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acción: escribir reseña */}
          <div className="mt-5">
            {user ? (
              !showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-primary w-full px-5 py-3 text-[11.5px] sm:w-auto"
                >
                  <Pencil className="h-4 w-4" />
                  Escribir reseña
                </button>
              )
            ) : (
              <p className="rounded-[10px] border-2 border-ink bg-surface-2 px-4 py-3 text-sm font-medium text-fg-muted">
                <Link to="/cuenta/login" className="font-bold text-brand-600 hover:text-brand-700">
                  Inicia sesión
                </Link>{' '}
                para dejar tu reseña.
              </p>
            )}

            {showForm && (
              <form onSubmit={submit} className="sticker p-5">
                <p className="text-sm font-bold text-fg">Tu calificación</p>
                <StarRating value={rating} size={7} onChange={setRating} className="mt-2" />
                <textarea
                  className="field mt-4"
                  rows={3}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Cuéntanos tu experiencia con el producto…"
                />
                {error && (
                  <p className="mt-3 flex items-center gap-2 rounded-lg border-2 border-ink bg-brand-600 p-2.5 text-sm font-semibold text-white">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </p>
                )}
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-lg px-4 py-2 text-sm font-bold text-fg-muted hover:bg-surface-2"
                  >
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 text-xs">
                    {saving && <Spinner size={4} className="border-white/40 border-t-white" />}
                    Publicar
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Lista de reseñas */}
          {count === 0 ? (
            <p className="mt-5 rounded-[10px] border-2 border-dashed border-ink py-10 text-center text-sm font-medium text-fg-muted">
              Todavía no hay reseñas. ¡Sé el primero en opinar!
            </p>
          ) : (
            <div className="mt-5 space-y-3.5">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-[10px] border-2 border-ink bg-white px-[18px] py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-accent-400 text-xs font-black text-fg">
                      {initials(r.author)}
                    </span>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-fg">{r.author}</p>
                      <StarRating value={r.rating} size={3.25} />
                    </div>
                    <span className="text-[11px] font-medium text-fg-subtle">
                      {fmtDate(r.created_at)}
                    </span>
                  </div>
                  {r.body && (
                    <p className="mt-2 text-[13.5px] font-medium leading-relaxed text-[#4a4a4a]">
                      {r.body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
