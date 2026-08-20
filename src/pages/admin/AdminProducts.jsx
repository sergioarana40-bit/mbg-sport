import { useEffect, useRef, useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Upload,
  AlertCircle,
  Star,
  FileSpreadsheet,
  HelpCircle,
  Download,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  X,
} from 'lucide-react'
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
  importProducts,
  updateProductFields,
  bulkUpdateProducts,
  bulkDeleteProducts,
} from '../../lib/admin'
import {
  productsFromCsv,
  downloadCsvTemplate,
  norm,
  exportProductsCsv,
} from '../../lib/csv'

const EMPTY = {
  name: '',
  description: '',
  price: '',
  category_id: '',
  stock: '',
  featured: false,
  active: true,
  image_url: '',
  variants: [],
}

// El editor maneja las opciones como texto separado por comas; en la base se
// guardan como [{name, options: […]}] (o null si no hay variantes válidas).
function toEditorVariants(list) {
  if (!Array.isArray(list)) return []
  return list.map((g) => ({
    name: g?.name || '',
    optionsText: Array.isArray(g?.options) ? g.options.join(', ') : '',
  }))
}
function fromEditorVariants(list) {
  const groups = (list || [])
    .map((g) => ({
      name: g.name.trim(),
      options: g.optionsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    }))
    .filter((g) => g.name && g.options.length > 0)
  return groups.length > 0 ? groups : null
}

// Celda editable al clic (precio/stock): Enter o clic fuera guarda, Esc cancela.
function EditableCell({ value, format, onSave, min = 0, step = 1, width = 'w-24' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value ?? ''))

  function start() {
    setDraft(String(value ?? ''))
    setEditing(true)
  }
  function commit() {
    setEditing(false)
    const n = Number(draft)
    if (draft === '' || Number.isNaN(n) || n < min || n === Number(value)) return
    onSave(n)
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={start}
        title="Clic para editar"
        className="group/cell -mx-1.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left transition hover:bg-accent-400/60"
      >
        <span>{format ? format(value) : value}</span>
        <Pencil className="h-3 w-3 opacity-0 transition group-hover/cell:opacity-60" />
      </button>
    )
  }
  return (
    <input
      autoFocus
      type="number"
      min={min}
      step={step}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') {
          setDraft(String(value ?? ''))
          setEditing(false)
        }
      }}
      className={`${width} rounded-md border-2 border-ink bg-white px-1.5 py-0.5 text-[13px] font-bold text-fg outline-none`}
    />
  )
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

  // Importación por CSV
  const csvInputRef = useRef(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [csvPreview, setCsvPreview] = useState(null) // { items, errors, fileName }
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null) // { created, updated, newCategories }

  // Selección múltiple (acciones en lote)
  const [selected, setSelected] = useState(() => new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)

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
      variants: toEditorVariants(p.variants),
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
    if (!form.name.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    setSaving(true)
    setError('')
    try {
      let image_url = form.image_url
      if (imageFile) image_url = await uploadProductImage(imageFile)
      await saveProduct({ ...form, image_url, variants: fromEditorVariants(form.variants) })
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

  // Al elegir archivo CSV: parsear y abrir vista previa (no guarda todavía).
  async function onPickCsv(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // permite re-elegir el mismo archivo
    if (!file) return
    setImportResult(null)
    try {
      const text = await file.text()
      const parsed = productsFromCsv(text)
      setCsvPreview({ ...parsed, fileName: file.name })
    } catch {
      setCsvPreview({
        items: [],
        errors: [{ line: 1, message: 'No se pudo leer el archivo.' }],
        fileName: file.name,
      })
    }
  }

  async function confirmImport() {
    if (!csvPreview || csvPreview.items.length === 0) return
    setImporting(true)
    try {
      const result = await importProducts(csvPreview.items)
      setCsvPreview(null)
      setImportResult(result)
      await load()
    } catch (err) {
      setCsvPreview((p) => ({
        ...p,
        errors: [...(p?.errors ?? []), { line: '—', message: err.message }],
      }))
    } finally {
      setImporting(false)
    }
  }

  // Cuántos del CSV actualizarían un producto existente (por nombre).
  const existingNames = new Set(products.map((p) => norm(p.name)))
  const csvUpdates = csvPreview
    ? csvPreview.items.filter((i) => existingNames.has(norm(i.name))).length
    : 0

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  )

  // Edición inline (precio/stock) con actualización optimista.
  async function saveInline(product, fields) {
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, ...fields } : p)))
    try {
      await updateProductFields(product.id, fields)
    } catch (err) {
      setError(err.message)
      load()
    }
  }

  // Duplicar: abre el formulario de alta con los datos copiados.
  function duplicate(p) {
    setForm({
      name: `${p.name} (copia)`,
      description: p.description || '',
      price: p.price,
      category_id: p.category_id || '',
      stock: p.stock ?? '',
      featured: !!p.featured,
      active: p.active !== false,
      image_url: p.image_url || '',
      variants: toEditorVariants(p.variants),
    })
    setImageFile(null)
    setPreview(p.image_url || '')
    setError('')
    setModalOpen(true)
  }

  // Selección múltiple
  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id))
  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(filtered.map((p) => p.id)))
  }

  async function runBulk(fn) {
    setBulkBusy(true)
    setError('')
    try {
      await fn([...selected])
      setSelected(new Set())
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBulkBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="title-stamp text-lg sm:text-xl">
            <span>Productos</span>
          </h1>
          <p className="mt-2 text-xs font-medium text-fg-subtle">{products.length} en total</p>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Importar CSV + ayuda del formato */}
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onPickCsv}
            className="hidden"
          />
          <button
            onClick={() => exportProductsCsv(products)}
            disabled={products.length === 0}
            title="Descargar el catálogo como CSV"
            className="inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-white px-4 py-2.5 font-display text-[11.5px] font-extrabold uppercase text-fg transition hover:bg-surface-2 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2.5} />
            Exportar
          </button>
          <button
            onClick={() => csvInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-white px-4 py-2.5 font-display text-[11.5px] font-extrabold uppercase text-fg transition hover:bg-surface-2"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" strokeWidth={2.5} />
            Importar CSV
          </button>
          <button
            onClick={() => setHelpOpen(true)}
            aria-label="Cómo preparar el CSV"
            title="Cómo preparar el CSV"
            className="grid h-10 w-10 place-items-center rounded-lg border-2 border-ink bg-accent-400 text-fg transition hover:bg-accent-300"
          >
            <HelpCircle className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </button>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-brand-600 px-4 py-2.5 font-display text-[11.5px] font-extrabold uppercase text-white shadow-hard-sm transition hover:bg-brand-700 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={3} />
            Nuevo producto
          </button>
        </div>
      </div>

      {/* Resultado de la última importación */}
      {importResult && (
        <div className="flex items-start gap-2 rounded-[10px] border-2 border-ink bg-state-paid/15 p-4 text-sm font-medium text-fg">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-state-paid" />
          <p>
            Importación completada: <b>{importResult.created}</b> producto
            {importResult.created === 1 ? '' : 's'} nuevo{importResult.created === 1 ? '' : 's'} y{' '}
            <b>{importResult.updated}</b> actualizado{importResult.updated === 1 ? '' : 's'}
            {importResult.newCategories > 0 && (
              <>
                {' '}
                · se crearon <b>{importResult.newCategories}</b> categoría
                {importResult.newCategories === 1 ? '' : 's'}
              </>
            )}
            .
          </p>
        </div>
      )}

      {!isSupabaseConfigured && (
        <div className="flex items-start gap-2 rounded-[10px] border-2 border-ink bg-accent-400/50 p-4 text-sm font-medium text-fg">
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

      {/* Barra de acciones en lote */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-[10px] border-2 border-ink bg-accent-400 px-4 py-3">
          <span className="mr-1 font-display text-xs font-extrabold uppercase text-fg">
            {selected.size} seleccionado{selected.size === 1 ? '' : 's'}
          </span>
          <button
            onClick={() => runBulk((ids) => bulkUpdateProducts(ids, { active: true }))}
            disabled={bulkBusy}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-white px-3 py-1.5 font-display text-[10.5px] font-extrabold uppercase text-fg transition hover:bg-surface-2 disabled:opacity-50"
          >
            <Eye className="h-3.5 w-3.5" />
            Mostrar
          </button>
          <button
            onClick={() => runBulk((ids) => bulkUpdateProducts(ids, { active: false }))}
            disabled={bulkBusy}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-white px-3 py-1.5 font-display text-[10.5px] font-extrabold uppercase text-fg transition hover:bg-surface-2 disabled:opacity-50"
          >
            <EyeOff className="h-3.5 w-3.5" />
            Ocultar
          </button>
          <select
            defaultValue=""
            disabled={bulkBusy}
            onChange={(e) => {
              const v = e.target.value
              e.target.value = ''
              if (v) runBulk((ids) => bulkUpdateProducts(ids, { category_id: v }))
            }}
            className="cursor-pointer rounded-lg border-2 border-ink bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-fg outline-none disabled:opacity-50"
          >
            <option value="" disabled>
              Mover a categoría…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setConfirmBulkDelete(true)}
            disabled={bulkBusy}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-brand-600 px-3 py-1.5 font-display text-[10.5px] font-extrabold uppercase text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar
          </button>
          <button
            onClick={() => setSelected(new Set())}
            aria-label="Quitar selección"
            className="ml-auto grid h-7 w-7 place-items-center rounded-lg text-fg transition hover:bg-black/10"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
          {bulkBusy && <Spinner size={4} />}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <div className="overflow-hidden rounded-[10px] border-2 border-ink bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink text-left text-[10px] uppercase tracking-[.08em] text-white">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      aria-label="Seleccionar todos"
                      className="h-4 w-4 cursor-pointer accent-accent-400"
                    />
                  </th>
                  <th className="px-4 py-3 font-bold">Producto</th>
                  <th className="px-4 py-3 font-bold">Categoría</th>
                  <th className="px-4 py-3 font-bold">Precio</th>
                  <th className="px-4 py-3 font-bold">Stock</th>
                  <th className="px-4 py-3 font-bold">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className={`transition hover:bg-surface-2 ${
                      selected.has(p.id) ? 'bg-accent-400/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        aria-label={`Seleccionar ${p.name}`}
                        className="h-4 w-4 cursor-pointer accent-brand-600"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductImage
                          src={p.image_url}
                          alt={p.name}
                          className="h-11 w-11 shrink-0 rounded-lg border-2 border-ink"
                        />
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-fg">{p.name}</span>
                          {p.featured && (
                            <Star className="h-3.5 w-3.5 fill-accent-400 text-ink" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-[#4a4a4a]">{p.category_name}</td>
                    <td className="px-4 py-3 font-bold text-fg">
                      <EditableCell
                        value={p.price}
                        min={0}
                        step={0.5}
                        format={(v) => (Number(v) > 0 ? formatPrice(v) : 'Por confirmar')}
                        onSave={(n) => saveInline(p, { price: n })}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-[#4a4a4a]">
                      <EditableCell
                        value={p.stock ?? 0}
                        min={0}
                        step={1}
                        width="w-16"
                        onSave={(n) => saveInline(p, { stock: n })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {p.active !== false ? (
                        <span className="font-bold text-state-paid">Activo</span>
                      ) : (
                        <span className="font-medium text-fg-subtle">Oculto</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => duplicate(p)}
                          className="grid h-[30px] w-[30px] place-items-center rounded-[7px] border-2 border-ink text-fg transition hover:bg-accent-400"
                          aria-label="Duplicar"
                          title="Duplicar producto"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openEdit(p)}
                          className="grid h-[30px] w-[30px] place-items-center rounded-[7px] border-2 border-ink text-fg transition hover:bg-accent-400"
                          aria-label="Editar"
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(p)}
                          className="grid h-[30px] w-[30px] place-items-center rounded-[7px] border-2 border-ink text-fg transition hover:bg-brand-600 hover:text-white"
                          aria-label="Eliminar"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-fg-subtle">
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
                Precio (MXN) — opcional
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="field"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="Vacío = por confirmar"
              />
              <p className="mt-1 text-[11px] font-medium text-fg-subtle">
                Sin precio, la tienda muestra "Precio por confirmar" y el cliente lo consulta
                por WhatsApp (no se puede agregar al carrito).
              </p>
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

          {/* Variantes (color, talla, grosor…): el cliente elige una opción de
              cada grupo antes de agregar al carrito. No cambian el precio. */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-fg-muted">
                Variantes (opcional)
              </label>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    variants: [...(f.variants || []), { name: '', optionsText: '' }],
                  }))
                }
                className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-white px-2.5 py-1.5 font-display text-[10.5px] font-extrabold uppercase text-fg transition hover:bg-surface-2"
              >
                <Plus className="h-3 w-3" strokeWidth={3} />
                Agregar
              </button>
            </div>
            <p className="mt-1 text-[11px] font-medium text-fg-subtle">
              Para productos con opciones a elegir (color, talla, grosor, tamaño…). Escribe las
              opciones separadas por coma; la elección del cliente llega junto con el pedido.
            </p>
            {(form.variants || []).map((g, idx) => (
              <div key={idx} className="mt-2 flex gap-2">
                <input
                  className="field w-32 shrink-0"
                  placeholder="Ej. Color"
                  value={g.name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      variants: f.variants.map((v, i) =>
                        i === idx ? { ...v, name: e.target.value } : v
                      ),
                    }))
                  }
                />
                <input
                  className="field flex-1"
                  placeholder="Opciones separadas por coma (ej. Rojo, Negro, Azul)"
                  value={g.optionsText}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      variants: f.variants.map((v, i) =>
                        i === idx ? { ...v, optionsText: e.target.value } : v
                      ),
                    }))
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      variants: f.variants.filter((_, i) => i !== idx),
                    }))
                  }
                  aria-label="Quitar variante"
                  title="Quitar variante"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border-2 border-ink text-fg transition hover:bg-brand-600 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-fg-muted">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="h-4 w-4 rounded border-2 border-ink accent-brand-600"
              />
              Destacado
            </label>
            <label className="flex items-center gap-2 text-sm text-fg-muted">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 rounded border-2 border-ink accent-brand-600"
              />
              Visible en tienda
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

      {/* Error general (edición inline / acciones en lote) */}
      {error && !modalOpen && !csvPreview && (
        <p className="flex items-center gap-2 rounded-lg border-2 border-ink bg-brand-600 p-3 text-sm font-semibold text-white">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {/* Confirmar borrado en lote */}
      <Modal
        open={confirmBulkDelete}
        onClose={() => setConfirmBulkDelete(false)}
        title="Eliminar seleccionados"
        maxWidth="max-w-sm"
      >
        <p className="text-sm font-medium text-[#4a4a4a]">
          ¿Eliminar <b className="text-fg">{selected.size}</b> producto
          {selected.size === 1 ? '' : 's'} del catálogo? Esta acción no se puede deshacer.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={() => setConfirmBulkDelete(false)}
            className="rounded-lg px-4 py-2 text-sm font-bold text-fg-muted hover:bg-surface-2"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              setConfirmBulkDelete(false)
              runBulk((ids) => bulkDeleteProducts(ids))
            }}
            className="btn-sticker px-5 py-2 text-xs"
          >
            Eliminar {selected.size}
          </button>
        </div>
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

      {/* Ayuda: cómo preparar el CSV */}
      <Modal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Cómo preparar tu CSV"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-sm">
          <p className="font-medium text-[#4a4a4a]">
            Guarda tu inventario como <b className="text-fg">CSV</b> desde Excel o Google Sheets
            (Archivo → Descargar → CSV). La primera fila debe traer los encabezados; el orden de
            las columnas no importa y sirve tanto con comas como con punto y coma.
          </p>

          <div className="overflow-x-auto rounded-[10px] border-2 border-ink">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-ink text-left text-[10px] uppercase tracking-[.08em] text-white">
                  <th className="px-3 py-2 font-bold">Columna</th>
                  <th className="px-3 py-2 font-bold">Obligatoria</th>
                  <th className="px-3 py-2 font-bold">Ejemplo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                <tr>
                  <td className="px-3 py-2 font-mono font-bold text-fg">nombre</td>
                  <td className="px-3 py-2 font-bold text-brand-600">Sí</td>
                  <td className="px-3 py-2 font-medium text-[#4a4a4a]">Mancuerna hexagonal 15 kg</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono font-bold text-fg">precio</td>
                  <td className="px-3 py-2 font-medium text-fg-subtle">No (vacío = por confirmar)</td>
                  <td className="px-3 py-2 font-medium text-[#4a4a4a]">850 · $1,299.50</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono font-bold text-fg">stock</td>
                  <td className="px-3 py-2 font-medium text-fg-subtle">No (0 si falta)</td>
                  <td className="px-3 py-2 font-medium text-[#4a4a4a]">10</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono font-bold text-fg">categoria</td>
                  <td className="px-3 py-2 font-medium text-fg-subtle">No</td>
                  <td className="px-3 py-2 font-medium text-[#4a4a4a]">
                    Refacciones (si no existe, se crea sola)
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono font-bold text-fg">descripcion</td>
                  <td className="px-3 py-2 font-medium text-fg-subtle">No</td>
                  <td className="px-3 py-2 font-medium text-[#4a4a4a]">
                    Recubrimiento de hule, mango antideslizante
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono font-bold text-fg">destacado</td>
                  <td className="px-3 py-2 font-medium text-fg-subtle">No</td>
                  <td className="px-3 py-2 font-medium text-[#4a4a4a]">si / no</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono font-bold text-fg">activo</td>
                  <td className="px-3 py-2 font-medium text-fg-subtle">No (si si falta)</td>
                  <td className="px-3 py-2 font-medium text-[#4a4a4a]">si / no</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono font-bold text-fg">imagen</td>
                  <td className="px-3 py-2 font-medium text-fg-subtle">No</td>
                  <td className="px-3 py-2 font-medium text-[#4a4a4a]">
                    https://… (enlace público a la foto)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <ul className="space-y-1.5 text-[13px] font-medium text-[#4a4a4a]">
            <li>
              · Si el <b className="text-fg">nombre ya existe</b>, el producto se{' '}
              <b className="text-fg">actualiza</b> (precio, stock, etc.) en lugar de duplicarse —
              ideal para subir tu inventario cada semana.
            </li>
            <li>
              · Sin <b className="text-fg">precio</b> (columna vacía o en 0), el producto se
              publica como <b className="text-fg">"Precio por confirmar"</b>: se ve en la tienda
              pero no se puede comprar hasta que le pongas precio.
            </li>
            <li>
              · La columna <b className="text-fg">imagen</b> acepta un enlace a la foto; si la
              dejas vacía, la foto de los productos existentes <b className="text-fg">no se toca</b>{' '}
              y a los nuevos se la puedes subir después con el botón de editar.
            </li>
            <li>· Antes de guardar verás una vista previa con lo que se va a crear y actualizar.</li>
          </ul>

          <div className="flex justify-between gap-3 pt-1">
            <button
              onClick={downloadCsvTemplate}
              className="inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-accent-400 px-4 py-2.5 font-display text-[11px] font-extrabold uppercase text-fg transition hover:bg-accent-300"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2.5} />
              Descargar plantilla
            </button>
            <button
              onClick={() => {
                setHelpOpen(false)
                csvInputRef.current?.click()
              }}
              className="btn-primary px-5 py-2.5 text-xs"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Elegir archivo
            </button>
          </div>
        </div>
      </Modal>

      {/* Vista previa de la importación */}
      <Modal
        open={!!csvPreview}
        onClose={() => setCsvPreview(null)}
        title="Vista previa de la importación"
        maxWidth="max-w-2xl"
      >
        {csvPreview && (
          <div className="space-y-4">
            <p className="text-[13px] font-medium text-[#4a4a4a]">
              Archivo <b className="font-mono text-fg">{csvPreview.fileName}</b> ·{' '}
              <b className="text-fg">{csvPreview.items.length - csvUpdates}</b> producto
              {csvPreview.items.length - csvUpdates === 1 ? '' : 's'} nuevo
              {csvPreview.items.length - csvUpdates === 1 ? '' : 's'} ·{' '}
              <b className="text-fg">{csvUpdates}</b> a actualizar
              {csvPreview.errors.length > 0 && (
                <>
                  {' '}
                  · <b className="text-brand-600">{csvPreview.errors.length} con error</b> (se
                  omiten)
                </>
              )}
            </p>

            {csvPreview.errors.length > 0 && (
              <div className="max-h-28 space-y-1 overflow-y-auto rounded-[10px] border-2 border-ink bg-brand-600/10 p-3 text-xs font-semibold text-brand-600">
                {csvPreview.errors.map((e, i) => (
                  <p key={i}>
                    Fila {e.line}: {e.message}
                  </p>
                ))}
              </div>
            )}

            {csvPreview.items.length > 0 && (
              <div className="max-h-64 overflow-y-auto rounded-[10px] border-2 border-ink">
                <table className="w-full text-[12.5px]">
                  <thead className="sticky top-0">
                    <tr className="bg-ink text-left text-[10px] uppercase tracking-[.08em] text-white">
                      <th className="px-3 py-2 font-bold">Producto</th>
                      <th className="px-3 py-2 font-bold">Precio</th>
                      <th className="px-3 py-2 font-bold">Stock</th>
                      <th className="px-3 py-2 font-bold">Categoría</th>
                      <th className="px-3 py-2 font-bold">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e5e5]">
                    {csvPreview.items.map((it, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-semibold text-fg">{it.name}</td>
                        <td className="px-3 py-2 font-bold text-fg">
                          {it.price > 0 ? formatPrice(it.price) : 'Por confirmar'}
                        </td>
                        <td className="px-3 py-2 font-medium text-[#4a4a4a]">{it.stock}</td>
                        <td className="px-3 py-2 font-medium text-[#4a4a4a]">
                          {it.categoryName || '—'}
                        </td>
                        <td className="px-3 py-2">
                          {existingNames.has(norm(it.name)) ? (
                            <span className="rounded-[5px] border-2 border-ink bg-accent-400 px-1.5 font-display text-[9px] font-extrabold uppercase text-fg">
                              Actualiza
                            </span>
                          ) : (
                            <span className="rounded-[5px] border-2 border-ink bg-state-paid px-1.5 font-display text-[9px] font-extrabold uppercase text-white">
                              Nuevo
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCsvPreview(null)}
                className="rounded-lg px-4 py-2 text-sm font-bold text-fg-muted hover:bg-surface-2"
              >
                Cancelar
              </button>
              <button
                onClick={confirmImport}
                disabled={importing || csvPreview.items.length === 0}
                className="btn-sticker px-5 py-2 text-xs disabled:opacity-50"
              >
                {importing && <Spinner size={4} className="border-white/40 border-t-white" />}
                Importar {csvPreview.items.length} producto
                {csvPreview.items.length === 1 ? '' : 's'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
