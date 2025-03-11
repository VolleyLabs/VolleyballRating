'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { retrieveLaunchParams } from '@telegram-apps/sdk';
import { isTMA, RetrieveLPResult } from '@telegram-apps/bridge';
import { createClient } from '@/app/utils/supabase/client';

const supabase = createClient();

interface TelegramContextType {
  launchParams: RetrieveLPResult | null;
  isLoading: boolean;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [launchParams, setLaunchParams] = useState<RetrieveLPResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      if (isTMA()) {
        const params = retrieveLaunchParams();
        setLaunchParams(params);

        if (params?.tgWebAppData?.user) {
          const { id, first_name, last_name, username, photo_url } = params.tgWebAppData.user;
          await updateUserInSupabase(id, first_name, last_name, username, photo_url);
        }
      }
      // Simulate minimum loading time for smooth UX
      setTimeout(() => setIsLoading(false), 300);
    };
    
    fetchData();
  }, []);

  async function updateUserInSupabase(id: number, first_name: string, last_name: string | undefined, username: string | undefined, photo_url: string | undefined) {
    const { error } = await supabase
      .from('users')
      .upsert([{ id, first_name, last_name, username, photo_url }], { onConflict: 'id' });

    if (error) {
      console.error('Error updating user in Supabase:', error);
    }
  }

  return (
    <TelegramContext.Provider value={{ launchParams, isLoading }}>
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