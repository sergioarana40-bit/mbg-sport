import { Dumbbell, Circle, Bike, Shirt, Zap, Wrench, Tag } from 'lucide-react'

const ICONS = {
  dumbbell: Dumbbell,
  circle: Circle,
  bike: Bike,
  shirt: Shirt,
  zap: Zap,
  wrench: Wrench,
}

// Adivina un ícono por slug si la categoría no define uno (datos de Supabase).
function guessBySlug(slug = '') {
  if (slug.includes('pesa') || slug.includes('mancuerna')) return 'dumbbell'
  if (slug.includes('barra') || slug.includes('disco')) return 'circle'
  if (slug.includes('cardio') || slug.includes('maquina') || slug.includes('bici')) return 'bike'
  if (slug.includes('ropa') || slug.includes('calzado')) return 'shirt'
  if (slug.includes('refac') || slug.includes('manten')) return 'wrench'
  if (slug.includes('acces')) return 'zap'
  return null
}

export default function CategoryIcon({ category, className = 'h-6 w-6' }) {
  const key = category?.icon || guessBySlug(category?.slug)
  const Icon = ICONS[key] || Tag
  return <Icon className={className} strokeWidth={1.75} />
}
