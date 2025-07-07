"use client";

import { useCallback, useEffect, useState } from "react";
import { useTelegram } from "@context/telegram-context";
import {
  getTodaysScores,
  getScoresForDate,
  subscribeToDailyScores,
  DailyScoreData,
} from "@lib/supabase-queries";
import { isToday, getTodayLocal } from "@utils/date";
import ScoreDisplay from "./score-display";
import NoDataDisplay from "./no-data-display";
import ScoreSkeleton from "./score-skeleton";
import DaySelector from "./day-selector";

export default function Score() {
  const { theme, isAnonymous } = useTelegram();
  const [scoreData, setScoreData] = useState<DailyScoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    getTodayLocal() // Initialize with today's local date
  );

  const initScoresForDate = useCallback(async (date: string) => {
    setIsLoading(true);
    try {
      const data = isToday(date)
        ? await getTodaysScores()
        : await getScoresForDate(date);
      setScoreData(data);
    } catch (error) {
      console.error("Error fetching scores for date:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up real-time subscription only for today
  useEffect(() => {
    if (!isToday(selectedDate)) {
      return; // Don't subscribe to real-time updates for historical dates
    }

    console.log("Setting up real-time subscription for daily scores");
    const subscription = subscribeToDailyScores((newScoreData) => {
      console.log("Received updated score data via real-time:", newScoreData);
      setScoreData(newScoreData);
    });

    return () => {
      if (subscription) {
        console.log("Cleaning up real-time subscription");
        subscription.unsubscribe();
      }
    };
  }, [selectedDate]);

  // Load scores when selected date changes
  useEffect(() => {
    initScoresForDate(selectedDate);
  }, [selectedDate, initScoresForDate]);

  // Handle escape key and fullscreen changes
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    const handleFullscreenChange = () => {
      // If user exits browser fullscreen (e.g., via ESC or browser controls),
      // sync our component state
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isFullscreen]);

  const toggleFullscreen = async () => {
    const newFullscreenState = !isFullscreen;

    if (newFullscreenState) {
      // Entering fullscreen - request browser fullscreen
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          console.log("Browser fullscreen activated");
        }
        setIsFullscreen(true);
      } catch (err) {
        console.error("Failed to request browser fullscreen:", err);
        // Still set fullscreen state even if browser fullscreen fails
        setIsFullscreen(true);
      }
    } else {
      // Exiting fullscreen
      setIsFullscreen(false);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  if (isAnonymous) {
    return null;
  }

  const showLiveTracking = isToday(selectedDate) && scoreData;

  // Create day selector component
  const daySelector = !isFullscreen ? (
    <DaySelector selectedDate={selectedDate} onDateChange={handleDateChange} />
  ) : null;

  return (
    <div
      className={`flex flex-auto flex-col ${theme.bg} items-center min-h-screen relative`}
    >
      <div className="flex-1 w-full flex flex-col pb-0">
        {isLoading ? (
          <ScoreSkeleton />
        ) : scoreData ? (
          <ScoreDisplay
            scoreData={scoreData}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            selectedDate={selectedDate}
            isHistoricalView={!isToday(selectedDate)}
            daySelector={daySelector}
            onRefreshScores={() => initScoresForDate(selectedDate)}
          />
        ) : (
          <NoDataDisplay />
        )}
      </div>

      {/* Footer with Live tracking status - only for today */}
      {!isLoading && showLiveTracking && !isFullscreen && (
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
