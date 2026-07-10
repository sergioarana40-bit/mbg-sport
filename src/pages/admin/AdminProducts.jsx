import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search, Upload, AlertCircle, Star } from 'lucide-react'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'
import ProductImage from '../../components/ProductImage'
import { formatPrice } from '../../config'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  getAllProducts,
  getAllCategories,
  saveProduct,
  deleteProduct,
  uploadProductImage,
} from '../../lib/admin'

const EMPTY = {
  name: '',
  description: '',
  price: '',
  category_id: '',
  stock: '',
  featured: false,
  active: true,
  image_url: '',
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

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
      const [prods, cats] = await Promise.all([getAllProducts(), getAllCategories()])
      setProducts(prods)
      setCategories(cats)
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
    setImageFile(null)
    setPreview('')
    setError('')
    setModalOpen(true)
  }

  function openEdit(p) {
    setForm({
      id: p.id,
      name: p.name,
      description: p.description || '',
      price: p.price,
      category_id: p.category_id || '',
      stock: p.stock ?? '',
      featured: !!p.featured,
      active: p.active !== false,
      image_url: p.image_url || '',
    })
    setImageFile(null)
    setPreview(p.image_url || '')
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
    if (!form.name.trim() || !form.price) {
      setError('Nombre y precio son obligatorios.')
      return
    }
    setSaving(true)
    setError('')
    try {
      let image_url = form.image_url
      if (imageFile) image_url = await uploadProductImage(imageFile)
      await saveProduct({ ...form, image_url })
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
      await deleteProduct(confirmDelete.id)
      setConfirmDelete(null)
      await load()
    } catch (err) {
      setError(err.message)
      setConfirmDelete(null)
    }
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-fg">Productos</h1>
          <p className="text-sm text-fg-muted">{products.length} en total</p>
        </div>
        <button onClick={openNew} className="btn-primary px-4 py-2.5 text-sm">
          <Plus className="h-4.5 w-4.5" />
          Nuevo producto
        </button>
      </div>

      {!isSupabaseConfigured && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Modo demostración: puedes ver el catálogo, pero para crear o editar productos conecta
          Supabase.
        </div>
      )}

      {/* Buscador */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar producto…"
          className="field pl-9"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-xs uppercase tracking-wide text-fg-subtle">
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">Categoría</th>
                  <th className="px-4 py-3 font-semibold">Precio</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((p) => (
                  <tr key={p.id} className="transition hover:bg-surface-2">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductImage
                          src={p.image_url}
                          alt={p.name}
                          className="h-11 w-11 shrink-0 rounded-lg border border-line"
                        />
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-fg">{p.name}</span>
                          {p.featured && (
                            <Star className="h-3.5 w-3.5 fill-accent-400 text-accent-400" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-fg-muted">{p.category_name}</td>
                    <td className="px-4 py-3 font-semibold text-fg">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3 text-fg-muted">{p.stock ?? 0}</td>
                    <td className="px-4 py-3">
                      {p.active !== false ? (
                        <span className="text-emerald-400">Activo</span>
                      ) : (
                        <span className="text-fg-subtle">Oculto</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted hover:bg-surface-3 hover:text-brand-400"
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(p)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted hover:bg-brand-600/15 hover:text-brand-400"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-fg-subtle">
                      No hay productos que coincidan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de formulario */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? 'Editar producto' : 'Nuevo producto'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Imagen */}
          <div className="flex items-center gap-4">
            <ProductImage
              src={preview}
              alt="Vista previa"
              className="h-20 w-20 shrink-0 rounded-lg border border-line"
            />
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium text-fg-muted hover:bg-surface-2">
              <Upload className="h-4 w-4" />
              Subir imagen
              <input type="file" accept="image/*" onChange={onPickImage} className="hidden" />
            </label>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-fg-muted">Nombre</label>
            <input
              className="field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-fg-muted">Descripción</label>
            <textarea
              className="field"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-fg-muted">
                Precio (MXN)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="field"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-fg-muted">Stock</label>
              <input
                type="number"
                min="0"
                className="field"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-fg-muted">Categoría</label>
            <select
              className="field"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-fg-muted">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="h-4 w-4 rounded border-line bg-surface-2 text-brand-600 focus:ring-brand-500"
              />
              Destacado
            </label>
            <label className="flex items-center gap-2 text-sm text-fg-muted">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 rounded border-line bg-surface-2 text-brand-600 focus:ring-brand-500"
              />
              Visible en tienda
            </label>
          </div>

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

      {/* Confirmar borrado */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Eliminar producto"
        maxWidth="max-w-sm"
      >
        <p className="text-sm text-fg-muted">
          ¿Seguro que quieres eliminar <b className="text-fg">{confirmDelete?.name}</b>? Esta
          acción no se puede deshacer.
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
