# 📊 Estructura del Excel para Importar Estudiantes

## Formato del Archivo

El sistema acepta archivos Excel (.xls o .xlsx) con la siguiente estructura:

### Columnas Requeridas

| Columna | Nombre Campo | Tipo | Obligatorio | Descripción | Ejemplo |
|---------|--------------|------|-------------|-------------|---------|
| **A** | RUT | Texto | ✅ Sí | RUT del estudiante con o sin formato | `12345678-9` o `123456789` |
| **B** | Nombre | Texto | ✅ Sí | Nombre(s) del estudiante | `Juan Carlos` |
| **C** | Apellido | Texto | ✅ Sí | Apellido(s) del estudiante | `Pérez González` |
| **D** | Email | Texto | ❌ No | Correo electrónico | `juan.perez@ejemplo.cl` |
| **E** | Teléfono | Texto | ❌ No | Teléfono con código país | `+56912345678` |
| **F** | Fecha Nacimiento | Fecha | ❌ No | Fecha en formato DD/MM/YYYY | `15/03/2000` |
| **G** | Carrera | Texto | ❌ No | Nombre de la carrera | `Enfermería` |
| **H** | Nivel Académico | Texto | ❌ No | Año o nivel cursando | `4to año` |

## 📝 Ejemplo de Excel

```
| RUT         | Nombre      | Apellido        | Email                    | Teléfono      | Fecha Nacimiento | Carrera      | Nivel Académico |
|-------------|-------------|-----------------|--------------------------|---------------|------------------|--------------|-----------------|
| 12345678-9  | Juan        | Pérez           | juan.perez@ejemplo.cl    | +56912345678  | 15/03/2000       | Enfermería   | 4to año         |
| 98765432-1  | María       | González        | maria.gonzalez@ejemplo.cl| +56987654321  | 22/07/1999       | Medicina     | 5to año         |
| 11223344-5  | Pedro       | Silva           | pedro.silva@ejemplo.cl   | +56911223344  | 10/11/2001       | Kinesiología | 3er año         |
```

## ✅ Validaciones Automáticas

El sistema realiza las siguientes validaciones al procesar el archivo:

### 1. Validación de Campos Obligatorios
- ❌ Si falta RUT, Nombre o Apellido → La fila se omite
- ⚠️ Se muestra advertencia en consola

### 2. Formato de RUT
- ✅ Acepta: `12345678-9`, `12.345.678-9`, `123456789`
- 🔄 Normaliza automáticamente a formato: `12345678-9`
- 🔤 Convierte dígito verificador a mayúscula (K)

### 3. Formato de Fecha
- ✅ Acepta: `DD/MM/YYYY` (15/03/2000)
- ✅ Acepta: Fechas de Excel (número serial)
- 🔄 Convierte automáticamente a formato ISO: `2000-03-15`

### 4. Filas Vacías
- 🗑️ Se omiten automáticamente
- No generan errores

### 5. Encabezados
- 🔍 Detecta automáticamente si la primera fila es encabezado
- ⏭️ La salta si contiene la palabra "rut" (case insensitive)

## 🎯 Buenas Prácticas

### ✅ Recomendaciones

1. **Usa la plantilla oficial**
   - Descárgala desde el botón "Descargar plantilla" en la interfaz
   - Ya tiene el formato correcto

2. **Formato de RUT**
   - Preferible con guión: `12345678-9`
   - El sistema lo normaliza automáticamente

3. **Emails válidos**
   - Usa formato estándar: `nombre@dominio.cl`
   - Evita espacios o caracteres especiales

4. **Teléfonos con código país**
   - Formato recomendado: `+56912345678`
   - También acepta: `912345678`

5. **Fechas consistentes**
   - Usa siempre el mismo formato: `DD/MM/YYYY`
   - O deja que Excel maneje las fechas

### ❌ Errores Comunes

1. **RUT sin dígito verificador**
   - ❌ Incorrecto: `12345678`
   - ✅ Correcto: `12345678-9`

2. **Nombres en columnas incorrectas**
   - Respeta el orden de las columnas
   - No agregues columnas extra al inicio

3. **Fechas en formato incorrecto**
   - ❌ Incorrecto: `2000-03-15` (en Excel)
   - ✅ Correcto: `15/03/2000`

4. **Archivo muy grande**
   - Límite: 5MB
   - Si tienes muchos estudiantes, divide en múltiples solicitudes

## 🔧 Funciones del Parser

El sistema incluye las siguientes funciones de procesamiento:

### `parseExcelEstudiantes(file)`
Parsea el archivo Excel y retorna:
```javascript
{
  estudiantes: [
    {
      rut: "12345678-9",
      nombre: "Juan",
      apellido: "Pérez",
      email: "juan.perez@ejemplo.cl",
      telefono: "+56912345678",
      fecha_nacimiento: "2000-03-15",
      carrera: "Enfermería",
      nivel_academico: "4to año"
    },
    // ... más estudiantes
  ],
  total: 3,
  nombreHoja: "Estudiantes"
}
```

### `formatRut(rut)`
Normaliza el formato del RUT:
- Entrada: `12.345.678-9` o `123456789`
- Salida: `12345678-9`

### `validarRut(rut)`
Valida el dígito verificador del RUT chileno:
- Retorna: `true` o `false`

### `generarPlantillaExcel()`
Genera y descarga un archivo Excel de ejemplo con:
- Encabezados correctos
- 3 filas de ejemplo
- Formato adecuado

## 📥 Descargar Plantilla

Puedes descargar la plantilla de dos formas:

1. **Desde la interfaz**
   - Ve a "Solicitud de Rotación"
   - Click en "Descargar plantilla"

2. **Programáticamente**
   ```javascript
   import { generarPlantillaExcel } from './utils/excelParser';
   generarPlantillaExcel();
   ```

## 🧪 Probar el Parser

Para probar el parser sin subir a la base de datos:

```javascript
import { parseExcelEstudiantes } from './utils/excelParser';

const file = event.target.files[0];
const resultado = await parseExcelEstudiantes(file);

console.log('Total estudiantes:', resultado.total);
console.log('Estudiantes:', resultado.estudiantes);
```

## 📊 Límites y Restricciones

| Concepto | Límite | Razón |
|----------|--------|-------|
| Tamaño archivo | 5 MB | Performance del navegador |
| Estudiantes por archivo | ~1000 | Recomendado para UX |
| Columnas | 8 fijas | Estructura definida |
| Formato | .xls, .xlsx | Compatibilidad |

## 🆘 Mensajes de Error

### "El archivo Excel está vacío o no tiene datos"
- El archivo no tiene filas con datos
- Verifica que haya al menos una fila con información

### "No se encontraron estudiantes válidos en el archivo"
- Todas las filas fueron omitidas por falta de datos obligatorios
- Verifica que las columnas A, B, C tengan datos

### "Error al procesar el archivo Excel"
- El archivo puede estar corrupto
- Intenta abrirlo en Excel y guardarlo nuevamente

### "Por favor selecciona un archivo Excel válido"
- El archivo no es .xls o .xlsx
- Verifica la extensión del archivo

## 💡 Tips Avanzados

### Importar desde Google Sheets
1. Abre tu Google Sheet
2. Archivo → Descargar → Microsoft Excel (.xlsx)
3. Sube el archivo descargado

### Importar desde CSV
1. Abre el CSV en Excel
2. Guarda como → Excel Workbook (.xlsx)
3. Sube el archivo

### Múltiples hojas
- El sistema solo lee la primera hoja
- Asegúrate de que los datos estén en la primera hoja
