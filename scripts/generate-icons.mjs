// Genera los íconos PNG de la PWA a partir de un SVG del logo MBG.
// Uso: node scripts/generate-icons.mjs
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

mkdirSync('public/icons', { recursive: true })

// Ícono "any": fondo rojo de marca con MBG en blanco.
const iconSvg = (fontSize) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#dc2626"/>
  <text x="256" y="256" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="900" fill="#ffffff" text-anchor="middle" dominant-baseline="central" letter-spacing="-8">MBG</text>
</svg>`

const any = Buffer.from(iconSvg(200))
const maskable = Buffer.from(iconSvg(150)) // texto más chico para el safe zone

await sharp(any).resize(512, 512).png().toFile('public/icons/icon-512.png')
await sharp(any).resize(192, 192).png().toFile('public/icons/icon-192.png')
await sharp(maskable).resize(512, 512).png().toFile('public/icons/icon-maskable-512.png')

console.log('✓ Íconos PWA generados en public/icons/')
