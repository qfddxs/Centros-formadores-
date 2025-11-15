import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import Button from '../components/UI/Button';
import HeaderCentroFormador from '../components/UI/HeaderCentroFormador';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  DocumentArrowUpIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { subirDocumentoPDF, eliminarArchivo } from '../utils/storageHelper';

const GestionDocumental = () => {
  const navigate = useNavigate();
  const [centroInfo, setCentroInfo] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('certificado_vacunacion');
  const [descripcion, setDescripcion] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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

      // Cargar documentos del centro
      const { data: docsData, error: docsError } = await supabase
        .from('documentos_centro')
        .select('*')
        .eq('centro_formador_id', centroData.centro_formador_id)
        .order('fecha_subida', { ascending: false });

      if (docsError) throw docsError;
      setDocumentos(docsData || []);

    } catch (err) {
      console.error('Error:', err);
      setError('Error al cargar información');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar que sea PDF
    if (file.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      setError('El archivo no debe superar los 10MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Subir archivo a Storage
      const archivoData = await subirDocumentoPDF(
        file, 
        centroInfo.centro_formador_id, 
        tipoDocumento
      );

      // Guardar registro en la base de datos
      const { data: docData, error: docError } = await supabase
        .from('documentos_centro')
        .insert([{
          centro_formador_id: centroInfo.centro_formador_id,
          nombre_archivo: archivoData.nombre,
          tipo_documento: tipoDocumento,
          descripcion: descripcion || null,
          archivo_url: archivoData.url,
          tamaño_bytes: archivoData.tamaño,
          subido_por: user.id
        }])
        .select()
        .single();

      if (docError) throw docError;

      // Agregar a la lista
      setDocumentos(prev => [docData, ...prev]);
      
      // Limpiar formulario
      setDescripcion('');
      setTipoDocumento('certificado_vacunacion');

    } catch (err) {
      console.error('Error al subir archivo:', err);
      setError(err.message || 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documento) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return;

    try {
      // Extraer el path del archivo desde la URL
      const urlParts = documento.archivo_url.split('/documentos-centros/');
      const filePath = urlParts[1];

      // Eliminar de Storage
      await eliminarArchivo('documentos-centros', filePath);

      // Eliminar de la base de datos
      const { error: deleteError } = await supabase
        .from('documentos_centro')
        .delete()
        .eq('id', documento.id);

      if (deleteError) throw deleteError;

      // Actualizar lista
      setDocumentos(prev => prev.filter(doc => doc.id !== documento.id));

    } catch (err) {
      console.error('Error al eliminar:', err);
      setError('Error al eliminar el documento');
    }
  };

  const handleDownload = (documento) => {
    // Abrir el archivo en una nueva pestaña
    window.open(documento.archivo_url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Variantes de animación para la lista
  const listContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const listItemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <HeaderCentroFormador
        titulo="Gestión Documental"
        subtitulo={centroInfo?.centro_formador?.nombre}
        icono={DocumentTextIcon}
        codigoCentro={centroInfo?.centro_formador?.codigo}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Área de Subida */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-8 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 transition-colors">Subir Documento</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 transition-colors">
            Sube documentos importantes como certificados de vacunación, seguros, o cualquier otro documento requerido.
          </p>

          {/* Formulario de tipo y descripción */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="tipo-documento" className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2 transition-colors">
                Tipo de Documento
              </label>
              <select
                id="tipo-documento"
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
                disabled={uploading}
                className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="certificado_vacunacion">Certificado de Vacunación</option>
                <option value="seguro_medico">Seguro Médico</option>
                <option value="certificado_antecedentes">Certificado de Antecedentes</option>
                <option value="convenio">Convenio</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2 transition-colors">
                Descripción (opcional)
              </label>
              <input
                id="descripcion"
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                disabled={uploading}
                placeholder="Ej: Vacunas 2025"
                className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
            <DocumentArrowUpIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3 transition-colors" />
            <label htmlFor="pdf-upload" className="cursor-pointer">
              <span className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
                {uploading ? 'Subiendo...' : 'Selecciona un archivo PDF'}
              </span>
              <span className="text-gray-600 dark:text-gray-400 transition-colors"> o arrastra aquí</span>
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 transition-colors">PDF - Máx. 10MB</p>
          </div>
        </motion.div>

        {/* Lista de Documentos */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 transition-colors">Documentos Subidos</h2>

          {documentos.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4 transition-colors" />
              <p className="text-gray-500 dark:text-gray-400 transition-colors">No hay documentos subidos aún</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 transition-colors">
                Los documentos que subas aparecerán aquí
              </p>
            </div>
          ) : (
            <motion.div
              className="space-y-3"
              variants={listContainerVariants}
              initial="hidden"
              animate="visible"
            >
              {documentos.map(doc => (
                <motion.div
                  key={doc.id}
                  variants={listItemVariants}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center transition-colors">
                      <DocumentTextIcon className="w-6 h-6 text-red-600 dark:text-red-400 transition-colors" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white transition-colors">{doc.nombre_archivo}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                        <span className="capitalize">{doc.tipo_documento.replace(/_/g, ' ')}</span> • {new Date(doc.fecha_subida).toLocaleDateString('es-CL')} • {(doc.tamaño_bytes / 1024).toFixed(2)} KB
                      </p>
                      {doc.descripcion && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 transition-colors">{doc.descripcion}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="Descargar"
                    >
                      <ArrowDownTrayIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default GestionDocumental;
