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
import ConsoleLoggerScript from "../components/ConsoleLoggerScript";
import { setAuthToken } from "../utils/supabase/client";

interface TelegramContextType {
  webApp: WebApp | null; // Make webApp nullable for SSR
  isLoading: boolean;
  themeParams: ThemeParams | null;
  theme: ReturnType<typeof useTelegramTheme>;
  isAdmin: boolean;
  isAnonymous: boolean;
  token: string | null; // Add token to the context
  userId: number | null; // Add userId for easier access
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
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  // Generate theme styles based on themeParams
  const theme = useTelegramTheme(themeParams);

  // Function to initialize Supabase with the token
  const initializeSupabase = (accessToken: string) => {
    setAuthToken(accessToken);
    console.log(
      "TelegramProvider: set Authorization header with JWT",
      accessToken.substring(0, 10) + "…"
    );
  };

  // Function to check if token is expired or will expire soon
  const isTokenExpiredOrExpiringSoon = (
    token: string,
    minutesThreshold: number = 10
  ): boolean => {
    try {
      // Decode the JWT to get the payload
      const base64Payload = token.split(".")[1];
      const payload = JSON.parse(atob(base64Payload));

      // Check if the expiration timestamp is in the past or will be in the next X minutes
      const currentTime = Math.floor(Date.now() / 1000);
      const thresholdTime = currentTime + minutesThreshold * 60;
      return payload.exp < thresholdTime;
    } catch (error) {
      console.error("Error parsing token:", error);
      // If there's an error parsing the token, consider it expired
      return true;
    }
  };

  // Function to clear stored auth data
  const clearStoredAuthData = () => {
    localStorage.removeItem("telegram_auth_token");
    localStorage.removeItem("telegram_is_admin");
    setToken(null);
    setIsAdmin(false);
  };

  // Function to refresh authentication periodically
  useEffect(() => {
    // Only run this effect if we have a token and we're in the browser
    if (!token || typeof window === "undefined") return;

    const checkAndRefreshToken = () => {
      if (isTokenExpiredOrExpiringSoon(token)) {
        console.log(
          "Token is expiring soon, refreshing the page to get new data"
        );
        // Refresh the page to get fresh authentication data
        window.location.reload();
      }
    };

    // Check every 5 minutes
    const intervalId = setInterval(checkAndRefreshToken, 5 * 60 * 1000);

    // Clean up the interval on unmount
    return () => clearInterval(intervalId);
  }, [token]);

  // Function to check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      // Decode the JWT to get the payload
      const base64Payload = token.split(".")[1];
      const payload = JSON.parse(atob(base64Payload));

      // Check if the expiration timestamp is in the past
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error("Error parsing token:", error);
      // If there's an error parsing the token, consider it expired
      return true;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Guard against server-side rendering - Telegram WebApp only exists in browser
      const isBrowser = typeof window !== "undefined";

      // Try to load saved token from localStorage
      if (isBrowser) {
        const savedToken = localStorage.getItem("telegram_auth_token");
        const savedUserId = localStorage.getItem("telegram_user_id");
        const savedIsAdmin =
          localStorage.getItem("telegram_is_admin") === "true";

        if (savedToken) {
          // Check if token is expired
          if (isTokenExpired(savedToken)) {
            console.log("Saved token has expired, will try to re-authenticate");
            // Don't clear stored auth data yet, we'll try to re-authenticate
          } else {
            // Token is valid, use it
            setToken(savedToken);
            setIsAdmin(savedIsAdmin);
            initializeSupabase(savedToken);

            if (savedUserId) {
              const userId = parseInt(savedUserId);
              setUserId(userId);
              setIsAnonymous(false);
            }
          }
        }
      }

      // Check if Telegram WebApp is available (only in browser client-side)
      if (isBrowser && window.Telegram?.WebApp) {
        const webApp = window.Telegram.WebApp;

        // Notify Telegram WebApp that we are ready
        window.Telegram.WebApp.ready();

        // Expand the WebApp to fullscreen
        window.Telegram.WebApp.expand();

        if (!webApp.initData) {
          setIsLoading(false);
          return;
        }

        // Subscribe to theme changes
        const handleThemeChange = () => {
          setThemeParams(webApp.themeParams || null);
        };

        // Call our API to validate the data and get a Supabase token
        try {
          const response = await fetch("/api/telegram-auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData: webApp.initData }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error("Authentication error:", errorData.error);

            // If token expired, clear the stored token and refresh the page to force re-auth
            if (errorData.error === "Authentication data expired") {
              console.log(
                "Authentication data expired, refreshing to get new data"
              );
              clearStoredAuthData();
              // Refresh the page to get fresh authentication data from Telegram
              window.location.reload();
              return;
            }

            throw new Error(errorData.error || "Authentication failed");
          }

          const { token: newToken, isAdmin: newIsAdmin } =
            await response.json();

          // Set the token and admin status in state
          setToken(newToken);
          setIsAdmin(newIsAdmin);

          // Store token and admin status in localStorage for persistence
          localStorage.setItem("telegram_auth_token", newToken);
          localStorage.setItem(
            "telegram_is_admin",
            newIsAdmin ? "true" : "false"
          );

          // Set the token in Supabase client
          initializeSupabase(newToken);

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

          webApp.onEvent("themeChanged", handleThemeChange);

          if (initData?.user) {
            const {
              id,
              first_name,
              last_name,
              username,
              photo_url,
              language_code,
              is_premium,
              allows_write_to_pm,
              is_bot,
            } = initData.user as unknown as {
              id: number;
              first_name: string;
              last_name?: string;
              username?: string;
              photo_url?: string;
              language_code?: string;
              is_premium?: boolean;
              allows_write_to_pm?: boolean;
              is_bot?: boolean;
            };

            // Save user ID to state and localStorage
            setUserId(id);
            localStorage.setItem("telegram_user_id", id.toString());

            await upsertUser(
              id,
              first_name,
              last_name,
              username,
              photo_url,
              undefined,
              language_code,
              is_premium,
              allows_write_to_pm,
              is_bot
            );

            // User has Telegram ID, not anonymous
            setIsAnonymous(false);
          } else {
            // For development environment with test ID
            try {
              const testId = Number(process.env.NEXT_PUBLIC_TELEGRAM_TEST_ID);
              if (!isNaN(testId)) {
                // Save test ID to state and localStorage
                setUserId(testId);
                localStorage.setItem("telegram_user_id", testId.toString());

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
        } catch (error) {
          console.error("Authentication error:", error);
          setIsLoading(false);
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
              // Save test ID to state and localStorage if not already set
              if (!userId) {
                setUserId(testId);
                localStorage.setItem("telegram_user_id", testId.toString());
              }

              // Check if test user is admin
              try {
                const adminStatus = await checkIsAdmin(testId);
                setIsAdmin(adminStatus);
                localStorage.setItem(
                  "telegram_is_admin",
                  adminStatus ? "true" : "false"
                );
              } catch (error) {
                console.error("Error checking admin status:", error);
              }

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
  }, [userId]);

  return (
    <TelegramContext.Provider
      value={{
        webApp,
        isLoading,
        themeParams,
        theme,
        isAdmin,
        isAnonymous,
        token,
        userId,
      }}
    >
      {children}
      {isAdmin && <ConsoleLoggerScript />}
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
