'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { retrieveLaunchParams, ThemeParams } from '@telegram-apps/sdk';
import { isTMA, RetrieveLPResult } from '@telegram-apps/bridge';
import { upsertUser } from '../lib/supabase-queries';
import { on } from '@telegram-apps/sdk';


interface TelegramContextType {
  launchParams: RetrieveLPResult | null;
  isLoading: boolean;
  colorScheme: 'light' | 'dark';
  themeParams: ThemeParams | null;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [launchParams, setLaunchParams] = useState<RetrieveLPResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('dark');
  const [themeParams, setThemeParams] = useState<ThemeParams | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      if (isTMA()) {
        const params = retrieveLaunchParams();
        setLaunchParams(params);

        setColorScheme(params?.tgWebAppThemeParams?.button_text_color === "#ffffff" ? 'dark' : 'light');
        setThemeParams(params?.tgWebAppThemeParams || null);
        
        const removeThemeChanged = on('theme_changed', payload => {
          setColorScheme(payload.theme_params.button_color === "#ffffff" ? 'dark' : 'light');
          setThemeParams(payload.theme_params || null);
        });

        if (params?.tgWebAppData?.user) {
          const { id, first_name, last_name, username, photo_url } = params.tgWebAppData.user;

          await upsertUser(id, first_name, last_name, username, photo_url);
        }
    
        // Simulate minimum loading time for smooth UX
        setTimeout(() => setIsLoading(false), 300);

        return () => {
          removeThemeChanged();
        };
      } else {
        // For local development, use system theme
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
          setColorScheme(mediaQuery.matches ? 'dark' : 'light');
          setThemeParams(null);
        };
  
        handleChange();
        mediaQuery.addEventListener('change', handleChange);
  
        // Simulate minimum loading time for smooth UX
        setTimeout(() => setIsLoading(false), 300);

        return () => {
          mediaQuery.removeEventListener('change', handleChange);
        };
      }
    };
    
    fetchData();
  }, []);

  return (
    <TelegramContext.Provider value={{ launchParams, isLoading, colorScheme, themeParams }}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  const context = useContext(TelegramContext);
  if (context === undefined) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
} 