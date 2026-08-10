-- ============================================================
-- Migración: banner comercial de la portada de la tienda
-- (diseño "Entrega MBGSPORT" · pantallas 03/04)
-- ============================================================
-- Ejecutar UNA VEZ en el SQL Editor del proyecto de Supabase
-- (solo si la base ya existía antes de esta función; las
-- instalaciones nuevas lo traen incluido en schema.sql).
--
-- Crea la tabla `banners` que alimenta el "Destacado de la semana"
-- de la home de la tienda; se administra desde /admin/banner y,
-- con varios banners activos, la portada los rota en carrusel.

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  product_id uuid references public.products(id) on delete set null,
  image_url text,
  cta_label text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.banners enable row level security;

-- Lectura: público solo ve activos; el admin ve todos.
create policy "banners_read" on public.banners
  for select using (active = true or public.is_admin());
-- Escritura: solo admin.
create policy "banners_admin_insert" on public.banners
  for insert with check (public.is_admin());
create policy "banners_admin_update" on public.banners
  for update using (public.is_admin()) with check (public.is_admin());
create policy "banners_admin_delete" on public.banners
  for delete using (public.is_admin());
