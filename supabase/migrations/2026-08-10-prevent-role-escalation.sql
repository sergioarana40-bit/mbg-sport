-- ============================================================
-- Migración de seguridad: impedir auto-promoción a administrador
-- ============================================================
-- Contexto: is_admin() confía en profiles.role, y la política RLS
-- profiles_self_update permite que cada usuario actualice su propia fila.
-- Postgres RLS no restringe columnas, así que sin esto un cliente podía:
--   update public.profiles set role = 'admin' where id = auth.uid();
-- y volverse administrador. Este trigger lo bloquea.
--
-- El service_role y el SQL Editor (auth.uid() = null) conservan control total,
-- para poder seguir asignando administradores manualmente.

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

drop trigger if exists trg_prevent_role_self_escalation on public.profiles;
create trigger trg_prevent_role_self_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();
