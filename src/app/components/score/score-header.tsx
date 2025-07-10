"use client";

import { initializeAudio } from "../../services/audio";
import { Volume2 } from "lucide-react";

interface ScoreHeaderProps {
  daySelector?: React.ReactNode;
  onAudioSettingsClick: () => void;
  onFullscreenToggle: () => void;
  audioEnabled: boolean;
  audioReady: boolean;
  onAudioReadyChange: (ready: boolean) => void;
  volume: number;
  loading?: boolean;
}

export default function ScoreHeader({
  daySelector,
  onAudioSettingsClick,
  onFullscreenToggle,
  audioEnabled,
  audioReady,
  onAudioReadyChange,
  volume,
  loading = false,
}: ScoreHeaderProps) {
  const handleAudioSettingsClick = async () => {
    // Try to initialize audio when user opens settings
    if (audioEnabled && !audioReady) {
      const success = await initializeAudio();
      onAudioReadyChange(success);
      if (success) {
        console.log("Audio initialized via settings button");
      }
    }
    onAudioSettingsClick();
  };

  // Show skeleton while loading
  if (loading) {
    return (
      <div className="flex items-center gap-3 mb-6 relative z-10 animate-pulse">
        <div className="flex-1 min-w-0">
          {/* Day Selector Skeleton */}
          <div className="flex space-x-3 overflow-x-auto py-2 px-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-20 h-12 bg-gray-300 dark:bg-gray-700 rounded-lg"
              ></div>
            ))}
          </div>
        </div>
        <div className="flex space-x-2 flex-shrink-0">
          {/* Audio button skeleton */}
          <div className="h-10 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
          {/* Fullscreen button skeleton */}
          <div className="h-10 w-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 mb-6 relative z-10">
      <div className="flex-1 min-w-0">{daySelector}</div>
      <div className="flex space-x-2 flex-shrink-0">
        {/* Audio Settings Button */}
        <button
          onClick={handleAudioSettingsClick}
          className="text-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-2 rounded transition-colors flex items-center space-x-1 relative"
          title={`Audio settings - ${
            !audioEnabled ? "Disabled" : audioReady ? "Ready" : "Tap to enable"
          }`}
        >
          <Volume2 size={18} />
          <span className="text-sm hidden sm:inline">
            {Math.round(volume * 100)}%
          </span>
          {/* Audio status indicator */}
          <div
            className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
              !audioEnabled
                ? "bg-red-500"
                : audioReady
                ? "bg-green-500"
                : "bg-yellow-500"
            }`}
          ></div>
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={onFullscreenToggle}
          className="text-2xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-2 rounded transition-colors"
          title="Fullscreen mode"
        >
          ⛶
        </button>
      </div>
    </div>
  );
}
