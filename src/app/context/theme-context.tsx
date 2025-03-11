'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { isTMA } from '@telegram-apps/bridge';

type ThemeContextType = {
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string> | null;
};

const defaultThemeContext: ThemeContextType = {
  colorScheme: 'light',
  themeParams: null,
};

const ThemeContext = createContext<ThemeContextType>(defaultThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeContextType>(defaultThemeContext);

  useEffect(() => {
    if (isTMA()) {
      // Получаем текущую цветовую схему из Telegram WebApp
      const colorScheme = window.Telegram?.WebApp?.colorScheme as 'light' | 'dark';
      const themeParams = window.Telegram?.WebApp?.themeParams || null;

      setTheme({
        colorScheme: colorScheme || 'light',
        themeParams,
      });

      // Слушаем изменения темы
      const handleThemeChange = () => {
        setTheme({
          colorScheme: window.Telegram?.WebApp?.colorScheme as 'light' | 'dark',
          themeParams: window.Telegram?.WebApp?.themeParams || null,
        });
      };

      window.Telegram?.WebApp?.onEvent('themeChanged', handleThemeChange);

      return () => {
        window.Telegram?.WebApp?.offEvent('themeChanged', handleThemeChange);
      };
    } else {
      // Для локальной разработки используем системную тему
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        setTheme({
          colorScheme: mediaQuery.matches ? 'dark' : 'light',
          themeParams: null,
        });
      };

      handleChange();
      mediaQuery.addEventListener('change', handleChange);

      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
} 