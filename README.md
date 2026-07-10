# MBG Sport · Tienda en línea

Tienda de artículos deportivos (gimnasio, pesas, barras, ropa y refacciones) con
catálogo, carrito, checkout con **MercadoPago** y panel de administración.

- **Cliente:** catálogo, filtros por categoría, buscador, detalle de producto, carrito y checkout.
- **Admin:** dashboard con estadísticas, gestión de productos (con imágenes), categorías y pedidos.
- **Stack:** Vite + React + React Router + Tailwind CSS v4 + Supabase (base de datos, auth, storage y edge functions) + MercadoPago.

> Mientras no configures Supabase, la app funciona en **modo demostración** con datos de ejemplo,
> para que puedas ver y navegar la tienda.

---

## 1. Desarrollo local

```bash
npm install
npm run dev
```

Abre http://localhost:5173 (o el puerto que indique Vite).

---

## 2. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta el contenido de [`supabase/schema.sql`](supabase/schema.sql)
   (crea tablas, seguridad RLS y el bucket de imágenes).
3. Opcional: ejecuta [`supabase/seed.sql`](supabase/seed.sql) para poblar la tienda con
   categorías y productos de ejemplo.
4. En **Project Settings → API**, copia la **Project URL** y la **anon/publishable key**
   a tu archivo `.env`:

   ```env
   VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```

5. Crea el usuario administrador en **Authentication → Users → Add user**
   (email + contraseña). Con ese usuario entrarás a `/admin`.
6. Recomendado: en **Authentication → Providers → Email**, desactiva
   *"Allow new users to sign up"* para que nadie más pueda registrarse como admin.

---

## 3. Configurar MercadoPago

1. Crea una aplicación en el [panel de desarrolladores de MercadoPago](https://www.mercadopago.com.mx/developers)
   y copia tu **Access Token** (para pruebas usa las credenciales de *TEST*).
2. Guarda el Access Token como secret y despliega las edge functions:

   ```bash
   # Requiere la CLI de Supabase y haber hecho: supabase link --project-ref TU-REF
   supabase secrets set MERCADOPAGO_ACCESS_TOKEN=APP_USR-tu-access-token

   supabase functions deploy create-preference
   supabase functions deploy mercadopago-webhook --no-verify-jwt
   ```

3. En el panel de MercadoPago, configura la **URL de notificaciones (webhook)** apuntando a:

   ```
   https://TU-PROYECTO.supabase.co/functions/v1/mercadopago-webhook
   ```

Con esto, al finalizar la compra el cliente es redirigido al checkout de MercadoPago y,
tras pagar, el webhook actualiza el estado del pedido automáticamente.

> **Nota de seguridad:** el `create-preference` usa el Access Token solo en el servidor.
> Para producción se recomienda validar la firma `x-signature` en el webhook.

---

## 4. Despliegue (Vercel / Netlify)

- Framework: **Vite**. Build: `npm run build`. Carpeta de salida: `dist`.
- Configura las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- Al ser una SPA con React Router, agrega un *rewrite* de todas las rutas a `index.html`
  (Vercel lo hace automático; en Netlify usa un archivo `_redirects` con `/* /index.html 200`).

---

## Estructura

```
src/
  components/     Header, Footer, ProductCard, Modal, etc.
  context/        CartContext (carrito) y AuthContext (admin)
  lib/            supabase, api (tienda), admin (panel), mercadopago
  pages/          Home, Catalog, ProductDetail, Cart, Checkout, ...
  pages/admin/    Login, Dashboard, AdminProducts, AdminCategories, AdminOrders
  config.js       Datos del negocio (dirección, envío, etc.) — edítalo aquí
  data/demo.js    Datos de demostración (modo sin backend)
supabase/
  schema.sql      Tablas + RLS + storage
  seed.sql        Datos iniciales
  functions/      Edge functions de MercadoPago
```

Los datos del negocio (dirección, teléfono, WhatsApp, costo de envío, etc.) se editan
en [`src/config.js`](src/config.js).
