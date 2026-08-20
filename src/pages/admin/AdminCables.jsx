import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Upload, AlertCircle, Cable } from 'lucide-react'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'
import ProductImage from '../../components/ProductImage'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  getAllCableTypes,
  saveCableType,
  deleteCableType,
  getAllCableEnds,
  saveCableEnd,
  deleteCableEnd,
  uploadCableImage,
} from '../../lib/admin'

// Administración del armador de cables (/cables): tipos de cable y terminales.
// La compatibilidad se resuelve por la etiqueta de grosor: cada terminal marca
// con qué grosores funciona; sin marcas = compatible con todos.

const EMPTY_TYPE = {
  name: '',
  description: '',
  thickness: 'delgado',
  image_url: '',
  sort_order: 0,
  active: true,
}
const EMPTY_END = {
  name: '',
  description: '',
  compatible: [],
  image_url: '',
  sort_order: 0,
  active: true,
}

function ItemRow({ item, subtitle, onEdit, onDelete }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2">
      <ProductImage
        src={item.image_url}
        alt={item.name}
        className="h-14 w-[74px] shrink-0 rounded-lg border-2 border-ink"
      />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-semibold text-fg">
          {item.name}
          {item.active === false && (
            <span className="rounded-[5px] border-2 border-ink bg-surface-3 px-1.5 font-display text-[9px] font-extrabold uppercase text-fg-muted">
              Oculto
            </span>
          )}
        </p>
        <p className="truncate text-xs font-medium text-[#4a4a4a]">{subtitle}</p>
      </div>
      <span className="hidden font-mono text-xs font-bold text-fg-subtle sm:block">
        #{item.sort_order}
      </span>
      <div className="flex gap-1">
        <button
          onClick={onEdit}
          className="grid h-[30px] w-[30px] place-items-center rounded-[7px] border-2 border-ink text-fg transition hover:bg-accent-400"
          aria-label="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="grid h-[30px] w-[30px] place-items-center rounded-[7px] border-2 border-ink text-fg transition hover:bg-brand-600 hover:text-white"
          aria-label="Eliminar"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  )
}

export default function AdminCables() {
  const [types, setTypes] = useState([])
  const [ends, setEnds] = useState([])
  const [loading, setLoading] = useState(true)

  // El modal edita tipos ('type') o terminales ('end') con el mismo flujo.
  const [kind, setKind] = useState('type')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_TYPE)
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null) // { kind, item }

  async function load() {
    setLoading(true)
    try {
      const [t, e] = await Promise.all([getAllCableTypes(), getAllCableEnds()])
      setTypes(t)
      setEnds(e)
    } catch {
      /* noop */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Vocabulario de grosores existente (para checkboxes de compatibilidad).
  const thicknessOptions = [...new Set(types.map((t) => t.thickness).filter(Boolean))]

  function openNew(newKind) {
    setKind(newKind)
    const empty = newKind === 'type' ? EMPTY_TYPE : EMPTY_END
    const list = newKind === 'type' ? types : ends
    setForm({ ...empty, sort_order: list.length + 1 })
    setImageFile(null)
    setPreview('')
    setError('')
    setModalOpen(true)
  }

  function openEdit(editKind, item) {
    setKind(editKind)
    setForm({
      id: item.id,
      name: item.name,
      description: item.description || '',
      thickness: item.thickness || '',
      compatible: item.compatible || [],
      image_url: item.image_url || '',
      sort_order: item.sort_order ?? 0,
      active: item.active !== false,
    })
    setImageFile(null)
    setPreview(item.image_url || '')
    setError('')
    setModalOpen(true)
  }

  function onPickImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  function toggleCompatible(tag) {
    setForm((f) => ({
      ...f,
      compatible: f.compatible.includes(tag)
        ? f.compatible.filter((t) => t !== tag)
        : [...f.compatible, tag],
    }))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Escribe un nombre.')
      return
    }
    if (kind === 'type' && !form.thickness.trim()) {
      setError('Indica el grosor (ej. delgado o grueso).')
      return
    }
    setSaving(true)
    setError('')
    try {
      let image_url = form.image_url
      if (imageFile) image_url = await uploadCableImage(imageFile)
      if (kind === 'type') await saveCableType({ ...form, image_url })
      else await saveCableEnd({ ...form, image_url })
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
      if (confirmDelete.kind === 'type') await deleteCableType(confirmDelete.item.id)
      else await deleteCableEnd(confirmDelete.item.id)
      setConfirmDelete(null)
      await load()
    } catch (err) {
      setError(err.message)
      setConfirmDelete(null)
    }
  }

  const sectionButton =
    'inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-brand-600 px-4 py-2.5 font-display text-[11.5px] font-extrabold uppercase text-white shadow-hard-sm transition hover:bg-brand-700 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="title-stamp text-lg sm:text-xl">
          <span>Armador de cables</span>
        </h1>
        <p className="mt-2 text-xs font-medium text-fg-subtle">
          Opciones que ve el cliente en “Arma tu cable” (/cables). Sube fotos reales de tus
          cables y terminales; la compatibilidad se controla con la etiqueta de grosor.
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="flex items-start gap-2 rounded-[10px] border-2 border-ink bg-accent-400/50 p-4 text-sm font-medium text-fg">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Modo demostración: conecta Supabase para gestionar el armador.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Tipos de cable */}
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-[15px] font-extrabold uppercase text-fg">
              Tipos de cable · {types.length}
            </h2>
            <button onClick={() => openNew('type')} className={sectionButton}>
              <Plus className="h-3.5 w-3.5" strokeWidth={3} />
              Nuevo cable
            </button>
          </div>
          {types.length === 0 ? (
            <div className="rounded-[10px] border-2 border-dashed border-ink py-14 text-center">
              <div className="sticker mx-auto grid h-14 w-14 place-items-center rounded-full">
                <Cable className="h-7 w-7 text-fg" />
              </div>
              <p className="mt-4 font-display font-extrabold uppercase text-fg">
                Sin tipos de cable
              </p>
              <p className="mt-1 text-sm font-medium text-fg-muted">
                Mientras no haya opciones, /cables muestra solo el botón de WhatsApp.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[10px] border-2 border-ink bg-white">
              <ul className="divide-y divide-[#e5e5e5]">
                {types.map((t) => (
                  <ItemRow
                    key={t.id}
                    item={t}
                    subtitle={`Grosor: ${t.thickness}${t.description ? ` · ${t.description}` : ''}`}
                    onEdit={() => openEdit('type', t)}
                    onDelete={() => setConfirmDelete({ kind: 'type', item: t })}
                  />
                ))}
              </ul>
            </div>
          )}

          {/* Terminales */}
          <div className="flex items-end justify-between gap-3 pt-2">
            <h2 className="font-display text-[15px] font-extrabold uppercase text-fg">
              Terminales · {ends.length}
            </h2>
            <button onClick={() => openNew('end')} className={sectionButton}>
              <Plus className="h-3.5 w-3.5" strokeWidth={3} />
              Nueva terminal
            </button>
          </div>
          {ends.length === 0 ? (
            <div className="rounded-[10px] border-2 border-dashed border-ink py-14 text-center">
              <p className="font-display font-extrabold uppercase text-fg">Sin terminales</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[10px] border-2 border-ink bg-white">
              <ul className="divide-y divide-[#e5e5e5]">
                {ends.map((e) => (
                  <ItemRow
                    key={e.id}
                    item={e}
                    subtitle={
                      (e.compatible?.length ?? 0) === 0
                        ? 'Compatible con todos los cables'
                        : `Compatible con: ${e.compatible.join(', ')}`
                    }
                    onEdit={() => openEdit('end', e)}
                    onDelete={() => setConfirmDelete({ kind: 'end', item: e })}
                  />
                ))}
              </ul>
            </div>
          )}
        </>
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
        title={
          kind === 'type'
            ? form.id
              ? 'Editar tipo de cable'
              : 'Nuevo tipo de cable'
            : form.id
              ? 'Editar terminal'
              : 'Nueva terminal'
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Foto */}
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.06em] text-[#4a4a4a]">
              Foto
            </label>
            <label className="block cursor-pointer">
              <ProductImage
                src={preview}
                alt="Vista previa"
                className="aspect-[4/3] max-w-[260px] rounded-[10px] border-2 border-ink"
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
              Nombre
            </label>
            <input
              className="field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={kind === 'type' ? 'Cable negro · grueso' : 'Terminal de bola'}
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
              placeholder={
                kind === 'type'
                  ? 'Recubierto en nylon negro · 1/4" (≈ 6.4 mm)'
                  : 'Bola de acero prensada, la más común en poleas'
              }
            />
          </div>

          {kind === 'type' ? (
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.06em] text-[#4a4a4a]">
                Grosor (etiqueta de compatibilidad)
              </label>
              <input
                className="field"
                list="thickness-options"
                value={form.thickness}
                onChange={(e) => setForm({ ...form, thickness: e.target.value })}
                placeholder="delgado, grueso…"
              />
              <datalist id="thickness-options">
                {thicknessOptions.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
              <p className="mt-1 text-[11px] font-medium text-fg-subtle">
                Las terminales marcan con qué grosores funcionan; usa las mismas etiquetas.
              </p>
            </div>
          ) : (
            <div>
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.06em] text-[#4a4a4a]">
                Compatible con
              </span>
              {thicknessOptions.length === 0 ? (
                <p className="text-[12.5px] font-medium text-fg-subtle">
                  Primero registra tipos de cable; sus grosores aparecerán aquí.
                </p>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {thicknessOptions.map((tag) => (
                    <label key={tag} className="flex items-center gap-2 text-sm text-fg-muted">
                      <input
                        type="checkbox"
                        checked={form.compatible.includes(tag)}
                        onChange={() => toggleCompatible(tag)}
                        className="h-4 w-4 rounded border-2 border-ink accent-brand-600"
                      />
                      {tag}
                    </label>
                  ))}
                </div>
              )}
              <p className="mt-1 text-[11px] font-medium text-fg-subtle">
                Sin marcas = compatible con todos los cables.
              </p>
            </div>
          )}

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
              Visible en el armador
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
        title={confirmDelete?.kind === 'type' ? 'Eliminar tipo de cable' : 'Eliminar terminal'}
        maxWidth="max-w-sm"
      >
        <p className="text-sm font-medium text-[#4a4a4a]">
          ¿Eliminar <b className="text-fg">{confirmDelete?.item?.name}</b> del armador?
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
