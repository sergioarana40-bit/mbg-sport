-- ============================================================
-- 2026-08-20 · Folio corto de pedidos + variantes de producto +
--              armador de cables a la medida
-- Aplicada en producción (cwffhlvjstmxgpmiafqn) vía MCP como las
-- migraciones: orders_folio_corto, products_variants, armador_de_cables.
-- ============================================================

-- ---------- 1) Folio corto consecutivo para pedidos (#0001, #0002, …) ----------
create sequence if not exists public.orders_folio_seq;

alter table public.orders add column if not exists folio integer;

-- Backfill cronológico para los pedidos existentes.
with numbered as (
  select id, row_number() over (order by created_at, id) as rn
  from public.orders
  where folio is null
)
update public.orders o set folio = n.rn from numbered n where o.id = n.id;

select setval(
  'public.orders_folio_seq',
  coalesce((select max(folio) from public.orders), 0) + 1,
  false
);

alter table public.orders alter column folio set default nextval('public.orders_folio_seq');
alter sequence public.orders_folio_seq owned by public.orders.folio;

create unique index if not exists idx_orders_folio on public.orders(folio);

-- El checkout de invitado no puede releer su pedido (sin SELECT por privacidad).
-- Esta función devuelve SOLO el folio a quien conozca el UUID completo del pedido
-- (el UUID es secreto e inadivinable, funciona como comprobante de propiedad).
create or replace function public.get_order_folio(p_order_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select folio from public.orders where id = p_order_id;
$$;

grant execute on function public.get_order_folio(uuid) to anon, authenticated;

-- ---------- 2) Variantes de producto ----------
-- Grupos de opciones sin cambio de precio:
-- [{"name":"Color","options":["Rojo","Negro"]}, …]  ·  null = sin variantes
alter table public.products add column if not exists variants jsonb;

-- ---------- 3) Armador de cables a la medida ----------
create table if not exists public.cable_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  thickness text not null,                    -- etiqueta de grosor: 'delgado' | 'grueso'
  image_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.cable_ends (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  compatible text[] not null default '{}',    -- grosores compatibles; vacío = todos
  image_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.cable_types enable row level security;
alter table public.cable_ends  enable row level security;

create policy "cable_types_read" on public.cable_types
  for select using (active = true or public.is_admin());
create policy "cable_types_admin_insert" on public.cable_types
  for insert with check (public.is_admin());
create policy "cable_types_admin_update" on public.cable_types
  for update using (public.is_admin()) with check (public.is_admin());
create policy "cable_types_admin_delete" on public.cable_types
  for delete using (public.is_admin());

create policy "cable_ends_read" on public.cable_ends
  for select using (active = true or public.is_admin());
create policy "cable_ends_admin_insert" on public.cable_ends
  for insert with check (public.is_admin());
create policy "cable_ends_admin_update" on public.cable_ends
  for update using (public.is_admin()) with check (public.is_admin());
create policy "cable_ends_admin_delete" on public.cable_ends
  for delete using (public.is_admin());

-- Datos iniciales (editables desde el panel de administración).
insert into public.cable_types (name, description, thickness, sort_order) values
  ('Cable negro · delgado',        'Recubierto en nylon negro · 3/16" (≈ 4.8 mm)',   'delgado', 1),
  ('Cable negro · grueso',         'Recubierto en nylon negro · 1/4" (≈ 6.4 mm)',    'grueso',  2),
  ('Cable transparente · delgado', 'Recubrimiento transparente · 3/16" (≈ 4.8 mm)',  'delgado', 3),
  ('Cable transparente · grueso',  'Recubrimiento transparente · 1/4" (≈ 6.4 mm)',   'grueso',  4);

insert into public.cable_ends (name, description, compatible, sort_order) values
  ('Terminal de bola',         'Bola de acero prensada, la más común en poleas',  '{delgado,grueso}', 1),
  ('Bola con vástago',         'Bola con espiga cilíndrica para anclaje',         '{delgado,grueso}', 2),
  ('Ojillo con guardacabo',    'Lazo reforzado para gancho o mosquetón',          '{delgado,grueso}', 3),
  ('Horquilla (clevis)',       'Horquilla con perno para unión articulada',       '{grueso}',         4),
  ('Tope cilíndrico',          'Cilindro prensado como tope de recorrido',        '{delgado,grueso}', 5),
  ('Rosca / espárrago',        'Terminal roscada para tensores',                  '{grueso}',         6),
  ('Sin terminal (solo corte)','Cable cortado y sellado, sin herraje',            '{delgado,grueso}', 7);
