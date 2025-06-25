"use client";

import { useCallback, useEffect, useState } from "react";
import { useTelegram } from "@context/telegram-context";
import {
  getTodaysScores,
  subscribeToDailyScores,
  DailyScoreData,
} from "@lib/supabase-queries";

// Sound effects using Web Audio API
const createBeep = (
  frequency: number,
  duration: number,
  volume: number = 0.3
) => {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      volume,
      audioContext.currentTime + 0.01
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.log("Audio not supported:", error);
  }
};

// Different sounds for each side (inspired by Apple Watch)
const playLeftSound = () => {
  // Higher pitch "up" tone
  createBeep(800, 0.15, 0.4);
  setTimeout(() => createBeep(1000, 0.1, 0.3), 150);
};

const playRightSound = () => {
  // Success chime (lower pitch)
  createBeep(523, 0.1, 0.4); // C5
  setTimeout(() => createBeep(659, 0.1, 0.3), 100); // E5
  setTimeout(() => createBeep(784, 0.2, 0.4), 200); // G5
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
        // Play left sound (up tone)
        playLeftSound();
        // Vibrate for left side
        if ("vibrate" in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
        setTimeout(() => setLeftFlash(false), 5000);
      }

      if (rightChanged) {
        setRightFlash(true);
        // Play right sound (success chime)
        playRightSound();
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
              <div className="text-white text-sm mb-1">DAILY TOTALS</div>
              <div className="text-gray-300 text-xs">
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
            <div className="text-blue-400 text-lg font-medium mb-4 tracking-wider">
              LEFT
            </div>
            <div
              className={`text-blue-400 font-light transition-all duration-200 ${
                leftFlash ? "scale-110 brightness-150" : ""
              }`}
              style={{
                fontSize: "min(40vw, 30vh)",
                lineHeight: "0.8",
                fontFamily: "system-ui, -apple-system",
              }}
            >
              {currentSets?.left_score || 0}
            </div>
          </div>

          {/* Right side */}
          <div className="flex-1 flex flex-col items-center justify-center bg-black">
            <div className="text-red-400 text-lg font-medium mb-4 tracking-wider">
              RIGHT
            </div>
            <div
              className={`text-red-400 font-light transition-all duration-200 ${
                rightFlash ? "scale-110 brightness-150" : ""
              }`}
              style={{
                fontSize: "min(40vw, 30vh)",
                lineHeight: "0.8",
                fontFamily: "system-ui, -apple-system",
              }}
            >
              {currentSets?.right_score || 0}
            </div>
          </div>
        </div>

        {/* Current set indicator */}
        <div className="text-center py-2 bg-gray-900">
          <div className="text-gray-400 text-xs">CURRENT SET</div>
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

      {/* Current Set Status */}
      <div className="text-center mb-6 relative z-10">
        <div className="flex justify-between items-center mb-2">
          <div className="w-8"></div> {/* Spacer */}
          <p className={`text-sm ${theme.secondaryText}`}>CURRENT SET</p>
          <button
            onClick={onToggleFullscreen}
            className="text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-2 py-1 rounded transition-colors"
            title="Fullscreen mode"
          >
            ⛶
          </button>
        </div>
        <div className={`text-xs ${theme.secondaryText} tracking-wide`}>
          {dailyTotals?.left_wins || 0} — {dailyTotals?.right_wins || 0}
        </div>
      </div>

      {/* Current Set Score Display */}
      <div className="flex justify-between items-center mb-8 relative z-10">
        {/* Left Team */}
        <div className="flex flex-col items-center">
          <div className={`text-sm ${theme.secondaryText} mb-2 tracking-wide`}>
            LEFT
          </div>
          <div
            className={`text-6xl font-light text-blue-500 mb-4 transition-all duration-200 ${
              leftFlash ? "scale-110 brightness-125" : ""
            }`}
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
            className={`text-6xl font-light text-red-500 mb-4 transition-all duration-200 ${
              rightFlash ? "scale-110 brightness-125" : ""
            }`}
            style={{ fontFamily: "system-ui, -apple-system" }}
          >
            {currentSets?.right_score || 0}
          </div>
        </div>
      </div>

      {/* Daily Totals */}
      {dailyTotals && (
        <div className="text-center pt-4 border-t border-gray-300 dark:border-gray-600 relative z-10">
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
