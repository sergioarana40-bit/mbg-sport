// Genera los íconos PNG de la PWA a partir de la mascota oficial (isotipo).
// Fondo amarillo de marca (#FFD700) estilo póster 1b.
// Uso: node scripts/generate-icons.mjs
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

mkdirSync('public/icons', { recursive: true })

const MASCOT = 'public/brand/isotipo.png'
const YELLOW = { r: 255, g: 215, b: 0, alpha: 1 }

// Compone la mascota centrada sobre un lienzo amarillo.
// `scale` = fracción del lienzo que ocupa la mascota (menor para maskable).
async function makeIcon(size, scale, outFile) {
  const inner = Math.round(size * scale)
  const mascot = await sharp(MASCOT)
    .trim()
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  await sharp({
    create: { width: size, height: size, channels: 4, background: YELLOW },
  })
    .composite([{ input: mascot, gravity: 'center' }])
    .png()
    .toFile(outFile)
}

// "any": mascota grande; "maskable": más aire para el safe zone circular.
await makeIcon(512, 0.86, 'public/icons/icon-512.png')
await makeIcon(192, 0.86, 'public/icons/icon-192.png')
await makeIcon(512, 0.62, 'public/icons/icon-maskable-512.png')

// Favicon con la mascota (fondo amarillo redondeado se ve bien en pestañas).
await makeIcon(64, 0.9, 'public/favicon.png')

console.log('✓ Íconos PWA generados en public/icons/ (mascota sobre amarillo)')
