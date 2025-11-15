# Verificación y Solución - Dashboard de Solicitudes

## Problema
El Dashboard no muestra las solicitudes pendientes y rechazadas correctamente.

## Solución Implementada

### 1. Corrección del Campo de Motivo de Rechazo
Se corrigió el campo usado para mostrar el motivo de rechazo en el Dashboard:
- **Antes**: `solicitud.observaciones`
- **Ahora**: `solicitud.motivo_rechazo`

Este campo coincide con la estructura de la base de datos definida en `supabase/00-schema-completo.sql`.

### 2. Verificación de la Estructura

El Dashboard ya tiene implementada la lógica correcta para:
- ✅ Filtrar solicitudes por estado (pendiente, aprobada, rechazada)
- ✅ Mostrar contadores animados para cada estado
- ✅ Mostrar secciones separadas para pendientes y rechazadas
- ✅ Mostrar el motivo de rechazo cuando existe

## Pasos para Verificar

### 1. Verificar que existan datos en la base de datos

Ejecuta en Supabase SQL Editor:

```sql
-- Ver todas las solicitudes
SELECT 
  id,
  especialidad,
  numero_cupos,
  estado,
  fecha_inicio,
  fecha_termino,
  motivo_rechazo,
  created_at
FROM solicitudes_cupos
ORDER BY created_at DESC;

-- Ver conteo por estado
SELECT 
  estado,
  COUNT(*) as cantidad
FROM solicitudes_cupos
GROUP BY estado;
```

### 2. Si no hay datos, insertar datos de prueba

Ejecuta el archivo `test-solicitudes-data.sql` en Supabase SQL Editor.

**IMPORTANTE**: Antes de ejecutar, verifica que tengas un centro formador creado:

```sql
-- Ver centros formadores disponibles
SELECT id, nombre, codigo FROM centros_formadores;
```

Si no tienes centros, crea uno primero:

```sql
INSERT INTO centros_formadores (nombre, codigo, nivel_formacion)
VALUES ('Universidad de Prueba', 'UP001', 'pregrado');
```

### 3. Verificar las políticas RLS

Las políticas RLS deben permitir que los centros vean sus propias solicitudes:

```sql
-- Verificar políticas activas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'solicitudes_cupos';
```

### 4. Verificar la vinculación usuario-centro

Asegúrate de que tu usuario esté vinculado a un centro formador:

```sql
-- Ver tu vinculación (reemplaza 'TU_USER_ID' con tu ID de usuario)
SELECT 
  uc.id,
  uc.user_id,
  uc.centro_formador_id,
  cf.nombre as centro_nombre,
  cf.codigo as centro_codigo
FROM usuarios_centros uc
JOIN centros_formadores cf ON cf.id = uc.centro_formador_id
WHERE uc.user_id = auth.uid();
```

### 5. Verificar en el navegador

1. Abre las DevTools del navegador (F12)
2. Ve a la pestaña Console
3. Busca mensajes de error o advertencias
4. Verifica que la consulta a Supabase se esté ejecutando correctamente

## Estructura del Dashboard

El Dashboard muestra:

1. **Estadísticas en tarjetas**:
   - Total de solicitudes
   - Pendientes (amarillo)
   - Aprobadas (verde)
   - Rechazadas (rojo)

2. **Sección de Solicitudes Pendientes**:
   - Solo se muestra si hay solicitudes pendientes
   - Muestra hasta 5 solicitudes
   - Botón para ver todas si hay más de 5

3. **Sección de Solicitudes Rechazadas**:
   - Solo se muestra si hay solicitudes rechazadas
   - Muestra hasta 5 solicitudes
   - Incluye el motivo de rechazo
   - Botón para ver todas si hay más de 5

4. **Actividad Reciente**:
   - Muestra las últimas 5 solicitudes de cualquier estado

## Código Relevante

### Filtrado de solicitudes:
```javascript
const estadisticas = {
  total: solicitudes.length,
  pendientes: solicitudes.filter(s => s.estado === 'pendiente').length,
  aprobadas: solicitudes.filter(s => s.estado === 'aprobada').length,
  rechazadas: solicitudes.filter(s => s.estado === 'rechazada').length
};
```

### Consulta a Supabase:
```javascript
const { data: solicitudesData, error: solicitudesError } = await supabase
  .from('solicitudes_cupos')
  .select('*')
  .eq('centro_formador_id', centroData.centro_formador_id)
  .order('created_at', { ascending: false });
```

## Solución de Problemas Comunes

### Problema: No se muestran solicitudes
**Causa**: No hay datos en la base de datos o el usuario no está vinculado a un centro
**Solución**: Ejecutar el script de datos de prueba y verificar la vinculación

### Problema: Las solicitudes no se filtran correctamente
**Causa**: El campo `estado` tiene valores diferentes a 'pendiente', 'aprobada', 'rechazada'
**Solución**: Verificar los valores en la base de datos y corregirlos

### Problema: No se muestra el motivo de rechazo
**Causa**: El campo `motivo_rechazo` está vacío o NULL
**Solución**: Actualizar las solicitudes rechazadas con un motivo

```sql
UPDATE solicitudes_cupos
SET motivo_rechazo = 'Motivo de rechazo aquí'
WHERE estado = 'rechazada' AND motivo_rechazo IS NULL;
```

## Próximos Pasos

1. Ejecutar las verificaciones en orden
2. Insertar datos de prueba si es necesario
3. Verificar que el Dashboard muestre correctamente las solicitudes
4. Si persiste el problema, revisar los logs del navegador y de Supabase

## Contacto

Si el problema persiste después de seguir estos pasos, verifica:
- La configuración de Supabase en `.env`
- Las políticas RLS en Supabase Dashboard
- Los logs de errores en la consola del navegador
