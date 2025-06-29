"use client";

import { useTelegram } from "@context/telegram-context";

export default function LoadingDisplay() {
  const { theme } = useTelegram();

  return (
    <div className={`${theme.cardBg} p-6 rounded-lg m-4 animate-pulse`}>
      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
    </div>
  );
}
