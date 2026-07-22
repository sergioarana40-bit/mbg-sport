-- ============================================================
-- MBG Sport · Esquema de base de datos (Supabase / PostgreSQL)
-- ============================================================
-- Ejecutar una vez en el proyecto de Supabase (SQL Editor o migración).

-- ---------- Tablas ----------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  category_id uuid references public.categories(id) on delete set null,
  stock int not null default 0,
  featured boolean not null default false,
  active boolean not null default true,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  customer_address text,
  notes text,
  subtotal numeric(10,2) not null default 0,
  shipping numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  status text not null default 'pending',          -- pending|paid|processing|shipped|delivered|cancelled
  payment_status text not null default 'pending',   -- pending|approved|rejected|in_process
  payment_id text,
  preference_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  price numeric(10,2) not null,
  quantity int not null default 1
);

-- ---------- Índices ----------
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_active on public.products(active);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_orders_created on public.orders(created_at desc);

-- ---------- Row Level Security ----------
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- Catálogo: lectura pública (tienda). Escritura: solo administradores (usuarios autenticados).
create policy "categories_public_read" on public.categories
  for select using (true);
create policy "categories_admin_write" on public.categories
  for all to authenticated using (true) with check (true);

create policy "products_public_read" on public.products
  for select using (true);
create policy "products_admin_write" on public.products
  for all to authenticated using (true) with check (true);

-- Pedidos: cualquiera puede CREAR un pedido (checkout sin login).
-- Solo administradores pueden ver / actualizar / borrar.
create policy "orders_public_insert" on public.orders
  for insert to anon, authenticated with check (true);
create policy "orders_admin_read" on public.orders
  for select to authenticated using (true);
create policy "orders_admin_update" on public.orders
  for update to authenticated using (true) with check (true);
create policy "orders_admin_delete" on public.orders
  for delete to authenticated using (true);

create policy "order_items_public_insert" on public.order_items
  for insert to anon, authenticated with check (true);
create policy "order_items_admin_read" on public.order_items
  for select to authenticated using (true);

-- ---------- Trabajos del servicio técnico (galería de /reparaciones) ----------
-- Contenido editable por el admin; el layout de la página es fijo en el frontend.
create table if not exists public.repair_works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.repair_works enable row level security;

-- Lectura: público solo ve activos; el admin ve todos.
create policy "repair_works_read" on public.repair_works
  for select using (active = true or public.is_admin());
-- Escritura: solo admin.
create policy "repair_works_admin_insert" on public.repair_works
  for insert with check (public.is_admin());
create policy "repair_works_admin_update" on public.repair_works
  for update using (public.is_admin()) with check (public.is_admin());
create policy "repair_works_admin_delete" on public.repair_works
  for delete using (public.is_admin());

-- ---------- Storage: imágenes de productos ----------
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'products');
create policy "product_images_admin_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'products');
create policy "product_images_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'products');
create policy "product_images_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'products');
