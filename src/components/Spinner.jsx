export default function Spinner({ className = '', size = 8 }) {
  return (
    <div
      className={`animate-spin rounded-full border-4 border-surface-3 border-t-brand-600 ${className}`}
      style={{ height: `${size * 4}px`, width: `${size * 4}px` }}
      role="status"
      aria-label="Cargando"
    />
  )
}
