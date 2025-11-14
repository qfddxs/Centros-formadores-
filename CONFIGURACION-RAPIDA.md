# ⚡ Configuración Rápida - Solución al Error de Storage

## 🚨 Error Actual

```
Error al subir archivo: Error: No se pudo subir el documento
```

**Causa:** Los buckets de Storage no existen en Supabase.

## ✅ Solución en 3 Pasos

### Paso 1: Crear las Tablas (si no lo has hecho)

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Click en **SQL Editor** (icono de base de datos en el menú izquierdo)
3. Click en **New Query**
4. Copia y pega el contenido de `supabase-migrations.sql`
5. Click en **Run** (o presiona Ctrl+Enter)

**Resultado esperado:**
```
Success. No rows returned
```

### Paso 2: Crear los Buckets de Storage

**Opción A: Usando SQL (Recomendado)**

1. En el mismo **SQL Editor**
2. Click en **New Query**
3. Copia y pega el contenido de `supabase-storage-setup.sql`
4. Click en **Run**

**Resultado esperado:**
```
2 rows returned
rotaciones-excel | documentos-centros
```

**Opción B: Usando la Interfaz**

1. Ve a **Storage** en el menú izquierdo
2. Click en **New bucket**
3. Crear primer bucket:
   - Name: `rotaciones-excel`
   - Public: ✅ Activado
   - File size limit: `5 MB`
   - Allowed MIME types: `application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
4. Click en **Create bucket**
5. Repetir para segundo bucket:
   - Name: `documentos-centros`
   - Public: ✅ Activado
   - File size limit: `10 MB`
   - Allowed MIME types: `application/pdf`

### Paso 3: Configurar Políticas de Storage

Si usaste la **Opción A (SQL)**, las políticas ya están creadas. ✅

Si usaste la **Opción B (Interfaz)**, ejecuta este SQL:

```sql
-- Copiar y pegar en SQL Editor
-- Políticas para rotaciones-excel
CREATE POLICY "Centros ven sus archivos Excel"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'rotaciones-excel' AND
  (storage.foldername(name))[1] IN (
    SELECT centro_formador_id::text FROM usuarios_centros 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Centros suben archivos Excel"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'rotaciones-excel' AND
  (storage.foldername(name))[1] IN (
    SELECT centro_formador_id::text FROM usuarios_centros 
    WHERE user_id = auth.uid()
  )
);

-- Políticas para documentos-centros
CREATE POLICY "Centros ven sus documentos PDF"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documentos-centros' AND
  (storage.foldername(name))[1] IN (
    SELECT centro_formador_id::text FROM usuarios_centros 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Centros suben documentos PDF"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documentos-centros' AND
  (storage.foldername(name))[1] IN (
    SELECT centro_formador_id::text FROM usuarios_centros 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Centros eliminan documentos PDF"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documentos-centros' AND
  (storage.foldername(name))[1] IN (
    SELECT centro_formador_id::text FROM usuarios_centros 
    WHERE user_id = auth.uid()
  )
);
```

## 🧪 Verificar que Funciona

### 1. Verificar Buckets Creados

En **SQL Editor**, ejecuta:

```sql
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id IN ('rotaciones-excel', 'documentos-centros');
```

**Deberías ver:**
```
id                    | name                | public | file_size_limit
rotaciones-excel      | rotaciones-excel    | true   | 5242880
documentos-centros    | documentos-centros  | true   | 10485760
```

### 2. Verificar Políticas

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%Excel%' OR policyname LIKE '%PDF%';
```

**Deberías ver al menos 5 políticas.**

### 3. Probar en la Aplicación

1. Recarga la página: http://localhost:5174/gestion-documental
2. Selecciona un PDF
3. Click en subir
4. ✅ Debería funcionar sin errores

## 🔍 Troubleshooting

### Error: "Bucket already exists"
✅ Esto es normal, significa que ya está creado. Continúa con las políticas.

### Error: "Policy already exists"
✅ Esto es normal, significa que ya está creada. Todo bien.

### Error: "relation usuarios_centros does not exist"
❌ Necesitas ejecutar primero `supabase-migrations.sql` (Paso 1)

### Sigue sin funcionar
1. Verifica que estés autenticado en la aplicación
2. Verifica que tu usuario tenga un `centro_formador_id` en la tabla `usuarios_centros`
3. Revisa la consola del navegador (F12) para ver el error específico
4. Revisa los logs en Supabase Dashboard → Logs

## 📋 Checklist Final

Antes de probar, verifica:

- [ ] ✅ Tablas creadas (`solicitudes_rotacion`, `estudiantes_rotacion`, `documentos_centro`)
- [ ] ✅ Bucket `rotaciones-excel` creado
- [ ] ✅ Bucket `documentos-centros` creado
- [ ] ✅ Políticas de Storage configuradas
- [ ] ✅ Usuario autenticado en la aplicación
- [ ] ✅ Usuario tiene `centro_formador_id` asignado

## 🎯 Resumen Ultra Rápido

```bash
# 1. Ir a Supabase Dashboard
# 2. SQL Editor → New Query
# 3. Ejecutar: supabase-migrations.sql
# 4. Ejecutar: supabase-storage-setup.sql
# 5. Recargar aplicación
# 6. ¡Listo! 🎉
```

## 💡 Tip

Si prefieres no usar SQL, puedes crear los buckets manualmente en la interfaz de Supabase:
- Storage → New bucket → Configurar según arriba
- Luego ejecutar solo las políticas en SQL Editor

---

**Tiempo estimado:** 5 minutos ⏱️
