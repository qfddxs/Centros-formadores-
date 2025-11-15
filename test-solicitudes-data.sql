-- Script para insertar datos de prueba de solicitudes
-- Ejecutar en Supabase SQL Editor

-- Primero, obtener el ID de un centro formador existente
-- Reemplaza 'TU_CENTRO_ID' con el ID real de tu centro

-- Ejemplo de solicitudes de prueba
INSERT INTO solicitudes_cupos (
  centro_formador_id,
  especialidad,
  numero_cupos,
  fecha_inicio,
  fecha_termino,
  solicitante,
  comentarios,
  estado,
  motivo_rechazo
) VALUES
-- Solicitud pendiente
(
  (SELECT id FROM centros_formadores LIMIT 1),
  'Enfermería',
  5,
  '2025-01-15',
  '2025-03-15',
  'Juan Pérez',
  'Solicitud para rotación de estudiantes de enfermería',
  'pendiente',
  NULL
),
-- Solicitud aprobada
(
  (SELECT id FROM centros_formadores LIMIT 1),
  'Medicina Interna',
  3,
  '2025-02-01',
  '2025-04-01',
  'María González',
  'Rotación de medicina interna para estudiantes de 5to año',
  'aprobada',
  NULL
),
-- Solicitud rechazada
(
  (SELECT id FROM centros_formadores LIMIT 1),
  'Pediatría',
  8,
  '2025-01-20',
  '2025-03-20',
  'Carlos Rodríguez',
  'Solicitud de cupos para pediatría',
  'rechazada',
  'No hay cupos disponibles para el período solicitado'
),
-- Otra solicitud pendiente
(
  (SELECT id FROM centros_formadores LIMIT 1),
  'Cirugía',
  4,
  '2025-02-15',
  '2025-04-15',
  'Ana Martínez',
  'Rotación de cirugía general',
  'pendiente',
  NULL
),
-- Otra solicitud rechazada
(
  (SELECT id FROM centros_formadores LIMIT 1),
  'Ginecología',
  6,
  '2025-01-10',
  '2025-03-10',
  'Pedro Sánchez',
  'Solicitud para rotación de ginecología',
  'rechazada',
  'El servicio no cuenta con capacidad para recibir más estudiantes en este período'
);

-- Verificar las solicitudes insertadas
SELECT 
  id,
  especialidad,
  numero_cupos,
  estado,
  fecha_inicio,
  fecha_termino,
  motivo_rechazo
FROM solicitudes_cupos
ORDER BY created_at DESC;
