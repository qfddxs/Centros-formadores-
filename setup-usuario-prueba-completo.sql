-- ============================================
-- SETUP COMPLETO: Usuario de Prueba + Datos
-- ============================================
-- Ejecutar en Supabase SQL Editor DESPUÉS de crear el usuario en Auth

-- PASO 1: Crear usuario en Supabase Dashboard
-- Ve a: Authentication → Users → Add user
-- Email: test@universidad.cl
-- Password: Test123456!
-- Copia el USER_ID generado

-- ============================================
-- PASO 2: Crear Centro Formador
-- ============================================

-- Eliminar centro de prueba si existe (opcional)
DELETE FROM centros_formadores WHERE codigo = 'UP001';

-- Crear centro formador
INSERT INTO centros_formadores (
  nombre, 
  codigo, 
  nivel_formacion,
  direccion,
  email,
  telefono,
  contacto_nombre,
  contacto_cargo,
  activo
)
VALUES (
  'Universidad de Prueba',
  'UP001',
  'pregrado',
  'Av. Principal 123, Santiago',
  'contacto@universidad.cl',
  '+56912345678',
  'Juan Pérez',
  'Director de Prácticas',
  true
)
RETURNING id, nombre, codigo;

-- Guardar el ID del centro para los siguientes pasos

-- ============================================
-- PASO 3: Vincular Usuario con Centro
-- ============================================

-- IMPORTANTE: Reemplaza 'TU_USER_ID_AQUI' con el ID del usuario creado en Auth
-- IMPORTANTE: Reemplaza 'ID_DEL_CENTRO_AQUI' con el ID del centro del paso anterior

INSERT INTO usuarios_centros (
  user_id, 
  centro_formador_id, 
  rol,
  activo
)
VALUES (
  'TU_USER_ID_AQUI',      -- ⚠️ REEMPLAZAR con el user_id de Auth
  'ID_DEL_CENTRO_AQUI',   -- ⚠️ REEMPLAZAR con el id del centro
  'centro_formador',
  true
)
ON CONFLICT (user_id, centro_formador_id) DO NOTHING
RETURNING id, user_id, centro_formador_id;

-- ============================================
-- PASO 4: Insertar Solicitudes de Prueba
-- ============================================

-- IMPORTANTE: Reemplaza 'ID_DEL_CENTRO_AQUI' con el ID del centro

-- Solicitud Pendiente 1
INSERT INTO solicitudes_cupos (
  centro_formador_id,
  especialidad,
  numero_cupos,
  fecha_inicio,
  fecha_termino,
  fecha_solicitud,
  solicitante,
  comentarios,
  estado
) VALUES (
  'ID_DEL_CENTRO_AQUI',  -- ⚠️ REEMPLAZAR
  'Enfermería',
  5,
  '2025-01-15',
  '2025-03-15',
  CURRENT_DATE,
  'Juan Pérez',
  'Solicitud para rotación de estudiantes de enfermería de 4to año',
  'pendiente'
);

-- Solicitud Pendiente 2
INSERT INTO solicitudes_cupos (
  centro_formador_id,
  especialidad,
  numero_cupos,
  fecha_inicio,
  fecha_termino,
  fecha_solicitud,
  solicitante,
  comentarios,
  estado
) VALUES (
  'ID_DEL_CENTRO_AQUI',  -- ⚠️ REEMPLAZAR
  'Cirugía General',
  4,
  '2025-02-15',
  '2025-04-15',
  CURRENT_DATE,
  'María González',
  'Rotación de cirugía para estudiantes de medicina',
  'pendiente'
);

-- Solicitud Aprobada
INSERT INTO solicitudes_cupos (
  centro_formador_id,
  especialidad,
  numero_cupos,
  fecha_inicio,
  fecha_termino,
  fecha_solicitud,
  solicitante,
  comentarios,
  estado
) VALUES (
  'ID_DEL_CENTRO_AQUI',  -- ⚠️ REEMPLAZAR
  'Medicina Interna',
  3,
  '2025-02-01',
  '2025-04-01',
  CURRENT_DATE - INTERVAL '5 days',
  'Carlos Rodríguez',
  'Rotación de medicina interna para estudiantes de 5to año',
  'aprobada'
);

-- Solicitud Rechazada 1
INSERT INTO solicitudes_cupos (
  centro_formador_id,
  especialidad,
  numero_cupos,
  fecha_inicio,
  fecha_termino,
  fecha_solicitud,
  solicitante,
  comentarios,
  estado,
  motivo_rechazo
) VALUES (
  'ID_DEL_CENTRO_AQUI',  -- ⚠️ REEMPLAZAR
  'Pediatría',
  8,
  '2025-01-20',
  '2025-03-20',
  CURRENT_DATE - INTERVAL '3 days',
  'Ana Martínez',
  'Solicitud de cupos para pediatría',
  'rechazada',
  'No hay cupos disponibles para el período solicitado. El servicio de pediatría está a capacidad máxima.'
);

-- Solicitud Rechazada 2
INSERT INTO solicitudes_cupos (
  centro_formador_id,
  especialidad,
  numero_cupos,
  fecha_inicio,
  fecha_termino,
  fecha_solicitud,
  solicitante,
  comentarios,
  estado,
  motivo_rechazo
) VALUES (
  'ID_DEL_CENTRO_AQUI',  -- ⚠️ REEMPLAZAR
  'Ginecología y Obstetricia',
  6,
  '2025-01-10',
  '2025-03-10',
  CURRENT_DATE - INTERVAL '7 days',
  'Pedro Sánchez',
  'Solicitud para rotación de ginecología',
  'rechazada',
  'El servicio no cuenta con capacidad para recibir más estudiantes en este período. Se sugiere solicitar para el próximo semestre.'
);

-- ============================================
-- PASO 5: Verificar Datos Insertados
-- ============================================

-- Ver centro creado
SELECT 
  id,
  nombre,
  codigo,
  nivel_formacion,
  email
FROM centros_formadores
WHERE codigo = 'UP001';

-- Ver vinculación usuario-centro
SELECT 
  uc.id,
  uc.user_id,
  uc.centro_formador_id,
  cf.nombre as centro_nombre,
  cf.codigo as centro_codigo,
  uc.rol,
  uc.activo
FROM usuarios_centros uc
JOIN centros_formadores cf ON cf.id = uc.centro_formador_id
WHERE cf.codigo = 'UP001';

-- Ver solicitudes por estado
SELECT 
  estado,
  COUNT(*) as cantidad
FROM solicitudes_cupos
WHERE centro_formador_id = (SELECT id FROM centros_formadores WHERE codigo = 'UP001')
GROUP BY estado
ORDER BY estado;

-- Ver todas las solicitudes con detalles
SELECT 
  id,
  especialidad,
  numero_cupos,
  estado,
  fecha_inicio,
  fecha_termino,
  solicitante,
  motivo_rechazo,
  created_at
FROM solicitudes_cupos
WHERE centro_formador_id = (SELECT id FROM centros_formadores WHERE codigo = 'UP001')
ORDER BY created_at DESC;

-- ============================================
-- RESUMEN ESPERADO
-- ============================================

-- Deberías ver:
-- ✅ 1 Centro formador: Universidad de Prueba (UP001)
-- ✅ 1 Vinculación usuario-centro
-- ✅ 5 Solicitudes:
--    - 2 Pendientes (Enfermería, Cirugía)
--    - 1 Aprobada (Medicina Interna)
--    - 2 Rechazadas (Pediatría, Ginecología)

-- ============================================
-- CREDENCIALES PARA LOGIN
-- ============================================

-- Email: test@universidad.cl
-- Password: Test123456!

-- Después de iniciar sesión, el Dashboard mostrará:
-- - Total: 5 solicitudes
-- - Pendientes: 2
-- - Aprobadas: 1
-- - Rechazadas: 2

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. Debes crear el usuario PRIMERO en Supabase Dashboard:
--    Authentication → Users → Add user

-- 2. Copia el user_id generado y reemplázalo en el PASO 3

-- 3. Ejecuta el PASO 2 y copia el id del centro

-- 4. Reemplaza 'ID_DEL_CENTRO_AQUI' en los PASOS 3 y 4

-- 5. Ejecuta cada sección en orden

-- ============================================
-- SCRIPT ALTERNATIVO (Si ya tienes el centro)
-- ============================================

-- Si ya tienes un centro formador, solo necesitas:

-- 1. Obtener el ID del centro
SELECT id, nombre FROM centros_formadores LIMIT 1;

-- 2. Vincular usuario (reemplazar IDs)
INSERT INTO usuarios_centros (user_id, centro_formador_id, rol)
VALUES ('TU_USER_ID', 'ID_DEL_CENTRO', 'centro_formador')
ON CONFLICT DO NOTHING;

-- 3. Insertar solicitudes (reemplazar ID_DEL_CENTRO en las queries anteriores)

