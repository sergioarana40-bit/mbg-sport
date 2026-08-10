import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Upload, AlertCircle, Megaphone } from 'lucide-react'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'
import ProductImage from '../../components/ProductImage'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  getAllBanners,
  saveBanner,
  deleteBanner,
  uploadBannerImage,
  getAllProducts,
} from '../../lib/admin'

const EMPTY = {
  title: '',
  description: '',
  product_id: '',
  image_url: '',
  cta_label: '',
  sort_order: 0,
  active: true,
}

// Banner comercial de la portada de la tienda: el admin elige el producto,
// textos y foto; si hay varios activos, la portada los rota en carrusel.
export default function AdminBanners() {
  const [banners, setBanners] = useState([])
  const [products, setProducts] = useState([])
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
      setBanners(await getAllBanners())
    } catch {
      /* noop */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    getAllProducts()
      .then((list) => setProducts([...list].sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => setProducts([]))
  }, [])

  function openNew() {
    setForm({ ...EMPTY, sort_order: banners.length + 1 })
    setImageFile(null)
    setPreview('')
    setError('')
    setModalOpen(true)
  }

  function openEdit(b) {
    setForm({
      id: b.id,
      title: b.title,
      description: b.description || '',
      product_id: b.product_id || '',
      image_url: b.image_url || '',
      cta_label: b.cta_label || '',
      sort_order: b.sort_order ?? 0,
      active: b.active !== false,
    })
    setImageFile(null)
    setPreview(b.image_url || '')
    setError('')
    setModalOpen(true)
  }

  // Al elegir producto, si aún no hay título se propone el nombre del producto.
  function onPickProduct(e) {
    const product_id = e.target.value
    const product = products.find((p) => p.id === product_id)
    setForm((f) => ({
      ...f,
      product_id,
      title: f.title.trim() ? f.title : (product?.name ?? ''),
    }))
    if (!preview && product?.image_url) setPreview(product.image_url)
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
      setError('Escribe un título para el banner.')
      return
    }
    setSaving(true)
    setError('')
    try {
      let image_url = form.image_url
      if (imageFile) image_url = await uploadBannerImage(imageFile)
      await saveBanner({ ...form, image_url })
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
      await deleteBanner(confirmDelete.id)
      setConfirmDelete(null)
      await load()
    } catch (err) {
      setError(err.message)
      setConfirmDelete(null)
    }
  }

  const activeCount = banners.filter((b) => b.active !== false).length

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="title-stamp text-lg sm:text-xl">
            <span>Banner de portada</span>
          </h1>
          <p className="mt-2 text-xs font-medium text-fg-subtle">
            "Destacado de la semana" de la home de la tienda · {activeCount} activo
            {activeCount === 1 ? '' : 's'} · con varios activos la portada los rota en carrusel
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-brand-600 px-4 py-2.5 font-display text-[11.5px] font-extrabold uppercase text-white shadow-hard-sm transition hover:bg-brand-700 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={3} />
          Nuevo banner
        </button>
      </div>

      {!isSupabaseConfigured && (
        <div className="flex items-start gap-2 rounded-[10px] border-2 border-ink bg-accent-400/50 p-4 text-sm font-medium text-fg">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Modo demostración: conecta Supabase para administrar el banner.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : banners.length === 0 ? (
        <div className="rounded-[10px] border-2 border-dashed border-ink py-20 text-center">
          <div className="sticker mx-auto grid h-14 w-14 place-items-center rounded-full">
            <Megaphone className="h-7 w-7 text-fg" />
          </div>
          <p className="mt-4 font-display font-extrabold uppercase text-fg">
            Aún no hay banners
          </p>
          <p className="mt-1 text-sm font-medium text-fg-muted">
            Crea el primero para destacar un producto en la portada. Mientras tanto se muestran
            los productos destacados.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[10px] border-2 border-ink bg-white">
          <ul className="divide-y divide-[#e5e5e5]">
            {banners.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2">
                <ProductImage
                  src={b.image_url}
                  alt={b.title}
                  className="h-14 w-[74px] shrink-0 rounded-lg border-2 border-ink"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold text-fg">
                    <span className="truncate">{b.title}</span>
                    {b.active === false && (
                      <span className="shrink-0 rounded-[5px] border-2 border-ink bg-surface-3 px-1.5 font-display text-[9px] font-extrabold uppercase text-fg-muted">
                        Oculto
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs font-medium text-[#4a4a4a]">
                    {b.products?.name ? `Producto: ${b.products.name}` : 'Sin producto ligado'}
                  </p>
                </div>
                <span className="hidden font-mono text-xs font-bold text-fg-subtle sm:block">
                  #{b.sort_order}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(b)}
                    className="grid h-[30px] w-[30px] place-items-center rounded-[7px] border-2 border-ink text-fg transition hover:bg-accent-400"
                    aria-label="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(b)}
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
        title={form.id ? 'Editar banner' : 'Nuevo banner'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.06em] text-[#4a4a4a]">
              Producto destacado
            </label>
            <select className="field" value={form.product_id} onChange={onPickProduct}>
              <option value="">Sin producto (el botón lleva al catálogo)</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] font-medium text-fg-subtle">
              Del producto se toman el precio, la categoría y, si no subes foto, su imagen.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.06em] text-[#4a4a4a]">
              Título
            </label>
            <input
              className="field"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Caminadora eléctrica plegable"
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
              placeholder="Motor 2.5 HP, velocidad hasta 14 km/h, pantalla LED y 12 programas."
            />
          </div>

          {/* Foto */}
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.06em] text-[#4a4a4a]">
              Foto del banner (opcional)
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

          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.06em] text-[#4a4a4a]">
                Texto del botón
              </label>
              <input
                className="field"
                value={form.cta_label}
                onChange={(e) => setForm({ ...form, cta_label: e.target.value })}
                placeholder="Ver producto"
              />
            </div>
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
          </div>

          <label className="flex items-center gap-2 text-sm text-fg-muted">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 rounded border-2 border-ink accent-brand-600"
            />
            Visible en la portada
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
        title="Eliminar banner"
        maxWidth="max-w-sm"
      >
        <p className="text-sm font-medium text-[#4a4a4a]">
          ¿Eliminar <b className="text-fg">{confirmDelete?.title}</b> de la portada?
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
