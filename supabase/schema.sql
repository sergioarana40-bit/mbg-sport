-- ============================================================
-- MBG Sport · Esquema completo (Supabase / PostgreSQL)
-- ============================================================
-- Refleja el estado REAL de producción (proyecto cwffhlvjstmxgpmiafqn) a
-- 2026-08-10. Reproduce toda la base: tablas, funciones, triggers, RLS y
-- Storage. Ejecutar una vez en un proyecto nuevo (SQL Editor).
--
-- Regla de oro de seguridad: el rol "admin" se decide en la BASE DE DATOS
-- (profiles.role + is_admin()), nunca en el frontend. Toda escritura de
-- catálogo/pedidos exige is_admin(); cada cliente solo ve/edita lo suyo.

-- ---------------------------------------------------------------
-- Funciones de apoyo
-- ---------------------------------------------------------------

-- ¿El usuario de la sesión es administrador? SECURITY DEFINER para poder leer
-- profiles saltándose RLS (evita recursión en las políticas que la invocan).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Al crear un usuario en auth.users, se crea automáticamente su perfil.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Impide que un usuario final cambie su propio role (auto-promoción a admin).
-- Ver supabase/migrations/2026-08-10-prevent-role-escalation.sql.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'No autorizado: no puedes cambiar tu rol.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------

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

-- Perfil de cada usuario (1:1 con auth.users). `role` gobierna is_admin().
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer',        -- 'customer' | 'admin'
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,  -- null = invitado
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  customer_address text,
  notes text,
  subtotal numeric(10,2) not null default 0,
  shipping numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  coupon_code text,
  delivery_method text not null default 'shipping',  -- 'shipping' | 'pickup'
  total numeric(10,2) not null default 0,
  status text not null default 'pending',            -- pending|paid|processing|shipped|delivered|cancelled
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

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  recipient text,
  phone text,
  full_address text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author text not null,
  rating int not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  type text not null,                       -- 'percent' | 'fixed' | 'free_shipping'
  value numeric(10,2) not null default 0,
  min_subtotal numeric(10,2) not null default 0,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- Banner comercial de la portada de la tienda ("Destacado de la semana").
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

-- Galería "Trabajos recientes" de la página de reparaciones.
create table if not exists public.repair_works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_active on public.products(active);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_orders_created on public.orders(created_at desc);
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_reviews_product on public.reviews(product_id);

-- ---------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists trg_prevent_role_self_escalation on public.profiles;
create trigger trg_prevent_role_self_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

-- ---------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------
alter table public.categories   enable row level security;
alter table public.products     enable row level security;
alter table public.profiles     enable row level security;
alter table public.orders       enable row level security;
alter table public.order_items  enable row level security;
alter table public.addresses    enable row level security;
alter table public.favorites    enable row level security;
alter table public.reviews      enable row level security;
alter table public.coupons      enable row level security;
alter table public.banners      enable row level security;
alter table public.repair_works enable row level security;

-- Catálogo: lectura pública, escritura solo admin.
create policy "categories_public_read" on public.categories for select using (true);
create policy "categories_admin_write" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "products_public_read" on public.products for select using (true);
create policy "products_admin_write" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Perfiles: cada quien lee/edita el suyo (el admin lee todos). El role está
-- protegido por el trigger prevent_role_self_escalation.
create policy "profiles_self_read" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles_self_update" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Pedidos: cualquiera crea (checkout invitado). Ver = admin o dueño;
-- actualizar/borrar = solo admin.
create policy "orders_insert" on public.orders
  for insert to anon, authenticated with check (user_id is null or user_id = auth.uid());
create policy "orders_read" on public.orders
  for select to authenticated using (public.is_admin() or user_id = auth.uid());
create policy "orders_admin_update" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "orders_admin_delete" on public.orders
  for delete to authenticated using (public.is_admin());

-- El artículo solo puede insertarse en un pedido propio (o de invitado) que
-- siga 'pending'. Impide añadir productos a pedidos ya pagados o ajenos.
create policy "order_items_insert" on public.order_items
  for insert to anon, authenticated with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or o.user_id is null)
        and o.status = 'pending'
    )
  );
create policy "order_items_read" on public.order_items
  for select to authenticated using (
    public.is_admin()
    or exists (select 1 from public.orders o
               where o.id = order_items.order_id and o.user_id = auth.uid())
  );

-- Direcciones / favoritos: cada quien solo lo suyo.
create policy "addresses_own" on public.addresses
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "favorites_own" on public.favorites
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Reseñas: lectura pública; escribir/editar atado al autor; borrar autor o admin.
create policy "reviews_public_read" on public.reviews for select using (true);
create policy "reviews_insert" on public.reviews
  for insert to authenticated with check (user_id = auth.uid());
create policy "reviews_owner_update" on public.reviews
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "reviews_owner_delete" on public.reviews
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- Cupones: lectura pública solo de activos; escritura solo admin.
create policy "coupons_public_read" on public.coupons for select using (active = true);
create policy "coupons_admin_all" on public.coupons
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Banner y galería de reparaciones: público ve activos; escritura solo admin.
create policy "banners_read" on public.banners
  for select using (active = true or public.is_admin());
create policy "banners_admin_insert" on public.banners
  for insert with check (public.is_admin());
create policy "banners_admin_update" on public.banners
  for update using (public.is_admin()) with check (public.is_admin());
create policy "banners_admin_delete" on public.banners
  for delete using (public.is_admin());

create policy "repair_works_read" on public.repair_works
  for select using (active = true or public.is_admin());
create policy "repair_works_admin_insert" on public.repair_works
  for insert with check (public.is_admin());
create policy "repair_works_admin_update" on public.repair_works
  for update using (public.is_admin()) with check (public.is_admin());
create policy "repair_works_admin_delete" on public.repair_works
  for delete using (public.is_admin());

-- ---------------------------------------------------------------
-- Realtime: aviso de pedidos en vivo en el panel admin
-- ---------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;

-- ---------------------------------------------------------------
-- Storage: imágenes de productos, banners y reparaciones (bucket 'products')
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'products');
create policy "product_images_admin_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'products' and public.is_admin());
create policy "product_images_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'products' and public.is_admin());
create policy "product_images_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'products' and public.is_admin());
