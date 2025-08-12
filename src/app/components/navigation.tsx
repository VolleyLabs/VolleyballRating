"use client";

import Image from "next/image";
import { useTelegram } from "@context/telegram-context";
import { ScreenName } from "../page";
import { useEffect, useState } from "react";
import { supabase, getUser } from "@/app/lib/supabase-queries";

interface NavigationProps {
  activeScreen: ScreenName;
  setActiveScreen: (screen: ScreenName) => void;
  screenNames: ScreenName[];
}

export default function Navigation({
  activeScreen,
  setActiveScreen,
  screenNames,
}: NavigationProps) {
  const { webApp, theme, isAdmin, isLoading, isAnonymous } = useTelegram();
  const [avatarUrl, setAvatarUrl] = useState<string>("/default-avatar.svg");
  // Keep for potential future use in tooltips or menus, but suppress linter for unused
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [firstName, setFirstName] = useState<string>("Player");
  const [webUserEmail, setWebUserEmail] = useState<string | null>(null);

  // Web (non-Telegram) auth: observe Supabase user
  useEffect(() => {
    if (webApp) return; // Only for web usage
    let isMounted = true;
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      setWebUserEmail(data.user?.email ?? null);
      const meta = data.user?.user_metadata as
        | { avatar_url?: string; picture?: string; photo_url?: string }
        | undefined;
      const candidate = meta?.avatar_url || meta?.picture || meta?.photo_url;
      if (candidate) setAvatarUrl(candidate);
      const nameMeta = data.user?.user_metadata as
        | {
            first_name?: string;
            given_name?: string;
            name?: string;
            full_name?: string;
          }
        | undefined;
      const resolvedName =
        nameMeta?.first_name ||
        nameMeta?.given_name ||
        (nameMeta?.name ? nameMeta.name.split(" ")[0] : undefined) ||
        (nameMeta?.full_name ? nameMeta.full_name.split(" ")[0] : undefined) ||
        (data.user?.email ? data.user.email.split("@")[0] : undefined) ||
        "Player";
      setFirstName(resolvedName);
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setWebUserEmail(session?.user?.email ?? null);
      const meta = session?.user?.user_metadata as
        | { avatar_url?: string; picture?: string; photo_url?: string }
        | undefined;
      const candidate = meta?.avatar_url || meta?.picture || meta?.photo_url;
      if (candidate) setAvatarUrl(candidate);
      const nameMeta = session?.user?.user_metadata as
        | {
            first_name?: string;
            given_name?: string;
            name?: string;
            full_name?: string;
          }
        | undefined;
      const resolvedName =
        nameMeta?.first_name ||
        nameMeta?.given_name ||
        (nameMeta?.name ? nameMeta.name.split(" ")[0] : undefined) ||
        (nameMeta?.full_name ? nameMeta.full_name.split(" ")[0] : undefined) ||
        (session?.user?.email ? session.user.email.split("@")[0] : undefined) ||
        "Player";
      setFirstName(resolvedName);
    });
    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, [webApp]);

  // Telegram mode: prefer avatar from our public.users table
  useEffect(() => {
    const loadFromUsers = async () => {
      try {
        // userId is stored in localStorage by TelegramProvider
        const idStr =
          typeof window !== "undefined"
            ? localStorage.getItem("telegram_user_id")
            : null;
        const tgId = idStr ? parseInt(idStr) : null;
        if (!tgId) return;
        const user = await getUser(tgId);
        if (user?.photo_url) setAvatarUrl(user.photo_url);
        if (user?.first_name) setFirstName(user.first_name);
      } catch (e) {
        console.error("Failed to load user avatar from database", e);
      }
    };
    if (webApp) loadFromUsers();
  }, [webApp]);

  const handleOAuthLogin = async (provider: "google" | "apple") => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams:
          provider === "google"
            ? { access_type: "offline", prompt: "consent" }
            : undefined,
      },
    });
    if (error) {
      console.error(`OAuth ${provider} error:`, error.message);
      return;
    }
    if (data?.url) window.location.href = data.url;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const iconMap: Record<ScreenName, string> = {
    settings: "/settings.svg",
    score: "/volleyball.svg",
    leaderboard: "/leaderboard.svg",
    // history: "/history.svg",
    // locations: "/location.svg",
    // schedules: "/calendar.svg",
  };

  const handleAvatarClick = () => {
    setActiveScreen("settings");
  };

  return (
    <nav
      className={`flex items-center justify-between p-4 border-b ${theme.border}`}
      style={theme.borderStyle}
    >
      <div className="flex items-center gap-3">
        {webApp === null ? (
          // Web mode: show OAuth buttons or avatar/signout
          webUserEmail ? (
            <div className="flex items-center gap-2">
              <div
                className="relative cursor-pointer transform transition-all duration-200 hover:scale-110 group"
                onClick={handleAvatarClick}
                title="User Settings"
              >
                <div className="overflow-hidden rounded-full relative">
                  <Image
                    src={avatarUrl}
                    alt="User Photo"
                    width={40}
                    height={40}
                    priority
                    className="rounded-full transition-all duration-200 group-hover:brightness-110"
                  />
                  <div className="absolute inset-0 bg-[#4CD964] opacity-0 group-hover:opacity-10 transition-opacity duration-200 rounded-full"></div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="px-2 py-1 text-xs rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800"
                aria-label="Sign out"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOAuthLogin("google")}
                className="w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center"
                title="Sign in with Google"
                aria-label="Sign in with Google"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" fill="#fff" stroke="#E5E7EB" />
                  <text
                    x="12"
                    y="16"
                    textAnchor="middle"
                    fontSize="12"
                    fill="#EA4335"
                    fontFamily="system-ui, -apple-system, Segoe UI, Roboto"
                  >
                    G
                  </text>
                </svg>
              </button>
              <button
                onClick={() => handleOAuthLogin("apple")}
                className="w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center"
                title="Sign in with Apple"
                aria-label="Sign in with Apple"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" fill="#000" />
                  <text
                    x="12"
                    y="16"
                    textAnchor="middle"
                    fontSize="12"
                    fill="#fff"
                    fontFamily="system-ui, -apple-system, Segoe UI, Roboto"
                  >
                    
                  </text>
                </svg>
              </button>
            </div>
          )
        ) : isAnonymous ? (
          <div></div>
        ) : isLoading ? (
          <div className="w-[40px] h-[40px] rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
        ) : (
          <div
            className="relative cursor-pointer transform transition-all duration-200 hover:scale-110 group"
            onClick={handleAvatarClick}
            title="User Settings"
          >
            <div className="overflow-hidden rounded-full relative">
              <Image
                src={avatarUrl}
                alt="User Photo"
                width={40}
                height={40}
                priority
                className={`rounded-full transition-all duration-200 ${
                  activeScreen === "settings"
                    ? "ring-2 ring-offset-1 ring-[#4CD964]"
                    : "group-hover:brightness-110"
                }`}
              />
              <div className="absolute inset-0 bg-[#4CD964] opacity-0 group-hover:opacity-10 transition-opacity duration-200 rounded-full"></div>
            </div>
            {isAdmin && (
              <div
                className="absolute bottom-0 right-0"
                style={{ transform: "translate(20%, 20%)" }}
              >
                <div
                  className="bg-[#0d1c2b] text-[#4CD964] text-[8px] font-bold px-1.5 py-0.5 rounded-sm"
                  style={{ boxShadow: "0 0 0 1px #1a2a3a" }}
                >
                  Admin
                </div>
              </div>
            )}
          </div>
        )}
        {/* Hide name label; use avatar only */}
      </div>

      <div className="flex space-x-4">
        {screenNames.map((screen) => (
          <button
            key={screen}
            onClick={() => setActiveScreen(screen)}
            className={`p-3 rounded-full transition-all duration-200 transform hover:scale-110 ${
              activeScreen === screen
                ? `${theme.primaryButton} hover:brightness-110`
                : `${theme.secondaryButton} hover:bg-opacity-80 hover:shadow-md`
            }`}
            style={activeScreen === screen ? theme.primaryButtonStyle : {}}
            title={screen.charAt(0).toUpperCase() + screen.slice(1)}
          >
            <Image
              src={iconMap[screen]}
              alt={screen}
              width={24}
              height={24}
              priority={screen === "score" || screen === "leaderboard"}
              className={activeScreen === screen ? "brightness-0 invert" : ""}
            />
          </button>
        ))}
      </div>
    </nav>
  );
}
