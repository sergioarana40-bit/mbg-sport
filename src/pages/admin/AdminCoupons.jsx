import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, AlertCircle, Ticket } from 'lucide-react'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'
import { formatPrice, STORE } from '../../config'
import { couponLabel } from '../../lib/coupons'
import { isSupabaseConfigured } from '../../lib/supabase'
import { getAllCoupons, saveCoupon, deleteCoupon } from '../../lib/admin'

const EMPTY = { code: '', type: 'percent', value: '', min_subtotal: '', active: true, expires_at: '' }

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  async function load() {
    setLoading(true)
    try {
      setCoupons(await getAllCoupons())
    } catch {
      /* noop */
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  function openNew() {
    setForm(EMPTY)
    setError('')
    setModalOpen(true)
  }
  function openEdit(c) {
    setForm({
      id: c.id,
      code: c.code,
      type: c.type,
      value: c.value,
      min_subtotal: c.min_subtotal,
      active: c.active,
      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '',
    })
    setError('')
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.code.trim()) {
      setError('El código es obligatorio.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await saveCoupon(form)
      setModalOpen(false)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return
    try {
      await deleteCoupon(confirmDelete.id)
      setConfirmDelete(null)
      await load()
    } catch (err) {
      setError(err.message)
      setConfirmDelete(null)
    }
  }

  const inputClass = 'field'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="title-stamp text-lg sm:text-xl">
            <span>Cupones</span>
          </h1>
          <p className="mt-2 text-xs font-medium text-fg-subtle">{coupons.length} cupones</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-brand-600 px-4 py-2.5 font-display text-[11.5px] font-extrabold uppercase text-white shadow-hard-sm transition hover:bg-brand-700 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={3} />
          Nuevo cupón
        </button>
      </div>

      {!isSupabaseConfigured && (
        <div className="flex items-start gap-2 rounded-[10px] border-2 border-ink bg-accent-400/50 p-4 text-sm font-medium text-fg">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Modo demostración: conecta Supabase para gestionar cupones.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <div className="overflow-hidden rounded-[10px] border-2 border-ink bg-white">
          <ul className="divide-y divide-[#e5e5e5]">
            {coupons.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border-2 border-ink bg-accent-400 text-fg">
                  <Ticket className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono font-bold text-fg">{c.code}</p>
                  <p className="truncate text-xs font-medium text-[#4a4a4a]">
                    {couponLabel(c)}
                    {Number(c.min_subtotal) > 0 && ` · desde ${formatPrice(c.min_subtotal)}`}
                    {!c.active && ' · inactivo'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(c)}
                    className="grid h-[30px] w-[30px] place-items-center rounded-[7px] border-2 border-ink text-fg transition hover:bg-accent-400"
                    aria-label="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(c)}
                    className="grid h-[30px] w-[30px] place-items-center rounded-[7px] border-2 border-ink text-fg transition hover:bg-brand-600 hover:text-white"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
            {coupons.length === 0 && (
              <li className="px-4 py-12 text-center text-fg-subtle">Aún no hay cupones.</li>
            )}
          </ul>
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? 'Editar cupón' : 'Nuevo cupón'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-fg-muted">Código</label>
            <input
              className={`${inputClass} uppercase`}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="MBG15"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-fg-muted">Tipo</label>
              <select
                className={inputClass}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="percent">Porcentaje (%)</option>
                <option value="fixed">Monto fijo ($)</option>
                {/* Sin envío a domicilio no tiene sentido ofrecer cupones de envío gratis. */}
                {!STORE.pickupOnly && <option value="free_shipping">Envío gratis</option>}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-fg-muted">
                Valor {form.type === 'percent' ? '(%)' : form.type === 'fixed' ? '($)' : ''}
              </label>
              <input
                type="number"
                min="0"
                className={inputClass}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                disabled={form.type === 'free_shipping'}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-fg-muted">
                Compra mínima ($)
              </label>
              <input
                type="number"
                min="0"
                className={inputClass}
                value={form.min_subtotal}
                onChange={(e) => setForm({ ...form, min_subtotal: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-fg-muted">Expira (opcional)</label>
              <input
                type="date"
                className={inputClass}
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-fg-muted">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 rounded border-2 border-ink accent-brand-600"
            />
            Activo
          </label>

          {error && (
            <p className="flex items-center gap-2 rounded-lg border-2 border-ink bg-brand-600 p-3 text-sm font-semibold text-white">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-fg-muted hover:bg-surface-2"
            >
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary px-5 py-2 text-sm">
              {saving && <Spinner size={4} className="border-white/40 border-t-white" />}
              Guardar
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Eliminar cupón"
        maxWidth="max-w-sm"
      >
        <p className="text-sm text-fg-muted">
          ¿Eliminar el cupón <b className="text-fg">{confirmDelete?.code}</b>?
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={() => setConfirmDelete(null)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-fg-muted hover:bg-surface-2"
          >
            Cancelar
          </button>
          <button onClick={handleDelete} className="btn-primary px-5 py-2 text-sm">
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  )
}
