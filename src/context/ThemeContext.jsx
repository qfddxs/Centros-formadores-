import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Verificar si hay preferencia guardada
    const saved = localStorage.getItem('darkMode');
    console.log('Initial theme from localStorage:', saved);
    
    if (saved !== null) {
      const isDark = JSON.parse(saved);
      console.log('Using saved preference:', isDark ? 'dark' : 'light');
      return isDark;
    }
    
    // Si no, usar preferencia del sistema
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    console.log('Using system preference:', systemPrefersDark ? 'dark' : 'light');
    return systemPrefersDark;
  });

  useEffect(() => {
    console.log('Theme changed to:', isDarkMode ? 'dark' : 'light');
    
    // Guardar preferencia
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    
    // Aplicar clase al documento de manera más agresiva
    const root = document.documentElement;
    
    if (isDarkMode) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      console.log('Added dark class to html');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      console.log('Removed dark class from html');
    }
    
    // Forzar repaint
    void root.offsetHeight;
    
    // Verificar que se aplicó
    console.log('HTML classes:', root.className);
    console.log('Data theme:', root.getAttribute('data-theme'));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    console.log('toggleDarkMode called');
    setIsDarkMode(prev => {
      console.log('Previous state:', prev, 'New state:', !prev);
      return !prev;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
