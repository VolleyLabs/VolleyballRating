"use client";

import { initializeAudio } from "../../services/audio";
import { Zap, ArrowLeft, ArrowRight } from "lucide-react";

interface Theme {
  text: string;
  secondaryText: string;
  textStyle?: React.CSSProperties;
  secondaryTextStyle?: React.CSSProperties;
}

interface CurrentSetDisplayProps {
  currentSets: {
    left_score: number | null;
    right_score: number | null;
    serving_team: "left" | "right" | null;
    is_finished: boolean;
  } | null;
  leftFlash: boolean;
  rightFlash: boolean;
  theme: Theme;
  audioEnabled: boolean;
  audioReady: boolean;
  onAudioReadyChange: (ready: boolean) => void;
  isHistoricalView: boolean;
  loading?: boolean;
}

export default function CurrentSetDisplay({
  currentSets,
  leftFlash,
  rightFlash,
  theme,
  audioEnabled,
  audioReady,
  onAudioReadyChange,
  isHistoricalView,
  loading = false,
}: CurrentSetDisplayProps) {
  const handleScoreAreaClick = async () => {
    // Try to initialize audio when user taps the score area
    if (audioEnabled && !audioReady) {
      const success = await initializeAudio();
      onAudioReadyChange(success);
      if (success) {
        console.log("Audio initialized via score tap");
      }
    }
  };

  // Don't render if it's historical view or set is finished
  if (
    isHistoricalView ||
    (!loading && (!currentSets || currentSets.is_finished))
  ) {
    return null;
  }

  // Show skeleton while loading
  if (loading) {
    return (
      <div className="relative z-10 flex-shrink-0 animate-pulse">
        {/* Current Set title skeleton */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-28"></div>
        </div>

        {/* Score Display skeleton */}
        <div className="flex justify-between items-center mb-4">
          {/* Left Team skeleton */}
          <div className="flex flex-col items-center flex-1 justify-center">
            {/* LEFT label skeleton */}
            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 w-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-8"></div>
              <div className="h-4 w-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
            {/* Score skeleton - large circle */}
            <div className="w-32 h-32 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <div className="w-16 h-16 bg-gray-400 dark:bg-gray-600 rounded"></div>
            </div>
          </div>

          {/* VS Separator skeleton */}
          <div className="px-4">
            <div className="h-6 w-6 bg-gray-300 dark:bg-gray-700 rounded mx-auto"></div>
          </div>

          {/* Right Team skeleton */}
          <div className="flex flex-col items-center flex-1 justify-center">
            {/* RIGHT label skeleton */}
            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 w-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-10"></div>
              <div className="h-4 w-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
            {/* Score skeleton - large circle */}
            <div className="w-32 h-32 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <div className="w-16 h-16 bg-gray-400 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex-shrink-0">
      <h2
        className={`text-xl font-semibold ${theme.text} mb-6 text-center flex items-center justify-center gap-2`}
        style={theme.textStyle}
      >
        <Zap size={24} className="text-orange-500 animate-pulse" />
        Current Set
      </h2>
      <div
        className="flex justify-between items-center mb-4 cursor-pointer"
        onClick={handleScoreAreaClick}
        title={!audioReady && audioEnabled ? "Tap to enable audio" : ""}
      >
        {/* Left Team */}
        <div className="flex flex-col items-center flex-1 justify-center">
          <div
            className={`text-sm ${
              theme.secondaryText
            } font-semibold mb-4 tracking-wide transition-all duration-1000 flex items-center gap-2 ${
              currentSets?.serving_team === "left"
                ? "text-blue-400 brightness-125"
                : ""
            }`}
            style={theme.secondaryTextStyle}
          >
            {currentSets?.serving_team === "left" && (
              <ArrowLeft size={16} className="text-blue-400 animate-bounce" />
            )}
            LEFT
            {currentSets?.serving_team === "left" && (
              <ArrowLeft size={16} className="text-blue-400 animate-bounce" />
            )}
          </div>
          <div
            className={`font-light text-blue-500 transition-all duration-300 ${
              leftFlash ? "scale-110 brightness-150" : ""
            } ${currentSets?.serving_team === "left" ? "brightness-110" : ""}`}
            style={{
              fontSize: "8rem",
              lineHeight: "0.8",
              fontFamily: "system-ui, -apple-system",
              textShadow: leftFlash
                ? "0 0 40px rgba(59, 130, 246, 0.9)"
                : currentSets?.serving_team === "left"
                ? "0 0 15px rgba(59, 130, 246, 0.5)"
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
            className={`text-sm ${
              theme.secondaryText
            } font-semibold mb-4 tracking-wide transition-all duration-1000 flex items-center gap-2 ${
              currentSets?.serving_team === "right"
                ? "text-red-400 brightness-125"
                : ""
            }`}
            style={theme.secondaryTextStyle}
          >
            {currentSets?.serving_team === "right" && (
              <ArrowRight size={16} className="text-red-400 animate-bounce" />
            )}
            RIGHT
            {currentSets?.serving_team === "right" && (
              <ArrowRight size={16} className="text-red-400 animate-bounce" />
            )}
          </div>
          <div
            className={`font-light text-red-500 transition-all duration-300 ${
              rightFlash ? "scale-110 brightness-150" : ""
            } ${currentSets?.serving_team === "right" ? "brightness-110" : ""}`}
            style={{
              fontSize: "8rem",
              lineHeight: "0.8",
              fontFamily: "system-ui, -apple-system",
              textShadow: rightFlash
                ? "0 0 40px rgba(239, 68, 68, 0.9)"
                : currentSets?.serving_team === "right"
                ? "0 0 15px rgba(239, 68, 68, 0.5)"
                : "0 0 5px rgba(239, 68, 68, 0.3)",
            }}
          >
            {currentSets?.right_score || 0}
          </div>
        </div>
      </div>
    </div>
  );
}
