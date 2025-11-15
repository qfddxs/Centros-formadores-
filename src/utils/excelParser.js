import * as XLSX from 'xlsx';

/**
 * Parsea un archivo Excel y extrae los datos de estudiantes
 * Estructura esperada del Excel (27 columnas):
 * A: N°
 * B: 1° Apellido
 * C: 2° Apellido
 * D: Nombre
 * E: Rut
 * F: Telefono
 * G: Correo Electronico
 * H: Nombre de contacto de emergencia
 * I: Telefono de contacto de emergencia
 * J: Lugar de residencia
 * K: Carrera
 * L: Nivel que cursa
 * M: Tipo de practica
 * N: Campo clinico solicitado
 * O: Fecha Inicio
 * P: Fecha termino
 * Q: N° semanas presenciales
 * R: Desde (horario)
 * S: Hasta (horario)
 * T: Cuarto turno
 * U: Nombre docente centro formador
 * V: Telefono docente centro formador
 * W: N° reg. sis
 * X: Inmunizacion al dia (Si/No)
 * Y: N° Visitas
 * Z: Fecha de la supervision
 * AA: Observaciones
 */
export const parseExcelEstudiantes = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Obtener la primera hoja
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
          header: 1,
          defval: '' 
        });

        // Validar que tenga datos
        if (jsonData.length < 2) {
          reject(new Error('El archivo Excel está vacío o no tiene datos'));
          return;
        }

        // Parsear estudiantes (saltar la primera fila si es encabezado)
        const estudiantes = [];
        const startRow = jsonData[0][1]?.toString().toLowerCase().includes('apellido') ? 1 : 0;

        for (let i = startRow; i < jsonData.length; i++) {
          const row = jsonData[i];
          
          // Saltar filas vacías (verificar apellido y nombre)
          if (!row[1] && !row[3]) continue;

          const estudiante = {
            numero: row[0] ? parseInt(row[0]) : null,
            primer_apellido: row[1]?.toString().trim() || '',
            segundo_apellido: row[2]?.toString().trim() || '',
            nombre: row[3]?.toString().trim() || '',
            rut: formatRut(row[4]?.toString() || ''),
            telefono: row[5]?.toString().trim() || '',
            correo_electronico: row[6]?.toString().trim() || '',
            nombre_contacto_emergencia: row[7]?.toString().trim() || '',
            telefono_contacto_emergencia: row[8]?.toString().trim() || '',
            lugar_residencia: row[9]?.toString().trim() || '',
            carrera: row[10]?.toString().trim() || '',
            nivel_que_cursa: row[11]?.toString().trim() || '',
            tipo_practica: row[12]?.toString().trim() || '',
            campo_clinico_solicitado: row[13]?.toString().trim() || '',
            fecha_inicio: parseFecha(row[14]),
            fecha_termino: parseFecha(row[15]),
            numero_semanas_presenciales: row[16] ? parseInt(row[16]) : null,
            horario_desde: parseHorario(row[17]),
            horario_hasta: parseHorario(row[18]),
            cuarto_turno: row[19]?.toString().trim() || '',
            nombre_docente_centro_formador: row[20]?.toString().trim() || '',
            telefono_docente_centro_formador: row[21]?.toString().trim() || '',
            numero_registro_sis: row[22]?.toString().trim() || '',
            inmunizacion_al_dia: row[23]?.toString().trim() || '',
            numero_visitas: row[24] ? parseInt(row[24]) : null,
            fecha_supervision: parseFecha(row[25]),
            observaciones: row[26]?.toString().trim() || ''
          };

          // Validar campos obligatorios
          if (!estudiante.primer_apellido || !estudiante.nombre || !estudiante.rut) {
            console.warn(`Fila ${i + 1} omitida: faltan datos obligatorios (apellido, nombre o RUT)`);
            continue;
          }

          estudiantes.push(estudiante);
        }

        if (estudiantes.length === 0) {
          reject(new Error('No se encontraron estudiantes válidos en el archivo'));
          return;
        }

        resolve({
          estudiantes,
          total: estudiantes.length,
          nombreHoja: workbook.SheetNames[0]
        });

      } catch (error) {
        reject(new Error(`Error al procesar el archivo Excel: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Formatea un RUT chileno
 */
const formatRut = (rut) => {
  if (!rut) return '';
  
  // Remover puntos, guiones y espacios
  let rutLimpio = rut.toString().replace(/[.\-\s]/g, '');
  
  // Asegurar que tenga guión antes del dígito verificador
  if (rutLimpio.length > 1) {
    rutLimpio = rutLimpio.slice(0, -1) + '-' + rutLimpio.slice(-1);
  }
  
  return rutLimpio.toUpperCase();
};

/**
 * Parsea diferentes formatos de fecha
 */
const parseFecha = (fecha) => {
  if (!fecha) return null;

  // Si es un número (fecha de Excel)
  if (typeof fecha === 'number') {
    const date = XLSX.SSF.parse_date_code(fecha);
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }

  // Si es string, intentar parsear DD/MM/YYYY
  if (typeof fecha === 'string') {
    const parts = fecha.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  return null;
};

/**
 * Parsea horarios en formato HH:MM
 */
const parseHorario = (horario) => {
  if (!horario) return null;

  // Si es un número (horario de Excel como fracción de día)
  if (typeof horario === 'number') {
    const totalMinutes = Math.round(horario * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  // Si es string, intentar normalizar
  if (typeof horario === 'string') {
    const cleaned = horario.trim();
    // Si ya está en formato HH:MM
    if (/^\d{1,2}:\d{2}$/.test(cleaned)) {
      const [h, m] = cleaned.split(':');
      return `${String(h).padStart(2, '0')}:${m}`;
    }
  }

  return null;
};

/**
 * Genera un archivo Excel de ejemplo para descargar
 */
export const generarPlantillaExcel = () => {
  const data = [
    [
      'N°', '1° Apellido', '2° Apellido', 'Nombre', 'Rut', 'Telefono', 'Correo Electronico',
      'Nombre de contacto de emergencia', 'Telefono de contacto de emergencia', 'Lugar de residencia',
      'Carrera', 'Nivel que cursa', 'Tipo de practica', 'Campo clinico solicitado',
      'Fecha Inicio', 'Fecha termino', 'N° semanas presenciales', 'Desde (horario)', 'Hasta (horario)',
      'Cuarto turno', 'Nombre docente centro formador', 'Telefono docente centro formador',
      'N° reg. sis', 'Inmunizacion al dia (Si/No)', 'N° Visitas', 'Fecha de la supervision', 'Observaciones'
    ],
    [
      1, 'Pérez', 'González', 'Juan', '12345678-9', '+56912345678', 'juan.perez@ejemplo.cl',
      'María Pérez', '+56987654321', 'Santiago, Región Metropolitana',
      'Enfermería', '4to año', 'Práctica Profesional', 'Medicina Interna',
      '01/03/2025', '30/04/2025', 8, '08:00', '17:00',
      'No', 'Dra. Ana Silva', '+56911223344',
      'REG-2025-001', 'Si', 0, '', 'Estudiante destacado'
    ],
    [
      2, 'González', 'Muñoz', 'María', '98765432-1', '+56923456789', 'maria.gonzalez@ejemplo.cl',
      'Pedro González', '+56934567890', 'Valparaíso, Región de Valparaíso',
      'Medicina', '5to año', 'Internado', 'Urgencias',
      '01/03/2025', '30/06/2025', 16, '08:00', '20:00',
      'Si', 'Dr. Carlos Rojas', '+56945678901',
      'REG-2025-002', 'Si', 0, '', ''
    ],
    [
      3, 'Silva', 'Torres', 'Pedro', '11223344-5', '+56956789012', 'pedro.silva@ejemplo.cl',
      'Ana Silva', '+56967890123', 'Concepción, Región del Biobío',
      'Kinesiología', '3er año', 'Práctica Clínica', 'Traumatología',
      '15/03/2025', '15/05/2025', 8, '09:00', '18:00',
      'No', 'Klgo. Luis Morales', '+56978901234',
      'REG-2025-003', 'Si', 0, '', 'Requiere supervisión adicional'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Ajustar ancho de columnas
  const colWidths = [
    { wch: 5 },  // N°
    { wch: 15 }, // 1° Apellido
    { wch: 15 }, // 2° Apellido
    { wch: 15 }, // Nombre
    { wch: 12 }, // Rut
    { wch: 15 }, // Telefono
    { wch: 25 }, // Correo
    { wch: 25 }, // Contacto emergencia
    { wch: 15 }, // Tel emergencia
    { wch: 30 }, // Residencia
    { wch: 20 }, // Carrera
    { wch: 12 }, // Nivel
    { wch: 20 }, // Tipo práctica
    { wch: 25 }, // Campo clínico
    { wch: 12 }, // Fecha inicio
    { wch: 12 }, // Fecha término
    { wch: 10 }, // Semanas
    { wch: 10 }, // Desde
    { wch: 10 }, // Hasta
    { wch: 12 }, // Cuarto turno
    { wch: 25 }, // Docente
    { wch: 15 }, // Tel docente
    { wch: 15 }, // Reg SIS
    { wch: 15 }, // Inmunización
    { wch: 10 }, // Visitas
    { wch: 15 }, // Fecha supervisión
    { wch: 30 }  // Observaciones
  ];
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Nómina Estudiantes');

  // Generar archivo
  XLSX.writeFile(wb, 'plantilla_nomina_estudiantes.xlsx');
};

/**
 * Valida el formato del RUT chileno
 */
export const validarRut = (rut) => {
  if (!rut) return false;
  
  const rutLimpio = rut.replace(/[.\-]/g, '');
  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1).toUpperCase();
  
  if (!/^\d+$/.test(cuerpo)) return false;
  
  let suma = 0;
  let multiplo = 2;
  
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  
  const dvEsperado = 11 - (suma % 11);
  const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
  
  return dv === dvCalculado;
};
