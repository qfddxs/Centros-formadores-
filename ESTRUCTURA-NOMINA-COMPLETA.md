# 📊 Estructura Completa de la Nómina de Estudiantes

## Formato del Archivo Excel

El sistema acepta archivos Excel (.xls o .xlsx) con **27 columnas** en el siguiente orden:

### Tabla de Columnas

| Col | Campo | Tipo | Obligatorio | Ejemplo |
|-----|-------|------|-------------|---------|
| **A** | N° | Número | ❌ | 1 |
| **B** | 1° Apellido | Texto | ✅ | Pérez |
| **C** | 2° Apellido | Texto | ❌ | González |
| **D** | Nombre | Texto | ✅ | Juan |
| **E** | Rut | Texto | ✅ | 12345678-9 |
| **F** | Telefono | Texto | ❌ | +56912345678 |
| **G** | Correo Electronico | Texto | ❌ | juan.perez@ejemplo.cl |
| **H** | Nombre de contacto de emergencia | Texto | ❌ | María Pérez |
| **I** | Telefono de contacto de emergencia | Texto | ❌ | +56987654321 |
| **J** | Lugar de residencia | Texto | ❌ | Santiago, RM |
| **K** | Carrera | Texto | ❌ | Enfermería |
| **L** | Nivel que cursa | Texto | ❌ | 4to año |
| **M** | Tipo de practica | Texto | ❌ | Práctica Profesional |
| **N** | Campo clinico solicitado | Texto | ❌ | Medicina Interna |
| **O** | Fecha Inicio | Fecha | ❌ | 01/03/2025 |
| **P** | Fecha termino | Fecha | ❌ | 30/04/2025 |
| **Q** | N° semanas presenciales | Número | ❌ | 8 |
| **R** | Desde (horario) | Hora | ❌ | 08:00 |
| **S** | Hasta (horario) | Hora | ❌ | 17:00 |
| **T** | Cuarto turno | Texto | ❌ | No |
| **U** | Nombre docente centro formador | Texto | ❌ | Dra. Ana Silva |
| **V** | Telefono docente centro formador | Texto | ❌ | +56911223344 |
| **W** | N° reg. sis | Texto | ❌ | REG-2025-001 |
| **X** | Inmunizacion al dia (Si/No) | Texto | ❌ | Si |
| **Y** | N° Visitas | Número | ❌ | 0 |
| **Z** | Fecha de la supervision | Fecha | ❌ | 15/03/2025 |
| **AA** | Observaciones | Texto | ❌ | Estudiante destacado |

## 📝 Campos Obligatorios

Solo 3 campos son obligatorios:
- ✅ **1° Apellido** (Columna B)
- ✅ **Nombre** (Columna D)
- ✅ **Rut** (Columna E)

Todos los demás campos son opcionales.

## 🎯 Ejemplo de Fila Completa

```
1 | Pérez | González | Juan | 12345678-9 | +56912345678 | juan.perez@ejemplo.cl | María Pérez | +56987654321 | Santiago, RM | Enfermería | 4to año | Práctica Profesional | Medicina Interna | 01/03/2025 | 30/04/2025 | 8 | 08:00 | 17:00 | No | Dra. Ana Silva | +56911223344 | REG-2025-001 | Si | 0 | | Estudiante destacado
```

## 📥 Descargar Plantilla

La plantilla incluye:
- ✅ Encabezados en la primera fila
- ✅ 3 estudiantes de ejemplo
- ✅ Todos los campos con datos de muestra
- ✅ Anchos de columna ajustados

**Para descargar:**
1. Ve a "Solicitud de Rotación"
2. Click en "Descargar plantilla"
3. Se descargará `plantilla_nomina_estudiantes.xlsx`

## ✅ Validaciones Automáticas

### Formato de RUT
- Acepta: `12345678-9`, `12.345.678-9`, `123456789`
- Normaliza a: `12345678-9`

### Formato de Fechas
- Acepta: `DD/MM/YYYY` (01/03/2025)
- Acepta: Fechas de Excel (número serial)
- Convierte a: `YYYY-MM-DD` (2025-03-01)

### Formato de Horarios
- Acepta: `HH:MM` (08:00)
- Acepta: Horarios de Excel (fracción de día)
- Convierte a: `HH:MM` (08:00)

### Números
- N°, N° semanas presenciales, N° Visitas se convierten a enteros
- Valores vacíos se guardan como NULL

## 🔍 Campos por Categoría

### 👤 Datos Personales
- N°
- 1° Apellido ✅
- 2° Apellido
- Nombre ✅
- Rut ✅
- Telefono
- Correo Electronico

### 🚨 Contacto de Emergencia
- Nombre de contacto de emergencia
- Telefono de contacto de emergencia

### 🎓 Información Académica
- Lugar de residencia
- Carrera
- Nivel que cursa

### 🏥 Información de Práctica
- Tipo de practica
- Campo clinico solicitado
- Fecha Inicio
- Fecha termino
- N° semanas presenciales
- Desde (horario)
- Hasta (horario)
- Cuarto turno

### 👨‍🏫 Docente Supervisor
- Nombre docente centro formador
- Telefono docente centro formador

### 📋 Registro y Seguimiento
- N° reg. sis
- Inmunizacion al dia (Si/No)
- N° Visitas
- Fecha de la supervision
- Observaciones

## 💡 Tips para Llenar la Nómina

### RUT
- Incluir guión antes del dígito verificador
- Ejemplo: `12345678-9`

### Teléfonos
- Incluir código país: `+56912345678`
- O formato local: `912345678`

### Fechas
- Usar formato: `DD/MM/YYYY`
- Ejemplo: `01/03/2025`

### Horarios
- Usar formato 24 horas: `08:00`, `17:00`
- No usar AM/PM

### Cuarto Turno / Inmunización
- Usar: `Si` o `No`
- Evitar: `Sí`, `SI`, `si`, etc.

### Lugar de Residencia
- Incluir comuna y región
- Ejemplo: `Santiago, Región Metropolitana`

## 🚫 Errores Comunes

### ❌ Fila sin apellido o nombre
```
| | | Juan | 12345678-9 | ...
```
**Solución:** Agregar al menos el primer apellido

### ❌ RUT sin dígito verificador
```
| Pérez | | Juan | 12345678 | ...
```
**Solución:** Agregar guión y dígito: `12345678-9`

### ❌ Fecha en formato incorrecto
```
| ... | 2025-03-01 | ...
```
**Solución:** Usar formato DD/MM/YYYY: `01/03/2025`

### ❌ Horario con AM/PM
```
| ... | 8:00 AM | 5:00 PM | ...
```
**Solución:** Usar formato 24h: `08:00` | `17:00`

## 📊 Vista Previa en la Aplicación

Después de subir el Excel, verás:
- ✅ Total de estudiantes encontrados
- ✅ Primeros 5 estudiantes con:
  - RUT formateado
  - Nombre completo (Nombre + Apellidos)
  - Correo electrónico
  - Carrera

## 🗄️ Almacenamiento

Los datos se guardan en dos lugares:

1. **Archivo Excel original** → Supabase Storage
   - Para que el admin pueda descargarlo
   - Mantiene formato original

2. **Datos parseados** → Base de datos
   - Para búsquedas y consultas
   - Datos normalizados y validados

## 🔧 Configuración en Supabase

Para que funcione, ejecuta en SQL Editor:

```sql
-- Archivo: supabase-migrations-estudiantes-completo.sql
```

Esto creará la tabla `estudiantes_rotacion` con todos los 27 campos.

## 📈 Consultas Útiles

### Ver estudiantes de una solicitud
```sql
SELECT * FROM estudiantes_rotacion 
WHERE solicitud_rotacion_id = 'UUID'
ORDER BY numero;
```

### Buscar por RUT
```sql
SELECT * FROM estudiantes_rotacion 
WHERE rut = '12345678-9';
```

### Estudiantes por carrera
```sql
SELECT carrera, COUNT(*) as total
FROM estudiantes_rotacion
GROUP BY carrera
ORDER BY total DESC;
```

### Estudiantes con inmunización al día
```sql
SELECT * FROM estudiantes_rotacion 
WHERE inmunizacion_al_dia = 'Si';
```
