import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Button from '../components/UI/Button';
import HeaderCentroFormador from '../components/UI/HeaderCentroFormador';
import ThemeToggle from '../components/UI/ThemeToggle';
import {
  BuildingOffice2Icon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
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
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bienvenida */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors mb-2">
            Bienvenido al Portal
          </h2>
          <p className="text-gray-600 dark:text-gray-400 transition-colors">
            Gestiona tus solicitudes de cupos clínicos de forma rápida y sencilla
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Total Solicitudes</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">{estadisticas.total}</p>
              </div>
              <DocumentTextIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 transition-colors" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-500 transition-colors">{estadisticas.pendientes}</p>
              </div>
              <ClockIcon className="w-12 h-12 text-yellow-400 transition-colors" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Aprobadas</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-500 transition-colors">{estadisticas.aprobadas}</p>
              </div>
              <CheckCircleIcon className="w-12 h-12 text-green-400 transition-colors" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Rechazadas</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-500 transition-colors">{estadisticas.rechazadas}</p>
              </div>
              <XCircleIcon className="w-12 h-12 text-red-400 transition-colors" />
            </div>
          </div>
        </div>

        {/* Menú de Acciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => navigate('/solicitar')}>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
              <DocumentTextIcon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-2">Solicitar Cupos</h3>
            <p className="text-sm text-teal-50">
              Nueva solicitud de cupos clínicos
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => navigate('/solicitud-rotacion')}>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
              <ClockIcon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-2">Solicitud de Rotación</h3>
            <p className="text-sm text-purple-50">
              Gestiona rotaciones de estudiantes
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => navigate('/gestion-documental')}>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
              <DocumentTextIcon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-2">Gestión Documental</h3>
            <p className="text-sm text-blue-50">
              Sube certificados y documentos
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => navigate('/solicitudes')}>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
              <CheckCircleIcon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-2">Mis Solicitudes</h3>
            <p className="text-sm text-orange-50">
              Revisa el estado de tus solicitudes
            </p>
          </div>
        </div>

        {/* Últimas Solicitudes */}
        {solicitudes.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 transition-colors">Últimas Solicitudes</h3>
            <div className="space-y-3">
              {solicitudes.slice(0, 5).map(solicitud => (
                <div key={solicitud.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors duration-300">
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
          </div>
        )}
      </main>
    </div>
  );
};

export default PortalDashboard;
