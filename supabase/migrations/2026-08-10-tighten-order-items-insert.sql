-- ============================================================
-- Migración de seguridad: restringir INSERT en order_items
-- ============================================================
-- Hallado en re-auditoría adversarial. La política order_items_insert tenía
-- with_check=true, así que un cliente (o anónimo) podía insertar artículos en
-- CUALQUIER pedido — incluido uno ya pagado o de otra persona. Vector de fraude:
-- pagar barato y luego añadir productos caros al pedido ya 'paid' → el admin
-- surte mercancía nunca cobrada.
--
-- Se restringe a: el pedido debe existir, ser del propio usuario (o de invitado)
-- y seguir 'pending'. Compatible con el checkout (crea el pedido 'pending' y
-- enseguida inserta sus items); bloquea insertar en pedidos pagados/ajenos.

drop policy if exists "order_items_insert" on public.order_items;
create policy "order_items_insert" on public.order_items
  for insert to anon, authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or o.user_id is null)
        and o.status = 'pending'
    )
  );
