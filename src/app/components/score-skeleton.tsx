"use client";

import { useTelegram } from "@context/telegram-context";

export default function ScoreSkeleton() {
  const { theme } = useTelegram();

  return (
    <div
      className={`w-full max-w-3xl mx-auto p-3 sm:p-4 ${theme.cardBg} rounded-2xl shadow-sm overflow-hidden flex-1 animate-pulse`}
      style={theme.cardBgStyle}
    >
      {/* Header Skeleton (Day Selector + Controls) */}
      <div className="flex justify-between items-center mb-6">
        {/* Day Selector Skeleton */}
        <div className="flex-1">
          <div className="flex space-x-3 overflow-x-auto">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-20 h-12 bg-gray-300 dark:bg-gray-700 rounded-lg"
              ></div>
            ))}
          </div>
        </div>
        <div className="flex space-x-2">
          {/* Audio button skeleton */}
          <div className="h-10 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
          {/* Fullscreen button skeleton */}
          <div className="h-10 w-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>

      {/* Daily Totals Skeleton */}
      <div
        className={`${theme.border} border rounded-lg p-4 mb-6`}
        style={theme.borderStyle}
      >
        {/* Match Results title */}
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-32 mx-auto mb-3"></div>
        <div className="flex justify-between items-center">
          {/* Left sets */}
          <div className="flex flex-col items-center">
            <div className="h-12 w-8 bg-gray-300 dark:bg-gray-700 rounded mb-1"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
          </div>
          {/* Separator */}
          <div className="h-6 w-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
          {/* Right sets */}
          <div className="flex flex-col items-center">
            <div className="h-12 w-8 bg-gray-300 dark:bg-gray-700 rounded mb-1"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
          </div>
        </div>
      </div>

      {/* Current Set Skeleton */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Current Set title */}
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-28 mx-auto mb-6"></div>

        {/* Score Display */}
        <div className="flex justify-between items-center flex-1 mb-8">
          {/* Left Team */}
          <div className="flex flex-col items-center flex-1 justify-center">
            {/* LEFT label */}
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-8 mb-4"></div>
            {/* Score skeleton - large circle */}
            <div className="w-32 h-32 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <div className="w-16 h-16 bg-gray-400 dark:bg-gray-600 rounded"></div>
            </div>
          </div>

          {/* VS Separator */}
          <div className="px-4">
            <div className="h-6 w-6 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>

          {/* Right Team */}
          <div className="flex flex-col items-center flex-1 justify-center">
            {/* RIGHT label */}
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-10 mb-4"></div>
            {/* Score skeleton - large circle */}
            <div className="w-32 h-32 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <div className="w-16 h-16 bg-gray-400 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        </div>

        {/* Status Indicators Skeleton */}
        <div className="flex items-center justify-center pt-6 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
