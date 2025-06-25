"use client";

import { useCallback, useEffect, useState } from "react";
import { useTelegram } from "@context/telegram-context";
import {
  getTodaysScores,
  subscribeToDailyScores,
  DailyScoreData,
} from "@lib/supabase-queries";

// Score Display Component - Apple Watch style
function ScoreDisplay({ scoreData }: { scoreData: DailyScoreData }) {
  const { theme } = useTelegram();

  const currentSets = scoreData.sets;
  const dailyTotals = scoreData.totals;

  return (
    <div className={`${theme.cardBg} rounded-2xl p-8 mx-4 my-6 shadow-lg`}>
      {/* Current Set Status */}
      <div className="text-center mb-6">
        <p className={`text-sm ${theme.secondaryText} mb-2`}>CURRENT SET</p>
        <div className={`text-xs ${theme.secondaryText} tracking-wide`}>
          {dailyTotals?.left_wins || 0} — {dailyTotals?.right_wins || 0}
        </div>
      </div>

      {/* Current Set Score Display */}
      <div className="flex justify-between items-center mb-8">
        {/* Left Team */}
        <div className="flex flex-col items-center">
          <div className={`text-sm ${theme.secondaryText} mb-2 tracking-wide`}>
            LEFT
          </div>
          <div
            className="text-6xl font-light text-blue-500 mb-4"
            style={{ fontFamily: "system-ui, -apple-system" }}
          >
            {currentSets?.left_score || 0}
          </div>
        </div>

        {/* Right Team */}
        <div className="flex flex-col items-center">
          <div className={`text-sm ${theme.secondaryText} mb-2 tracking-wide`}>
            RIGHT
          </div>
          <div
            className="text-6xl font-light text-red-500 mb-4"
            style={{ fontFamily: "system-ui, -apple-system" }}
          >
            {currentSets?.right_score || 0}
          </div>
        </div>
      </div>

      {/* Daily Totals */}
      {dailyTotals && (
        <div className="text-center pt-4 border-t border-gray-300 dark:border-gray-600">
          <p className={`text-xs ${theme.secondaryText} mb-2`}>DAILY TOTALS</p>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <div className={`text-lg font-medium text-blue-500`}>
                {dailyTotals.left_wins}
              </div>
              <div className={`text-xs ${theme.secondaryText}`}>LEFT WINS</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-medium text-red-500`}>
                {dailyTotals.right_wins}
              </div>
              <div className={`text-xs ${theme.secondaryText}`}>RIGHT WINS</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// No Data Component
function NoDataDisplay({
  theme,
}: {
  theme: ReturnType<typeof useTelegram>["theme"];
}) {
  return (
    <div className={`${theme.cardBg} p-6 rounded-lg m-4`}>
      <h3 className={`text-lg font-medium ${theme.text} mb-4 text-center`}>
        No games today
      </h3>
      <p className={`text-sm ${theme.secondaryText} text-center`}>
        Waiting for today&apos;s first game to start...
      </p>
    </div>
  );
}

export default function Start() {
  const { theme, isAnonymous } = useTelegram();
  const [scoreData, setScoreData] = useState<DailyScoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initTodaysScores = useCallback(async () => {
    try {
      const data = await getTodaysScores();
      setScoreData(data);
    } catch (error) {
      console.error("Error fetching today's scores:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    const channel = subscribeToDailyScores((newScoreData) => {
      setScoreData(newScoreData);
    });

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    initTodaysScores();
  }, [initTodaysScores]);

  if (isAnonymous) {
    return null;
  }

  const hasData = scoreData && (scoreData.sets || scoreData.totals);

  return (
    <div
      className={`flex flex-auto flex-col ${theme.bg} items-center min-h-screen`}
    >
      {isLoading ? (
        <div className={`${theme.cardBg} p-6 rounded-lg m-4 animate-pulse`}>
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      ) : hasData ? (
        <ScoreDisplay scoreData={scoreData} />
      ) : (
        <NoDataDisplay theme={theme} />
      )}
    </div>
  );
}
