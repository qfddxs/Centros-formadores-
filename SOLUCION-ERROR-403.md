# 🔒 Solución: Error 403 - No Autenticado

## Error Detectado

```
GET https://skuilfdzjyffnqwqbqey.supabase.co/auth/v1/user 403 (Forbidden)
```

Este error significa que **no hay una sesión activa** o la sesión expiró.

## Solución Rápida

### 1. Iniciar Sesión
1. Ve a la página de login: `http://localhost:5173/login`
2. Ingresa tus credenciales
3. El sistema te redirigirá al Dashboard automáticamente

### 2. Si No Tienes Cuenta

#### Opción A: Registrarse desde la Aplicación
1. Ve a `http://localhost:5173/registro`
2. Completa el formulario de registro
3. Inicia sesión con las credenciales creadas

#### Opción B: Crear Usuario Directamente en Supabase

**Paso 1: Crear Usuario en Auth**
1. Ve a Supabase Dashboard
2. Authentication → Users
3. Click en "Add user"
4. Ingresa email y contraseña
5. Copia el `user_id` generado

**Paso 2: Crear Centro Formador**
```sql
-- En Supabase SQL Editor
INSERT INTO centros_formadores (nombre, codigo, nivel_formacion)
VALUES ('Universidad de Prueba', 'UP001', 'pregrado')
RETURNING id;
```

**Paso 3: Vincular Usuario con Centro**
```sql
-- Reemplaza los IDs con los valores reales
INSERT INTO usuarios_centros (user_id, centro_formador_id)
VALUES (
  'TU_USER_ID_AQUI',  -- ID del usuario de Auth
  'ID_DEL_CENTRO_AQUI' -- ID del centro formador
);
```

## Verificar Sesión Activa

### En la Consola del Navegador (F12):
```javascript
// Verificar si hay sesión
const { data: { session } } = await supabase.auth.getSession();
console.log('Sesión activa:', session);

// Verificar usuario actual
const { data: { user } } = await supabase.auth.getUser();
console.log('Usuario:', user);
```

## Crear Usuario de Prueba Completo

Ejecuta este script en Supabase SQL Editor:

```sql
-- 1. Crear centro formador
INSERT INTO centros_formadores (
  nombre, 
  codigo, 
  nivel_formacion,
  direccion,
  email,
  telefono
)
VALUES (
  'Universidad de Prueba',
  'UP001',
  'pregrado',
  'Av. Principal 123',
  'contacto@universidad.cl',
  '+56912345678'
)
RETURNING id;

-- 2. Crear usuario en Auth (hacer esto desde Supabase Dashboard)
-- Authentication → Users → Add user
-- Email: test@universidad.cl
-- Password: Test123456!

-- 3. Vincular usuario con centro (reemplazar IDs)
INSERT INTO usuarios_centros (user_id, centro_formador_id, rol)
VALUES (
  'USER_ID_DE_AUTH',  -- Copiar desde Authentication → Users
  'ID_DEL_CENTRO',    -- ID del paso 1
  'centro_formador'
);

-- 4. Verificar vinculación
SELECT 
  uc.id,
  uc.user_id,
  cf.nombre as centro_nombre,
  cf.codigo as centro_codigo
FROM usuarios_centros uc
JOIN centros_formadores cf ON cf.id = uc.centro_formador_id;
```

## Insertar Solicitudes de Prueba

Una vez que tengas usuario y centro vinculados:

```sql
-- Obtener el ID del centro
SELECT id, nombre FROM centros_formadores;

-- Insertar solicitudes de prueba
INSERT INTO solicitudes_cupos (
  centro_formador_id,
  especialidad,
  numero_cupos,
  fecha_inicio,
  fecha_termino,
  solicitante,
  estado,
  motivo_rechazo
) VALUES
-- Pendiente
(
  'ID_DEL_CENTRO',
  'Enfermería',
  5,
  '2025-01-15',
  '2025-03-15',
  'Juan Pérez',
  'pendiente',
  NULL
),
-- Aprobada
(
  'ID_DEL_CENTRO',
  'Medicina Interna',
  3,
  '2025-02-01',
  '2025-04-01',
  'María González',
  'aprobada',
  NULL
),
-- Rechazada
(
  'ID_DEL_CENTRO',
  'Pediatría',
  8,
  '2025-01-20',
  '2025-03-20',
  'Carlos Rodríguez',
  'rechazada',
  'No hay cupos disponibles para el período solicitado'
);

-- Verificar
SELECT 
  especialidad,
  numero_cupos,
  estado,
  motivo_rechazo
FROM solicitudes_cupos
ORDER BY created_at DESC;
```

## Flujo Completo de Prueba

### 1. Preparar Base de Datos
```sql
-- Verificar que existan las tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('centros_formadores', 'usuarios_centros', 'solicitudes_cupos');
```

### 2. Crear Usuario de Prueba
- Email: `test@universidad.cl`
- Password: `Test123456!`

### 3. Iniciar Sesión
```
http://localhost:5173/login
```

### 4. Verificar Dashboard
```
http://localhost:5173/dashboard
```

Deberías ver:
- ✅ Estadísticas con contadores
- ✅ Solicitudes pendientes (1)
- ✅ Solicitudes rechazadas (1)
- ✅ Actividad reciente

## Problemas Comunes

### Error: "No tienes permisos para acceder"
**Causa**: Usuario no vinculado a un centro formador
**Solución**: Ejecutar el paso 3 del script (vincular usuario con centro)

### Error: "No se encontró tu centro formador"
**Causa**: No existe la vinculación en `usuarios_centros`
**Solución**: Verificar y crear la vinculación

### Error: WebSocket connection failed
**Causa**: Problema con Realtime de Supabase (no crítico)
**Solución**: Ignorar o deshabilitar Realtime temporalmente

### Las solicitudes no aparecen
**Causa**: `centro_formador_id` no coincide
**Solución**: Verificar que las solicitudes tengan el mismo `centro_formador_id` que el usuario

## Script de Verificación Completo

```sql
-- 1. Ver centros formadores
SELECT id, nombre, codigo FROM centros_formadores;

-- 2. Ver usuarios vinculados
SELECT 
  uc.user_id,
  cf.nombre as centro,
  cf.codigo
FROM usuarios_centros uc
JOIN centros_formadores cf ON cf.id = uc.centro_formador_id;

-- 3. Ver solicitudes por centro
SELECT 
  cf.nombre as centro,
  COUNT(*) as total_solicitudes,
  SUM(CASE WHEN sc.estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
  SUM(CASE WHEN sc.estado = 'aprobada' THEN 1 ELSE 0 END) as aprobadas,
  SUM(CASE WHEN sc.estado = 'rechazada' THEN 1 ELSE 0 END) as rechazadas
FROM centros_formadores cf
LEFT JOIN solicitudes_cupos sc ON sc.centro_formador_id = cf.id
GROUP BY cf.id, cf.nombre;
```

## Credenciales de Prueba Sugeridas

```
Email: test@universidad.cl
Password: Test123456!
Centro: Universidad de Prueba
Código: UP001
```

## Próximos Pasos

1. ✅ Crear usuario en Supabase Auth
2. ✅ Crear centro formador
3. ✅ Vincular usuario con centro
4. ✅ Insertar solicitudes de prueba
5. ✅ Iniciar sesión en la aplicación
6. ✅ Verificar que el Dashboard muestre los datos

---

**Nota**: El error 403 es normal si no has iniciado sesión. Una vez que inicies sesión correctamente, el Dashboard funcionará perfectamente.
