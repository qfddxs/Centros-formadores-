// Script para verificar la conexión con Supabase y los datos
// Ejecutar en la consola del navegador cuando estés en el Dashboard

async function verificarConexion() {
  console.log('🔍 Iniciando verificación de Supabase...\n');
  
  try {
    // 1. Verificar usuario autenticado
    console.log('1️⃣ Verificando usuario autenticado...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Error al obtener usuario:', userError);
      return;
    }
    
    if (!user) {
      console.error('❌ No hay usuario autenticado');
      return;
    }
    
    console.log('✅ Usuario autenticado:', user.id);
    console.log('   Email:', user.email);
    console.log('');
    
    // 2. Verificar vinculación con centro
    console.log('2️⃣ Verificando vinculación con centro formador...');
    const { data: centroData, error: centroError } = await supabase
      .from('usuarios_centros')
      .select('*, centro_formador:centros_formadores(*)')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (centroError) {
      console.error('❌ Error al obtener centro:', centroError);
      return;
    }
    
    if (!centroData) {
      console.error('❌ No hay vinculación con centro formador');
      console.log('💡 Solución: Crear vinculación en Supabase:');
      console.log(`   INSERT INTO usuarios_centros (user_id, centro_formador_id) VALUES ('${user.id}', 'ID_DEL_CENTRO');`);
      return;
    }
    
    console.log('✅ Centro formador vinculado:');
    console.log('   ID:', centroData.centro_formador_id);
    console.log('   Nombre:', centroData.centro_formador?.nombre);
    console.log('   Código:', centroData.centro_formador?.codigo);
    console.log('');
    
    // 3. Verificar solicitudes
    console.log('3️⃣ Verificando solicitudes de cupos...');
    const { data: solicitudesData, error: solicitudesError } = await supabase
      .from('solicitudes_cupos')
      .select('*')
      .eq('centro_formador_id', centroData.centro_formador_id)
      .order('created_at', { ascending: false });
    
    if (solicitudesError) {
      console.error('❌ Error al obtener solicitudes:', solicitudesError);
      return;
    }
    
    console.log('✅ Solicitudes obtenidas:', solicitudesData?.length || 0);
    
    if (!solicitudesData || solicitudesData.length === 0) {
      console.log('⚠️  No hay solicitudes para este centro');
      console.log('💡 Solución: Crear solicitudes de prueba ejecutando test-solicitudes-data.sql');
      return;
    }
    
    // 4. Desglose por estado
    const pendientes = solicitudesData.filter(s => s.estado === 'pendiente');
    const aprobadas = solicitudesData.filter(s => s.estado === 'aprobada');
    const rechazadas = solicitudesData.filter(s => s.estado === 'rechazada');
    
    console.log('');
    console.log('📊 Desglose por estado:');
    console.log('   🟡 Pendientes:', pendientes.length);
    console.log('   🟢 Aprobadas:', aprobadas.length);
    console.log('   🔴 Rechazadas:', rechazadas.length);
    console.log('');
    
    // 5. Mostrar detalles de pendientes
    if (pendientes.length > 0) {
      console.log('📋 Solicitudes Pendientes:');
      pendientes.forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.especialidad} - ${s.numero_cupos} cupos`);
      });
      console.log('');
    }
    
    // 6. Mostrar detalles de rechazadas
    if (rechazadas.length > 0) {
      console.log('📋 Solicitudes Rechazadas:');
      rechazadas.forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.especialidad} - ${s.numero_cupos} cupos`);
        if (s.motivo_rechazo) {
          console.log(`      Motivo: ${s.motivo_rechazo}`);
        } else {
          console.log('      ⚠️  Sin motivo de rechazo');
        }
      });
      console.log('');
    }
    
    // 7. Verificar políticas RLS
    console.log('4️⃣ Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('pg_policies')
      .select('*')
      .eq('tablename', 'solicitudes_cupos');
    
    if (!policiesError && policies) {
      console.log('✅ Políticas RLS activas:', policies.length);
    }
    
    console.log('');
    console.log('✅ Verificación completada exitosamente');
    console.log('');
    console.log('📝 Resumen:');
    console.log(`   - Usuario: ${user.email}`);
    console.log(`   - Centro: ${centroData.centro_formador?.nombre}`);
    console.log(`   - Total solicitudes: ${solicitudesData.length}`);
    console.log(`   - Pendientes: ${pendientes.length}`);
    console.log(`   - Aprobadas: ${aprobadas.length}`);
    console.log(`   - Rechazadas: ${rechazadas.length}`);
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

// Ejecutar automáticamente
console.log('🚀 Para verificar la conexión, ejecuta: verificarConexion()');
console.log('');

// Exportar para uso en consola
window.verificarConexion = verificarConexion;
