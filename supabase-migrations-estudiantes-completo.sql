-- ============================================
-- ACTUALIZACIÓN: Tabla de estudiantes con estructura completa
-- ============================================

-- Eliminar tabla anterior si existe (solo para desarrollo)
-- DROP TABLE IF EXISTS estudiantes_rotacion CASCADE;

-- Crear tabla con todos los campos de la nómina
CREATE TABLE IF NOT EXISTS estudiantes_rotacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_rotacion_id UUID REFERENCES solicitudes_rotacion(id) ON DELETE CASCADE,
  
  -- Datos personales
  numero INTEGER, -- N°
  primer_apellido VARCHAR(100) NOT NULL, -- 1° Apellido
  segundo_apellido VARCHAR(100), -- 2° Apellido
  nombre VARCHAR(100) NOT NULL, -- Nombre
  rut VARCHAR(12) NOT NULL, -- Rut
  telefono VARCHAR(20), -- Telefono
  correo_electronico VARCHAR(100), -- Correo Electronico
  
  -- Contacto de emergencia
  nombre_contacto_emergencia VARCHAR(100), -- Nombre de contacto de emergencia
  telefono_contacto_emergencia VARCHAR(20), -- Telefono de contacto de emergencia
  
  -- Ubicación y académico
  lugar_residencia VARCHAR(200), -- lugar de residencia
  carrera VARCHAR(100), -- Carrera
  nivel_que_cursa VARCHAR(50), -- Nivel que cursa
  
  -- Práctica
  tipo_practica VARCHAR(100), -- tipo de practica
  campo_clinico_solicitado VARCHAR(200), -- campo clinico solicitado
  fecha_inicio DATE, -- Fecha Inicio
  fecha_termino DATE, -- Fecha termino
  numero_semanas_presenciales INTEGER, -- n° semanas presenciales
  horario_desde TIME, -- desde (horario)
  horario_hasta TIME, -- hasta (horario)
  cuarto_turno VARCHAR(10), -- cuarto turno (Si/No)
  
  -- Docente supervisor
  nombre_docente_centro_formador VARCHAR(100), -- nombre docente centro formador
  telefono_docente_centro_formador VARCHAR(20), -- Telefono docente centro formador
  
  -- Registro y seguimiento
  numero_registro_sis VARCHAR(50), -- N° reg. sis
  inmunizacion_al_dia VARCHAR(10), -- inmunizacion al dia (Si/No)
  numero_visitas INTEGER, -- n° Visitas
  fecha_supervision DATE, -- Fecha de la supervision
  observaciones TEXT, -- observaciones
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_estudiantes_rotacion_solicitud ON estudiantes_rotacion(solicitud_rotacion_id);
CREATE INDEX IF NOT EXISTS idx_estudiantes_rotacion_rut ON estudiantes_rotacion(rut);
CREATE INDEX IF NOT EXISTS idx_estudiantes_rotacion_carrera ON estudiantes_rotacion(carrera);

-- RLS
ALTER TABLE estudiantes_rotacion ENABLE ROW LEVEL SECURITY;

-- Política: Ver estudiantes de rotación
DROP POLICY IF EXISTS "Ver estudiantes de rotación" ON estudiantes_rotacion;
CREATE POLICY "Ver estudiantes de rotación"
  ON estudiantes_rotacion FOR SELECT
  USING (
    solicitud_rotacion_id IN (
      SELECT id FROM solicitudes_rotacion 
      WHERE centro_formador_id IN (
        SELECT centro_formador_id FROM usuarios_centros 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Política: Insertar estudiantes
DROP POLICY IF EXISTS "Insertar estudiantes de rotación" ON estudiantes_rotacion;
CREATE POLICY "Insertar estudiantes de rotación"
  ON estudiantes_rotacion FOR INSERT
  WITH CHECK (
    solicitud_rotacion_id IN (
      SELECT id FROM solicitudes_rotacion 
      WHERE centro_formador_id IN (
        SELECT centro_formador_id FROM usuarios_centros 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Verificar estructura
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'estudiantes_rotacion' 
ORDER BY ordinal_position;
