# 🚀 Inicio Rápido - Verificación Dashboard

## ¿Qué se hizo?

Se corrigió el Dashboard para que muestre correctamente las solicitudes pendientes y rechazadas.

## Verificación Rápida (3 pasos)

### 1. Abrir el Dashboard
```bash
cd Centros-formadores-
npm run dev
```

### 2. Abrir la Consola del Navegador
- Presiona `F12`
- Ve a la pestaña **Console**
- Busca los mensajes con ✅ y 📊

### 3. Verificar que se muestren:
- ✅ Tarjetas con contadores (Total, Pendientes, Aprobadas, Rechazadas)
- ✅ Sección "Solicitudes Pendientes" (si hay pendientes)
- ✅ Sección "Solicitudes Rechazadas" (si hay rechazadas)
- ✅ Motivo de rechazo en cada solicitud rechazada

## Si No Ves Solicitudes

### Opción 1: Verificar en Supabase (Más Rápido)
1. Ve a https://supabase.com/dashboard
2. Abre tu proyecto
3. Ve a **SQL Editor**
4. Ejecuta:
```sql
SELECT estado, COUNT(*) as cantidad
FROM solicitudes_cupos
GROUP BY estado;
```

### Opción 2: Insertar Datos de Prueba
1. En Supabase SQL Editor
2. Copia y pega el contenido de `test-solicitudes-data.sql`
3. Ejecuta
4. Recarga el Dashboard

### Opción 3: Usar Script de Verificación
1. Abre el Dashboard en el navegador
2. Abre la consola (F12)
3. Copia y pega el contenido de `verificar-conexion-supabase.js`
4. Ejecuta: `verificarConexion()`

## Resultado Esperado

### Dashboard debe mostrar:

```
┌─────────────────────────────────────────────────┐
│  Total: 5  │  Pendientes: 2  │  Aprobadas: 1  │  Rechazadas: 2  │
└─────────────────────────────────────────────────┘

📋 Solicitudes Pendientes (2)
   • Enfermería - 5 cupos
   • Cirugía - 4 cupos

📋 Solicitudes Rechazadas (2)
   • Pediatría - 8 cupos
     Motivo: No hay cupos disponibles...
   • Ginecología - 6 cupos
     Motivo: El servicio no cuenta con capacidad...

📋 Actividad Reciente
   • [Últimas 5 solicitudes de cualquier estado]
```

## Archivos Importantes

- ✅ `src/pages/Dashboard.jsx` - Dashboard corregido
- 📝 `SOLUCION-DASHBOARD-PENDIENTES-RECHAZADAS.md` - Documentación completa
- 📝 `VERIFICAR-SOLICITUDES-DASHBOARD.md` - Guía de verificación detallada
- 🗄️ `test-solicitudes-data.sql` - Datos de prueba
- 🔧 `verificar-conexion-supabase.js` - Script de verificación

## Problemas Comunes

### "No tienes solicitudes"
**Causa**: No hay datos en la base de datos
**Solución**: Ejecutar `test-solicitudes-data.sql`

### "No se encontró tu centro formador"
**Causa**: Usuario no vinculado a un centro
**Solución**: Crear vinculación en Supabase:
```sql
INSERT INTO usuarios_centros (user_id, centro_formador_id)
VALUES ('TU_USER_ID', 'ID_DEL_CENTRO');
```

### Los contadores muestran 0
**Causa**: Solicitudes no vinculadas al centro correcto
**Solución**: Verificar `centro_formador_id` en las solicitudes

## Contacto

Si el problema persiste:
1. Revisa los logs en la consola del navegador
2. Ejecuta el script de verificación
3. Comparte el mensaje de error específico

---

**Última actualización**: Noviembre 2025
