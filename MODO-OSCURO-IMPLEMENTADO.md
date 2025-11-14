# 🌙 Modo Oscuro Implementado

## ✅ Lo que se implementó

### 1. Context API para el Tema
- `src/context/ThemeContext.jsx` - Maneja el estado global del tema
- Guarda la preferencia en localStorage
- Detecta preferencia del sistema automáticamente

### 2. Botón Toggle
- `src/components/UI/ThemeToggle.jsx` - Botón para cambiar entre modos
- Ícono de sol ☀️ en modo oscuro
- Ícono de luna 🌙 en modo claro
- Animaciones suaves

### 3. Configuración de Tailwind
- `darkMode: 'class'` habilitado en `tailwind.config.js`
- Permite usar clases `dark:` en todos los componentes

### 4. Integración en el Router
- ThemeProvider envuelve toda la aplicación
- Disponible en todas las páginas

## 🎨 Colores del Modo Oscuro

### Paleta Principal
```
Fondo principal: bg-gray-900 (muy oscuro pero no negro puro)
Fondo secundario: bg-gray-800 (tarjetas, headers)
Bordes: border-gray-700 (sutiles)
Texto principal: text-white
Texto secundario: text-gray-400
Acentos: Mantienen sus colores (teal, blue, etc.)
```

### Por qué estos colores
- ✅ No es negro puro (menos cansancio visual)
- ✅ Contraste suave pero legible
- ✅ Los colores de acento se mantienen vibrantes
- ✅ Transiciones suaves entre modos

## 🔧 Cómo Aplicar Modo Oscuro a Componentes

### Patrón General
```jsx
// Antes
className="bg-white text-gray-900"

// Después
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-300"
```

### Elementos Comunes

#### Fondos
```jsx
// Fondo principal
className="bg-gray-50 dark:bg-gray-900"

// Tarjetas/Cards
className="bg-white dark:bg-gray-800"

// Inputs
className="bg-white dark:bg-gray-700"
```

#### Textos
```jsx
// Título principal
className="text-gray-900 dark:text-white"

// Texto secundario
className="text-gray-600 dark:text-gray-400"

// Texto deshabilitado
className="text-gray-400 dark:text-gray-500"
```

#### Bordes
```jsx
className="border-gray-200 dark:border-gray-700"
```

#### Botones
```jsx
// Botón primario (mantiene color)
className="bg-teal-600 hover:bg-teal-700 text-white"

// Botón secundario
className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"

// Botón hover
className="hover:bg-gray-100 dark:hover:bg-gray-700"
```

## 📝 Componentes Actualizados

### ✅ Completamente Actualizados
- HeaderCentroFormador
- Dashboard (parcial)
- ThemeToggle

### ⏳ Pendientes de Actualizar
- Solicitar.jsx
- SolicitudRotacion.jsx
- GestionDocumental.jsx
- Solicitudes.jsx
- Login.jsx
- Registro.jsx

## 🚀 Cómo Completar la Implementación

### Para cada página, buscar y reemplazar:

1. **Fondos principales**
```jsx
// Buscar
className="min-h-screen bg-gray-50"

// Reemplazar con
className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300"
```

2. **Tarjetas/Cards**
```jsx
// Buscar
className="bg-white rounded-xl shadow-sm border border-gray-200"

// Reemplazar con
className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300"
```

3. **Títulos**
```jsx
// Buscar
className="text-xl font-bold text-gray-900"

// Reemplazar con
className="text-xl font-bold text-gray-900 dark:text-white transition-colors"
```

4. **Texto normal**
```jsx
// Buscar
className="text-gray-600"

// Reemplazar con
className="text-gray-600 dark:text-gray-400 transition-colors"
```

5. **Inputs**
```jsx
// Buscar
className="border border-gray-300 bg-white"

// Reemplazar con
className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
```

## 💡 Tips de Diseño

### 1. Transiciones Suaves
Siempre agregar `transition-colors duration-300` para cambios suaves

### 2. Contraste Adecuado
- Texto sobre fondo oscuro: usar `text-white` o `text-gray-100`
- Texto secundario: `text-gray-400`
- Nunca usar `text-gray-900` en modo oscuro

### 3. Colores de Acento
Los colores vibrantes (teal, blue, green, red) se mantienen igual:
```jsx
className="bg-teal-600 text-white" // ✅ Funciona en ambos modos
```

### 4. Sombras
Las sombras se ven mejor más sutiles en modo oscuro:
```jsx
className="shadow-sm dark:shadow-lg dark:shadow-gray-900/50"
```

## 🧪 Probar el Modo Oscuro

1. Abre la aplicación
2. Busca el botón de sol/luna en el header
3. Click para cambiar de modo
4. La preferencia se guarda automáticamente
5. Al recargar, mantiene tu elección

## 📱 Responsive

El modo oscuro funciona en todos los tamaños de pantalla:
- Desktop ✅
- Tablet ✅
- Mobile ✅

## 🔄 Sincronización

- Se guarda en localStorage
- Persiste entre sesiones
- Detecta preferencia del sistema al primer uso
- Se puede cambiar manualmente en cualquier momento

## 🎯 Próximos Pasos

Para completar el modo oscuro en todo el sistema:

1. Aplicar clases dark: a Solicitar.jsx
2. Aplicar clases dark: a SolicitudRotacion.jsx
3. Aplicar clases dark: a GestionDocumental.jsx
4. Aplicar clases dark: a Solicitudes.jsx
5. Aplicar clases dark: a Login.jsx y Registro.jsx

Usa los patrones de arriba para cada tipo de elemento.

## 🐛 Troubleshooting

### El modo oscuro no se aplica
- Verificar que `darkMode: 'class'` esté en tailwind.config.js
- Verificar que ThemeProvider envuelva la aplicación
- Reiniciar el servidor de desarrollo

### Los colores se ven mal
- Asegurarse de usar la paleta recomendada
- Agregar `transition-colors` para suavidad
- Verificar contraste de texto

### No persiste la preferencia
- Verificar que localStorage esté habilitado
- Revisar la consola por errores
- Limpiar caché del navegador
