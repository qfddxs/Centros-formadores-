import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { BuildingOffice2Icon, EnvelopeIcon, LockClosedIcon, UserIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useNivelFormacion } from '../context/NivelFormacionContext';

const PortalRegistro = () => {
  const navigate = useNavigate();
  const { nivelFormacion } = useNivelFormacion();
  const [formData, setFormData] = useState({
    // Datos del Centro Formador
    nombre_centro: '',
    codigo_centro: '',
    direccion_centro: '',
    telefono_centro: '',
    nivel_formacion: 'pregrado', // pregrado o postgrado
    especialidades: [], // Array de especialidades seleccionadas
    // Datos del Coordinador
    nombre_coordinador: '',
    cargo_coordinador: 'Coordinador de Campos Clínicos',
    email_coordinador: '',
    telefono_coordinador: '',
    // Credenciales
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const especialidadesDisponibles = formData.nivel_formacion === 'pregrado' 
    ? especialidadesPregrado 
    : especialidadesPostgrado;

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si cambia el nivel de formación, resetear especialidades
    if (name === 'nivel_formacion') {
      setFormData({
        ...formData,
        [name]: value,
        especialidades: []
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleEspecialidadToggle = (especialidad) => {
    setFormData(prev => {
      const especialidades = prev.especialidades.includes(especialidad)
        ? prev.especialidades.filter(e => e !== especialidad)
        : [...prev.especialidades, especialidad];
      return { ...prev, especialidades };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      // 1. Crear el centro formador
      const { data: centroData, error: centroError } = await supabase
        .from('centros_formadores')
        .insert([{
          nombre: formData.nombre_centro,
          codigo: formData.codigo_centro,
          direccion: formData.direccion_centro,
          telefono: formData.telefono_centro,
          email: formData.email_coordinador, // Usar email del coordinador
          contacto_nombre: formData.nombre_coordinador,
          contacto_cargo: formData.cargo_coordinador,
          nivel_formacion: formData.nivel_formacion,
          capacidad_total: 0,
          capacidad_disponible: 0,
          especialidades: formData.especialidades,
          activo: true
        }])
        .select()
        .single();

      if (centroError) throw centroError;

      // 2. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email_coordinador,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/portal-formadora/dashboard`,
          data: {
            nombre_completo: formData.nombre_coordinador,
            telefono: formData.telefono_coordinador,
            rol: 'centro_formador',
            centro_formador: formData.nombre_centro
          }
        }
      });

      if (authError) throw authError;

      // 3. Vincular usuario con centro formador
      const { error: vinculoError } = await supabase
        .from('usuarios_centros')
        .insert([{
          user_id: authData.user.id,
          centro_formador_id: centroData.id,
          rol: 'centro_formador',
          activo: true
        }]);

      if (vinculoError) throw vinculoError;

      // Redirigir al login con mensaje de éxito
      navigate('/login?registro=exitoso');
    } catch (err) {
      setError(err.message || 'Error al registrar. Intenta nuevamente.');
      console.error('Error en registro:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-600 rounded-2xl mb-4 shadow-lg">
            <BuildingOffice2Icon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Registro de Centro Formador</h1>
          <p className="text-gray-600">Crea una cuenta para tu institución</p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sección: Datos del Centro Formador */}
            <div className="bg-teal-50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-teal-900 mb-4">Datos del Centro Formador</h3>
              
              <div>
                <label htmlFor="nombre_centro" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Institución *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BuildingOffice2Icon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="nombre_centro"
                    id="nombre_centro"
                    required
                    value={formData.nombre_centro}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Universidad de Chile"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="nivel_formacion" className="block text-sm font-medium text-gray-700 mb-2">
                  Nivel de Formación *
                </label>
                <select
                  name="nivel_formacion"
                  id="nivel_formacion"
                  required
                  value={formData.nivel_formacion}
                  onChange={handleChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="pregrado">Pregrado</option>
                  <option value="postgrado">Postgrado</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Selecciona si tu centro forma estudiantes de pregrado o postgrado
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Especialidades que Ofrece *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-4 bg-white rounded-lg border border-gray-300">
                  {especialidadesDisponibles.map(especialidad => (
                    <label
                      key={especialidad}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={formData.especialidades.includes(especialidad)}
                        onChange={() => handleEspecialidadToggle(especialidad)}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{especialidad}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Selecciona todas las especialidades que tu institución ofrece ({formData.especialidades.length} seleccionadas)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="codigo_centro" className="block text-sm font-medium text-gray-700 mb-2">
                    Código/RUT
                  </label>
                  <input
                    type="text"
                    name="codigo_centro"
                    id="codigo_centro"
                    value={formData.codigo_centro}
                    onChange={handleChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="12.345.678-9"
                  />
                </div>

                <div>
                  <label htmlFor="telefono_centro" className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono del Centro
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <PhoneIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="telefono_centro"
                      id="telefono_centro"
                      value={formData.telefono_centro}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="+56 2 1234 5678"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="direccion_centro" className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="direccion_centro"
                    id="direccion_centro"
                    value={formData.direccion_centro}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Av. Independencia 1027, Santiago"
                  />
                </div>
              </div>
            </div>

            {/* Sección: Datos del Coordinador */}
            <div className="bg-blue-50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Datos del Coordinador</h3>
              
              <div>
                <label htmlFor="nombre_coordinador" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="nombre_coordinador"
                    id="nombre_coordinador"
                    required
                    value={formData.nombre_coordinador}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Juan Pérez González"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cargo_coordinador" className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo
                </label>
                <input
                  type="text"
                  name="cargo_coordinador"
                  id="cargo_coordinador"
                  value={formData.cargo_coordinador}
                  onChange={handleChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Coordinador de Campos Clínicos"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email_coordinador" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Personal *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email_coordinador"
                      id="email_coordinador"
                      required
                      value={formData.email_coordinador}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="juan.perez@universidad.cl"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="telefono_coordinador" className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono Personal
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <PhoneIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="telefono_coordinador"
                      id="telefono_coordinador"
                      value={formData.telefono_coordinador}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sección: Credenciales */}
            <div className="bg-purple-50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">Credenciales de Acceso</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Mínimo 6 caracteres</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Contraseña *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-teal-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-teal-600 hover:text-teal-700 font-semibold">
                Iniciar Sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalRegistro;
