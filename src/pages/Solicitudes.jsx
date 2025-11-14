import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Button from '../components/UI/Button';
import {
  BuildingOffice2Icon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PlusIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useNivelFormacion } from '../context/NivelFormacionContext';

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <BuildingOffice2Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Mis Solicitudes</h1>
                  <p className="text-sm text-gray-500">
                    {centroInfo?.centro_formador?.nombre} - {nivelFormacion === 'pregrado' ? 'Pregrado' : 'Postgrado'}
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate('/solicitar')}
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Nueva Solicitud
            </Button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-3xl font-bold text-gray-900">{estadisticas.total}</p>
              </div>
              <BuildingOffice2Icon className="w-12 h-12 text-gray-400" />
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

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filtrar por estado:</span>
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
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filtroEstado === filtro.key
                      ? 'bg-teal-100 text-teal-800 border border-teal-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filtro.label} ({filtro.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de Solicitudes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {solicitudesFiltradas.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BuildingOffice2Icon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filtroEstado === 'todas' ? 'No tienes solicitudes' : `No tienes solicitudes ${filtroEstado}s`}
              </h3>
              <p className="text-gray-500 mb-6">
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
            <div className="divide-y divide-gray-200">
              {solicitudesFiltradas.map((solicitud) => (
                <div key={solicitud.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {solicitud.especialidad}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                          getEstadoColor(solicitud.estado)
                        }`}>
                          {getEstadoIcon(solicitud.estado)}
                          {solicitud.estado.charAt(0).toUpperCase() + solicitud.estado.slice(1)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <UserGroupIcon className="w-4 h-4" />
                          <span>{solicitud.numero_cupos} cupos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDaysIcon className="w-4 h-4" />
                          <span>{formatearFecha(solicitud.fecha_inicio)} - {formatearFecha(solicitud.fecha_termino)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4" />
                          <span>Solicitado el {formatearFecha(solicitud.created_at)}</span>
                        </div>
                      </div>
                      
                      {solicitud.comentarios && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {solicitud.comentarios}
                        </p>
                      )}
                      
                      {solicitud.motivo_rechazo && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">
                            <strong>Motivo de rechazo:</strong> {solicitud.motivo_rechazo}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-6">
                      <button
                        onClick={() => handleVerDetalle(solicitud)}
                        className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal de Detalle */}
      {modalDetalle && solicitudSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Detalle de Solicitud</h2>
                <button
                  onClick={() => setModalDetalle(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
                  <p className="text-gray-900">{solicitudSeleccionada.especialidad}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                    getEstadoColor(solicitudSeleccionada.estado)
                  }`}>
                    {getEstadoIcon(solicitudSeleccionada.estado)}
                    {solicitudSeleccionada.estado.charAt(0).toUpperCase() + solicitudSeleccionada.estado.slice(1)}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cupos</label>
                  <p className="text-gray-900">{solicitudSeleccionada.numero_cupos}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Solicitante</label>
                  <p className="text-gray-900">{solicitudSeleccionada.solicitante || 'No especificado'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
                  <p className="text-gray-900">{formatearFecha(solicitudSeleccionada.fecha_inicio)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Término</label>
                  <p className="text-gray-900">{formatearFecha(solicitudSeleccionada.fecha_termino)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Solicitud</label>
                  <p className="text-gray-900">{formatearFecha(solicitudSeleccionada.created_at)}</p>
                </div>
              </div>
              
              {solicitudSeleccionada.comentarios && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comentarios</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{solicitudSeleccionada.comentarios}</p>
                </div>
              )}
              
              {solicitudSeleccionada.motivo_rechazo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de Rechazo</label>
                  <p className="text-red-800 bg-red-50 p-3 rounded-lg border border-red-200">{solicitudSeleccionada.motivo_rechazo}</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setModalDetalle(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalSolicitudes;
