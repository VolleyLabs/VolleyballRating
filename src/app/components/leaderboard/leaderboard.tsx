"use client";

import RatingTable from "@/app/components/leaderboard/rating";
import Vote from "@/app/components/leaderboard/vote";
import { useTelegram } from "@context/telegram-context";

export default function Leaderboard() {
  const { theme } = useTelegram();

  return (
    <div
      className={`w-full mx-auto p-2 sm:p-4 flex flex-col gap-2 items-center ${theme.bg} min-h-screen overflow-hidden`}
      style={theme.bgStyle}
    >
      <Vote />
      <RatingTable />
    </div>
  );
}
