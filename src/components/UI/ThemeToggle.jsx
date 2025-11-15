import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  const handleClick = () => {
    console.log('Toggle clicked. Current mode:', isDarkMode ? 'dark' : 'light');
    toggleDarkMode();
    console.log('After toggle. New mode:', !isDarkMode ? 'dark' : 'light');
  };

  return (
    <button
      onClick={handleClick}
      className="p-2 rounded-lg transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDarkMode ? (
        <SunIcon className="w-5 h-5 text-yellow-500 hover:text-yellow-400 transition-colors" />
      ) : (
        <MoonIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" />
      )}
    </button>
  );
};

export default ThemeToggle;
