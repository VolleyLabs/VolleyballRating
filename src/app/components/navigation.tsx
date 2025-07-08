"use client";

import Image from "next/image";
import { useTelegram } from "@context/telegram-context";
import { ScreenName } from "../page";
import { useEffect, useState } from "react";

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
  const [userPhotoUrl, setUserPhotoUrl] = useState<string>(
    "/default-avatar.svg"
  );
  const [firstName, setFirstName] = useState<string>("Player");

  // Safely access user data only on the client side
  useEffect(() => {
    if (webApp && webApp.initDataUnsafe && webApp.initDataUnsafe.user) {
      if (webApp.initDataUnsafe.user.photo_url) {
        setUserPhotoUrl(webApp.initDataUnsafe.user.photo_url);
      }
      if (webApp.initDataUnsafe.user.first_name) {
        setFirstName(webApp.initDataUnsafe.user.first_name);
      }
    }
  }, [webApp]);

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
        {isAnonymous ? (
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
                src={userPhotoUrl}
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
        {!isLoading && !isAnonymous && (
          <span
            className={`text-sm font-medium ${theme.text} hidden sm:inline-block cursor-pointer transition-all duration-200 hover:text-[#4CD964]`}
            style={theme.textStyle}
            onClick={handleAvatarClick}
          >
            {firstName}
          </span>
        )}
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
