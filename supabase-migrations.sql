-- ============================================
-- MIGRACIÓN: Sistema de Rotaciones y Estudiantes
-- ============================================

-- Tabla de solicitudes de rotación
CREATE TABLE IF NOT EXISTS solicitudes_rotacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centro_formador_id UUID REFERENCES centros_formadores(id) ON DELETE CASCADE,
  especialidad VARCHAR(100) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_termino DATE NOT NULL,
  comentarios TEXT,
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  archivo_excel_url TEXT, -- URL del archivo Excel original en Storage
  archivo_excel_nombre VARCHAR(255),
  fecha_solicitud DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de estudiantes por rotación
CREATE TABLE IF NOT EXISTS estudiantes_rotacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_rotacion_id UUID REFERENCES solicitudes_rotacion(id) ON DELETE CASCADE,
  rut VARCHAR(12) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  telefono VARCHAR(20),
  fecha_nacimiento DATE,
  carrera VARCHAR(100),
  nivel_academico VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de documentos (para gestión documental)
CREATE TABLE IF NOT EXISTS documentos_centro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centro_formador_id UUID REFERENCES centros_formadores(id) ON DELETE CASCADE,
  nombre_archivo VARCHAR(255) NOT NULL,
  tipo_documento VARCHAR(100) NOT NULL, -- 'certificado_vacunacion', 'seguro', 'otro'
  descripcion TEXT,
  archivo_url TEXT NOT NULL, -- URL en Supabase Storage
  tamaño_bytes BIGINT,
  fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subido_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_solicitudes_rotacion_centro ON solicitudes_rotacion(centro_formador_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_rotacion_estado ON solicitudes_rotacion(estado);
CREATE INDEX IF NOT EXISTS idx_estudiantes_rotacion_solicitud ON estudiantes_rotacion(solicitud_rotacion_id);
CREATE INDEX IF NOT EXISTS idx_estudiantes_rotacion_rut ON estudiantes_rotacion(rut);
CREATE INDEX IF NOT EXISTS idx_documentos_centro ON documentos_centro(centro_formador_id);

-- Políticas RLS (Row Level Security)
ALTER TABLE solicitudes_rotacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes_rotacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_centro ENABLE ROW LEVEL SECURITY;

-- Política: Los centros solo ven sus propias solicitudes de rotación
CREATE POLICY "Centros ven sus solicitudes de rotación"
  ON solicitudes_rotacion FOR SELECT
  USING (
    centro_formador_id IN (
      SELECT centro_formador_id FROM usuarios_centros 
      WHERE user_id = auth.uid()
    )
  );

-- Política: Los centros pueden crear solicitudes de rotación
CREATE POLICY "Centros crean solicitudes de rotación"
  ON solicitudes_rotacion FOR INSERT
  WITH CHECK (
    centro_formador_id IN (
      SELECT centro_formador_id FROM usuarios_centros 
      WHERE user_id = auth.uid()
    )
  );

-- Política: Los estudiantes son visibles según la solicitud
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

-- Política: Los centros ven sus documentos
CREATE POLICY "Centros ven sus documentos"
  ON documentos_centro FOR SELECT
  USING (
    centro_formador_id IN (
      SELECT centro_formador_id FROM usuarios_centros 
      WHERE user_id = auth.uid()
    )
  );

-- Política: Los centros suben documentos
CREATE POLICY "Centros suben documentos"
  ON documentos_centro FOR INSERT
  WITH CHECK (
    centro_formador_id IN (
      SELECT centro_formador_id FROM usuarios_centros 
      WHERE user_id = auth.uid()
    )
  );

-- Política: Los centros eliminan sus documentos
CREATE POLICY "Centros eliminan sus documentos"
  ON documentos_centro FOR DELETE
  USING (
    centro_formador_id IN (
      SELECT centro_formador_id FROM usuarios_centros 
      WHERE user_id = auth.uid()
    )
  );

-- Configuración de Storage Buckets (ejecutar en Supabase Dashboard)
-- Bucket: 'rotaciones-excel' para archivos Excel
-- Bucket: 'documentos-centros' para PDFs y otros documentos

COMMENT ON TABLE solicitudes_rotacion IS 'Solicitudes de rotación de estudiantes con archivo Excel';
COMMENT ON TABLE estudiantes_rotacion IS 'Datos parseados de estudiantes desde Excel';
COMMENT ON TABLE documentos_centro IS 'Documentos subidos por centros formadores (certificados, seguros, etc.)';
