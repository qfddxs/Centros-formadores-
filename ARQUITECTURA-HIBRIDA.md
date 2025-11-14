# 🏗️ Arquitectura del Sistema Híbrido

## 📐 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                    CENTRO FORMADOR                              │
│                                                                 │
│  1. Selecciona archivo Excel con estudiantes                   │
│  2. El navegador parsea el archivo (sin subir aún)            │
│  3. Vista previa de estudiantes encontrados                    │
│  4. Completa formulario y envía                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PROCESAMIENTO                                │
│                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐                 │
│  │  Archivo Excel   │    │  Datos Parseados │                 │
│  │  (Original)      │    │  (JSON)          │                 │
│  └────────┬─────────┘    └────────┬─────────┘                 │
│           │                       │                            │
│           ▼                       ▼                            │
│  ┌──────────────────┐    ┌──────────────────┐                 │
│  │ Supabase Storage │    │ Supabase DB      │                 │
│  │ rotaciones-excel │    │ Tablas           │                 │
│  └──────────────────┘    └──────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BASE DE DATOS                                │
│                                                                 │
│  ┌────────────────────────────────────────────┐                │
│  │  solicitudes_rotacion                      │                │
│  ├────────────────────────────────────────────┤                │
│  │ • id                                       │                │
│  │ • centro_formador_id                       │                │
│  │ • especialidad                             │                │
│  │ • fecha_inicio / fecha_termino             │                │
│  │ • archivo_excel_url  ← URL del Excel       │                │
│  │ • archivo_excel_nombre                     │                │
│  │ • estado (pendiente/aprobada/rechazada)    │                │
│  └────────────────────────────────────────────┘                │
│                       │                                         │
│                       │ 1:N                                     │
│                       ▼                                         │
│  ┌────────────────────────────────────────────┐                │
│  │  estudiantes_rotacion                      │                │
│  ├────────────────────────────────────────────┤                │
│  │ • id                                       │                │
│  │ • solicitud_rotacion_id (FK)               │                │
│  │ • rut                                      │                │
│  │ • nombre                                   │                │
│  │ • apellido                                 │                │
│  │ • email                                    │                │
│  │ • telefono                                 │                │
│  │ • fecha_nacimiento                         │                │
│  │ • carrera                                  │                │
│  │ • nivel_academico                          │                │
│  └────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Datos Completo

### 1️⃣ Carga del Archivo (Cliente)

```javascript
// Usuario selecciona archivo
<input type="file" onChange={handleFileChange} />

// Se parsea en el navegador
const resultado = await parseExcelEstudiantes(file);
// → { estudiantes: [...], total: 10 }

// Vista previa inmediata
setEstudiantesParsed(resultado);
```

**Ventajas:**
- ✅ Validación instantánea
- ✅ No consume ancho de banda hasta confirmar
- ✅ Usuario ve errores antes de enviar

### 2️⃣ Envío del Formulario (Cliente → Servidor)

```javascript
// 1. Subir archivo Excel a Storage
const archivoData = await subirArchivoExcel(file, centroId);
// → { url: "https://...", path: "...", nombre: "..." }

// 2. Crear solicitud con referencia al archivo
const solicitud = await supabase
  .from('solicitudes_rotacion')
  .insert({
    archivo_excel_url: archivoData.url,
    archivo_excel_nombre: archivoData.nombre,
    // ... otros campos
  });

// 3. Guardar estudiantes parseados
const estudiantes = estudiantesParsed.estudiantes.map(est => ({
  solicitud_rotacion_id: solicitud.id,
  ...est
}));

await supabase
  .from('estudiantes_rotacion')
  .insert(estudiantes);
```

### 3️⃣ Consultas (Admin/Centro)

```javascript
// Ver solicitud con estudiantes
const { data } = await supabase
  .from('solicitudes_rotacion')
  .select(`
    *,
    estudiantes:estudiantes_rotacion(*)
  `)
  .eq('id', solicitudId)
  .single();

// Resultado:
{
  id: "uuid",
  especialidad: "Enfermería",
  archivo_excel_url: "https://...",
  estudiantes: [
    { rut: "12345678-9", nombre: "Juan", ... },
    { rut: "98765432-1", nombre: "María", ... }
  ]
}
```

## 🗂️ Estructura de Storage

```
rotaciones-excel/
├── {centro_formador_id}/
│   ├── 1234567890_estudiantes_enfermeria.xlsx
│   ├── 1234567891_estudiantes_medicina.xlsx
│   └── ...

documentos-centros/
├── {centro_formador_id}/
│   ├── certificado_vacunacion/
│   │   ├── 1234567890_vacunas_2025.pdf
│   │   └── ...
│   ├── seguro_medico/
│   │   └── ...
│   └── otro/
│       └── ...
```

## 🔐 Seguridad (RLS)

### Políticas de Base de Datos

```sql
-- Los centros solo ven sus propias solicitudes
CREATE POLICY "Centros ven sus solicitudes"
  ON solicitudes_rotacion FOR SELECT
  USING (
    centro_formador_id IN (
      SELECT centro_formador_id FROM usuarios_centros 
      WHERE user_id = auth.uid()
    )
  );

-- Los centros solo ven estudiantes de sus solicitudes
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
```

### Políticas de Storage

```sql
-- Los centros solo acceden a sus archivos
CREATE POLICY "Centros ven sus archivos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'rotaciones-excel' AND
  (storage.foldername(name))[1] = centro_formador_id::text
);
```

## 📊 Ventajas del Sistema Híbrido

### ✅ Para el Centro Formador

1. **Validación Inmediata**
   - Ve errores antes de enviar
   - Puede corregir el Excel y volver a intentar

2. **Vista Previa**
   - Confirma que los datos se leyeron correctamente
   - Ve cuántos estudiantes se procesaron

3. **Facilidad de Uso**
   - Usa Excel (herramienta familiar)
   - No necesita llenar formularios uno por uno

### ✅ Para el Administrador

1. **Archivo Original**
   - Puede descargar el Excel original
   - Útil para auditorías o respaldos

2. **Datos Estructurados**
   - Búsquedas rápidas por RUT, nombre, etc.
   - Reportes y estadísticas fáciles

3. **Validación de Datos**
   - Los datos ya están normalizados
   - RUTs formateados correctamente

### ✅ Para el Sistema

1. **Performance**
   - Consultas SQL rápidas
   - Índices en campos clave

2. **Escalabilidad**
   - Storage separado de la BD
   - Archivos grandes no afectan queries

3. **Flexibilidad**
   - Fácil agregar campos nuevos
   - Cambios en estructura no afectan archivos existentes

## 🔍 Casos de Uso

### Caso 1: Centro sube solicitud

```
1. Centro selecciona Excel con 50 estudiantes
2. Sistema parsea y muestra: "50 estudiantes encontrados"
3. Centro revisa vista previa
4. Centro envía formulario
5. Sistema guarda:
   - 1 archivo Excel en Storage
   - 1 registro en solicitudes_rotacion
   - 50 registros en estudiantes_rotacion
```

### Caso 2: Admin revisa solicitud

```
1. Admin ve lista de solicitudes pendientes
2. Admin abre solicitud específica
3. Admin ve:
   - Datos de la solicitud
   - Lista de 50 estudiantes (desde BD)
   - Botón para descargar Excel original
4. Admin aprueba/rechaza
```

### Caso 3: Búsqueda de estudiante

```sql
-- Buscar estudiante por RUT
SELECT 
  e.*,
  s.especialidad,
  s.fecha_inicio,
  c.nombre as centro
FROM estudiantes_rotacion e
JOIN solicitudes_rotacion s ON e.solicitud_rotacion_id = s.id
JOIN centros_formadores c ON s.centro_formador_id = c.id
WHERE e.rut = '12345678-9';

-- Resultado en milisegundos (gracias a índices)
```

### Caso 4: Reporte de rotaciones

```sql
-- Estudiantes por especialidad
SELECT 
  s.especialidad,
  COUNT(e.id) as total_estudiantes,
  COUNT(DISTINCT s.centro_formador_id) as total_centros
FROM solicitudes_rotacion s
LEFT JOIN estudiantes_rotacion e ON s.id = e.solicitud_rotacion_id
WHERE s.estado = 'aprobada'
GROUP BY s.especialidad
ORDER BY total_estudiantes DESC;
```

## 🚀 Optimizaciones

### Índices Creados

```sql
-- Búsquedas por centro
CREATE INDEX idx_solicitudes_rotacion_centro 
  ON solicitudes_rotacion(centro_formador_id);

-- Búsquedas por estado
CREATE INDEX idx_solicitudes_rotacion_estado 
  ON solicitudes_rotacion(estado);

-- Búsquedas por RUT
CREATE INDEX idx_estudiantes_rotacion_rut 
  ON estudiantes_rotacion(rut);

-- Join con solicitudes
CREATE INDEX idx_estudiantes_rotacion_solicitud 
  ON estudiantes_rotacion(solicitud_rotacion_id);
```

### Caching

```javascript
// Los archivos en Storage tienen cache de 1 hora
const { data } = await supabase.storage
  .from('rotaciones-excel')
  .upload(fileName, file, {
    cacheControl: '3600'  // 1 hora
  });
```

## 📈 Métricas y Monitoreo

### Queries Útiles

```sql
-- Total de solicitudes por estado
SELECT estado, COUNT(*) 
FROM solicitudes_rotacion 
GROUP BY estado;

-- Promedio de estudiantes por solicitud
SELECT AVG(estudiantes_count) 
FROM (
  SELECT COUNT(e.id) as estudiantes_count
  FROM solicitudes_rotacion s
  LEFT JOIN estudiantes_rotacion e ON s.id = e.solicitud_rotacion_id
  GROUP BY s.id
) subquery;

-- Tamaño total de archivos en Storage
SELECT 
  SUM(tamaño_bytes) / 1024 / 1024 as total_mb
FROM documentos_centro;
```

## 🔮 Futuras Mejoras

1. **Validación de RUT en tiempo real**
   - Verificar dígito verificador
   - Alertar si RUT ya existe

2. **Importación incremental**
   - Agregar estudiantes a solicitud existente
   - Actualizar datos de estudiantes

3. **Exportación a Excel**
   - Generar Excel desde datos de BD
   - Útil para reportes

4. **Notificaciones**
   - Email cuando solicitud es aprobada
   - Notificar si hay errores en el Excel

5. **Historial de cambios**
   - Auditoría de modificaciones
   - Ver quién modificó qué y cuándo
