"use client";

import { useTelegram } from "@context/telegram-context";
import { TelegramTheme } from "@utils/telegram-theme";

// Player card skeleton for voting section
function PlayerCardSkeleton({ theme }: { theme: TelegramTheme }) {
  return (
    <div
      className={`flex flex-col items-center px-4 pt-4 pb-3 border rounded-lg shadow-sm ${theme.border} animate-pulse`}
      style={theme.borderStyle}
    >
      <div className="relative mb-2 overflow-hidden rounded-full">
        <div className="w-[120px] h-[120px] rounded-full bg-gray-300 dark:bg-gray-700"></div>
      </div>
      <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded mt-2 mb-1"></div>
      <div className="h-3 w-20 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
    </div>
  );
}

// Vote section skeleton
function VoteSkeleton({ theme }: { theme: TelegramTheme }) {
  return (
    <div
      className={`w-full max-w-md mx-auto p-3 sm:p-4 ${theme.cardBg} rounded-lg shadow-sm overflow-hidden animate-pulse`}
      style={theme.cardBgStyle}
    >
      {/* Title skeleton */}
      <div className="h-6 w-40 bg-gray-300 dark:bg-gray-700 rounded mx-auto mb-5"></div>

      {/* Player cards skeleton */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <PlayerCardSkeleton theme={theme} />
        <PlayerCardSkeleton theme={theme} />
      </div>

      {/* Vote button skeleton */}
      <div className="w-full h-10 bg-gray-300 dark:bg-gray-700 rounded-md mt-4"></div>
    </div>
  );
}

// Rating table skeleton
function RatingTableSkeleton({ theme }: { theme: TelegramTheme }) {
  return (
    <div
      className={`w-full max-w-md mx-auto ${theme.cardBg} rounded-lg shadow-sm overflow-hidden animate-pulse`}
      style={theme.cardBgStyle}
    >
      {/* Header skeleton */}
      <div
        className={`flex items-center justify-between p-4 ${theme.headerBg} border-b ${theme.border}`}
        style={{
          ...theme.headerBgStyle,
          borderColor: theme.borderStyle.borderColor,
        }}
      >
        <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
        <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
      </div>

      {/* Table header skeleton */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="h-4 w-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>

      {/* Table rows skeleton */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={`rating-skeleton-${index}`} className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
              <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div className="h-3 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LeaderboardSkeleton() {
  const { theme } = useTelegram();

  return (
    <div
      className={`w-full mx-auto p-2 sm:p-4 flex flex-col gap-2 items-center ${theme.bg} min-h-screen overflow-hidden`}
      style={theme.bgStyle}
    >
      <VoteSkeleton theme={theme} />
      <RatingTableSkeleton theme={theme} />
    </div>
  );
}
