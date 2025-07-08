"use client";

import Leaderboard from "@/app/components/leaderboard/leaderboard";
import { JSX, useState } from "react";
import { useTelegram } from "@context/telegram-context";
import Score from "@/app/components/score/score";
import Settings from "@components/settings";
import Navigation from "@components/navigation";
// import GameSchedules from "@components/game-schedules";
// import GameLocations from "@components/game-locations";
// import History from "@components/history";

export type ScreenName =
  | "score"
  | "leaderboard"
  // | "history"
  | "settings";
// | "locations"
// | "schedules"

export default function Home() {
  const { theme } = useTelegram();

  const [activeScreen, setActiveScreen] = useState<ScreenName>("score");

  const screens: Record<ScreenName, JSX.Element> = {
    settings: <Settings />,
    score: <Score />,
    leaderboard: <Leaderboard />,
    // history: <History />,
    // locations: <GameLocations />,
    // schedules: <GameSchedules />,
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
