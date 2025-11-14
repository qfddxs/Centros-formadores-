-- ============================================
-- SISTEMA DE CONTROL DE CUPOS DISPONIBLES
-- ============================================

-- Agregar campos de cupos a la tabla centros_formadores
ALTER TABLE centros_formadores 
ADD COLUMN IF NOT EXISTS cupos_totales INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cupos_disponibles INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cupos_en_uso INTEGER DEFAULT 0;

-- Crear tabla para historial de cupos
CREATE TABLE IF NOT EXISTS historial_cupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centro_formador_id UUID REFERENCES centros_formadores(id) ON DELETE CASCADE,
  solicitud_id UUID REFERENCES solicitudes_cupos(id) ON DELETE SET NULL,
  tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('asignacion', 'liberacion', 'ajuste')),
  cantidad INTEGER NOT NULL,
  cupos_antes INTEGER NOT NULL,
  cupos_despues INTEGER NOT NULL,
  motivo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_historial_cupos_centro ON historial_cupos(centro_formador_id);
CREATE INDEX IF NOT EXISTS idx_historial_cupos_solicitud ON historial_cupos(solicitud_id);

-- RLS
ALTER TABLE historial_cupos ENABLE ROW LEVEL SECURITY;

-- Política: Ver historial de cupos
CREATE POLICY "Ver historial de cupos"
  ON historial_cupos FOR SELECT
  USING (
    centro_formador_id IN (
      SELECT centro_formador_id FROM usuarios_centros 
      WHERE user_id = auth.uid()
    )
  );

-- Función para actualizar cupos disponibles
CREATE OR REPLACE FUNCTION actualizar_cupos_centro()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando se aprueba una solicitud, restar cupos
  IF NEW.estado = 'aprobada' AND OLD.estado != 'aprobada' THEN
    UPDATE centros_formadores 
    SET 
      cupos_en_uso = cupos_en_uso + NEW.numero_cupos,
      cupos_disponibles = cupos_totales - (cupos_en_uso + NEW.numero_cupos)
    WHERE id = NEW.centro_formador_id;
    
    -- Registrar en historial
    INSERT INTO historial_cupos (
      centro_formador_id, 
      solicitud_id, 
      tipo_movimiento, 
      cantidad,
      cupos_antes,
      cupos_despues,
      motivo
    )
    SELECT 
      NEW.centro_formador_id,
      NEW.id,
      'asignacion',
      NEW.numero_cupos,
      cupos_disponibles + NEW.numero_cupos,
      cupos_disponibles,
      'Solicitud aprobada'
    FROM centros_formadores
    WHERE id = NEW.centro_formador_id;
  END IF;
  
  -- Cuando se rechaza o cancela una solicitud aprobada, liberar cupos
  IF (NEW.estado = 'rechazada' OR NEW.estado = 'cancelada') AND OLD.estado = 'aprobada' THEN
    UPDATE centros_formadores 
    SET 
      cupos_en_uso = GREATEST(0, cupos_en_uso - OLD.numero_cupos),
      cupos_disponibles = cupos_totales - GREATEST(0, cupos_en_uso - OLD.numero_cupos)
    WHERE id = NEW.centro_formador_id;
    
    -- Registrar en historial
    INSERT INTO historial_cupos (
      centro_formador_id, 
      solicitud_id, 
      tipo_movimiento, 
      cantidad,
      cupos_antes,
      cupos_despues,
      motivo
    )
    SELECT 
      NEW.centro_formador_id,
      NEW.id,
      'liberacion',
      OLD.numero_cupos,
      cupos_disponibles - OLD.numero_cupos,
      cupos_disponibles,
      'Solicitud rechazada/cancelada'
    FROM centros_formadores
    WHERE id = NEW.centro_formador_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar cupos automáticamente
DROP TRIGGER IF EXISTS trigger_actualizar_cupos ON solicitudes_cupos;
CREATE TRIGGER trigger_actualizar_cupos
  AFTER UPDATE ON solicitudes_cupos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_cupos_centro();

-- Comentarios
COMMENT ON COLUMN centros_formadores.cupos_totales IS 'Total de cupos asignados al centro formador';
COMMENT ON COLUMN centros_formadores.cupos_disponibles IS 'Cupos disponibles para solicitar';
COMMENT ON COLUMN centros_formadores.cupos_en_uso IS 'Cupos actualmente en uso (solicitudes aprobadas)';
COMMENT ON TABLE historial_cupos IS 'Historial de movimientos de cupos';

-- Verificar
SELECT 
  id, 
  nombre, 
  cupos_totales, 
  cupos_disponibles, 
  cupos_en_uso 
FROM centros_formadores;
