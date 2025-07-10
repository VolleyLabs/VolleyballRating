"use client";

import { useTelegram } from "@context/telegram-context";
import CurrentSetDisplay from "./current-set-display";
import ScoreHeader from "./score-header";

export default function ScoreSkeleton() {
  const { theme } = useTelegram();

  return (
    <div
      className={`w-full max-w-3xl mx-auto p-3 sm:p-4 ${theme.cardBg} rounded-2xl shadow-sm overflow-hidden flex-1 animate-pulse`}
      style={theme.cardBgStyle}
    >
      {/* Header Skeleton */}
      <ScoreHeader
        onAudioSettingsClick={() => {}}
        onFullscreenToggle={() => {}}
        audioEnabled={false}
        audioReady={false}
        onAudioReadyChange={() => {}}
        volume={0.7}
        loading={true}
      />

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

      {/* Current Set Skeleton - Now handled by CurrentSetDisplay component */}
      <CurrentSetDisplay
        currentSets={null}
        leftFlash={false}
        rightFlash={false}
        theme={theme}
        audioEnabled={false}
        audioReady={false}
        onAudioReadyChange={() => {}}
        isHistoricalView={false}
        loading={true}
      />
    </div>
  );
}
