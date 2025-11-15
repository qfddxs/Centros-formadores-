# ✅ Solución: Dashboard - Mostrar Pendientes y Rechazadas

## Cambios Realizados

### 1. Corrección del Campo de Motivo de Rechazo
**Archivo**: `src/pages/Dashboard.jsx`

Se corrigió el campo usado para mostrar el motivo de rechazo:
- ❌ **Antes**: `solicitud.observaciones`
- ✅ **Ahora**: `solicitud.motivo_rechazo`

### 2. Mejora de Logs de Depuración
Se agregaron logs detallados en la consola para facilitar la depuración:
- ✅ Usuario autenticado
- ✅ Centro encontrado
- ✅ Solicitudes obtenidas
- 📊 Desglose por estado (pendientes, aprobadas, rechazadas)
- 📋 Datos completos de solicitudes

## Cómo Verificar que Funciona

### Paso 1: Abrir la Consola del Navegador
1. Abre el Dashboard en tu navegador
2. Presiona `F12` para abrir las DevTools
3. Ve a la pestaña **Console**

### Paso 2: Verificar los Logs
Deberías ver mensajes como:
```
✅ Usuario autenticado: [tu-user-id]
✅ Centro encontrado: [datos-del-centro]
✅ Solicitudes obtenidas: 5
📊 Desglose por estado: {pendientes: 2, aprobadas: 1, rechazadas: 2}
📋 Datos completos: [array de solicitudes]
```

### Paso 3: Verificar la Visualización
El Dashboard debe mostrar:

1. **Tarjetas de Estadísticas** (parte superior):
   - Total Solicitudes
   - Pendientes (amarillo) 🟡
   - Aprobadas (verde) 🟢
   - Rechazadas (rojo) 🔴

2. **Sección "Solicitudes Pendientes"** (si hay pendientes):
   - Título con contador
   - Lista de hasta 5 solicitudes pendientes
   - Botón "Ver todas" si hay más de 5

3. **Sección "Solicitudes Rechazadas"** (si hay rechazadas):
   - Título con contador
   - Lista de hasta 5 solicitudes rechazadas
   - **Motivo de rechazo** en cada solicitud
   - Botón "Ver todas" si hay más de 5

4. **Sección "Actividad Reciente"**:
   - Últimas 5 solicitudes de cualquier estado

## Si No Ves Solicitudes

### Opción A: Verificar en Supabase
1. Ve a tu proyecto en Supabase
2. Abre el **SQL Editor**
3. Ejecuta:
```sql
SELECT 
  id,
  especialidad,
  numero_cupos,
  estado,
  fecha_inicio,
  motivo_rechazo,
  created_at
FROM solicitudes_cupos
ORDER BY created_at DESC;
```

### Opción B: Insertar Datos de Prueba
Si no hay datos, ejecuta el archivo `test-solicitudes-data.sql` en Supabase SQL Editor.

**IMPORTANTE**: Antes de ejecutar, verifica que tengas un centro formador:
```sql
SELECT id, nombre, codigo FROM centros_formadores;
```

### Opción C: Verificar Vinculación Usuario-Centro
```sql
SELECT 
  uc.id,
  uc.user_id,
  uc.centro_formador_id,
  cf.nombre as centro_nombre
FROM usuarios_centros uc
JOIN centros_formadores cf ON cf.id = uc.centro_formador_id
WHERE uc.user_id = auth.uid();
```

## Estructura de la Base de Datos

La tabla `solicitudes_cupos` tiene estos campos importantes:
- `id`: UUID
- `centro_formador_id`: UUID (referencia al centro)
- `especialidad`: VARCHAR(100)
- `numero_cupos`: INTEGER
- `estado`: VARCHAR(20) - Valores: 'pendiente', 'aprobada', 'rechazada'
- `motivo_rechazo`: TEXT - Se muestra cuando estado = 'rechazada'
- `fecha_inicio`: DATE
- `fecha_termino`: DATE
- `created_at`: TIMESTAMP

## Código Relevante

### Filtrado de Solicitudes
```javascript
const estadisticas = {
  total: solicitudes.length,
  pendientes: solicitudes.filter(s => s.estado === 'pendiente').length,
  aprobadas: solicitudes.filter(s => s.estado === 'aprobada').length,
  rechazadas: solicitudes.filter(s => s.estado === 'rechazada').length
};
```

### Renderizado Condicional
```javascript
{/* Solo se muestra si hay solicitudes pendientes */}
{solicitudes.filter(s => s.estado === 'pendiente').length > 0 && (
  <motion.div>
    {/* Contenido de pendientes */}
  </motion.div>
)}

{/* Solo se muestra si hay solicitudes rechazadas */}
{solicitudes.filter(s => s.estado === 'rechazada').length > 0 && (
  <motion.div>
    {/* Contenido de rechazadas */}
  </motion.div>
)}
```

## Solución de Problemas

### Problema: No se muestran las secciones
**Causa**: No hay solicitudes con ese estado en la base de datos
**Solución**: Insertar datos de prueba o crear solicitudes reales

### Problema: Los contadores muestran 0
**Causa**: Las solicitudes no están vinculadas al centro correcto
**Solución**: Verificar que `centro_formador_id` coincida con tu centro

### Problema: No se muestra el motivo de rechazo
**Causa**: El campo `motivo_rechazo` está vacío o NULL
**Solución**: Actualizar las solicitudes rechazadas:
```sql
UPDATE solicitudes_cupos
SET motivo_rechazo = 'Motivo de rechazo aquí'
WHERE estado = 'rechazada' AND motivo_rechazo IS NULL;
```

### Problema: Error de permisos (RLS)
**Causa**: Las políticas RLS no permiten ver las solicitudes
**Solución**: Verificar políticas en Supabase:
```sql
SELECT * FROM pg_policies WHERE tablename = 'solicitudes_cupos';
```

## Próximos Pasos

1. ✅ Recargar el Dashboard
2. ✅ Verificar los logs en la consola
3. ✅ Confirmar que se muestran las secciones correctas
4. ✅ Verificar que los contadores sean correctos
5. ✅ Confirmar que se muestra el motivo de rechazo

## Archivos Modificados

- ✅ `src/pages/Dashboard.jsx` - Corrección del campo y mejora de logs
- ✅ `test-solicitudes-data.sql` - Script para insertar datos de prueba
- ✅ `VERIFICAR-SOLICITUDES-DASHBOARD.md` - Guía de verificación detallada

## Resultado Esperado

El Dashboard debe mostrar:
- ✅ Estadísticas correctas en las tarjetas superiores
- ✅ Sección de pendientes (si existen)
- ✅ Sección de rechazadas con motivo (si existen)
- ✅ Actividad reciente con todas las solicitudes
- ✅ Animaciones suaves al cargar
- ✅ Modo oscuro funcionando correctamente

---

**Nota**: Si después de seguir estos pasos el problema persiste, revisa los logs de la consola y comparte el mensaje de error específico.
