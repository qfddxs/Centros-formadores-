# 🧪 Guía de Pruebas - Sistema Híbrido

## ✅ Checklist de Configuración

Antes de probar, asegúrate de tener:

- [ ] Tablas creadas en Supabase (ejecutar `supabase-migrations.sql`)
- [ ] Buckets de Storage creados (`rotaciones-excel`, `documentos-centros`)
- [ ] Políticas RLS configuradas
- [ ] Políticas de Storage configuradas
- [ ] Variables de entorno en `.env`
- [ ] Dependencia `xlsx` instalada (`npm install xlsx`)

## 🎯 Escenarios de Prueba

### 1. Solicitud de Rotación - Flujo Completo

#### Paso 1: Descargar Plantilla
```
1. Ir a /solicitud-rotacion
2. Click en "Descargar plantilla"
3. Verificar que se descarga "plantilla_estudiantes.xlsx"
4. Abrir en Excel y verificar estructura
```

**Resultado esperado:**
- ✅ Archivo Excel con 3 estudiantes de ejemplo
- ✅ Encabezados correctos en la primera fila

#### Paso 2: Llenar Datos
```
1. Abrir la plantilla descargada
2. Agregar 5-10 estudiantes con datos reales
3. Guardar el archivo
```

**Datos de prueba sugeridos:**
```
RUT          | Nombre  | Apellido | Email                  | Teléfono     | Fecha Nac. | Carrera     | Nivel
12345678-9   | Juan    | Pérez    | juan@ejemplo.cl        | +56912345678 | 15/03/2000 | Enfermería  | 4to año
98765432-1   | María   | González | maria@ejemplo.cl       | +56987654321 | 22/07/1999 | Medicina    | 5to año
11223344-5   | Pedro   | Silva    | pedro@ejemplo.cl       | +56911223344 | 10/11/2001 | Kinesiología| 3er año
```

#### Paso 3: Subir Archivo
```
1. En /solicitud-rotacion
2. Seleccionar el archivo Excel
3. Esperar a que aparezca "Procesando archivo Excel..."
4. Verificar vista previa de estudiantes
```

**Resultado esperado:**
- ✅ Mensaje: "Archivo procesado exitosamente"
- ✅ Muestra: "Se encontraron X estudiantes válidos"
- ✅ Vista previa con primeros 5 estudiantes
- ✅ RUTs formateados correctamente (12345678-9)

#### Paso 4: Completar Formulario
```
1. Llenar campo "Especialidad/Carrera"
2. Seleccionar "Fecha de Inicio"
3. Seleccionar "Fecha de Término"
4. Agregar comentarios (opcional)
5. Click en "Enviar Solicitud"
```

**Resultado esperado:**
- ✅ Mensaje: "¡Solicitud Enviada!"
- ✅ Redirección al dashboard después de 2 segundos

#### Paso 5: Verificar en Supabase
```sql
-- Verificar solicitud creada
SELECT * FROM solicitudes_rotacion 
ORDER BY created_at DESC 
LIMIT 1;

-- Verificar estudiantes guardados
SELECT * FROM estudiantes_rotacion 
WHERE solicitud_rotacion_id = 'UUID_DE_LA_SOLICITUD';

-- Verificar archivo en Storage
-- Ir a Storage → rotaciones-excel → {centro_formador_id}
```

**Resultado esperado:**
- ✅ 1 registro en `solicitudes_rotacion`
- ✅ X registros en `estudiantes_rotacion` (según estudiantes en Excel)
- ✅ Archivo Excel visible en Storage
- ✅ `archivo_excel_url` apunta al archivo correcto

### 2. Gestión Documental - Flujo Completo

#### Paso 1: Subir Documento
```
1. Ir a /gestion-documental
2. Seleccionar tipo: "Certificado de Vacunación"
3. Agregar descripción: "Vacunas 2025"
4. Seleccionar archivo PDF
5. Esperar a que se suba
```

**Resultado esperado:**
- ✅ Documento aparece en la lista
- ✅ Muestra nombre, tipo, fecha y tamaño
- ✅ Muestra descripción si se agregó

#### Paso 2: Descargar Documento
```
1. Click en botón de descarga (flecha hacia abajo)
2. Verificar que se abre en nueva pestaña
```

**Resultado esperado:**
- ✅ PDF se abre correctamente
- ✅ URL es pública y accesible

#### Paso 3: Eliminar Documento
```
1. Click en botón de eliminar (papelera)
2. Confirmar eliminación
3. Verificar que desaparece de la lista
```

**Resultado esperado:**
- ✅ Documento se elimina de la lista
- ✅ Archivo se elimina de Storage
- ✅ Registro se elimina de la BD

#### Paso 4: Verificar en Supabase
```sql
-- Ver documentos del centro
SELECT * FROM documentos_centro 
WHERE centro_formador_id = 'UUID_DEL_CENTRO'
ORDER BY fecha_subida DESC;
```

### 3. Validaciones y Errores

#### Test 3.1: Archivo Excel Vacío
```
1. Crear Excel sin datos (solo encabezados)
2. Intentar subir
```

**Resultado esperado:**
- ❌ Error: "No se encontraron estudiantes válidos en el archivo"

#### Test 3.2: Archivo Excel con Filas Incompletas
```
1. Crear Excel con estudiantes sin RUT o sin nombre
2. Intentar subir
```

**Resultado esperado:**
- ⚠️ Filas incompletas se omiten
- ✅ Solo se procesan filas válidas
- ✅ Vista previa muestra solo estudiantes válidos

#### Test 3.3: Archivo No Excel
```
1. Intentar subir archivo .txt o .pdf
2. Verificar error
```

**Resultado esperado:**
- ❌ Error: "Por favor selecciona un archivo Excel válido (.xls o .xlsx)"

#### Test 3.4: Archivo Muy Grande
```
1. Crear Excel con más de 5MB
2. Intentar subir
```

**Resultado esperado:**
- ❌ Error: "El archivo no debe superar los 5MB"

#### Test 3.5: Fechas Inválidas
```
1. Seleccionar fecha de término anterior a fecha de inicio
2. Intentar enviar
```

**Resultado esperado:**
- ❌ Error: "La fecha de término debe ser posterior a la fecha de inicio"

#### Test 3.6: PDF No Válido en Gestión Documental
```
1. Intentar subir archivo .docx o .jpg
2. Verificar error
```

**Resultado esperado:**
- ❌ Error: "Solo se permiten archivos PDF"

### 4. Navegación y UX

#### Test 4.1: Menú del Dashboard
```
1. Ir a /dashboard
2. Verificar que aparecen 4 tarjetas:
   - Solicitar Cupos
   - Solicitud de Rotación
   - Gestión Documental
   - Mis Solicitudes
3. Click en cada una y verificar navegación
```

**Resultado esperado:**
- ✅ Todas las tarjetas son clickeables
- ✅ Navegan a la ruta correcta
- ✅ Diseño responsive

#### Test 4.2: Botón Volver
```
1. Desde cualquier página
2. Click en botón "←" (flecha izquierda)
3. Verificar que vuelve al dashboard
```

**Resultado esperado:**
- ✅ Vuelve a /dashboard
- ✅ No pierde el estado de sesión

#### Test 4.3: Estados de Carga
```
1. Subir archivo Excel grande
2. Observar indicador de carga
3. Enviar formulario
4. Observar botón "Enviando..."
```

**Resultado esperado:**
- ✅ Spinner animado mientras procesa
- ✅ Botones deshabilitados durante carga
- ✅ Mensajes claros de estado

### 5. Seguridad y Permisos

#### Test 5.1: RLS - Centro Solo Ve Sus Datos
```
1. Crear dos centros diferentes
2. Centro A crea solicitud
3. Iniciar sesión como Centro B
4. Verificar que no ve solicitud de Centro A
```

**Resultado esperado:**
- ✅ Cada centro solo ve sus propias solicitudes
- ✅ No puede acceder a datos de otros centros

#### Test 5.2: Storage - Archivos Privados por Centro
```
1. Centro A sube archivo
2. Copiar URL del archivo
3. Iniciar sesión como Centro B
4. Intentar acceder a URL
```

**Resultado esperado:**
- ✅ Centro B no puede acceder al archivo de Centro A
- ❌ Error 403 o similar

#### Test 5.3: Sin Autenticación
```
1. Cerrar sesión
2. Intentar acceder a /solicitud-rotacion
```

**Resultado esperado:**
- ✅ Redirección a /login
- ✅ No puede acceder sin autenticación

## 🐛 Debugging

### Consola del Navegador

Abre DevTools (F12) y revisa:

```javascript
// Ver datos parseados del Excel
console.log('Estudiantes:', estudiantesParsed);

// Ver errores de Supabase
console.error('Error:', error);

// Ver datos enviados
console.log('Datos a enviar:', formData);
```

### Queries SQL de Debugging

```sql
-- Ver última solicitud con estudiantes
SELECT 
  s.*,
  COUNT(e.id) as total_estudiantes
FROM solicitudes_rotacion s
LEFT JOIN estudiantes_rotacion e ON s.id = e.solicitud_rotacion_id
GROUP BY s.id
ORDER BY s.created_at DESC
LIMIT 1;

-- Ver estudiantes de una solicitud específica
SELECT * FROM estudiantes_rotacion 
WHERE solicitud_rotacion_id = 'UUID'
ORDER BY apellido, nombre;

-- Ver documentos recientes
SELECT * FROM documentos_centro 
ORDER BY fecha_subida DESC 
LIMIT 10;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('solicitudes_rotacion', 'estudiantes_rotacion', 'documentos_centro');
```

### Logs de Supabase

En el dashboard de Supabase:
1. Ir a "Logs"
2. Filtrar por "API" o "Storage"
3. Buscar errores recientes

## 📊 Métricas de Éxito

Después de las pruebas, verifica:

- [ ] ✅ Solicitudes creadas correctamente
- [ ] ✅ Estudiantes guardados en BD
- [ ] ✅ Archivos Excel en Storage
- [ ] ✅ Documentos PDF subidos
- [ ] ✅ RLS funcionando (centros aislados)
- [ ] ✅ Validaciones funcionando
- [ ] ✅ UX fluida sin errores
- [ ] ✅ Mensajes de error claros
- [ ] ✅ Performance aceptable (<2s para parsear Excel)

## 🚨 Problemas Comunes

### "No se pudo subir el archivo"
**Causa:** Buckets no creados o políticas incorrectas
**Solución:** Verificar Storage en Supabase

### "Error al crear la solicitud"
**Causa:** Tablas no existen o RLS muy restrictivo
**Solución:** Ejecutar migrations y verificar políticas

### "No se encontraron estudiantes válidos"
**Causa:** Excel con formato incorrecto
**Solución:** Usar plantilla oficial

### Archivo se sube pero no aparece en BD
**Causa:** Error en inserción de estudiantes
**Solución:** Revisar logs de Supabase y consola

### Vista previa no muestra estudiantes
**Causa:** Error en parser
**Solución:** Verificar formato de Excel y consola

## 📝 Reporte de Pruebas

Usa esta plantilla para documentar tus pruebas:

```markdown
## Reporte de Pruebas - [Fecha]

### Configuración
- [ ] Tablas creadas
- [ ] Storage configurado
- [ ] RLS habilitado

### Pruebas Funcionales
- [ ] Solicitud de rotación completa
- [ ] Gestión documental completa
- [ ] Validaciones funcionando

### Pruebas de Seguridad
- [ ] RLS aislando centros
- [ ] Storage privado por centro

### Problemas Encontrados
1. [Descripción del problema]
   - Severidad: Alta/Media/Baja
   - Pasos para reproducir
   - Solución aplicada

### Métricas
- Solicitudes creadas: X
- Estudiantes procesados: Y
- Documentos subidos: Z
- Tiempo promedio de carga: Xs
```
