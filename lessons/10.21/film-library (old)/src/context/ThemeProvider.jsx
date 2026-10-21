import { useEffect, useMemo } from 'react';
import { ThemeContext } from './ThemeContext.js';
import { useLocalStorage } from '../hooks/useLocalStorage.js';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useLocalStorage('film-library:theme', 'light');

  // Синхронізуємо React-стан із DOM: CSS перемикає кольори за атрибутом на <html>
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // useMemo: без нього value був би новим об'єктом на кожному рендері,
  // і всі споживачі контексту перемальовувалися б щоразу
  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light')),
    }),
    [theme, setTheme],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
