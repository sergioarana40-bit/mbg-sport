-- ============================================================
-- MBG Sport · Datos iniciales (opcional)
-- ============================================================
-- Ejecutar DESPUÉS de schema.sql para poblar la tienda con
-- categorías y productos de ejemplo. Edítalos a tu gusto.

insert into public.categories (name, slug, sort_order) values
  ('Pesas y Mancuernas', 'pesas-mancuernas', 1),
  ('Barras y Discos',    'barras-discos',    2),
  ('Cardio y Máquinas',  'cardio-maquinas',  3),
  ('Ropa y Calzado',     'ropa-calzado',     4),
  ('Accesorios',         'accesorios',       5),
  ('Refacciones',        'refacciones',      6)
on conflict (slug) do nothing;

insert into public.products (name, description, price, category_id, stock, featured, active)
select v.name, v.description, v.price, c.id, v.stock, v.featured, true
from (values
  ('Mancuerna hexagonal 10 kg', 'Mancuerna de hule con recubrimiento antigolpes y mango cromado antideslizante. Precio por pieza.', 650, 'pesas-mancuernas', 24, true),
  ('Set de mancuernas ajustables 24 kg', 'Par de mancuernas ajustables de 2.5 a 24 kg. Ideal para entrenar en casa.', 2890, 'pesas-mancuernas', 8, true),
  ('Kettlebell (pesa rusa) 16 kg', 'Pesa rusa de hierro fundido con base plana y mango ancho.', 780, 'pesas-mancuernas', 15, false),
  ('Barra olímpica 20 kg', 'Barra olímpica de 2.2 m, capacidad 300 kg, con casquillos giratorios.', 2400, 'barras-discos', 6, true),
  ('Par de discos olímpicos 20 kg', 'Par de discos de hule con inserto de acero. Diámetro estándar olímpico.', 1600, 'barras-discos', 12, false),
  ('Rack para sentadillas', 'Estructura de acero para sentadilla y press. Altura ajustable, base reforzada.', 4500, 'cardio-maquinas', 4, true),
  ('Caminadora eléctrica plegable', 'Motor 2.5 HP, velocidad hasta 14 km/h, pantalla LED y 12 programas.', 8900, 'cardio-maquinas', 3, true),
  ('Bicicleta fija de spinning', 'Volante de inercia de 13 kg, resistencia ajustable y asiento ergonómico.', 5200, 'cardio-maquinas', 5, false),
  ('Playera dry-fit MBG Sport', 'Playera deportiva de secado rápido con logo MBG. Tallas CH a XG.', 290, 'ropa-calzado', 40, false),
  ('Guantes de gimnasio', 'Guantes con soporte de muñeca y palma acolchada antiderrapante.', 180, 'accesorios', 30, false),
  ('Cinturón de levantamiento de piel', 'Cinturón de piel de 10 cm con hebilla doble para soporte lumbar.', 420, 'accesorios', 18, true),
  ('Cable de acero para máquina', 'Cable recubierto de 4 mm para reparación de poleas. Refacción universal.', 150, 'refacciones', 50, false)
) as v(name, description, price, cat_slug, stock, featured)
join public.categories c on c.slug = v.cat_slug;
