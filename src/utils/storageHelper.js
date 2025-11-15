import { supabase } from '../supabaseClient';

/**
 * Sube un archivo Excel a Supabase Storage
 */
export const subirArchivoExcel = async (file, centroFormadorId) => {
  try {
    const timestamp = Date.now();
    const sanitizedName = sanitizeFileName(file.name);
    const fileName = `${centroFormadorId}/${timestamp}_${sanitizedName}`;
    
    const { data, error } = await supabase.storage
      .from('rotaciones-excel')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('rotaciones-excel')
      .getPublicUrl(fileName);

    return {
      path: data.path,
      url: urlData.publicUrl,
      nombre: file.name
    };
  } catch (error) {
    console.error('Error al subir archivo Excel:', error);
    throw new Error('No se pudo subir el archivo Excel');
  }
};

/**
 * Sanitiza el nombre de archivo para Storage
 */
const sanitizeFileName = (fileName) => {
  // Remover caracteres especiales y espacios
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Reemplazar caracteres especiales con _
    .replace(/_{2,}/g, '_') // Reemplazar múltiples _ con uno solo
    .toLowerCase();
};

/**
 * Sube un documento PDF a Supabase Storage
 */
export const subirDocumentoPDF = async (file, centroFormadorId, tipoDocumento) => {
  try {
    const timestamp = Date.now();
    const sanitizedName = sanitizeFileName(file.name);
    const fileName = `${centroFormadorId}/${tipoDocumento}/${timestamp}_${sanitizedName}`;
    
    const { data, error } = await supabase.storage
      .from('documentos-centros')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('documentos-centros')
      .getPublicUrl(fileName);

    return {
      path: data.path,
      url: urlData.publicUrl,
      nombre: file.name,
      tamaño: file.size
    };
  } catch (error) {
    console.error('Error al subir documento:', error);
    throw new Error('No se pudo subir el documento');
  }
};

/**
 * Elimina un archivo de Storage
 */
export const eliminarArchivo = async (bucket, path) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    throw new Error('No se pudo eliminar el archivo');
  }
};

/**
 * Descarga un archivo de Storage
 */
export const descargarArchivo = async (bucket, path) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al descargar archivo:', error);
    throw new Error('No se pudo descargar el archivo');
  }
};

/**
 * Obtiene la URL pública de un archivo
 */
export const obtenerUrlPublica = (bucket, path) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
};
