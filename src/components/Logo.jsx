import { Link } from 'react-router-dom'

// Logotipo oficial MBGSPORT (PNG del manual de marca, en public/brand/).
// `size` = alto en px, o `sizeClassName` (p. ej. "h-8 md:h-10") para alto responsivo.
export default function Logo({ to = '/', size = 40, sizeClassName = '', className = '' }) {
  return (
    <Link to={to} className={`inline-flex shrink-0 items-center ${className}`}>
      <img
        src="/brand/logotipo.png"
        alt="MBGSPORT"
        style={sizeClassName ? undefined : { height: size }}
        className={`block w-auto ${sizeClassName}`}
      />
    </Link>
  )
}
