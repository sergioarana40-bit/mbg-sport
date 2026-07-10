import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-7xl font-bold text-brand-600">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-neutral-900">
        Página no encontrada
      </h1>
      <p className="mt-2 text-neutral-500">
        La página que buscas no existe o fue movida.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
