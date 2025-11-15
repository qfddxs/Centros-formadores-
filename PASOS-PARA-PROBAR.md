# 🚀 Pasos para Probar el Dashboard

## El Problema Actual

Ves el error **403 Forbidden** porque no hay una sesión activa. Necesitas crear un usuario y datos de prueba.

## Solución en 5 Pasos

### Paso 1: Crear Usuario en Supabase

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Click en **Authentication** (menú izquierdo)
3. Click en **Users**
4. Click en **Add user** (botón verde)
5. Ingresa:
   - Email: `test@universidad.cl`
   - Password: `Test123456!`
6. Click en **Create user**
7. **IMPORTANTE**: Copia el `user_id` (UUID) que aparece en la lista

### Paso 2: Crear Centro Formador

1. En Supabase, ve a **SQL Editor**
2. Click en **New query**
3. Copia y pega:

```sql
INSERT INTO centros_formadores (
  nombre, 
  codigo, 
  nivel_formacion,
  email
)
VALUES (
  'Universidad de Prueba',
  'UP001',
  'pregrado',
  'contacto@universidad.cl'
)
RETURNING id, nombre, codigo;
```

4. Click en **Run**
5. **IMPORTANTE**: Copia el `id` que aparece en el resultado

### Paso 3: Vincular Usuario con Centro

1. En el mismo SQL Editor, crea una nueva query
2. Reemplaza `TU_USER_ID` y `ID_DEL_CENTRO` con los valores copiados:

```sql
INSERT INTO usuarios_centros (user_id, centro_formador_id, rol)
VALUES (
  'TU_USER_ID',      -- Pegar el user_id del Paso 1
  'ID_DEL_CENTRO',   -- Pegar el id del Paso 2
  'centro_formador'
);
```

3. Click en **Run**

### Paso 4: Insertar Solicitudes de Prueba

1. En el SQL Editor, crea una nueva query
2. Reemplaza `ID_DEL_CENTRO` (5 veces) con el id del Paso 2:

```sql
-- Pendiente 1
INSERT INTO solicitudes_cupos (
  centro_formador_id, especialidad, numero_cupos,
  fecha_inicio, fecha_termino, solicitante, estado
) VALUES (
  'ID_DEL_CENTRO', 'Enfermería', 5,
  '2025-01-15', '2025-03-15', 'Juan Pérez', 'pendiente'
);

-- Pendiente 2
INSERT INTO solicitudes_cupos (
  centro_formador_id, especialidad, numero_cupos,
  fecha_inicio, fecha_termino, solicitante, estado
) VALUES (
  'ID_DEL_CENTRO', 'Cirugía', 4,
  '2025-02-15', '2025-04-15', 'María González', 'pendiente'
);

-- Aprobada
INSERT INTO solicitudes_cupos (
  centro_formador_id, especialidad, numero_cupos,
  fecha_inicio, fecha_termino, solicitante, estado
) VALUES (
  'ID_DEL_CENTRO', 'Medicina Interna', 3,
  '2025-02-01', '2025-04-01', 'Carlos Rodríguez', 'aprobada'
);

-- Rechazada 1
INSERT INTO solicitudes_cupos (
  centro_formador_id, especialidad, numero_cupos,
  fecha_inicio, fecha_termino, solicitante, estado, motivo_rechazo
) VALUES (
  'ID_DEL_CENTRO', 'Pediatría', 8,
  '2025-01-20', '2025-03-20', 'Ana Martínez', 'rechazada',
  'No hay cupos disponibles para el período solicitado'
);

-- Rechazada 2
INSERT INTO solicitudes_cupos (
  centro_formador_id, especialidad, numero_cupos,
  fecha_inicio, fecha_termino, solicitante, estado, motivo_rechazo
) VALUES (
  'ID_DEL_CENTRO', 'Ginecología', 6,
  '2025-01-10', '2025-03-10', 'Pedro Sánchez', 'rechazada',
  'El servicio no cuenta con capacidad para recibir más estudiantes'
);
```

3. Click en **Run**

### Paso 5: Iniciar Sesión en la Aplicación

1. Asegúrate de que la aplicación esté corriendo:
   ```bash
   cd Centros-formadores-
   npm run dev
   ```

2. Abre el navegador en: `http://localhost:5173/login`

3. Ingresa las credenciales:
   - Email: `test@universidad.cl`
   - Password: `Test123456!`

4. Click en **Ingresar al Portal**

5. Serás redirigido al Dashboard

## Resultado Esperado

El Dashboard debe mostrar:

```
┌─────────────────────────────────────────────────────────┐
│  Total: 5  │  Pendientes: 2  │  Aprobadas: 1  │  Rechazadas: 2  │
└─────────────────────────────────────────────────────────┘

📋 Solicitudes Pendientes (2)
   🟡 Enfermería - 5 cupos
   🟡 Cirugía - 4 cupos

📋 Solicitudes Rechazadas (2)
   🔴 Pediatría - 8 cupos
      Motivo: No hay cupos disponibles...
   🔴 Ginecología - 6 cupos
      Motivo: El servicio no cuenta con capacidad...

📋 Actividad Reciente
   [Últimas 5 solicitudes]
```

## Verificación en la Consola

Abre las DevTools (F12) y busca estos mensajes:

```
✅ Usuario autenticado: [tu-user-id]
✅ Centro encontrado: [datos-del-centro]
✅ Solicitudes obtenidas: 5
📊 Desglose por estado: {pendientes: 2, aprobadas: 1, rechazadas: 2}
```

## Script de Verificación Rápida

Si quieres verificar que todo esté bien antes de iniciar sesión:

```sql
-- Ver si el centro existe
SELECT id, nombre, codigo FROM centros_formadores WHERE codigo = 'UP001';

-- Ver si la vinculación existe
SELECT 
  uc.user_id,
  cf.nombre
FROM usuarios_centros uc
JOIN centros_formadores cf ON cf.id = uc.centro_formador_id
WHERE cf.codigo = 'UP001';

-- Ver conteo de solicitudes
SELECT 
  estado,
  COUNT(*) as cantidad
FROM solicitudes_cupos
WHERE centro_formador_id = (SELECT id FROM centros_formadores WHERE codigo = 'UP001')
GROUP BY estado;
```

Deberías ver:
- ✅ 1 centro: Universidad de Prueba
- ✅ 1 vinculación
- ✅ pendiente: 2
- ✅ aprobada: 1
- ✅ rechazada: 2

## Problemas Comunes

### "No tienes permisos para acceder"
- **Causa**: No ejecutaste el Paso 3 (vincular usuario con centro)
- **Solución**: Ejecuta el query del Paso 3

### "No se encontró tu centro formador"
- **Causa**: El user_id no coincide o no existe la vinculación
- **Solución**: Verifica que el user_id sea correcto en el Paso 3

### Las solicitudes no aparecen
- **Causa**: El centro_formador_id no coincide
- **Solución**: Verifica que uses el mismo ID del centro en todos los pasos

### Error 403 persiste
- **Causa**: No iniciaste sesión o la sesión expiró
- **Solución**: Ve a `/login` e ingresa las credenciales

## Archivos de Ayuda

- 📝 `SOLUCION-ERROR-403.md` - Guía detallada del error 403
- 🗄️ `setup-usuario-prueba-completo.sql` - Script SQL completo
- 📝 `SOLUCION-DASHBOARD-PENDIENTES-RECHAZADAS.md` - Documentación del Dashboard
- 🔧 `verificar-conexion-supabase.js` - Script de verificación

## Resumen de Credenciales

```
Email: test@universidad.cl
Password: Test123456!
Centro: Universidad de Prueba (UP001)
```

## Próximos Pasos

Una vez que funcione:
1. ✅ Explora el Dashboard
2. ✅ Crea una nueva solicitud desde "Nueva Solicitud"
3. ✅ Ve a "Mis Solicitudes" para ver todas
4. ✅ Prueba el modo oscuro (botón en el header)

---

**¿Necesitas ayuda?** Revisa los logs en la consola del navegador (F12) y comparte el error específico.
