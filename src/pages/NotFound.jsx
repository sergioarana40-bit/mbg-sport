import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

// 404 estilo póster 1b: fondo amarillo con puntos, isotipo y número con contorno.
const DOTS_STYLE = {
  backgroundImage: 'radial-gradient(rgba(0,0,0,.07) 1.5px, transparent 1.5px)',
  backgroundSize: '16px 16px',
}

const OUTLINE_STYLE = {
  color: '#fff',
  textShadow:
    '-3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 3px 3px 0 #000, 8px 8px 0 rgba(0,0,0,.18)',
}

export default function NotFound() {
  return (
    <div className="bg-accent-400" style={DOTS_STYLE}>
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 py-14 text-center">
        <img
          src="/brand/isotipo.png"
          alt=""
          className="w-[170px]"
          style={{ filter: 'drop-shadow(0 12px 14px rgba(0,0,0,.22))' }}
        />
        <p className="mt-4 font-display text-[88px] font-black leading-none" style={OUTLINE_STYLE}>
          404
        </p>
        <h1 className="mt-3.5 font-display text-2xl font-black uppercase text-fg">
          Página no encontrada
        </h1>
        <p className="mt-2.5 max-w-[340px] text-[13.5px] font-semibold leading-relaxed text-fg">
          La página que buscas no existe o fue movida. Vuelve a entrenar.
        </p>
        <Link to="/" className="btn-primary mt-6">
          Volver al inicio
          <ArrowRight className="h-4 w-4 text-accent-400" strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  )
}
