import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Button from '../components/UI/Button';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center">
                <BuildingOffice2Icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {centroInfo?.centro_formador?.nombre}
                </h1>
                <p className="text-sm text-gray-500">Portal de Centros Formadores</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bienvenida */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenido al Portal
          </h2>
          <p className="text-gray-600">
            Gestiona tus solicitudes de cupos clínicos de forma rápida y sencilla
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Solicitudes</p>
                <p className="text-3xl font-bold text-gray-900">{estadisticas.total}</p>
              </div>
              <DocumentTextIcon className="w-12 h-12 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-600">{estadisticas.pendientes}</p>
              </div>
              <ClockIcon className="w-12 h-12 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Aprobadas</p>
                <p className="text-3xl font-bold text-green-600">{estadisticas.aprobadas}</p>
              </div>
              <CheckCircleIcon className="w-12 h-12 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Rechazadas</p>
                <p className="text-3xl font-bold text-red-600">{estadisticas.rechazadas}</p>
              </div>
              <XCircleIcon className="w-12 h-12 text-red-400" />
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-8 text-white shadow-lg">
            <h3 className="text-2xl font-bold mb-3">Solicitar Cupos</h3>
            <p className="mb-6 text-teal-50">
              Crea una nueva solicitud de cupos clínicos para tus estudiantes
            </p>
            <Button
              variant="secondary"
              onClick={() => navigate('/solicitar')}
              className="bg-white text-teal-600 hover:bg-teal-50"
            >
              Nueva Solicitud
            </Button>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-8 text-white shadow-lg">
            <h3 className="text-2xl font-bold mb-3">Ver Solicitudes</h3>
            <p className="mb-6 text-purple-50">
              Revisa el estado de todas tus solicitudes enviadas
            </p>
            <Button
              variant="secondary"
              onClick={() => navigate('/solicitudes')}
              className="bg-white text-purple-600 hover:bg-purple-50"
            >
              Ver Todas
            </Button>
          </div>
        </div>

        {/* Últimas Solicitudes */}
        {solicitudes.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Últimas Solicitudes</h3>
            <div className="space-y-3">
              {solicitudes.slice(0, 5).map(solicitud => (
                <div key={solicitud.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{solicitud.especialidad}</p>
                    <p className="text-sm text-gray-500">
                      {solicitud.numero_cupos} cupos - {new Date(solicitud.created_at).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${solicitud.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                    solicitud.estado === 'aprobada' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
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
