# Configuración de Supabase - Sistema Híbrido de Rotaciones

## 📋 Pasos para configurar Supabase

### 1. Ejecutar las migraciones SQL

Ve al **SQL Editor** en tu dashboard de Supabase y ejecuta el archivo `supabase-migrations.sql` que contiene:

- Tabla `solicitudes_rotacion` - Solicitudes con referencia al archivo Excel
- Tabla `estudiantes_rotacion` - Datos parseados de estudiantes
- Tabla `documentos_centro` - Gestión documental (PDFs)
- Políticas RLS (Row Level Security)
- Índices para optimización

### 2. Crear los Storage Buckets

En la sección **Storage** de Supabase, crea dos buckets:

#### Bucket 1: `rotaciones-excel`
```
Nombre: rotaciones-excel
Público: Sí (para que los admins puedan descargar)
Tamaño máximo: 5MB
Tipos permitidos: .xls, .xlsx
```

**Políticas de Storage:**
```sql
-- Política de lectura
CREATE POLICY "Centros ven sus archivos Excel"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'rotaciones-excel' AND
  (storage.foldername(name))[1] IN (
    SELECT centro_formador_id::text FROM usuarios_centros 
    WHERE user_id = auth.uid()
  )
);

-- Política de subida
CREATE POLICY "Centros suben archivos Excel"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'rotaciones-excel' AND
  (storage.foldername(name))[1] IN (
    SELECT centro_formador_id::text FROM usuarios_centros 
    WHERE user_id = auth.uid()
  )
);
```

#### Bucket 2: `documentos-centros`
```
Nombre: documentos-centros
Público: Sí
Tamaño máximo: 10MB
Tipos permitidos: .pdf
```

**Políticas de Storage:**
```sql
-- Política de lectura
CREATE POLICY "Centros ven sus documentos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documentos-centros' AND
  (storage.foldername(name))[1] IN (
    SELECT centro_formador_id::text FROM usuarios_centros 
    WHERE user_id = auth.uid()
  )
);

-- Política de subida
CREATE POLICY "Centros suben documentos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documentos-centros' AND
  (storage.foldername(name))[1] IN (
    SELECT centro_formador_id::text FROM usuarios_centros 
    WHERE user_id = auth.uid()
  )
);

-- Política de eliminación
CREATE POLICY "Centros eliminan sus documentos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documentos-centros' AND
  (storage.foldername(name))[1] IN (
    SELECT centro_formador_id::text FROM usuarios_centros 
    WHERE user_id = auth.uid()
  )
);
```

### 3. Verificar las políticas RLS

Asegúrate de que las tablas tengan RLS habilitado:

```sql
-- Verificar que RLS esté habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('solicitudes_rotacion', 'estudiantes_rotacion', 'documentos_centro');
```

## 🔄 Flujo del Sistema Híbrido

### Cuando un centro sube una solicitud de rotación:

1. **Usuario selecciona archivo Excel** → El archivo se parsea en el navegador
2. **Vista previa de estudiantes** → Se muestra cuántos estudiantes se encontraron
3. **Al enviar el formulario:**
   - ✅ Archivo Excel se sube a `rotaciones-excel` bucket
   - ✅ Se crea registro en `solicitudes_rotacion` con URL del Excel
   - ✅ Datos parseados se guardan en `estudiantes_rotacion`

### Ventajas de este enfoque:

- 📄 **Archivo original preservado** - El admin puede descargar el Excel original
- 🔍 **Datos estructurados** - Búsquedas y consultas rápidas en la BD
- ✅ **Validación en tiempo real** - El usuario ve si hay errores antes de enviar
- 📊 **Reportes fáciles** - Puedes hacer queries SQL sobre los estudiantes

## 📝 Estructura esperada del Excel

El parser espera las siguientes columnas (en orden):

| Columna | Campo | Obligatorio | Ejemplo |
|---------|-------|-------------|---------|
| A | RUT | ✅ | 12345678-9 |
| B | Nombre | ✅ | Juan |
| C | Apellido | ✅ | Pérez |
| D | Email | ❌ | juan.perez@ejemplo.cl |
| E | Teléfono | ❌ | +56912345678 |
| F | Fecha Nacimiento | ❌ | 15/03/2000 |
| G | Carrera | ❌ | Enfermería |
| H | Nivel Académico | ❌ | 4to año |

**Nota:** La primera fila puede ser encabezados (se detecta automáticamente)

## 🧪 Probar el sistema

1. Descarga la plantilla Excel desde el botón en la interfaz
2. Llena los datos de estudiantes
3. Sube el archivo en "Solicitud de Rotación"
4. Verifica que aparezca la vista previa
5. Envía la solicitud
6. Verifica en Supabase:
   - Tabla `solicitudes_rotacion` debe tener el registro
   - Tabla `estudiantes_rotacion` debe tener los estudiantes
   - Bucket `rotaciones-excel` debe tener el archivo

## 🔧 Troubleshooting

### Error: "No se pudo subir el archivo"
- Verifica que los buckets existan
- Verifica que las políticas de Storage estén configuradas
- Revisa la consola del navegador para más detalles

### Error: "No se encontraron estudiantes válidos"
- Verifica que el Excel tenga datos en las columnas A, B, C
- Asegúrate de que no todas las filas estén vacías
- Revisa que el formato sea .xls o .xlsx

### Los estudiantes no se guardan
- Verifica que la tabla `estudiantes_rotacion` exista
- Revisa las políticas RLS de la tabla
- Verifica que `solicitud_rotacion_id` sea válido

## 📚 Queries útiles

### Ver solicitudes con conteo de estudiantes
```sql
SELECT 
  sr.*,
  COUNT(er.id) as total_estudiantes
FROM solicitudes_rotacion sr
LEFT JOIN estudiantes_rotacion er ON sr.id = er.solicitud_rotacion_id
GROUP BY sr.id
ORDER BY sr.created_at DESC;
```

### Buscar estudiantes por RUT
```sql
SELECT 
  er.*,
  sr.especialidad,
  sr.fecha_inicio,
  cf.nombre as centro
FROM estudiantes_rotacion er
JOIN solicitudes_rotacion sr ON er.solicitud_rotacion_id = sr.id
JOIN centros_formadores cf ON sr.centro_formador_id = cf.id
WHERE er.rut = '12345678-9';
```

### Ver documentos por centro
```sql
SELECT 
  dc.*,
  cf.nombre as centro
FROM documentos_centro dc
JOIN centros_formadores cf ON dc.centro_formador_id = cf.id
ORDER BY dc.fecha_subida DESC;
```
