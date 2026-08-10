import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Usamos el manifiesto de public/manifest.webmanifest (enlazado en index.html).
      manifest: false,
      // Permite probar el service worker en desarrollo (npm run dev).
      devOptions: { enabled: true, type: 'module' },
      workbox: {
        navigateFallback: '/index.html',
        // No interceptar las rutas de Supabase con el fallback de navegación.
        navigateFallbackDenylist: [/^\/rest/, /^\/auth/, /^\/functions/],
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [
          {
            // Catálogo/pedidos de Supabase: red primero, con respaldo en caché (offline).
            urlPattern: ({ url }) => url.hostname.endsWith('supabase.co'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            // Imágenes de productos: caché primero.
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Google Fonts.
            urlPattern: ({ url }) => url.hostname.includes('fonts.g'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    // Respeta PORT si el entorno lo define (p. ej. previews); 5173 por defecto.
    port: Number(process.env.PORT) || 5173,
  },
})
