import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ThemeToggle from './ThemeToggle';

const HeaderCentroFormador = ({ 
  titulo, 
  subtitulo, 
  icono: Icono,
  mostrarBotonVolver = true,
  rutaVolver = '/dashboard',
  codigoCentro = null
}) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Lado izquierdo: Código Centro + Botón volver + Título */}
          <div className="flex items-center gap-4">
            {/* Código del Centro Formador */}
            {codigoCentro && (
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all hover:scale-105">
                  <span className="text-white font-bold text-sm tracking-tight">
                    {codigoCentro}
                  </span>
                </div>
              </div>
            )}

            {/* Separador vertical */}
            {codigoCentro && <div className="h-10 w-px bg-gray-300 dark:bg-gray-600"></div>}

            {mostrarBotonVolver && (
              <button
                onClick={() => navigate(rutaVolver)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-3">
              {Icono && (
                <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                  <Icono className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">{titulo}</h1>
                {subtitulo && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">{subtitulo}</p>
                )}
              </div>
            </div>
          </div>

          {/* Botón de tema */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default HeaderCentroFormador;
