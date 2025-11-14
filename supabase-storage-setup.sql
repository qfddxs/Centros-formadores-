-- ============================================
-- CONFIGURACIÓN DE STORAGE BUCKETS
-- ============================================
-- Ejecutar este script en el SQL Editor de Supabase

-- Crear bucket para archivos Excel de rotaciones
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rotaciones-excel',
  'rotaciones-excel',
  true,
  5242880, -- 5MB en bytes
  ARRAY['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- Crear bucket para documentos PDF de centros
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos-centros',
  'documentos-centros',
  true,
  10485760, -- 10MB en bytes
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- POLÍTICAS DE STORAGE PARA rotaciones-excel
-- ============================================

-- Política de lectura: Centros ven sus archivos Excel
CREATE POLICY "Centros ven sus archivos Excel"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'rotaciones-excel' AND
  (storage.foldername(name))[1] IN (
    SELECT centro_formador_id::text FROM usuarios_centros 
    WHERE user_id = auth.uid()
  )
);

-- Política de subida: Centros suben archivos Excel
CREATE POLICY "Centros suben archivos Excel"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'rotaciones-excel' AND
  (storage.foldername(name))[1] IN (
    SELECT centro_formador_id::text FROM usuarios_centros 
    WHERE user_id = auth.uid()
  )
);

-- Política de eliminación: Centros eliminan sus archivos Excel
CREATE POLICY "Centros eliminan archivos Excel"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'rotaciones-excel' AND
  (storage.foldername(name))[1] IN (
    SELECT centro_formador_id::text FROM usuarios_centros 
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- POLÍTICAS DE STORAGE PARA documentos-centros
-- ============================================

-- Política de lectura: Centros ven sus documentos
CREATE POLICY "Centros ven sus documentos PDF"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documentos-centros' AND
  (storage.foldername(name))[1] IN (
    SELECT centro_formador_id::text FROM usuarios_centros 
    WHERE user_id = auth.uid()
  )
);

-- Política de subida: Centros suben documentos
CREATE POLICY "Centros suben documentos PDF"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documentos-centros' AND
  (storage.foldername(name))[1] IN (
    SELECT centro_formador_id::text FROM usuarios_centros 
    WHERE user_id = auth.uid()
  )
);

-- Política de eliminación: Centros eliminan sus documentos
CREATE POLICY "Centros eliminan documentos PDF"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documentos-centros' AND
  (storage.foldername(name))[1] IN (
    SELECT centro_formador_id::text FROM usuarios_centros 
    WHERE user_id = auth.uid()
  )
);

-- Verificar que los buckets se crearon correctamente
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id IN ('rotaciones-excel', 'documentos-centros');
