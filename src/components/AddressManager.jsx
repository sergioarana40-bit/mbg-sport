import { useEffect, useState } from 'react'
import { MapPin, Plus, Pencil, Trash2, Star, AlertCircle } from 'lucide-react'
import Modal from './Modal'
import Spinner from './Spinner'
import { getAddresses, saveAddress, deleteAddress } from '../lib/account'

const EMPTY = { label: '', recipient: '', phone: '', full_address: '', is_default: false }

export default function AddressManager({ userId }) {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  async function load() {
    setLoading(true)
    try {
      setAddresses(await getAddresses(userId))
    } catch {
      setAddresses([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  function openNew() {
    setForm(EMPTY)
    setError('')
    setModalOpen(true)
  }
  function openEdit(a) {
    setForm({
      id: a.id,
      label: a.label || '',
      recipient: a.recipient || '',
      phone: a.phone || '',
      full_address: a.full_address || '',
      is_default: a.is_default,
    })
    setError('')
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.full_address.trim()) {
      setError('Escribe la dirección.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await saveAddress(userId, form)
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
    await deleteAddress(confirmDelete.id)
    setConfirmDelete(null)
    await load()
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-fg">Mis direcciones</h2>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-1.5 rounded-lg bg-surface-3 px-3 py-1.5 text-sm font-semibold text-fg transition hover:bg-surface-2"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : addresses.length === 0 ? (
        <p className="mt-4 rounded-xl bg-surface-2 px-4 py-6 text-center text-sm text-fg-muted">
          Aún no tienes direcciones guardadas.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {addresses.map((a) => (
            <li key={a.id} className="flex gap-3 rounded-xl bg-surface-2 p-3">
              <MapPin className="mt-0.5 h-4.5 w-4.5 shrink-0 text-brand-400" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-semibold text-fg">
                  {a.label || 'Dirección'}
                  {a.is_default && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-600/15 px-2 py-0.5 text-[10px] font-bold text-brand-400">
                      <Star className="h-3 w-3 fill-brand-400" /> Principal
                    </span>
                  )}
                </p>
                <p className="text-xs text-fg-muted">{a.full_address}</p>
                {a.recipient && <p className="text-xs text-fg-subtle">{a.recipient} · {a.phone}</p>}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(a)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted hover:bg-surface-3 hover:text-brand-400"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setConfirmDelete(a)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted hover:bg-brand-600/15 hover:text-brand-400"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? 'Editar dirección' : 'Nueva dirección'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-fg-muted">
              Etiqueta (Casa, Oficina…)
            </label>
            <input
              className="field"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Casa"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-fg-muted">Dirección completa</label>
            <textarea
              className="field"
              rows={2}
              value={form.full_address}
              onChange={(e) => setForm({ ...form, full_address: e.target.value })}
              placeholder="Calle y número, colonia, ciudad, C.P."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-fg-muted">Recibe</label>
              <input
                className="field"
                value={form.recipient}
                onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                placeholder="Nombre"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-fg-muted">Teléfono</label>
              <input
                className="field"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-fg-muted">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
              className="h-4 w-4 rounded border-line bg-surface-2 text-brand-600 focus:ring-brand-500"
            />
            Usar como dirección principal
          </label>

          {error && (
            <p className="flex items-center gap-2 rounded-lg bg-brand-600/15 p-3 text-sm text-brand-300">
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
        title="Eliminar dirección"
        maxWidth="max-w-sm"
      >
        <p className="text-sm text-fg-muted">¿Eliminar esta dirección guardada?</p>
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
