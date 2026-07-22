import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, AlertCircle, GripVertical } from 'lucide-react'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'
import CategoryIcon from '../../components/CategoryIcon'
import { isSupabaseConfigured } from '../../lib/supabase'
import { getAllCategories, saveCategory, deleteCategory } from '../../lib/admin'

const EMPTY = { name: '', sort_order: 0 }

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  async function load() {
    setLoading(true)
    try {
      setCategories(await getAllCategories())
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
    setForm({ ...EMPTY, sort_order: categories.length })
    setError('')
    setModalOpen(true)
  }

  function openEdit(c) {
    setForm({ id: c.id, name: c.name, sort_order: c.sort_order ?? 0 })
    setError('')
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await saveCategory(form)
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
      await deleteCategory(confirmDelete.id)
      setConfirmDelete(null)
      await load()
    } catch (err) {
      setError(err.message)
      setConfirmDelete(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="title-stamp text-lg sm:text-xl">
            <span>Categorías</span>
          </h1>
          <p className="mt-2 text-xs font-medium text-fg-subtle">
            {categories.length} categorías
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-brand-600 px-4 py-2.5 font-display text-[11.5px] font-extrabold uppercase text-white shadow-hard-sm transition hover:bg-brand-700 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={3} />
          Nueva categoría
        </button>
      </div>

      {!isSupabaseConfigured && (
        <div className="flex items-start gap-2 rounded-[10px] border-2 border-ink bg-accent-400/50 p-4 text-sm font-medium text-fg">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Modo demostración: conecta Supabase para crear o editar categorías.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <div className="overflow-hidden rounded-[10px] border-2 border-ink bg-white">
          <ul className="divide-y divide-[#e5e5e5]">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2">
                <GripVertical className="h-4 w-4 text-fg-subtle" />
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border-2 border-ink bg-accent-400 text-fg">
                  <CategoryIcon category={c} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-fg">{c.name}</p>
                  <p className="truncate text-xs font-medium text-fg-subtle">/{c.slug}</p>
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
            {categories.length === 0 && (
              <li className="px-4 py-12 text-center text-fg-subtle">Aún no hay categorías.</li>
            )}
          </ul>
        </div>
      )}

      {/* Modal formulario */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? 'Editar categoría' : 'Nueva categoría'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-fg-muted">Nombre</label>
            <input
              className="field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Pesas y Mancuernas"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-fg-muted">
              Orden de aparición
            </label>
            <input
              type="number"
              min="0"
              className="field"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
            />
          </div>

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

      {/* Confirmar borrado */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Eliminar categoría"
        maxWidth="max-w-sm"
      >
        <p className="text-sm text-fg-muted">
          ¿Eliminar <b className="text-fg">{confirmDelete?.name}</b>? Los productos de esta
          categoría quedarán sin categoría.
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
