import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import ThemeToggle from '../components/UI/ThemeToggle';
import {
  BuildingOffice2Icon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const PortalDashboard = () => {
  console.log('🚀 PortalDashboard component loaded');

  const navigate = useNavigate();
  const [centroInfo, setCentroInfo] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudesRotacion, setSolicitudesRotacion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());

  useEffect(() => {
    console.log('🔄 useEffect ejecutándose');
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Efecto separado para realtime (solo cuando hay cambios en la BD)
  useEffect(() => {
    if (!centroInfo?.centro_formador_id) return;

    console.log('🔄 Configurando realtime...');

    // Suscripción a cambios en tiempo real para solicitudes de cupos
    const channelCupos = supabase
      .channel('solicitudes_cupos_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar todos los eventos (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'solicitudes_cupos'
        },
        (payload) => {
          console.log('🔔 Cambio detectado en solicitudes de cupos:', payload);
          fetchDataSilent();
        }
      )
      .subscribe();

    // Suscripción a cambios en tiempo real para solicitudes de rotación
    const channelRotacion = supabase
      .channel('solicitudes_rotacion_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar todos los eventos (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'solicitudes_rotacion'
        },
        (payload) => {
          console.log('🔔 Cambio detectado en solicitudes de rotación:', payload);
          fetchDataSilent();
        }
      )
      .subscribe();

    // Cleanup: desuscribirse al desmontar
    return () => {
      console.log('🧹 Limpiando realtime...');
      supabase.removeChannel(channelCupos);
      supabase.removeChannel(channelRotacion);
    };
  }, [centroInfo?.centro_formador_id]);

  const fetchData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Error obteniendo usuario:', userError);
        navigate('/login');
        return;
      }

      console.log('✅ Usuario autenticado:', user.id);

      // Obtener información del centro
      const { data: centroData, error: centroError } = await supabase
        .from('usuarios_centros')
        .select('*, centro_formador:centros_formadores(*)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (centroError) {
        console.error('❌ Error obteniendo centro:', centroError);
        throw centroError;
      }

      if (!centroData) {
        console.error('❌ No se encontró vínculo con centro formador');
        alert('No se encontró tu centro formador. Por favor contacta al administrador.');
        navigate('/login');
        return;
      }

      console.log('✅ Centro encontrado:', centroData);
      setCentroInfo(centroData);

      // Obtener solicitudes de cupos del centro
      const { data: solicitudesData, error: solicitudesError } = await supabase
        .from('solicitudes_cupos')
        .select('*')
        .eq('centro_formador_id', centroData.centro_formador_id)
        .order('created_at', { ascending: false });

      if (solicitudesError) {
        console.error('❌ Error obteniendo solicitudes de cupos:', solicitudesError);
      } else {
        console.log('✅ Solicitudes de cupos obtenidas:', solicitudesData?.length || 0);
      }

      // Obtener solicitudes de rotación del centro
      const { data: solicitudesRotacionData, error: solicitudesRotacionError } = await supabase
        .from('solicitudes_rotacion')
        .select('*')
        .eq('centro_formador_id', centroData.centro_formador_id)
        .order('created_at', { ascending: false });

      if (solicitudesRotacionError) {
        console.error('❌ Error obteniendo solicitudes de rotación:', solicitudesRotacionError);
      } else {
        console.log('✅ Solicitudes de rotación obtenidas:', solicitudesRotacionData?.length || 0);
      }

      setSolicitudes(solicitudesData || []);
      setSolicitudesRotacion(solicitudesRotacionData || []);
    } catch (err) {
      console.error('❌ Error general:', err);
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar datos sin mostrar loading (para polling y realtime)
  const fetchDataSilent = async () => {
    try {
      if (!centroInfo?.centro_formador_id) return;

      // Obtener solicitudes de cupos del centro
      const { data: solicitudesData } = await supabase
        .from('solicitudes_cupos')
        .select('*')
        .eq('centro_formador_id', centroInfo.centro_formador_id)
        .order('created_at', { ascending: false });

      // Obtener solicitudes de rotación del centro
      const { data: solicitudesRotacionData } = await supabase
        .from('solicitudes_rotacion')
        .select('*')
        .eq('centro_formador_id', centroInfo.centro_formador_id)
        .order('created_at', { ascending: false });

      setSolicitudes(solicitudesData || []);
      setSolicitudesRotacion(solicitudesRotacionData || []);
      setUltimaActualizacion(new Date());
    } catch (err) {
      console.error('❌ Error en actualización silenciosa:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
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

  // Combinar todas las solicitudes con su tipo
  const todasLasSolicitudes = [
    ...solicitudes.map(s => ({ ...s, tipo: 'cupos' })),
    ...solicitudesRotacion.map(s => ({ ...s, tipo: 'rotacion' }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Variantes de animación para Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <motion.header initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* Código del Centro Formador */}
              {centroInfo?.centro_formador?.codigo && (
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all hover:scale-105">
                    <span className="text-white font-bold text-sm tracking-tight">
                      {centroInfo.centro_formador.codigo}
                    </span>
                  </div>
                </div>
              )}

              {/* Separador vertical */}
              {centroInfo?.centro_formador?.codigo && (
                <div className="h-10 w-px bg-gray-300 dark:bg-gray-600"></div>
              )}

              <div className="w-12 h-12 bg-teal-600 dark:bg-teal-700 rounded-lg flex items-center justify-center transition-colors">
                <BuildingOffice2Icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">
                  {centroInfo?.centro_formador?.nombre}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">Portal de Centros Formadores</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Indicador de actualización */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Actualizado {ultimaActualizacion.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              
              {/* Botón de tema */}
              <ThemeToggle />
              
              {/* Botón Salir */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Principal (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bienvenida */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors mb-1">
                Bienvenido al Portal
              </h2>
              <p className="text-gray-600 dark:text-gray-400 transition-colors">
                Aquí tienes un resumen de la actividad de tu centro.
              </p>
            </motion.div>

            {/* Actividad Reciente */}
            {todasLasSolicitudes.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 transition-colors">Actividad Reciente</h3>
                <div className="space-y-3">
                  {todasLasSolicitudes.slice(0, 10).map(solicitud => (
                    <div key={`${solicitud.tipo}-${solicitud.id}`} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            solicitud.tipo === 'cupos' 
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                              : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
                          }`}>
                            {solicitud.tipo === 'cupos' ? 'Solicitud de Cupos' : 'Solicitud de Rotación'}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white transition-colors">
                          {solicitud.especialidad}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                          {solicitud.tipo === 'cupos' 
                            ? `${solicitud.numero_cupos} cupos` 
                            : `${new Date(solicitud.fecha_inicio).toLocaleDateString('es-CL')} - ${new Date(solicitud.fecha_termino).toLocaleDateString('es-CL')}`
                          } • {new Date(solicitud.created_at).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        solicitud.estado === 'pendiente' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                        solicitud.estado === 'aprobada' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                      }`}>
                        {solicitud.estado.charAt(0).toUpperCase() + solicitud.estado.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Solicitudes Pendientes y Rechazadas */}
            <div className="space-y-6">
              {/* Solicitudes Pendientes */}
              {solicitudes.filter(s => s.estado === 'pendiente').length > 0 && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-yellow-200 dark:border-yellow-700/50 p-6 transition-colors duration-300"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <ClockIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors">
                      Solicitudes Pendientes ({solicitudes.filter(s => s.estado === 'pendiente').length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {solicitudes.filter(s => s.estado === 'pendiente').slice(0, 5).map(solicitud => (
                      <div key={solicitud.id} className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-colors duration-300 border border-yellow-200 dark:border-yellow-700/30">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white transition-colors">{solicitud.especialidad}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                            {solicitud.numero_cupos} cupos - {new Date(solicitud.created_at).toLocaleDateString('es-CL')}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 transition-colors">
                          Pendiente
                        </span>
                      </div>
                    ))}
                  </div>
                  {solicitudes.filter(s => s.estado === 'pendiente').length > 5 && (
                    <button
                      onClick={() => navigate('/solicitudes')}
                      className="mt-4 w-full text-center text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 font-medium transition-colors"
                    >
                      Ver todas las pendientes ({solicitudes.filter(s => s.estado === 'pendiente').length})
                    </button>
                  )}
                </motion.div>
              )}

              {/* Solicitudes Rechazadas */}
              {solicitudes.filter(s => s.estado === 'rechazada').length > 0 && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-red-200 dark:border-red-700/50 p-6 transition-colors duration-300"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors">
                      Solicitudes Rechazadas ({solicitudes.filter(s => s.estado === 'rechazada').length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {solicitudes.filter(s => s.estado === 'rechazada').slice(0, 5).map(solicitud => (
                      <div key={solicitud.id} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors duration-300 border border-red-200 dark:border-red-700/30">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white transition-colors">{solicitud.especialidad}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                            {solicitud.numero_cupos} cupos - {new Date(solicitud.created_at).toLocaleDateString('es-CL')}
                          </p>
                          {solicitud.motivo_rechazo && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1 italic">
                              Motivo: {solicitud.motivo_rechazo}
                            </p>
                          )}
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 transition-colors">
                          Rechazada
                        </span>
                      </div>
                    ))}
                  </div>
                  {solicitudes.filter(s => s.estado === 'rechazada').length > 5 && (
                    <button
                      onClick={() => navigate('/solicitudes')}
                      className="mt-4 w-full text-center text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
                    >
                      Ver todas las rechazadas ({solicitudes.filter(s => s.estado === 'rechazada').length})
                    </button>
                  )}
                </motion.div>
              )}


            </div>
          </div>

          {/* Barra Lateral (1/3) */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Acciones Rápidas</h3>
              <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
                {[
                  { title: 'Solicitar Cupos', desc: 'Nueva solicitud de cupos clínicos', icon: DocumentTextIcon, path: '/solicitar', color: 'teal' },
                  { title: 'Solicitud de Rotación', desc: 'Gestiona rotaciones de estudiantes', icon: ClockIcon, path: '/solicitud-rotacion', color: 'purple' },
                  { title: 'Solicitudes de Rotación', desc: 'Ver estado de rotaciones enviadas', icon: CheckCircleIcon, path: '/solicitudes-rotacion', color: 'indigo' },
                  { title: 'Seguimiento Estudiantes', desc: 'Asistencia y observaciones en tiempo real', icon: BuildingOffice2Icon, path: '/seguimiento-estudiantes', color: 'green' },
                  { title: 'Gestión Documental', desc: 'Sube certificados y documentos', icon: DocumentTextIcon, path: '/gestion-documental', color: 'blue' },
                  { title: 'Mis Solicitudes', desc: 'Revisa el estado de tus solicitudes', icon: CheckCircleIcon, path: '/solicitudes', color: 'orange' },
                ].map((action) => (
                  <motion.div
                    key={action.title}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, x: 4 }}
                    className="group flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    onClick={() => navigate(action.path)}
                  >
                    <div className={`p-3 rounded-lg bg-${action.color}-100 dark:bg-${action.color}-900/40`}>
                      <action.icon className={`w-6 h-6 text-${action.color}-600 dark:text-${action.color}-300`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-100">{action.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{action.desc}</p>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:translate-x-1 transition-transform" />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
};

export default PortalDashboard;
