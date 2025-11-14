import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Button from '../components/UI/Button';
import HeaderCentroFormador from '../components/UI/HeaderCentroFormador';
import {
  CalendarDaysIcon,
  UserGroupIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { parseExcelEstudiantes, generarPlantillaExcel } from '../utils/excelParser';
import { subirArchivoExcel } from '../utils/storageHelper';

const SolicitudRotacion = () => {
  const navigate = useNavigate();
  const [centroInfo, setCentroInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [estudiantesParsed, setEstudiantesParsed] = useState(null);
  const [parsing, setParsing] = useState(false);
  
  const [formData, setFormData] = useState({
    especialidad: '',
    fecha_inicio: '',
    fecha_termino: '',
    comentarios: ''
  });

  useEffect(() => {
    fetchCentroInfo();
  }, []);

  const fetchCentroInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: centroData } = await supabase
        .from('usuarios_centros')
        .select('*, centro_formador:centros_formadores(*)')
        .eq('user_id', user.id)
        .single();

      setCentroInfo(centroData);
    } catch (err) {
      console.error('Error:', err);
      setError('Error al cargar información del centro');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar que sea un archivo Excel
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!validTypes.includes(file.type)) {
      setError('Por favor selecciona un archivo Excel válido (.xls o .xlsx)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      setError('El archivo no debe superar los 5MB');
      return;
    }

    setExcelFile(file);
    setError('');
    setParsing(true);

    try {
      // Parsear el archivo Excel
      const resultado = await parseExcelEstudiantes(file);
      setEstudiantesParsed(resultado);
      console.log('Estudiantes parseados:', resultado);
    } catch (err) {
      setError(err.message);
      setExcelFile(null);
      setEstudiantesParsed(null);
    } finally {
      setParsing(false);
    }
  };

  const removeFile = () => {
    setExcelFile(null);
    setEstudiantesParsed(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Validaciones
      if (!formData.especialidad || !formData.fecha_inicio || !formData.fecha_termino) {
        throw new Error('Debes completar todos los campos obligatorios');
      }

      if (!excelFile || !estudiantesParsed) {
        throw new Error('Debes adjuntar la planilla de estudiantes en formato Excel');
      }

      if (new Date(formData.fecha_termino) <= new Date(formData.fecha_inicio)) {
        throw new Error('La fecha de término debe ser posterior a la fecha de inicio');
      }

      // 1. Subir archivo Excel a Storage
      console.log('Subiendo archivo Excel...');
      const archivoData = await subirArchivoExcel(excelFile, centroInfo.centro_formador_id);

      // 2. Crear solicitud de rotación
      console.log('Creando solicitud de rotación...');
      const { data: solicitud, error: solicitudError } = await supabase
        .from('solicitudes_rotacion')
        .insert([{
          centro_formador_id: centroInfo.centro_formador_id,
          especialidad: formData.especialidad,
          fecha_inicio: formData.fecha_inicio,
          fecha_termino: formData.fecha_termino,
          comentarios: formData.comentarios,
          archivo_excel_url: archivoData.url,
          archivo_excel_nombre: archivoData.nombre,
          estado: 'pendiente',
          fecha_solicitud: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (solicitudError) throw solicitudError;

      // 3. Insertar estudiantes parseados
      console.log('Guardando estudiantes...');
      const estudiantesData = estudiantesParsed.estudiantes.map(est => ({
        solicitud_rotacion_id: solicitud.id,
        ...est
      }));

      const { error: estudiantesError } = await supabase
        .from('estudiantes_rotacion')
        .insert(estudiantesData);

      if (estudiantesError) throw estudiantesError;

      console.log('✅ Solicitud creada exitosamente');
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err) {
      console.error('Error al crear solicitud:', err);
      setError(err.message || 'Error al crear la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 dark:border-teal-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">¡Solicitud Enviada!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Tu solicitud de rotación ha sido enviada exitosamente.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Redirigiendo al dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <HeaderCentroFormador
        titulo="Solicitud de Rotación"
        subtitulo={centroInfo?.centro_formador?.nombre}
        icono={UserGroupIcon}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 transition-colors duration-300">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Información Básica */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-4">Información de la Rotación</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="especialidad" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Especialidad/Carrera *
                  </label>
                  <input
                    type="text"
                    name="especialidad"
                    id="especialidad"
                    required
                    value={formData.especialidad}
                    onChange={handleChange}
                    className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                    placeholder="Ej: Enfermería, Medicina, etc."
                  />
                </div>
              </div>
            </div>

            {/* Fechas */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4 flex items-center gap-2">
                <CalendarDaysIcon className="w-5 h-5" />
                Duración de Práctica
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    name="fecha_inicio"
                    id="fecha_inicio"
                    required
                    value={formData.fecha_inicio}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="fecha_termino" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de Término *
                  </label>
                  <input
                    type="date"
                    name="fecha_termino"
                    id="fecha_termino"
                    required
                    value={formData.fecha_termino}
                    onChange={handleChange}
                    min={formData.fecha_inicio || new Date().toISOString().split('T')[0]}
                    className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Planilla de Estudiantes */}
            <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-teal-900 dark:text-teal-300 mb-4 flex items-center gap-2">
                <DocumentArrowUpIcon className="w-5 h-5" />
                Planilla de Estudiantes
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Adjunta un archivo Excel con la lista de estudiantes que participarán en la rotación.
                  </p>
                  <button
                    type="button"
                    onClick={generarPlantillaExcel}
                    className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium underline"
                  >
                    Descargar plantilla
                  </button>
                </div>

                {!excelFile ? (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-teal-500 dark:hover:border-teal-400 transition-colors">
                    <DocumentArrowUpIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    <label htmlFor="excel-upload" className="cursor-pointer">
                      <span className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium">
                        Selecciona un archivo
                      </span>
                      <span className="text-gray-600 dark:text-gray-400"> o arrastra aquí</span>
                      <input
                        id="excel-upload"
                        type="file"
                        accept=".xls,.xlsx"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={parsing}
                      />
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Excel (.xls, .xlsx) - Máx. 5MB</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-gray-700 border border-teal-200 dark:border-teal-700 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                          <DocumentArrowUpIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{excelFile.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {(excelFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        disabled={parsing || submitting}
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Estado de parseo */}
                    {parsing && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
                        <p className="text-sm text-blue-700 dark:text-blue-300">Procesando archivo Excel...</p>
                      </div>
                    )}

                    {/* Resultado del parseo */}
                    {estudiantesParsed && !parsing && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-900 dark:text-green-300">
                              Archivo procesado exitosamente
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                              Se encontraron {estudiantesParsed.total} estudiantes válidos
                            </p>
                            
                            {/* Vista previa de estudiantes */}
                            <div className="mt-3 bg-white dark:bg-gray-700 rounded-lg p-3 max-h-48 overflow-y-auto">
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Vista previa:</p>
                              <div className="space-y-1">
                                {estudiantesParsed.estudiantes.slice(0, 5).map((est, idx) => (
                                  <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                    <span className="font-mono bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded">{est.rut}</span>
                                    <span>{est.nombre} {est.apellido}</span>
                                    {est.email && <span className="text-gray-400 dark:text-gray-500">• {est.email}</span>}
                                  </div>
                                ))}
                                {estudiantesParsed.estudiantes.length > 5 && (
                                  <p className="text-xs text-gray-500 dark:text-gray-500 italic mt-2">
                                    ... y {estudiantesParsed.estudiantes.length - 5} más
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Comentarios */}
            <div>
              <label htmlFor="comentarios" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Comentarios Adicionales
              </label>
              <textarea
                name="comentarios"
                id="comentarios"
                rows={4}
                value={formData.comentarios}
                onChange={handleChange}
                className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent resize-none"
                placeholder="Información adicional sobre la rotación..."
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/dashboard')}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                className="min-w-[140px]"
              >
                {submitting ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default SolicitudRotacion;
