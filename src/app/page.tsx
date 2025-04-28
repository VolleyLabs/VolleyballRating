"use client";

import History from "@components/history";
import Leaderboard from "@components/leaderboard";
import { JSX, useState } from "react";
import { useTelegram } from "@context/telegram-context";
import Start from "@components/start";
import Settings from "@components/settings";
import Navigation from "./components/navigation";

export type ScreenName = "leaderboard" | "history" | "start" | "settings";

export default function Home() {
  const { theme } = useTelegram();

  const [activeScreen, setActiveScreen] = useState<ScreenName>("leaderboard");

  const screens: Record<ScreenName, JSX.Element> = {
    leaderboard: <Leaderboard />,
    history: <History />,
    start: <Start />,
    settings: <Settings />,
  };

  // Get visible navigation items (settings is accessed via avatar)
  const visibleScreens = Object.keys(screens).filter(
    (screen) => screen !== "settings"
  ) as ScreenName[];

  return (
    <div className={`${theme.bg} flex flex-auto flex-col`}>
      <Navigation
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        screenNames={visibleScreens}
      />
      {screens[activeScreen]}
      {/* <Footer setActiveScreen={setActiveScreen}/> */}
    </div>
  );
}
