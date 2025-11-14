# 🎯 Sistema de Control de Cupos Disponibles

## 📋 Descripción

El sistema ahora controla los cupos disponibles para cada centro formador, evitando que soliciten más cupos de los que tienen asignados.

## ✨ Características Implementadas

### 1. Indicador Visual de Cupos
- **Tarjeta destacada** en la parte superior mostrando:
  - Cupos disponibles (número grande)
  - Cupos totales
  - Alertas visuales según disponibilidad

### 2. Validaciones Automáticas
- ✅ No permite solicitar más cupos de los disponibles
- ✅ Muestra mensaje de error si intenta exceder el límite
- ✅ Deshabilita el botón de envío si no hay cupos
- ✅ Campo de número de cupos con máximo dinámico

### 3. Alertas Visuales
- 🔴 **Sin cupos**: Alerta roja si cupos_disponibles = 0
- 🟡 **Pocos cupos**: Alerta amarilla si cupos_disponibles ≤ 5
- 🟢 **Cupos suficientes**: Sin alerta

### 4. Sistema Automático de Actualización
- Cuando una solicitud es **aprobada** → Resta cupos
- Cuando una solicitud es **rechazada/cancelada** → Libera cupos
- Historial completo de movimientos de cupos

## 🗄️ Estructura de Base de Datos

### Campos Agregados a `centros_formadores`

```sql
cupos_totales INTEGER       -- Total de cupos asignados
cupos_disponibles INTEGER   -- Cupos disponibles para solicitar
cupos_en_uso INTEGER        -- Cupos en uso (solicitudes aprobadas)
```

### Nueva Tabla: `historial_cupos`

Registra todos los movimientos de cupos:
- Asignaciones (cuando se aprueba solicitud)
- Liberaciones (cuando se rechaza/cancela)
- Ajustes manuales

## 🚀 Configuración Inicial

### Paso 1: Ejecutar SQL en Supabase

```sql
-- Copiar y ejecutar el contenido de: supabase-cupos-disponibles.sql
```

Este script:
1. Agrega campos de cupos a `centros_formadores`
2. Crea tabla `historial_cupos`
3. Crea función automática para actualizar cupos
4. Crea trigger que se ejecuta al cambiar estado de solicitud

### Paso 2: Asignar Cupos Iniciales

Después de ejecutar el script, asigna cupos a cada centro:

```sql
-- Ejemplo: Asignar 50 cupos a un centro
UPDATE centros_formadores 
SET 
  cupos_totales = 50,
  cupos_disponibles = 50,
  cupos_en_uso = 0
WHERE id = 'UUID_DEL_CENTRO';

-- O asignar a todos los centros
UPDATE centros_formadores 
SET 
  cupos_totales = 30,
  cupos_disponibles = 30,
  cupos_en_uso = 0;
```

## 📊 Flujo de Cupos

### Cuando un Centro Solicita Cupos

```
1. Centro ve sus cupos disponibles: 30
2. Solicita 10 cupos
3. Validación: 10 ≤ 30 ✅
4. Solicitud creada con estado "pendiente"
5. Cupos aún disponibles: 30 (no cambian hasta aprobar)
```

### Cuando el Admin Aprueba la Solicitud

```
1. Admin cambia estado a "aprobada"
2. Trigger automático se ejecuta:
   - cupos_en_uso: 0 → 10
   - cupos_disponibles: 30 → 20
3. Se registra en historial_cupos
4. Centro ahora ve: 20 cupos disponibles
```

### Cuando el Admin Rechaza una Solicitud Aprobada

```
1. Admin cambia estado a "rechazada"
2. Trigger automático se ejecuta:
   - cupos_en_uso: 10 → 0
   - cupos_disponibles: 20 → 30
3. Se registra en historial_cupos
4. Centro recupera sus 10 cupos
```

## 🎨 Interfaz de Usuario

### Indicador de Cupos (Tarjeta Superior)

```
┌─────────────────────────────────────┐
│  Cupos Disponibles                  │
│                                     │
│  30                                 │
│  de 50 cupos totales                │
│                                     │
│  ⚠️ Quedan pocos cupos disponibles  │ ← Si ≤ 5
└─────────────────────────────────────┘
```

### Campo de Número de Cupos

```
Número de Cupos * (Máximo: 30)
┌─────────────────────┐
│ 👥  [  10  ]        │
└─────────────────────┘

Si excede:
⚠️ Excede los cupos disponibles (30)
```

### Botón de Envío

```
Estado Normal:
[Enviar Solicitud]

Sin cupos:
[Sin Cupos Disponibles] (deshabilitado)

Excede límite:
[Enviar Solicitud] (deshabilitado)
```

## 🔍 Consultas Útiles

### Ver cupos de todos los centros

```sql
SELECT 
  nombre,
  cupos_totales,
  cupos_disponibles,
  cupos_en_uso,
  ROUND((cupos_en_uso::DECIMAL / NULLIF(cupos_totales, 0)) * 100, 2) as porcentaje_uso
FROM centros_formadores
ORDER BY cupos_disponibles ASC;
```

### Ver historial de cupos de un centro

```sql
SELECT 
  hc.*,
  sc.especialidad,
  sc.numero_cupos
FROM historial_cupos hc
LEFT JOIN solicitudes_cupos sc ON hc.solicitud_id = sc.id
WHERE hc.centro_formador_id = 'UUID_DEL_CENTRO'
ORDER BY hc.created_at DESC;
```

### Centros sin cupos disponibles

```sql
SELECT 
  nombre,
  cupos_totales,
  cupos_en_uso
FROM centros_formadores
WHERE cupos_disponibles = 0
ORDER BY nombre;
```

### Solicitudes que excederían cupos

```sql
SELECT 
  sc.*,
  cf.nombre as centro,
  cf.cupos_disponibles,
  sc.numero_cupos,
  (sc.numero_cupos - cf.cupos_disponibles) as exceso
FROM solicitudes_cupos sc
JOIN centros_formadores cf ON sc.centro_formador_id = cf.id
WHERE sc.estado = 'pendiente'
  AND sc.numero_cupos > cf.cupos_disponibles;
```

## 🛠️ Ajustes Manuales de Cupos

### Aumentar cupos totales de un centro

```sql
-- Aumentar de 50 a 80 cupos
UPDATE centros_formadores 
SET 
  cupos_totales = 80,
  cupos_disponibles = 80 - cupos_en_uso
WHERE id = 'UUID_DEL_CENTRO';

-- Registrar en historial
INSERT INTO historial_cupos (
  centro_formador_id,
  tipo_movimiento,
  cantidad,
  cupos_antes,
  cupos_despues,
  motivo
)
VALUES (
  'UUID_DEL_CENTRO',
  'ajuste',
  30,
  50,
  80,
  'Aumento de cupos por convenio'
);
```

### Liberar cupos manualmente

```sql
-- Si una solicitud terminó y quieres liberar cupos
UPDATE centros_formadores 
SET 
  cupos_en_uso = cupos_en_uso - 10,
  cupos_disponibles = cupos_disponibles + 10
WHERE id = 'UUID_DEL_CENTRO';
```

## 📈 Dashboard de Cupos (Futuro)

Ideas para implementar:

1. **Gráfico de uso de cupos**
   - Barra de progreso visual
   - Porcentaje de uso

2. **Proyección de cupos**
   - Cuándo se liberarán cupos (según fechas de término)
   - Solicitudes pendientes que consumirían cupos

3. **Alertas automáticas**
   - Email cuando quedan pocos cupos
   - Notificación cuando se liberan cupos

4. **Historial visual**
   - Timeline de movimientos de cupos
   - Gráfico de uso en el tiempo

## 🧪 Pruebas

### Test 1: Solicitar dentro del límite
```
1. Centro tiene 30 cupos disponibles
2. Solicita 10 cupos
3. ✅ Solicitud se crea correctamente
4. Admin aprueba
5. ✅ Cupos disponibles: 30 → 20
```

### Test 2: Intentar exceder límite
```
1. Centro tiene 5 cupos disponibles
2. Intenta solicitar 10 cupos
3. ❌ Error: "No puedes solicitar más cupos..."
4. ✅ Solicitud no se crea
```

### Test 3: Sin cupos disponibles
```
1. Centro tiene 0 cupos disponibles
2. ✅ Campo de número deshabilitado
3. ✅ Botón "Sin Cupos Disponibles" deshabilitado
4. ✅ Alerta roja visible
```

### Test 4: Liberar cupos al rechazar
```
1. Solicitud aprobada con 10 cupos
2. Cupos disponibles: 20
3. Admin rechaza la solicitud
4. ✅ Cupos disponibles: 20 → 30
```

## 🔐 Seguridad

- ✅ Validación en frontend (UX)
- ✅ Validación en backend (antes de insertar)
- ✅ Trigger automático (consistencia de datos)
- ✅ RLS en historial_cupos (solo ven su historial)

## 💡 Tips

1. **Asignar cupos realistas**: Considera la capacidad real del centro
2. **Revisar periódicamente**: Ajustar cupos según demanda
3. **Monitorear historial**: Detectar patrones de uso
4. **Comunicar cambios**: Avisar a centros cuando se ajustan cupos

## 🆘 Troubleshooting

### Los cupos no se actualizan al aprobar
- Verificar que el trigger esté creado
- Revisar logs de Supabase
- Ejecutar manualmente la función

### Cupos negativos
- Ejecutar: `UPDATE centros_formadores SET cupos_disponibles = GREATEST(0, cupos_disponibles)`
- Revisar historial para encontrar causa

### Centro no ve sus cupos
- Verificar que `cupos_totales` y `cupos_disponibles` no sean NULL
- Asignar valores iniciales si es necesario
