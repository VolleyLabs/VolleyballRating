"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { isAdmin as checkIsAdmin, upsertUser } from "../lib/supabase-queries";
import { useTelegramTheme } from "../utils/telegram-theme";

interface TelegramContextType {
  webApp: WebApp | null; // Make webApp nullable for SSR
  isLoading: boolean;
  themeParams: ThemeParams | null;
  theme: ReturnType<typeof useTelegramTheme>;
  isAdmin: boolean;
  isAnonymous: boolean;
}

const TelegramContext = createContext<TelegramContextType | undefined>(
  undefined
);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [webApp, setWebApp] = useState<WebApp | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [themeParams, setThemeParams] = useState<ThemeParams | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Generate theme styles based on themeParams
  const theme = useTelegramTheme(themeParams);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Guard against server-side rendering - Telegram WebApp only exists in browser
      const isBrowser = typeof window !== "undefined";

      // Check if Telegram WebApp is available (only in browser client-side)
      if (isBrowser && window.Telegram?.WebApp) {
        const webApp = window.Telegram.WebApp;
        setWebApp(webApp);

        // Set theme parameters safely
        setThemeParams(webApp.themeParams || null);

        // Parse init data from Telegram WebApp
        let initData: WebAppInitData = { auth_date: 0, hash: "" };
        try {
          initData = webApp.initDataUnsafe as WebAppInitData;
        } catch (error) {
          console.error("Error parsing initData:", error);
        }

        // Subscribe to theme changes
        const handleThemeChange = () => {
          setThemeParams(webApp.themeParams || null);
        };

        webApp.onEvent("themeChanged", handleThemeChange);

        if (initData?.user) {
          const { id, first_name, last_name, username, photo_url } =
            initData.user;

          await upsertUser(id, first_name, last_name, username, photo_url);

          // Check if user is admin
          try {
            const adminStatus = await checkIsAdmin(id);
            setIsAdmin(adminStatus);
          } catch (error) {
            console.error("Error checking admin status:", error);
            setIsAdmin(false);
          }

          // User has Telegram ID, not anonymous
          setIsAnonymous(false);
        } else {
          // For development environment with test ID
          try {
            const testId = Number(process.env.NEXT_PUBLIC_TELEGRAM_TEST_ID);
            if (!isNaN(testId)) {
              const adminStatus = await checkIsAdmin(testId);
              setIsAdmin(adminStatus);
              setIsAnonymous(false);
            } else {
              setIsAnonymous(true);
            }
          } catch (error) {
            console.error("Error checking admin status with test ID:", error);
            setIsAdmin(false);
            setIsAnonymous(true);
          }
        }

        // Simulate minimum loading time for smooth UX
        setTimeout(() => setIsLoading(false), 300);

        // Return cleanup function
        return () => {
          webApp.offEvent("themeChanged", handleThemeChange);
        };
      } else {
        // For server-side rendering or when Telegram WebApp isn't available
        console.log("Telegram WebApp not available - using default theme");
        setWebApp(null);
        setThemeParams(null);

        // Check admin status with test ID for local development
        // Only if we're in the browser
        if (isBrowser) {
          try {
            const testId = Number(process.env.NEXT_PUBLIC_TELEGRAM_TEST_ID);
            if (!isNaN(testId)) {
              const adminStatus = await checkIsAdmin(testId);
              setIsAdmin(adminStatus);
              setIsAnonymous(false);
            } else {
              setIsAnonymous(true);
            }
          } catch (error) {
            console.error("Error checking admin status with test ID:", error);
            setIsAdmin(false);
            setIsAnonymous(true);
          }
        }

        // Simulate minimum loading time for smooth UX (only in browser)
        if (isBrowser) {
          setTimeout(() => setIsLoading(false), 300);
        } else {
          // In SSR, don't wait
          setIsLoading(false);
        }

        // Return empty cleanup function
        return () => {};
      }
    };

    fetchData();
  }, []);

  return (
    <TelegramContext.Provider
      value={{
        webApp,
        isLoading,
        themeParams,
        theme,
        isAdmin,
        isAnonymous,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  const context = useContext(TelegramContext);
  if (context === undefined) {
    throw new Error("useTelegram must be used within a TelegramProvider");
  }
  return context;
}
