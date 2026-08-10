-- Se retira MercadoPago: los pagos ahora son presenciales al recoger en tienda.
-- Elimina las columnas de la pasarela (nunca hubo pagos en línea reales).
alter table public.orders drop column if exists payment_status;
alter table public.orders drop column if exists payment_id;
alter table public.orders drop column if exists preference_id;
