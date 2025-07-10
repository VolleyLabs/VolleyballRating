"use client";

import { Award } from "lucide-react";
import DayStatistics from "./day-statistics";
import { DailyScoreData } from "@lib/supabase-queries";
import { TelegramTheme } from "@utils/telegram-theme";

interface DailyTotalsDisplayProps {
  dailyTotals: {
    left_sets: number;
    right_sets: number;
  } | null;
  scoreData: DailyScoreData;
  theme: TelegramTheme;
  loading?: boolean;
}

export default function DailyTotalsDisplay({
  dailyTotals,
  scoreData,
  theme,
  loading = false,
}: DailyTotalsDisplayProps) {
  // Don't render if no daily totals and not loading
  if (!loading && !dailyTotals) {
    return null;
  }

  // Show skeleton while loading
  if (loading) {
    return (
      <div
        className={`${theme.border} border rounded-lg p-4 mb-6 relative z-10 animate-pulse`}
        style={theme.borderStyle}
      >
        {/* Match Results title skeleton */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-5 h-5 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
        </div>

        <div className="flex justify-between items-center mb-4">
          {/* Left sets skeleton */}
          <div className="flex flex-col items-center">
            <div className="h-12 w-8 bg-gray-300 dark:bg-gray-700 rounded mb-1"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
          </div>
          {/* Separator skeleton */}
          <div className="h-6 w-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
          {/* Right sets skeleton */}
          <div className="flex flex-col items-center">
            <div className="h-12 w-8 bg-gray-300 dark:bg-gray-700 rounded mb-1"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
          </div>
        </div>

        {/* Day Statistics skeleton */}
        <div className="space-y-3">
          <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-24 mx-auto"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16 mx-auto mb-1"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-12 mx-auto"></div>
            </div>
            <div className="text-center">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16 mx-auto mb-1"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-12 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${theme.border} border rounded-lg p-4 mb-6 relative z-10`}
      style={theme.borderStyle}
    >
      <h2
        className={`text-lg font-semibold ${theme.text} mb-3 text-center flex items-center justify-center gap-2`}
        style={theme.textStyle}
      >
        <Award size={20} className="text-purple-500" />
        Match Results
      </h2>
      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-col items-center">
          <div className="text-blue-500 font-bold text-3xl mb-1">
            {dailyTotals?.left_sets || 0}
          </div>
          <div
            className={`text-sm ${theme.secondaryText} font-medium`}
            style={theme.secondaryTextStyle}
          >
            LEFT SETS
          </div>
        </div>
        <div
          className={`text-2xl ${theme.text} font-light`}
          style={theme.textStyle}
        >
          —
        </div>
        <div className="flex flex-col items-center">
          <div className="text-red-500 font-bold text-3xl mb-1">
            {dailyTotals?.right_sets || 0}
          </div>
          <div
            className={`text-sm ${theme.secondaryText} font-medium`}
            style={theme.secondaryTextStyle}
          >
            RIGHT SETS
          </div>
        </div>
      </div>

      {/* Day Statistics */}
      <DayStatistics scoreData={scoreData} theme={theme} />
    </div>
  );
}
