"use client";

import { useTelegram } from "@context/telegram-context";
import CurrentSetDisplay from "./current-set-display";
import ScoreHeader from "./score-header";
import DailyTotalsDisplay from "./daily-totals-display";

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
      <DailyTotalsDisplay
        dailyTotals={null}
        scoreData={{
          sets: null,
          totals: null,
          points: [],
        }}
        theme={theme}
        loading={true}
      />

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
