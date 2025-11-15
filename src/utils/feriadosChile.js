// Feriados de Chile 2025
export const feriadosChile2025 = {
  '2025-01-01': 'Año Nuevo',
  '2025-04-18': 'Viernes Santo',
  '2025-04-19': 'Sábado Santo',
  '2025-05-01': 'Día del Trabajo',
  '2025-05-21': 'Día de las Glorias Navales',
  '2025-06-29': 'San Pedro y San Pablo',
  '2025-07-16': 'Día de la Virgen del Carmen',
  '2025-08-15': 'Asunción de la Virgen',
  '2025-09-18': 'Día de la Independencia Nacional',
  '2025-09-19': 'Día de las Glorias del Ejército',
  '2025-10-12': 'Encuentro de Dos Mundos',
  '2025-10-31': 'Día de las Iglesias Evangélicas y Protestantes',
  '2025-11-01': 'Día de Todos los Santos',
  '2025-12-08': 'Inmaculada Concepción',
  '2025-12-25': 'Navidad'
};

export const esFeriado = (fecha) => {
  const fechaStr = fecha.toISOString().split('T')[0];
  return feriadosChile2025[fechaStr] || null;
};

export const esDomingo = (fecha) => {
  return fecha.getDay() === 0; // 0 = Domingo
};

export const esSabado = (fecha) => {
  return fecha.getDay() === 6; // 6 = Sábado
};

export const esNoLaboral = (fecha) => {
  // Solo domingos y feriados son no laborales
  // Los sábados SÍ son laborales en salud
  return esDomingo(fecha) || esFeriado(fecha) !== null;
};
