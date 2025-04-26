'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { retrieveLaunchParams, ThemeParams } from '@telegram-apps/sdk';
import { isTMA, RetrieveLPResult } from '@telegram-apps/bridge';
import { isAdmin as checkIsAdmin, upsertUser } from '../lib/supabase-queries';
import { on } from '@telegram-apps/sdk';
import { TelegramTheme, useTelegramTheme } from '../utils/telegram-theme';

interface TelegramContextType {
  launchParams: RetrieveLPResult | null;
  isLoading: boolean;
  themeParams: ThemeParams | null;
  theme: TelegramTheme;
  isFullscreen: boolean;
  isAdmin: boolean;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [launchParams, setLaunchParams] = useState<RetrieveLPResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [themeParams, setThemeParams] = useState<ThemeParams | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Generate theme styles based on themeParams
  const theme = useTelegramTheme(themeParams);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      if (isTMA()) {
        const params = retrieveLaunchParams();
        setLaunchParams(params);
        setThemeParams(params?.tgWebAppThemeParams || null);
        setIsFullscreen(params?.tgWebAppFullscreen ?? false);
        
        const removeThemeChanged = on('theme_changed', payload => {
          setThemeParams(payload.theme_params || null);
        });

        if (params?.tgWebAppData?.user) {
          const { id, first_name, last_name, username, photo_url } = params.tgWebAppData.user;

          await upsertUser(id, first_name, last_name, username, photo_url);
          
          // Check if user is admin
          try {
            const adminStatus = await checkIsAdmin(id);
            setIsAdmin(adminStatus);
          } catch (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
          }
        } else {
          // For development environment with test ID
          try {
            const testId = Number(process.env.NEXT_PUBLIC_TELEGRAM_TEST_ID);
            if (!isNaN(testId)) {
              const adminStatus = await checkIsAdmin(testId);
              setIsAdmin(adminStatus);
            }
          } catch (error) {
            console.error('Error checking admin status with test ID:', error);
            setIsAdmin(false);
          }
        }
    
        // Simulate minimum loading time for smooth UX
        setTimeout(() => setIsLoading(false), 300);

        return () => {
          removeThemeChanged();
        };
      } else {
        // For local development, use default theme
        setThemeParams(null); // Will use default theme
        
        // Check admin status with test ID for local development
        try {
          const testId = Number(process.env.NEXT_PUBLIC_TELEGRAM_TEST_ID);
          if (!isNaN(testId)) {
            const adminStatus = await checkIsAdmin(testId);
            setIsAdmin(adminStatus);
          }
        } catch (error) {
          console.error('Error checking admin status with test ID:', error);
          setIsAdmin(false);
        }
  
        // Simulate minimum loading time for smooth UX
        setTimeout(() => setIsLoading(false), 300);

        return () => {};
      }
    };
    
    fetchData();
  }, []);

  return (
    <TelegramContext.Provider value={{ launchParams, isLoading, themeParams, theme, isFullscreen, isAdmin }}>
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