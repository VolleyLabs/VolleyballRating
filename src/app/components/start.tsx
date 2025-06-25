"use client";

import { useCallback, useEffect, useState } from "react";
import { useTelegram } from "@context/telegram-context";
import {
  getTodaysScores,
  subscribeToDailyScores,
  DailyScoreData,
} from "@lib/supabase-queries";

// Speech synthesis for announcing score changes
const speak = (text: string, pitch: number = 1, rate: number = 1.2) => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  try {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.volume = 0.8;

    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.log("Speech synthesis not supported:", error);
  }
};

// Different announcements for each side
const announceLeftScore = () => {
  speak("Left", 1.2, 1.4); // Higher pitch for left
};

const announceRightScore = () => {
  speak("Right", 0.8, 1.2); // Lower pitch for right
};

// Score Display Component - Apple Watch style
function ScoreDisplay({
  scoreData,
  isFullscreen,
  onToggleFullscreen,
}: {
  scoreData: DailyScoreData;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const { theme } = useTelegram();
  const [leftFlash, setLeftFlash] = useState(false);
  const [rightFlash, setRightFlash] = useState(false);
  const [previousScoreData, setPreviousScoreData] =
    useState<DailyScoreData | null>(null);

  const currentSets = scoreData.sets;
  const dailyTotals = scoreData.totals;

  // Detect score changes and trigger flash
  useEffect(() => {
    if (previousScoreData && currentSets && previousScoreData.sets) {
      const leftChanged =
        currentSets.left_score !== previousScoreData.sets.left_score;
      const rightChanged =
        currentSets.right_score !== previousScoreData.sets.right_score;

      if (leftChanged) {
        setLeftFlash(true);
        // Announce left score change
        announceLeftScore();
        // Vibrate for left side
        if ("vibrate" in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
        setTimeout(() => setLeftFlash(false), 5000);
      }

      if (rightChanged) {
        setRightFlash(true);
        // Announce right score change
        announceRightScore();
        // Vibrate for right side
        if ("vibrate" in navigator) {
          navigator.vibrate([200]);
        }
        setTimeout(() => setRightFlash(false), 5000);
      }
    }
    setPreviousScoreData(scoreData);
  }, [scoreData, previousScoreData]);

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Flash overlays */}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-200 ${
            leftFlash ? "opacity-20" : "opacity-0"
          }`}
          style={{
            background:
              "linear-gradient(to right, #3b82f6 50%, transparent 50%)",
          }}
        />
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-200 ${
            rightFlash ? "opacity-20" : "opacity-0"
          }`}
          style={{
            background:
              "linear-gradient(to left, #ef4444 50%, transparent 50%)",
          }}
        />

        {/* Top bar with exit button and daily totals */}
        <div className="flex justify-between items-center p-4 bg-gray-900">
          <button
            onClick={onToggleFullscreen}
            className="text-white bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Exit Fullscreen
          </button>
          {dailyTotals && (
            <div className="text-center">
              <div className="text-white text-lg font-medium">
                {dailyTotals.left_wins} — {dailyTotals.right_wins}
              </div>
            </div>
          )}
          <div className="w-[120px]"></div> {/* Spacer for centering */}
        </div>

        {/* Main score area */}
        <div className="flex-1 flex">
          {/* Left side */}
          <div className="flex-1 flex flex-col items-center justify-center bg-black border-r border-gray-600">
            <div
              className={`text-blue-400 font-light transition-all duration-200 ${
                leftFlash ? "scale-110 brightness-150" : ""
              }`}
              style={{
                fontSize: "min(60vw, 70vh)",
                lineHeight: "0.5",
                fontFamily: "system-ui, -apple-system",
              }}
            >
              {currentSets?.left_score || 0}
            </div>
          </div>

          {/* Right side */}
          <div className="flex-1 flex flex-col items-center justify-center bg-black">
            <div
              className={`text-red-400 font-light transition-all duration-200 ${
                rightFlash ? "scale-110 brightness-150" : ""
              }`}
              style={{
                fontSize: "min(60vw, 70vh)",
                lineHeight: "0.5",
                fontFamily: "system-ui, -apple-system",
              }}
            >
              {currentSets?.right_score || 0}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${theme.cardBg} rounded-2xl p-8 mx-4 my-6 shadow-lg relative overflow-hidden`}
    >
      {/* Flash overlays for normal mode */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-200 rounded-2xl ${
          leftFlash ? "opacity-10" : "opacity-0"
        }`}
        style={{
          background: "linear-gradient(to right, #3b82f6 50%, transparent 50%)",
        }}
      />
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-200 rounded-2xl ${
          rightFlash ? "opacity-10" : "opacity-0"
        }`}
        style={{
          background: "linear-gradient(to left, #ef4444 50%, transparent 50%)",
        }}
      />

      {/* Header with global score */}
      <div className="text-center mb-6 relative z-10">
        <div className="flex justify-between items-center mb-2">
          <div className="w-8"></div> {/* Spacer */}
          {dailyTotals && (
            <div className={`text-xl ${theme.text} font-medium tracking-wide`}>
              {dailyTotals.left_wins} — {dailyTotals.right_wins}
            </div>
          )}
          <button
            onClick={onToggleFullscreen}
            className="text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-2 py-1 rounded transition-colors"
            title="Fullscreen mode"
          >
            ⛶
          </button>
        </div>
      </div>

      {/* Current Set Score Display */}
      <div className="flex justify-between items-center mb-8 relative z-10">
        {/* Left Team */}
        <div className="flex flex-col items-center">
          <div
            className={`font-light text-blue-500 transition-all duration-200 ${
              leftFlash ? "scale-110 brightness-125" : ""
            }`}
            style={{
              fontSize: "12rem",
              lineHeight: "0.8",
              fontFamily: "system-ui, -apple-system",
            }}
          >
            {currentSets?.left_score || 0}
          </div>
        </div>

        {/* Right Team */}
        <div className="flex flex-col items-center">
          <div
            className={`font-light text-red-500 transition-all duration-200 ${
              rightFlash ? "scale-110 brightness-125" : ""
            }`}
            style={{
              fontSize: "12rem",
              lineHeight: "0.8",
              fontFamily: "system-ui, -apple-system",
            }}
          >
            {currentSets?.right_score || 0}
          </div>
        </div>
      </div>
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
      className={`flex flex-auto flex-col ${theme.bg} items-center min-h-screen`}
    >
      {isLoading ? (
        <div className={`${theme.cardBg} p-6 rounded-lg m-4 animate-pulse`}>
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      ) : hasData ? (
        <ScoreDisplay
          scoreData={scoreData}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
      ) : (
        <NoDataDisplay theme={theme} />
      )}
    </div>
  );
}
