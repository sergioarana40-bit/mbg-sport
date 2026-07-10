import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-7xl font-bold text-brand-500">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-fg">
        Página no encontrada
      </h1>
      <p className="mt-2 text-fg-muted">
        La página que buscas no existe o fue movida.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Volver al inicio
      </Link>
    </div>
  )
}
