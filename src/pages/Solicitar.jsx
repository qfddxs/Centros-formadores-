import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Button from '../components/UI/Button';
import HeaderCentroFormador from '../components/UI/HeaderCentroFormador';
import {
  BuildingOffice2Icon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useNivelFormacion } from '../context/NivelFormacionContext';

const PortalSolicitar = () => {
  const navigate = useNavigate();
  const { nivelFormacion } = useNivelFormacion();
  const [centroInfo, setCentroInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cuposDisponibles, setCuposDisponibles] = useState(0);
  const [cuposTotales, setCuposTotales] = useState(0);
  
  const [formData, setFormData] = useState({
    especialidad: '',
    numero_cupos: 1,
    fecha_inicio: '',
    fecha_termino: '',
    comentarios: '',
    solicitante: ''
  });

  // Especialidades según nivel de formación
  const especialidadesPregrado = [
    'Enfermería',
    'Técnico de Nivel Superior en Enfermería',
    'Medicina',
    'Kinesiología',
    'Nutrición',
    'Obstetricia',
    'Odontología',
    'Tecnología Médica',
    'Técnico en Laboratorio Clínico',
    'Técnico en Radiología',
    'Terapia Ocupacional',
    'Fonoaudiología',
    'Química y Farmacia',
    'Podología',
    'Técnico en Enfermería',
    'Técnico Paramédico'
  ];

  const especialidadesPostgrado = [
    'Medicina - Especialización',
    'Odontología - Especialización',
    'Enfermería en Cuidados Críticos',
    'Medicina Familiar',
    'Pediatría',
    'Cirugía',
    'Medicina Interna',
    'Ginecología y Obstetricia'
  ];

  const especialidadesDisponibles = nivelFormacion === 'pregrado' 
    ? especialidadesPregrado 
    : especialidadesPostgrado;

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
      
      // Obtener cupos disponibles
      if (centroData?.centro_formador) {
        setCuposDisponibles(centroData.centro_formador.cupos_disponibles || 0);
        setCuposTotales(centroData.centro_formador.cupos_totales || 0);
      }
      
      setFormData(prev => ({
        ...prev,
        solicitante: user.user_metadata?.nombre_completo || ''
      }));
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
      [name]: name === 'numero_cupos' ? parseInt(value) || 1 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Validaciones
      if (!formData.especialidad) {
        throw new Error('Debes seleccionar una especialidad');
      }

      if (!formData.fecha_inicio || !formData.fecha_termino) {
        throw new Error('Debes especificar las fechas de inicio y término');
      }

      if (new Date(formData.fecha_termino) <= new Date(formData.fecha_inicio)) {
        throw new Error('La fecha de término debe ser posterior a la fecha de inicio');
      }

      // Validar cupos disponibles
      if (formData.numero_cupos > cuposDisponibles) {
        throw new Error(`No puedes solicitar más cupos de los disponibles. Tienes ${cuposDisponibles} cupos disponibles.`);
      }

      if (formData.numero_cupos <= 0) {
        throw new Error('Debes solicitar al menos 1 cupo');
      }

      // Crear solicitud
      const { data, error } = await supabase
        .from('solicitudes_cupos')
        .insert([{
          centro_formador_id: centroInfo.centro_formador_id,
          especialidad: formData.especialidad,
          numero_cupos: formData.numero_cupos,
          fecha_inicio: formData.fecha_inicio,
          fecha_termino: formData.fecha_termino,
          solicitante: formData.solicitante,
          comentarios: formData.comentarios,
          estado: 'pendiente',
          fecha_solicitud: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (error) throw error;

      setSuccess(true);
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/solicitudes');
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud Enviada!</h2>
          <p className="text-gray-600 mb-6">
            Tu solicitud de cupos ha sido enviada exitosamente. El hospital la revisará y te notificará el resultado.
          </p>
          <p className="text-sm text-gray-500">Redirigiendo a tus solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <HeaderCentroFormador
        titulo="Solicitar Cupos Clínicos"
        subtitulo={`${centroInfo?.centro_formador?.nombre} - ${nivelFormacion === 'pregrado' ? 'Pregrado' : 'Postgrado'}`}
        icono={DocumentTextIcon}
      />

      {/* Contenido */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Indicador de Cupos Disponibles */}
        <div className="mb-6 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-teal-50 mb-1">Cupos Disponibles</p>
              <p className="text-4xl font-bold">{cuposDisponibles}</p>
              <p className="text-sm text-teal-50 mt-1">de {cuposTotales} cupos totales</p>
            </div>
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              <UserGroupIcon className="w-12 h-12" />
            </div>
          </div>
          {cuposDisponibles === 0 && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-300/30 rounded-lg">
              <p className="text-sm font-medium">⚠️ No tienes cupos disponibles para solicitar</p>
            </div>
          )}
          {cuposDisponibles > 0 && cuposDisponibles <= 5 && (
            <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-300/30 rounded-lg">
              <p className="text-sm font-medium">⚠️ Quedan pocos cupos disponibles</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 transition-colors duration-300">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Información de la Solicitud */}
            <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-6 transition-colors duration-300">
              <h3 className="text-lg font-semibold text-teal-900 dark:text-teal-300 mb-4 flex items-center gap-2 transition-colors">
                <AcademicCapIcon className="w-5 h-5" />
                Información de la Solicitud
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="especialidad" className="block text-sm font-medium text-gray-700 mb-2">
                    Especialidad/Carrera *
                  </label>
                  <select
                    name="especialidad"
                    id="especialidad"
                    required
                    value={formData.especialidad}
                    onChange={handleChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Selecciona una especialidad</option>
                    {especialidadesDisponibles.map(esp => (
                      <option key={esp} value={esp}>{esp}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="numero_cupos" className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Cupos * 
                    <span className="text-xs text-gray-500 ml-2">
                      (Máximo: {cuposDisponibles})
                    </span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserGroupIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="numero_cupos"
                      id="numero_cupos"
                      min="1"
                      max={cuposDisponibles}
                      required
                      value={formData.numero_cupos}
                      onChange={handleChange}
                      disabled={cuposDisponibles === 0}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        formData.numero_cupos > cuposDisponibles 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300'
                      } ${cuposDisponibles === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  {formData.numero_cupos > cuposDisponibles && (
                    <p className="mt-2 text-sm text-red-600">
                      ⚠️ Excede los cupos disponibles ({cuposDisponibles})
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Fechas */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 transition-colors duration-300">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4 flex items-center gap-2 transition-colors">
                <CalendarDaysIcon className="w-5 h-5" />
                Duración de Práctica
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="fecha_termino" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Información Adicional */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 transition-colors duration-300">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-4 flex items-center gap-2 transition-colors">
                <BuildingOffice2Icon className="w-5 h-5" />
                Información Adicional
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="solicitante" className="block text-sm font-medium text-gray-700 mb-2">
                    Solicitante
                  </label>
                  <input
                    type="text"
                    name="solicitante"
                    id="solicitante"
                    value={formData.solicitante}
                    onChange={handleChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Nombre del responsable de la solicitud"
                  />
                </div>

                <div>
                  <label htmlFor="comentarios" className="block text-sm font-medium text-gray-700 mb-2">
                    Comentarios Adicionales
                  </label>
                  <textarea
                    name="comentarios"
                    id="comentarios"
                    rows={4}
                    value={formData.comentarios}
                    onChange={handleChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                    placeholder="Información adicional sobre la solicitud, requisitos especiales, etc."
                  />
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
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
                disabled={submitting || cuposDisponibles === 0 || formData.numero_cupos > cuposDisponibles}
                className="min-w-[140px]"
              >
                {submitting ? 'Enviando...' : cuposDisponibles === 0 ? 'Sin Cupos Disponibles' : 'Enviar Solicitud'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default PortalSolicitar;
