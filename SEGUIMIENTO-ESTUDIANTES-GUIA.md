# 📚 Guía: Seguimiento de Estudiantes en Práctica

## 🎯 Descripción General

Nueva funcionalidad que permite a los Centros Formadores hacer seguimiento en tiempo real de sus estudiantes durante las prácticas clínicas, incluyendo:

- ✅ Asistencia diaria con calendario visual
- 📝 Observaciones y comentarios
- 📊 Estadísticas de asistencia
- 📅 Calendario interactivo del año 2025
- 🎨 Diseño consistente con modo oscuro

---

## 🗄️ Estructura de Base de Datos

### Tablas Creadas

#### 1. `asistencia_estudiantes`
Registro diario de asistencia de cada estudiante.

**Campos:**
- `id`: UUID (PK)
- `estudiante_rotacion_id`: UUID (FK → estudiantes_rotacion)
- `fecha`: DATE
- `estado`: VARCHAR(50) - Valores: 'presente', 'ausente', 'justificado', 'tarde'
- `hora_entrada`: TIME
- `hora_salida`: TIME
- `observaciones`: TEXT
- `registrado_por`: UUID (FK → auth.users)
- `created_at`, `updated_at`: TIMESTAMP

**Restricción:** Un registro por estudiante por día (UNIQUE)

#### 2. `observaciones_estudiantes`
Comentarios y observaciones sobre el desempeño.

**Campos:**
- `id`: UUID (PK)
- `estudiante_rotacion_id`: UUID (FK → estudiantes_rotacion)
- `fecha`: DATE
- `tipo`: VARCHAR(50) - Valores: 'positiva', 'negativa', 'neutral', 'alerta'
- `titulo`: VARCHAR(255)
- `descripcion`: TEXT
- `registrado_por`: UUID (FK → auth.users)
- `created_at`, `updated_at`: TIMESTAMP

#### 3. `evaluaciones_estudiantes`
Evaluaciones formales durante la práctica.

**Campos:**
- `id`: UUID (PK)
- `estudiante_rotacion_id`: UUID (FK → estudiantes_rotacion)
- `fecha_evaluacion`: DATE
- `tipo_evaluacion`: VARCHAR(100)
- `nota`: DECIMAL(3,1)
- `comentarios`: TEXT
- `evaluador_nombre`: VARCHAR(255)
- `evaluador_cargo`: VARCHAR(255)
- `created_at`, `updated_at`: TIMESTAMP

---

## 🔐 Seguridad (RLS)

Todas las tablas tienen políticas RLS que garantizan:

- ✅ Los centros formadores **solo ven** datos de sus propios estudiantes
- ✅ Filtrado automático por `centro_formador_id`
- ✅ Seguridad a nivel de base de datos

---

## 🎨 Interfaz de Usuario

### Componentes Principales

#### 1. **Lista de Estudiantes** (Sidebar Izquierdo)
- Muestra todos los estudiantes en rotación del centro
- Información: Nombre, RUT, Especialidad
- Selección activa con highlight teal
- Scroll vertical para muchos estudiantes

#### 2. **Información del Estudiante** (Header)
- Nombre completo y especialidad
- Datos de contacto (RUT, email, teléfono)
- Porcentaje de asistencia destacado

#### 3. **Estadísticas** (Cards)
5 tarjetas con métricas:
- **Total**: Días registrados
- **Presentes**: Días con asistencia (verde)
- **Ausentes**: Faltas sin justificar (rojo)
- **Justificados**: Faltas justificadas (amarillo)
- **Tardes**: Llegadas tarde (naranja)

#### 4. **Calendario Interactivo**
- Vista mensual con navegación (← →)
- Días de la semana en español
- Fines de semana con fondo diferenciado
- Día actual con borde teal
- Estados visuales por día:
  - 🟢 Verde: Presente
  - 🔴 Rojo: Ausente
  - 🟡 Amarillo: Justificado
  - 🟠 Naranja: Tarde
- Leyenda de colores al final

#### 5. **Observaciones Recientes**
- Últimas 10 observaciones
- Colores según tipo:
  - Verde: Positiva
  - Rojo: Negativa
  - Naranja: Alerta
  - Azul: Neutral
- Fecha y descripción completa

---

## 🚀 Instalación

### 1. Ejecutar Script SQL

```bash
# En Supabase SQL Editor, ejecutar:
supabase-seguimiento-estudiantes.sql
```

### 2. Verificar Tablas Creadas

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%estudiantes%';
```

Deberías ver:
- `asistencia_estudiantes`
- `observaciones_estudiantes`
- `evaluaciones_estudiantes`
- `estudiantes_rotacion` (ya existente)

### 3. Verificar Políticas RLS

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('asistencia_estudiantes', 'observaciones_estudiantes', 'evaluaciones_estudiantes');
```

---

## 📊 Datos de Prueba

### Insertar Asistencia de Ejemplo

```sql
-- Reemplazar UUID_ESTUDIANTE con un ID real de tu tabla estudiantes_rotacion

-- Enero 2025
INSERT INTO asistencia_estudiantes (estudiante_rotacion_id, fecha, estado, hora_entrada, hora_salida, observaciones)
VALUES 
  ('UUID_ESTUDIANTE', '2025-01-13', 'presente', '08:00', '17:00', 'Excelente desempeño en procedimientos'),
  ('UUID_ESTUDIANTE', '2025-01-14', 'presente', '08:05', '17:00', 'Llegó 5 minutos tarde'),
  ('UUID_ESTUDIANTE', '2025-01-15', 'ausente', NULL, NULL, 'Falta justificada por enfermedad'),
  ('UUID_ESTUDIANTE', '2025-01-16', 'justificado', NULL, NULL, 'Certificado médico presentado'),
  ('UUID_ESTUDIANTE', '2025-01-17', 'presente', '08:00', '17:00', 'Muy proactivo con los pacientes');
```

### Insertar Observaciones de Ejemplo

```sql
INSERT INTO observaciones_estudiantes (estudiante_rotacion_id, fecha, tipo, titulo, descripcion)
VALUES 
  ('UUID_ESTUDIANTE', '2025-01-13', 'positiva', 'Excelente trabajo en equipo', 'Demostró gran capacidad de colaboración con el equipo médico'),
  ('UUID_ESTUDIANTE', '2025-01-14', 'neutral', 'Puntualidad', 'Llegó 5 minutos tarde, se recomienda mejorar'),
  ('UUID_ESTUDIANTE', '2025-01-17', 'positiva', 'Iniciativa destacada', 'Propuso mejoras en el proceso de atención');
```

---

## 🎯 Funcionalidades Implementadas

### ✅ Completadas

1. **Visualización de Estudiantes**
   - Lista completa de estudiantes en rotación
   - Filtrado automático por centro formador
   - Selección interactiva

2. **Calendario de Asistencia**
   - Vista mensual completa
   - Navegación entre meses
   - Estados visuales por día
   - Leyenda de colores
   - Destacado del día actual

3. **Estadísticas en Tiempo Real**
   - Cálculo automático de métricas
   - Porcentaje de asistencia
   - Contadores por estado

4. **Observaciones**
   - Listado de últimas 10 observaciones
   - Clasificación por tipo
   - Colores diferenciados

5. **Modo Oscuro**
   - Totalmente compatible
   - Transiciones suaves
   - Colores adaptados

### 🔄 Pendientes (Futuras Mejoras)

1. **Registro de Asistencia**
   - Formulario para que el hospital registre asistencia
   - Validaciones de fechas
   - Carga masiva

2. **Exportación de Reportes**
   - PDF con resumen de asistencia
   - Excel con datos detallados
   - Gráficos de tendencias

3. **Notificaciones**
   - Alertas por ausencias repetidas
   - Recordatorios de evaluaciones
   - Email automático al centro formador

4. **Evaluaciones**
   - Formulario de evaluación
   - Historial de notas
   - Promedio general

---

## 🔗 Navegación

### Acceso desde Dashboard

El botón "Seguimiento Estudiantes" está disponible en:
- **Dashboard** → Acciones Rápidas → "Seguimiento Estudiantes"
- **Ruta directa:** `/seguimiento-estudiantes`

### Flujo de Usuario

1. Usuario inicia sesión
2. Ve Dashboard con sus estadísticas
3. Click en "Seguimiento Estudiantes"
4. Ve lista de todos sus estudiantes en práctica
5. Selecciona un estudiante
6. Ve calendario, estadísticas y observaciones
7. Puede navegar entre meses
8. Puede cambiar de estudiante

---

## 🎨 Diseño y Estilos

### Colores por Estado de Asistencia

- **Presente**: Verde (`green-100/600`)
- **Ausente**: Rojo (`red-100/600`)
- **Justificado**: Amarillo (`yellow-100/600`)
- **Tarde**: Naranja (`orange-100/600`)

### Colores por Tipo de Observación

- **Positiva**: Verde (`green-50/800`)
- **Negativa**: Rojo (`red-50/800`)
- **Alerta**: Naranja (`orange-50/800`)
- **Neutral**: Azul (`blue-50/800`)

### Modo Oscuro

Todos los componentes tienen variantes dark:
- Fondos: `dark:bg-gray-800/900`
- Textos: `dark:text-white/gray-300`
- Bordes: `dark:border-gray-700`
- Cards: `dark:bg-gray-800`

---

## 📱 Responsive

- **Desktop**: Layout de 4 columnas (1 sidebar + 3 contenido)
- **Tablet**: Layout de 2 columnas
- **Mobile**: Layout de 1 columna (stack vertical)

---

## 🐛 Troubleshooting

### No aparecen estudiantes

**Causa:** No hay solicitudes de rotación aprobadas
**Solución:** 
1. Crear solicitud de rotación
2. Subir Excel con estudiantes
3. Esperar aprobación (o aprobar manualmente en BD)

### No aparece asistencia en el calendario

**Causa:** No hay registros de asistencia
**Solución:**
1. Insertar datos de prueba (ver sección "Datos de Prueba")
2. O esperar a que el hospital registre asistencia

### Error de permisos RLS

**Causa:** Políticas RLS no aplicadas correctamente
**Solución:**
```sql
-- Verificar que las políticas existan
SELECT * FROM pg_policies WHERE tablename = 'asistencia_estudiantes';

-- Si no existen, ejecutar nuevamente el script SQL
```

---

## 📈 Próximos Pasos

1. **Implementar registro de asistencia** (Portal Hospital/SC)
2. **Agregar gráficos de tendencias** (Chart.js o Recharts)
3. **Sistema de notificaciones** por email
4. **Exportación de reportes** en PDF/Excel
5. **Módulo de evaluaciones** completo

---

## 🤝 Integración con Otros Módulos

### Relación con Solicitud de Rotación
- Los estudiantes vienen de `solicitudes_rotacion`
- Se cargan desde el Excel subido
- Tabla: `estudiantes_rotacion`

### Relación con Centro Formador
- Filtrado automático por `centro_formador_id`
- Solo ve sus propios estudiantes
- Seguridad garantizada por RLS

### Relación con Hospital/SC (Futuro)
- El hospital/SC registrará la asistencia
- El centro formador solo visualiza
- Comunicación bidireccional

---

## ✅ Checklist de Implementación

- [x] Script SQL creado
- [x] Tablas con RLS configuradas
- [x] Componente React creado
- [x] Ruta agregada al router
- [x] Botón en Dashboard
- [x] Modo oscuro implementado
- [x] Responsive design
- [x] Documentación completa
- [ ] Datos de prueba insertados
- [ ] Testing con usuarios reales

---

**Fecha de Creación:** Enero 2025  
**Versión:** 1.0  
**Estado:** ✅ Funcional - Listo para pruebas
