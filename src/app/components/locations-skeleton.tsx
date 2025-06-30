"use client";

import { useTelegram } from "@context/telegram-context";

export default function LocationsSkeleton() {
  const { theme } = useTelegram();

  return (
    <div
      className={`w-full mx-auto p-2 sm:p-4 flex flex-col gap-4 items-center ${theme.bg} min-h-screen overflow-hidden`}
      style={theme.bgStyle}
    >
      {/* Header skeleton */}
      <div
        className={`w-full max-w-md mx-auto p-4 ${theme.cardBg} rounded-lg shadow-sm animate-pulse`}
        style={theme.cardBgStyle}
      >
        <div className="flex justify-between items-center">
          <div className="h-8 w-36 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>

      {/* Location cards skeleton */}
      <div className="w-full max-w-md mx-auto grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`location-skeleton-${index}`}
            className={`rounded-lg border ${theme.border} overflow-hidden shadow-sm animate-pulse`}
            style={theme.borderStyle}
          >
            <div className="p-4">
              {/* Location name skeleton */}
              <div className="h-6 w-40 bg-gray-300 dark:bg-gray-700 rounded mb-3"></div>

              {/* Address skeleton */}
              <div className="h-4 w-full bg-gray-300 dark:bg-gray-700 rounded mb-3"></div>

              {/* Details grid skeleton */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <div className="h-3 w-12 bg-gray-300 dark:bg-gray-700 rounded mb-1"></div>
                  <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
                </div>
                <div>
                  <div className="h-3 w-10 bg-gray-300 dark:bg-gray-700 rounded mb-1"></div>
                  <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
                </div>
                <div>
                  <div className="h-3 w-14 bg-gray-300 dark:bg-gray-700 rounded mb-1"></div>
                  <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
                </div>
                <div>
                  <div className="h-3 w-16 bg-gray-300 dark:bg-gray-700 rounded mb-1"></div>
                  <div className="h-4 w-18 bg-gray-300 dark:bg-gray-700 rounded"></div>
                </div>
              </div>

              {/* Action buttons skeleton */}
              <div className="flex space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="h-8 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-8 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-8 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add new button skeleton */}
      <div className="w-full max-w-md mx-auto">
        <div className="h-12 w-full bg-gray-300 dark:bg-gray-700 rounded-md animate-pulse"></div>
      </div>
    </div>
  );
}
