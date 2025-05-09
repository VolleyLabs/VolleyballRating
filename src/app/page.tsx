"use client";

import History from "@components/history";
import Leaderboard from "@components/leaderboard";
import { JSX, useState } from "react";
import { useTelegram } from "@context/telegram-context";
import Start from "@components/start";
import Settings from "@components/settings";
import Navigation from "./components/navigation";
import GameSchedules from "./components/game-schedules";
import GameLocations from "./components/game-locations";
export type ScreenName =
  | "leaderboard"
  | "history"
  | "start"
  | "settings"
  | "locations"
  | "schedules";

export default function Home() {
  const { theme } = useTelegram();

  const [activeScreen, setActiveScreen] = useState<ScreenName>("leaderboard");

  const screens: Record<ScreenName, JSX.Element> = {
    leaderboard: <Leaderboard />,
    history: <History />,
    start: <Start />,
    settings: <Settings />,
    locations: <GameLocations />,
    schedules: <GameSchedules />,
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
