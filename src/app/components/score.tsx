"use client";

import { useCallback, useEffect, useState } from "react";
import { useTelegram } from "@context/telegram-context";
import {
  getTodaysScores,
  subscribeToDailyScores,
  DailyScoreData,
} from "@lib/supabase-queries";
import ScoreDisplay from "./score-display";
import NoDataDisplay from "./no-data-display";
import ScoreSkeleton from "./score-skeleton";

export default function Score() {
  const { theme, isAnonymous } = useTelegram();
  const [scoreData, setScoreData] = useState<DailyScoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    console.log("Setting up real-time subscription for daily scores");
    const channel = subscribeToDailyScores((newScoreData) => {
      console.log("Received updated score data via real-time:", newScoreData);
      setScoreData(newScoreData);
    });

    return () => {
      if (channel) {
        console.log("Cleaning up real-time subscription");
        channel.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    initTodaysScores();
  }, [initTodaysScores]);

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (isAnonymous) {
    return null;
  }

  const hasData = scoreData && (scoreData.sets || scoreData.totals);

  return (
    <div
      className={`flex flex-auto flex-col ${theme.bg} items-center min-h-screen relative`}
    >
      <div className="flex-1 w-full flex flex-col pb-0">
        {isLoading ? (
          <ScoreSkeleton />
        ) : hasData ? (
          <ScoreDisplay
            scoreData={scoreData}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
          />
        ) : (
          <NoDataDisplay />
        )}
      </div>

      {/* Footer with Live tracking status */}
      {!isLoading && hasData && !isFullscreen && (
        <div
          className={`fixed bottom-0 left-0 right-0 ${theme.bg} border-t border-gray-200 dark:border-gray-700 py-2 px-4 z-50`}
          style={theme.bgStyle}
        >
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span
                className={`text-xs ${theme.secondaryText} font-medium`}
                style={theme.secondaryTextStyle}
              >
                Live tracking
              </span>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span
                className={`text-xs ${theme.secondaryText} font-medium opacity-75`}
                style={theme.secondaryTextStyle}
              >
                Tap anywhere to enable audio
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
