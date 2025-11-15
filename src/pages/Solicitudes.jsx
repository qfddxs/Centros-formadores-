import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView, animate } from 'framer-motion';
import { supabase } from '../supabaseClient';
import Button from '../components/UI/Button';
import HeaderCentroFormador from '../components/UI/HeaderCentroFormador';
import {
  BuildingOffice2Icon,
  CalendarDaysIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PlusIcon,
  FunnelIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useNivelFormacion } from '../context/NivelFormacionContext';

// Componente para animar números
function Counter({ from = 0, to }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      animate(from, to, {
        duration: 1.5,
        onUpdate(value) {
          if (ref.current) {
            ref.current.textContent = Math.round(value).toLocaleString('es-CL');
          }
        },
      });
    }
  }, [from, to, isInView]);

  return <span ref={ref}>{from}</span>;
}

const PortalSolicitudes = () => {
  const navigate = useNavigate();
  const { nivelFormacion } = useNivelFormacion();
  const [centroInfo, setCentroInfo] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      // Obtener información del centro
      const { data: centroData } = await supabase
        .from('usuarios_centros')
        .select('*, centro_formador:centros_formadores(*)')
        .eq('user_id', user.id)
        .single();

      setCentroInfo(centroData);

      // Obtener solicitudes del centro
      const { data: solicitudesData } = await supabase
        .from('solicitudes_cupos')
        .select('*')
        .eq('centro_formador_id', centroData.centro_formador_id)
        .order('created_at', { ascending: false });

      setSolicitudes(solicitudesData || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('mis_solicitudes_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // Solo escuchar actualizaciones
          schema: 'public',
          table: 'solicitudes_cupos'
        },
        (payload) => {
          console.log('🔄 Solicitud actualizada:', payload);
          // Recargar solicitudes cuando hay cambios
          fetchData();
        }
      )
      .subscribe();

    // Cleanup: desuscribirse al desmontar
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'aprobada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rechazada':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'pendiente':
        return <ClockIcon className="w-4 h-4" />;
      case 'aprobada':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'rechazada':
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const solicitudesFiltradas = solicitudes.filter(solicitud => {
    if (filtroEstado === 'todas') return true;
    return solicitud.estado === filtroEstado;
  });

  const estadisticas = {
    total: solicitudes.length,
    pendientes: solicitudes.filter(s => s.estado === 'pendiente').length,
    aprobadas: solicitudes.filter(s => s.estado === 'aprobada').length,
    rechazadas: solicitudes.filter(s => s.estado === 'rechazada').length
  };

  const handleVerDetalle = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setModalDetalle(true);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Variantes de animación para Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 dark:border-teal-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <HeaderCentroFormador
        titulo="Mis Solicitudes"
        subtitulo={`${centroInfo?.centro_formador?.nombre} - ${nivelFormacion === 'pregrado' ? 'Pregrado' : 'Postgrado'}`}
        icono={DocumentTextIcon}
        codigoCentro={centroInfo?.centro_formador?.codigo}
      />

      {/* Botón Nueva Solicitud */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex justify-end ">
          <Button
            variant="primary"
            onClick={() => navigate('/solicitar')}
            className="flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Nueva Solicitud
          </Button>
        </div>
      </motion.div>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
        {/* Estadísticas */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white"><Counter to={estadisticas.total} /></p>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg"><DocumentTextIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" /></div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pendientes</p>
                <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-500"><Counter to={estadisticas.pendientes} /></p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg"><ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" /></div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Aprobadas</p>
                <p className="text-4xl font-bold text-green-600 dark:text-green-500"><Counter to={estadisticas.aprobadas} /></p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-lg"><CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" /></div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rechazadas</p>
                <p className="text-4xl font-bold text-red-600 dark:text-red-500"><Counter to={estadisticas.rechazadas} /></p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-lg"><XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" /></div>
            </div>
          </motion.div>
        </motion.div>

        {/* Filtros */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar por estado:</span>
            </div>
            <div className="flex gap-2">
              {[
                { key: 'todas', label: 'Todas', count: estadisticas.total },
                { key: 'pendiente', label: 'Pendientes', count: estadisticas.pendientes },
                { key: 'aprobada', label: 'Aprobadas', count: estadisticas.aprobadas },
                { key: 'rechazada', label: 'Rechazadas', count: estadisticas.rechazadas }
              ].map(filtro => (
                <button
                  key={filtro.key}
                  onClick={() => setFiltroEstado(filtro.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    filtroEstado === filtro.key
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {filtro.label} ({filtro.count})
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Lista de Solicitudes */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300 overflow-hidden">
          {solicitudesFiltradas.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <BuildingOffice2Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {filtroEstado === 'todas' ? 'No tienes solicitudes' : `No tienes solicitudes ${filtroEstado}s`}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {filtroEstado === 'todas' 
                  ? 'Crea tu primera solicitud de cupos clínicos'
                  : 'Cambia el filtro para ver otras solicitudes'
                }
              </p>
              {filtroEstado === 'todas' && (
                <Button
                  variant="primary"
                  onClick={() => navigate('/solicitar')}
                >
                  Crear Primera Solicitud
                </Button>
              )}
            </div>
          ) : (
            <motion.div
              className="divide-y divide-gray-200 dark:divide-gray-700"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {solicitudesFiltradas.map((solicitud) => (
                <motion.div key={solicitud.id} variants={itemVariants}>
                  <div className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        solicitud.estado === 'pendiente' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                        solicitud.estado === 'aprobada' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      }`}>
                        {getEstadoIcon(solicitud.estado)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {solicitud.especialidad}
                          </h3>
                          <span className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            solicitud.estado === 'pendiente' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                            solicitud.estado === 'aprobada' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                            'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                          }`}>
                            {solicitud.estado.charAt(0).toUpperCase() + solicitud.estado.slice(1)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <div className="flex items-center gap-1.5">
                            <UserGroupIcon className="w-4 h-4" />
                            <span>{solicitud.numero_cupos} cupos</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CalendarDaysIcon className="w-4 h-4" />
                            <span>{formatearFecha(solicitud.fecha_inicio)}</span>
                          </div>
                        </div>
                        
                        {solicitud.motivo_rechazo && (
                          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-800 dark:text-red-300">
                              <strong>Motivo de rechazo:</strong> {solicitud.motivo_rechazo}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-6">
                      <button
                        onClick={() => handleVerDetalle(solicitud)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      {/* Modal de Detalle */}
      <AnimatePresence>
        {modalDetalle && solicitudSeleccionada && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300"
            >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detalle de Solicitud</h2>
                <button
                  onClick={() => setModalDetalle(false)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Especialidad</label>
                  <p className="text-gray-900 dark:text-white">{solicitudSeleccionada.especialidad}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                    getEstadoColor(solicitudSeleccionada.estado)
                  }`}>
                    {getEstadoIcon(solicitudSeleccionada.estado)}
                    {solicitudSeleccionada.estado.charAt(0).toUpperCase() + solicitudSeleccionada.estado.slice(1)}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número de Cupos</label>
                  <p className="text-gray-900 dark:text-white">{solicitudSeleccionada.numero_cupos}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Solicitante</label>
                  <p className="text-gray-900 dark:text-white">{solicitudSeleccionada.solicitante || 'No especificado'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Inicio</label>
                  <p className="text-gray-900 dark:text-white">{formatearFecha(solicitudSeleccionada.fecha_inicio)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Término</label>
                  <p className="text-gray-900 dark:text-white">{formatearFecha(solicitudSeleccionada.fecha_termino)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Solicitud</label>
                  <p className="text-gray-900 dark:text-white">{formatearFecha(solicitudSeleccionada.created_at)}</p>
                </div>
              </div>
              
              {solicitudSeleccionada.comentarios && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comentarios</label>
                  <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">{solicitudSeleccionada.comentarios}</p>
                </div>
              )}
              
              {solicitudSeleccionada.motivo_rechazo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo de Rechazo</label>
                  <p className="text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">{solicitudSeleccionada.motivo_rechazo}</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setModalDetalle(false)}
              >
                Cerrar
              </Button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PortalSolicitudes;
