import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Upload, AlertCircle, Wrench } from 'lucide-react'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'
import ProductImage from '../../components/ProductImage'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  getAllRepairWorks,
  saveRepairWork,
  deleteRepairWork,
  uploadRepairImage,
} from '../../lib/admin'

const EMPTY = { title: '', description: '', image_url: '', sort_order: 0, active: true }

// Galería "Trabajos recientes" de /reparaciones: el admin sube fotos y textos;
// el layout de la página pública es fijo.
export default function AdminRepairs() {
  const [works, setWorks] = useState([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  async function load() {
    setLoading(true)
    try {
      setWorks(await getAllRepairWorks())
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
    setForm({ ...EMPTY, sort_order: works.length + 1 })
    setImageFile(null)
    setPreview('')
    setError('')
    setModalOpen(true)
  }

  function openEdit(w) {
    setForm({
      id: w.id,
      title: w.title,
      description: w.description || '',
      image_url: w.image_url || '',
      sort_order: w.sort_order ?? 0,
      active: w.active !== false,
    })
    setImageFile(null)
    setPreview(w.image_url || '')
    setError('')
    setModalOpen(true)
  }

  function onPickImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Escribe un título para el trabajo.')
      return
    }
    setSaving(true)
    setError('')
    try {
      let image_url = form.image_url
      if (imageFile) image_url = await uploadRepairImage(imageFile)
      await saveRepairWork({ ...form, image_url })
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
      await deleteRepairWork(confirmDelete.id)
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
            <span>Servicio técnico</span>
          </h1>
          <p className="mt-2 text-xs font-medium text-fg-subtle">
            Galería "Trabajos recientes" de la página de reparaciones · {works.length} elemento
            {works.length === 1 ? '' : 's'}
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-brand-600 px-4 py-2.5 font-display text-[11.5px] font-extrabold uppercase text-white shadow-hard-sm transition hover:bg-brand-700 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={3} />
          Nuevo trabajo
        </button>
      </div>

      {!isSupabaseConfigured && (
        <div className="flex items-start gap-2 rounded-[10px] border-2 border-ink bg-accent-400/50 p-4 text-sm font-medium text-fg">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Modo demostración: conecta Supabase para gestionar la galería.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : works.length === 0 ? (
        <div className="rounded-[10px] border-2 border-dashed border-ink py-20 text-center">
          <div className="sticker mx-auto grid h-14 w-14 place-items-center rounded-full">
            <Wrench className="h-7 w-7 text-fg" />
          </div>
          <p className="mt-4 font-display font-extrabold uppercase text-fg">
            Aún no hay trabajos
          </p>
          <p className="mt-1 text-sm font-medium text-fg-muted">
            Sube fotos de reparaciones para mostrarlas en la página pública.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[10px] border-2 border-ink bg-white">
          <ul className="divide-y divide-[#e5e5e5]">
            {works.map((w) => (
              <li key={w.id} className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2">
                <ProductImage
                  src={w.image_url}
                  alt={w.title}
                  className="h-14 w-[74px] shrink-0 rounded-lg border-2 border-ink"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold text-fg">
                    {w.title}
                    {w.active === false && (
                      <span className="rounded-[5px] border-2 border-ink bg-surface-3 px-1.5 font-display text-[9px] font-extrabold uppercase text-fg-muted">
                        Oculto
                      </span>
                    )}
                  </p>
                  {w.description && (
                    <p className="truncate text-xs font-medium text-[#4a4a4a]">{w.description}</p>
                  )}
                </div>
                <span className="hidden font-mono text-xs font-bold text-fg-subtle sm:block">
                  #{w.sort_order}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(w)}
                    className="grid h-[30px] w-[30px] place-items-center rounded-[7px] border-2 border-ink text-fg transition hover:bg-accent-400"
                    aria-label="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(w)}
                    className="grid h-[30px] w-[30px] place-items-center rounded-[7px] border-2 border-ink text-fg transition hover:bg-brand-600 hover:text-white"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && !modalOpen && (
        <p className="flex items-center gap-2 rounded-lg border-2 border-ink bg-brand-600 p-3 text-sm font-semibold text-white">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {/* Modal alta/edición */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? 'Editar trabajo' : 'Nuevo trabajo'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Foto */}
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.06em] text-[#4a4a4a]">
              Foto del trabajo
            </label>
            <label className="block cursor-pointer">
              <ProductImage
                src={preview}
                alt="Vista previa"
                className="aspect-[4/3] rounded-[10px] border-2 border-ink"
              />
              <span className="mt-2 inline-flex items-center gap-2 rounded-lg bg-ink px-3 py-2 font-display text-[11px] font-extrabold uppercase text-white transition hover:bg-ink-2">
                <Upload className="h-3.5 w-3.5" />
                {preview ? 'Cambiar foto' : 'Subir foto'}
              </span>
              <input type="file" accept="image/*" onChange={onPickImage} className="hidden" />
            </label>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.06em] text-[#4a4a4a]">
              Título
            </label>
            <input
              className="field"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Cambio de banda en caminadora"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.06em] text-[#4a4a4a]">
              Descripción (opcional)
            </label>
            <textarea
              className="field"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Qué se hizo, tipo de equipo, etc."
            />
          </div>

          <div className="flex items-end gap-4">
            <div className="w-28">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.06em] text-[#4a4a4a]">
                Orden
              </label>
              <input
                type="number"
                min="0"
                className="field"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 pb-2.5 text-sm text-fg-muted">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 rounded border-2 border-ink accent-brand-600"
              />
              Visible en la página
            </label>
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
              className="rounded-lg px-4 py-2 text-sm font-bold text-fg-muted hover:bg-surface-2"
            >
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 text-xs">
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
        title="Eliminar trabajo"
        maxWidth="max-w-sm"
      >
        <p className="text-sm font-medium text-[#4a4a4a]">
          ¿Eliminar <b className="text-fg">{confirmDelete?.title}</b> de la galería?
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={() => setConfirmDelete(null)}
            className="rounded-lg px-4 py-2 text-sm font-bold text-fg-muted hover:bg-surface-2"
          >
            Cancelar
          </button>
          <button onClick={handleDelete} className="btn-sticker px-5 py-2 text-xs">
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  )
}
