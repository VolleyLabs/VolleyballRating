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
  const [dynamicFontSize, setDynamicFontSize] = useState("80vh");

  const currentSets = scoreData.sets;
  const dailyTotals = scoreData.totals;

  // Calculate optimal font size based on viewport dimensions
  const calculateOptimalFontSize = () => {
    if (typeof window === "undefined") return "80vh";

    const width = window.innerWidth;
    const height = window.innerHeight;

    // For each side (half width), calculate max font size
    // Account for 2-digit numbers and some padding
    const maxWidthBasedSize = width * 0.5 * 0.7; // 70% of half width for 2-digit numbers
    const maxHeightBasedSize = height * 0.8; // 80% of height accounting for top/bottom elements

    return `${Math.min(maxWidthBasedSize, maxHeightBasedSize)}px`;
  };

  // Update font size on mount and resize
  useEffect(() => {
    const updateFontSize = () => {
      setDynamicFontSize(calculateOptimalFontSize());
    };

    updateFontSize();
    window.addEventListener("resize", updateFontSize);
    window.addEventListener("orientationchange", updateFontSize);

    return () => {
      window.removeEventListener("resize", updateFontSize);
      window.removeEventListener("orientationchange", updateFontSize);
    };
  }, []);

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
          className={`absolute inset-0 pointer-events-none ${
            leftFlash ? "opacity-60" : "opacity-0"
          }`}
          style={{
            background:
              "linear-gradient(to right, #3b82f6 50%, transparent 50%)",
            transition: leftFlash ? "none" : "opacity 1s ease-out",
          }}
        />
        <div
          className={`absolute inset-0 pointer-events-none ${
            rightFlash ? "opacity-60" : "opacity-0"
          }`}
          style={{
            background:
              "linear-gradient(to left, #ef4444 50%, transparent 50%)",
            transition: rightFlash ? "none" : "opacity 1s ease-out",
          }}
        />

        {/* Global score at top center */}
        {dailyTotals && (
          <div
            className="absolute top-1 left-1/2 transform -translate-x-1/2 text-white font-medium z-10 px-4 py-1"
            style={{ fontSize: "6.4rem" }}
          >
            <span className="mr-6">{dailyTotals.left_wins}</span>
            <span className="ml-6">{dailyTotals.right_wins}</span>
          </div>
        )}

        {/* Main score area - full height */}
        <div className="flex-1 flex relative">
          {/* Left side */}
          <div className="flex-1 flex flex-col items-center justify-center bg-black border-r border-gray-600 relative">
            <div
              className={`font-light transition-all duration-200 ${
                leftFlash ? "scale-125" : ""
              }`}
              style={{
                fontSize: dynamicFontSize,
                lineHeight: "0.4",
                fontFamily: "system-ui, -apple-system",
                color: leftFlash ? "#60a5fa" : "#60a5fa", // Always bright blue
                textShadow: leftFlash
                  ? "0 0 40px rgba(96, 165, 250, 1), 0 0 80px rgba(96, 165, 250, 0.5)"
                  : "0 0 10px rgba(96, 165, 250, 0.3)",
              }}
            >
              {currentSets?.left_score || 0}
            </div>
          </div>

          {/* Right side */}
          <div className="flex-1 flex flex-col items-center justify-center bg-black">
            <div
              className={`font-light transition-all duration-200 ${
                rightFlash ? "scale-125" : ""
              }`}
              style={{
                fontSize: dynamicFontSize,
                lineHeight: "0.4",
                fontFamily: "system-ui, -apple-system",
                color: rightFlash ? "#f87171" : "#f87171", // Always bright red
                textShadow: rightFlash
                  ? "0 0 40px rgba(248, 113, 113, 1), 0 0 80px rgba(248, 113, 113, 0.5)"
                  : "0 0 10px rgba(248, 113, 113, 0.3)",
              }}
            >
              {currentSets?.right_score || 0}
            </div>
          </div>
        </div>

        {/* Bottom exit button */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
          <button
            onClick={onToggleFullscreen}
            className="text-white bg-gray-800 bg-opacity-80 hover:bg-opacity-100 px-6 py-3 rounded-full text-sm font-medium transition-all backdrop-blur-sm"
          >
            Exit Fullscreen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full max-w-md mx-auto p-3 sm:p-4 ${theme.cardBg} rounded-lg shadow-sm overflow-hidden flex-1`}
      style={theme.cardBgStyle}
    >
      {/* Flash overlays for normal mode */}
      <div
        className={`absolute inset-0 pointer-events-none rounded-2xl ${
          leftFlash ? "opacity-40" : "opacity-0"
        }`}
        style={{
          background: "linear-gradient(to right, #3b82f6 50%, transparent 50%)",
          transition: leftFlash ? "none" : "opacity 1s ease-out",
        }}
      />
      <div
        className={`absolute inset-0 pointer-events-none rounded-2xl ${
          rightFlash ? "opacity-40" : "opacity-0"
        }`}
        style={{
          background: "linear-gradient(to left, #ef4444 50%, transparent 50%)",
          transition: rightFlash ? "none" : "opacity 1s ease-out",
        }}
      />

      {/* Header with title and fullscreen button */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex-1">
          <h1
            className={`text-2xl font-bold ${theme.text} mb-1`}
            style={theme.textStyle}
          >
            🏐 Live Score
          </h1>
          <p
            className={`text-sm ${theme.secondaryText}`}
            style={theme.secondaryTextStyle}
          >
            Real-time volleyball tracking
          </p>
        </div>
        <button
          onClick={onToggleFullscreen}
          className="text-3xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-4 py-3 rounded transition-colors"
          title="Fullscreen mode"
        >
          ⛶
        </button>
      </div>

      {/* Daily Totals Section */}
      {dailyTotals && (
        <div
          className={`${theme.border} border rounded-lg p-4 mb-6 relative z-10`}
          style={theme.borderStyle}
        >
          <h2
            className={`text-lg font-semibold ${theme.text} mb-3 text-center`}
            style={theme.textStyle}
          >
            📊 Daily Results
          </h2>
          <div className="flex justify-between items-center">
            <div className="flex flex-col items-center">
              <div className="text-blue-500 font-bold text-3xl mb-1">
                {dailyTotals.left_wins}
              </div>
              <div
                className={`text-sm ${theme.secondaryText} font-medium`}
                style={theme.secondaryTextStyle}
              >
                LEFT WINS
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
                {dailyTotals.right_wins}
              </div>
              <div
                className={`text-sm ${theme.secondaryText} font-medium`}
                style={theme.secondaryTextStyle}
              >
                RIGHT WINS
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Set Score Display - Expanded */}
      <div className="relative z-10 flex-1 flex flex-col">
        <h2
          className={`text-xl font-semibold ${theme.text} mb-6 text-center`}
          style={theme.textStyle}
        >
          🔥 Current Set
        </h2>
        <div className="flex justify-between items-center flex-1 mb-8">
          {/* Left Team */}
          <div className="flex flex-col items-center flex-1 justify-center">
            <div
              className={`text-sm ${theme.secondaryText} font-semibold mb-4 tracking-wide`}
              style={theme.secondaryTextStyle}
            >
              LEFT
            </div>
            <div
              className={`font-light text-blue-500 transition-all duration-300 ${
                leftFlash ? "scale-110 brightness-150" : ""
              }`}
              style={{
                fontSize: "8rem",
                lineHeight: "0.8",
                fontFamily: "system-ui, -apple-system",
                textShadow: leftFlash
                  ? "0 0 40px rgba(59, 130, 246, 0.9)"
                  : "0 0 5px rgba(59, 130, 246, 0.3)",
              }}
            >
              {currentSets?.left_score || 0}
            </div>
          </div>

          {/* VS Separator */}
          <div className="px-4">
            <div
              className={`text-xl ${theme.secondaryText} font-medium`}
              style={theme.secondaryTextStyle}
            >
              VS
            </div>
          </div>

          {/* Right Team */}
          <div className="flex flex-col items-center flex-1 justify-center">
            <div
              className={`text-sm ${theme.secondaryText} font-semibold mb-4 tracking-wide`}
              style={theme.secondaryTextStyle}
            >
              RIGHT
            </div>
            <div
              className={`font-light text-red-500 transition-all duration-300 ${
                rightFlash ? "scale-110 brightness-150" : ""
              }`}
              style={{
                fontSize: "8rem",
                lineHeight: "0.8",
                fontFamily: "system-ui, -apple-system",
                textShadow: rightFlash
                  ? "0 0 40px rgba(239, 68, 68, 0.9)"
                  : "0 0 5px rgba(239, 68, 68, 0.3)",
              }}
            >
              {currentSets?.right_score || 0}
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-center pt-6 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span
              className={`text-base ${theme.secondaryText} font-medium`}
              style={theme.secondaryTextStyle}
            >
              Live tracking active
            </span>
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
