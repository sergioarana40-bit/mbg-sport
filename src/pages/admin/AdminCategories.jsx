import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, AlertCircle, GripVertical } from 'lucide-react'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'
import CategoryIcon from '../../components/CategoryIcon'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  getAllCategories,
  saveCategory,
  deleteCategory,
} from '../../lib/admin'

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

  const inputClass =
    'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-neutral-900">
            Categorías
          </h1>
          <p className="text-sm text-neutral-500">{categories.length} categorías</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <Plus className="h-4.5 w-4.5" />
          Nueva categoría
        </button>
      </div>

      {!isSupabaseConfigured && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Modo demostración: conecta Supabase para crear o editar categorías.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <ul className="divide-y divide-neutral-100">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50">
                <GripVertical className="h-4 w-4 text-neutral-300" />
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-neutral-100 text-neutral-600">
                  <CategoryIcon category={c} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-neutral-900">{c.name}</p>
                  <p className="truncate text-xs text-neutral-400">/{c.slug}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(c)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-brand-600"
                    aria-label="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(c)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-neutral-500 hover:bg-red-50 hover:text-brand-600"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
            {categories.length === 0 && (
              <li className="px-4 py-12 text-center text-neutral-400">
                Aún no hay categorías.
              </li>
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
            <label className="mb-1 block text-sm font-medium text-neutral-700">Nombre</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Pesas y Mancuernas"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Orden de aparición
            </label>
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
            />
          </div>

          {error && (
            <p className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-brand-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-70"
            >
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
        <p className="text-sm text-neutral-600">
          ¿Eliminar <b>{confirmDelete?.name}</b>? Los productos de esta categoría quedarán sin
          categoría.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={() => setConfirmDelete(null)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  )
}
