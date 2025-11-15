-- =====================================================
-- SISTEMA DE SEGUIMIENTO DE ESTUDIANTES EN PRÁCTICA
-- =====================================================

-- Tabla de asistencia diaria
CREATE TABLE IF NOT EXISTS asistencia_estudiantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estudiante_rotacion_id UUID REFERENCES estudiantes_rotacion(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  estado VARCHAR(50) NOT NULL, -- 'presente', 'ausente', 'justificado', 'tarde'
  hora_entrada TIME,
  hora_salida TIME,
  observaciones TEXT,
  registrado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(estudiante_rotacion_id, fecha)
);

-- Tabla de observaciones generales
CREATE TABLE IF NOT EXISTS observaciones_estudiantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estudiante_rotacion_id UUID REFERENCES estudiantes_rotacion(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo VARCHAR(50) NOT NULL, -- 'positiva', 'negativa', 'neutral', 'alerta'
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  registrado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de evaluaciones
CREATE TABLE IF NOT EXISTS evaluaciones_estudiantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estudiante_rotacion_id UUID REFERENCES estudiantes_rotacion(id) ON DELETE CASCADE,
  fecha_evaluacion DATE NOT NULL,
  tipo_evaluacion VARCHAR(100), -- 'parcial', 'final', 'competencias', etc.
  nota DECIMAL(3,1),
  comentarios TEXT,
  evaluador_nombre VARCHAR(255),
  evaluador_cargo VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_asistencia_estudiante ON asistencia_estudiantes(estudiante_rotacion_id);
CREATE INDEX idx_asistencia_fecha ON asistencia_estudiantes(fecha);
CREATE INDEX idx_observaciones_estudiante ON observaciones_estudiantes(estudiante_rotacion_id);
CREATE INDEX idx_evaluaciones_estudiante ON evaluaciones_estudiantes(estudiante_rotacion_id);

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE asistencia_estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE observaciones_estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluaciones_estudiantes ENABLE ROW LEVEL SECURITY;

-- Política: Centros formadores pueden ver asistencia de sus estudiantes
CREATE POLICY "centros_ven_asistencia_sus_estudiantes"
ON asistencia_estudiantes
FOR SELECT
USING (
  estudiante_rotacion_id IN (
    SELECT er.id 
    FROM estudiantes_rotacion er
    JOIN solicitudes_rotacion sr ON er.solicitud_rotacion_id = sr.id
    JOIN usuarios_centros uc ON sr.centro_formador_id = uc.centro_formador_id
    WHERE uc.user_id = auth.uid()
  )
);

-- Política: Centros formadores pueden ver observaciones de sus estudiantes
CREATE POLICY "centros_ven_observaciones_sus_estudiantes"
ON observaciones_estudiantes
FOR SELECT
USING (
  estudiante_rotacion_id IN (
    SELECT er.id 
    FROM estudiantes_rotacion er
    JOIN solicitudes_rotacion sr ON er.solicitud_rotacion_id = sr.id
    JOIN usuarios_centros uc ON sr.centro_formador_id = uc.centro_formador_id
    WHERE uc.user_id = auth.uid()
  )
);

-- Política: Centros formadores pueden ver evaluaciones de sus estudiantes
CREATE POLICY "centros_ven_evaluaciones_sus_estudiantes"
ON evaluaciones_estudiantes
FOR SELECT
USING (
  estudiante_rotacion_id IN (
    SELECT er.id 
    FROM estudiantes_rotacion er
    JOIN solicitudes_rotacion sr ON er.solicitud_rotacion_id = sr.id
    JOIN usuarios_centros uc ON sr.centro_formador_id = uc.centro_formador_id
    WHERE uc.user_id = auth.uid()
  )
);

-- =====================================================
-- FUNCIONES ÚTILES
-- =====================================================

-- Función para calcular porcentaje de asistencia
CREATE OR REPLACE FUNCTION calcular_porcentaje_asistencia(
  p_estudiante_rotacion_id UUID,
  p_fecha_inicio DATE,
  p_fecha_fin DATE
)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
AS $$
DECLARE
  total_dias INTEGER;
  dias_presente INTEGER;
BEGIN
  -- Contar días totales (excluyendo fines de semana)
  SELECT COUNT(*)
  INTO total_dias
  FROM generate_series(p_fecha_inicio, p_fecha_fin, '1 day'::interval) AS fecha
  WHERE EXTRACT(DOW FROM fecha) NOT IN (0, 6); -- 0=Domingo, 6=Sábado
  
  -- Contar días presentes
  SELECT COUNT(*)
  INTO dias_presente
  FROM asistencia_estudiantes
  WHERE estudiante_rotacion_id = p_estudiante_rotacion_id
    AND fecha BETWEEN p_fecha_inicio AND p_fecha_fin
    AND estado IN ('presente', 'tarde');
  
  -- Calcular porcentaje
  IF total_dias > 0 THEN
    RETURN (dias_presente::DECIMAL / total_dias::DECIMAL) * 100;
  ELSE
    RETURN 0;
  END IF;
END;
$$;

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL - COMENTAR EN PRODUCCIÓN)
-- =====================================================

-- Insertar asistencia de ejemplo para testing
-- NOTA: Reemplazar los UUIDs con IDs reales de tu base de datos
/*
INSERT INTO asistencia_estudiantes (estudiante_rotacion_id, fecha, estado, hora_entrada, hora_salida, observaciones)
VALUES 
  ('UUID_ESTUDIANTE_1', '2025-01-15', 'presente', '08:00', '17:00', 'Excelente desempeño'),
  ('UUID_ESTUDIANTE_1', '2025-01-16', 'presente', '08:05', '17:00', 'Llegó 5 minutos tarde'),
  ('UUID_ESTUDIANTE_1', '2025-01-17', 'ausente', NULL, NULL, 'Falta justificada por enfermedad');
*/

COMMENT ON TABLE asistencia_estudiantes IS 'Registro diario de asistencia de estudiantes en práctica';
COMMENT ON TABLE observaciones_estudiantes IS 'Observaciones y comentarios sobre el desempeño de estudiantes';
COMMENT ON TABLE evaluaciones_estudiantes IS 'Evaluaciones formales de estudiantes durante la práctica';
