import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, useInView, animate } from 'framer-motion';
import Button from '../components/UI/Button';
// import HeaderCentroFormador from '../components/UI/HeaderCentroFormador'; // No se usa en este componente
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

const PortalDashboard = () => {
  console.log('🚀 PortalDashboard component loaded');

  const navigate = useNavigate();
  const [centroInfo, setCentroInfo] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 useEffect ejecutándose');
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Error obteniendo usuario:', userError);
        navigate('/login');
        return;
      }

      console.log('Usuario autenticado:', user.id);

      // Obtener información del centro
      const { data: centroData, error: centroError } = await supabase
        .from('usuarios_centros')
        .select('*, centro_formador:centros_formadores(*)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (centroError) {
        console.error('Error obteniendo centro:', centroError);
        throw centroError;
      }

      if (!centroData) {
        console.error('No se encontró vínculo con centro formador');
        alert('No se encontró tu centro formador. Por favor contacta al administrador.');
        navigate('/login');
        return;
      }

      console.log('Centro encontrado:', centroData);
      setCentroInfo(centroData);

      // Obtener solicitudes del centro
      const { data: solicitudesData, error: solicitudesError } = await supabase
        .from('solicitudes_cupos')
        .select('*')
        .eq('centro_formador_id', centroData.centro_formador_id)
        .order('created_at', { ascending: false });

      if (solicitudesError) {
        console.error('Error obteniendo solicitudes:', solicitudesError);
      }

      setSolicitudes(solicitudesData || []);
    } catch (err) {
      console.error('Error general:', err);
    } finally {
      setLoading(false);
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

  const estadisticas = {
    total: solicitudes.length,
    pendientes: solicitudes.filter(s => s.estado === 'pendiente').length,
    aprobadas: solicitudes.filter(s => s.estado === 'aprobada').length,
    rechazadas: solicitudes.filter(s => s.estado === 'rechazada').length
  };

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
              {/* Logo IP Chile */}
              <a
                href="https://www.ipchile.cl/encuentra-tu-carrera/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-50 rounded-lg transition-all group flex-shrink-0"
                title="Instituto Profesional de Chile"
              >
                <img 
                  src="https://www.ipchile.cl/wp-content/uploads/2021/03/logo-ipchile.png" 
                  alt="IP Chile Logo" 
                  className="h-10 w-auto object-contain group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-16 h-10 bg-blue-600 rounded-lg items-center justify-center group-hover:bg-blue-700 transition-colors">
                  <span className="text-white font-bold text-lg">IP</span>
                </div>
              </a>

              {/* Separador vertical */}
              <div className="h-10 w-px bg-gray-300"></div>

              <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center">
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

            {/* Estadísticas */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Solicitudes</p>
                    <p className="text-4xl font-bold text-gray-900 dark:text-white"><Counter to={estadisticas.total} /></p>
                  </div>
                  <div className="p-3 bg-teal-100 dark:bg-teal-900/40 rounded-lg"><DocumentTextIcon className="w-6 h-6 text-teal-600 dark:text-teal-300" /></div>
                </div>
              </motion.div>
              <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Pendientes</p>
                    <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-500"><Counter to={estadisticas.pendientes} /></p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg"><ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" /></div>
                </div>
              </motion.div>
              <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Aprobadas</p>
                    <p className="text-4xl font-bold text-green-600 dark:text-green-500"><Counter to={estadisticas.aprobadas} /></p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-lg"><CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" /></div>
                </div>
              </motion.div>
              <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Rechazadas</p>
                    <p className="text-4xl font-bold text-red-600 dark:text-red-500"><Counter to={estadisticas.rechazadas} /></p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-lg"><XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" /></div>
                </div>
              </motion.div>
            </motion.div>

            {/* Últimas Solicitudes */}
            {solicitudes.length > 0 && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 transition-colors">Actividad Reciente</h3>
                <div className="space-y-3">
                  {solicitudes.slice(0, 5).map(solicitud => (
                    <div key={solicitud.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white transition-colors">{solicitud.especialidad}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                          {solicitud.numero_cupos} cupos - {new Date(solicitud.created_at).toLocaleDateString('es-CL')}
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
          </div>

          {/* Barra Lateral (1/3) */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Acciones Rápidas</h3>
              <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
                {[
                  { title: 'Solicitar Cupos', desc: 'Nueva solicitud de cupos clínicos', icon: DocumentTextIcon, path: '/solicitar', color: 'teal' },
                  { title: 'Solicitud de Rotación', desc: 'Gestiona rotaciones de estudiantes', icon: ClockIcon, path: '/solicitud-rotacion', color: 'purple' },
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
