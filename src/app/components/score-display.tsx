"use client";

import { useEffect, useState } from "react";
import { useTelegram } from "@context/telegram-context";
import { DailyScoreData } from "@lib/supabase-queries";
import {
  AudioCache,
  AudioPlaylist,
  initializeAudio,
  announceScoreVolleyball,
} from "../services/audio";
import AudioSettingsModal from "./audio-settings-modal";

// Global audio instances
const audioCache = new AudioCache();
const audioPlaylist = new AudioPlaylist(audioCache);

interface ScoreDisplayProps {
  scoreData: DailyScoreData;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export default function ScoreDisplay({
  scoreData,
  isFullscreen,
  onToggleFullscreen,
}: ScoreDisplayProps) {
  const { theme } = useTelegram();
  const [leftFlash, setLeftFlash] = useState(false);
  const [rightFlash, setRightFlash] = useState(false);
  const [previousScoreData, setPreviousScoreData] =
    useState<DailyScoreData | null>(null);
  const [dynamicFontSize, setDynamicFontSize] = useState("80vh");
  const [audioReady, setAudioReady] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>("default");
  const [volume, setVolume] = useState<number>(0.7); // 70% default volume
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true); // Audio enabled by default

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

  // Initialize audio enabled preference from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load audio enabled preference from localStorage (default: true)
    const savedAudioEnabled = localStorage.getItem("volleyball-audio-enabled");
    const isAudioEnabled =
      savedAudioEnabled === null ? true : savedAudioEnabled === "true";
    setAudioEnabled(isAudioEnabled);
  }, []);

  // Initialize audio when enabled state changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    // If audio is enabled, try to initialize it automatically
    if (audioEnabled) {
      const initAudioAutomatically = async () => {
        try {
          const success = await initializeAudio();
          setAudioReady(success);
          if (success) {
            console.log("Audio initialized automatically");
          } else {
            console.log(
              "Audio initialization failed - may need user interaction"
            );
          }
        } catch (error) {
          console.log("Audio auto-initialization failed:", error);
          setAudioReady(false);
        }
      };

      // Try to initialize audio automatically
      initAudioAutomatically();

      // Fallback: Add listeners for user interaction if auto-init fails
      const initAudioOnInteraction = async () => {
        if (audioEnabled && !audioReady) {
          const success = await initializeAudio();
          setAudioReady(success);
          if (success) {
            console.log("Audio initialized via user interaction");
          }
        }
      };

      const handleUserInteraction = () => {
        initAudioOnInteraction();
        // Remove listeners after first successful interaction
        if (audioReady) {
          document.removeEventListener("touchstart", handleUserInteraction);
          document.removeEventListener("click", handleUserInteraction);
          document.removeEventListener("keydown", handleUserInteraction);
          document.removeEventListener("scroll", handleUserInteraction);
        }
      };

      // Add listeners for user interaction as fallback
      document.addEventListener("touchstart", handleUserInteraction, {
        passive: true,
      });
      document.addEventListener("click", handleUserInteraction);
      document.addEventListener("keydown", handleUserInteraction);
      document.addEventListener("scroll", handleUserInteraction, {
        passive: true,
      });

      return () => {
        document.removeEventListener("touchstart", handleUserInteraction);
        document.removeEventListener("click", handleUserInteraction);
        document.removeEventListener("keydown", handleUserInteraction);
        document.removeEventListener("scroll", handleUserInteraction);
      };
    } else {
      // Audio is disabled by user preference
      setAudioReady(false);
      console.log("Audio disabled by user preference");
    }
  }, [audioEnabled]);

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

      if (leftChanged || rightChanged) {
        // Determine which side scored and set flash
        if (leftChanged) {
          setLeftFlash(true);
          setTimeout(() => setLeftFlash(false), 5000);
        }
        if (rightChanged) {
          setRightFlash(true);
          setTimeout(() => setRightFlash(false), 5000);
        }

        // Announce the current score (both scores) if audio is enabled
        if (audioEnabled && audioReady) {
          announceScoreVolleyball(
            currentSets.left_score,
            currentSets.right_score,
            leftChanged,
            rightChanged,
            audioPlaylist
          );
        }

        // Vibrate for any score change
        if ("vibrate" in navigator) {
          navigator.vibrate([150, 100, 150]);
        }
      }
    }
    setPreviousScoreData(scoreData);
  }, [scoreData, previousScoreData, currentSets, audioEnabled, audioReady]);

  // Volume control handler with localStorage persistence
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    audioCache.setVolume(newVolume);

    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("volleyball-audio-volume", newVolume.toString());
    }
  };

  // Audio enabled toggle handler with localStorage persistence
  const handleAudioEnabledChange = (enabled: boolean) => {
    setAudioEnabled(enabled);

    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("volleyball-audio-enabled", enabled.toString());
    }

    // If disabling audio, reset audio ready state
    if (!enabled) {
      setAudioReady(false);
    } else {
      // If enabling audio, try to initialize it
      const initAudio = async () => {
        const success = await initializeAudio();
        setAudioReady(success);
      };
      initAudio();
    }
  };

  // Initialize volume from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedVolume = localStorage.getItem("volleyball-audio-volume");
      if (savedVolume) {
        const parsedVolume = parseFloat(savedVolume);
        if (!isNaN(parsedVolume) && parsedVolume >= 0 && parsedVolume <= 1) {
          setVolume(parsedVolume);
          audioCache.setVolume(parsedVolume);
        }
      }
    }
  }, []);

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

      {/* Header with title and controls */}
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
        <div className="flex space-x-2">
          {/* Audio Settings Button */}
          <button
            onClick={async () => {
              // Try to initialize audio when user opens settings
              if (audioEnabled && !audioReady) {
                const success = await initializeAudio();
                setAudioReady(success);
                if (success) {
                  console.log("Audio initialized via settings button");
                }
              }
              setShowAudioModal(true);
            }}
            className="text-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-2 rounded transition-colors flex items-center space-x-1 relative"
            title={`Audio settings - ${
              !audioEnabled
                ? "Disabled"
                : audioReady
                ? "Ready"
                : "Tap to enable"
            }`}
          >
            <span>🔊</span>
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
            onClick={onToggleFullscreen}
            className="text-2xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-2 rounded transition-colors"
            title="Fullscreen mode"
          >
            ⛶
          </button>
        </div>
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
        <div
          className="flex justify-between items-center flex-1 mb-8 cursor-pointer"
          onClick={async () => {
            // Try to initialize audio when user taps the score area
            if (audioEnabled && !audioReady) {
              const success = await initializeAudio();
              setAudioReady(success);
              if (success) {
                console.log("Audio initialized via score tap");
              }
            }
          }}
          title={!audioReady && audioEnabled ? "Tap to enable audio" : ""}
        >
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

        {/* Status Indicators */}
        <div className="flex items-center justify-center pt-6 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span
                className={`text-sm ${theme.secondaryText} font-medium`}
                style={theme.secondaryTextStyle}
              >
                Live tracking
              </span>
            </div>
            {audioEnabled && !audioReady && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <span
                  className={`text-xs ${theme.secondaryText} font-medium opacity-75`}
                  style={theme.secondaryTextStyle}
                >
                  Tap anywhere to enable audio
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audio Settings Modal */}
      <AudioSettingsModal
        isOpen={showAudioModal}
        onClose={() => setShowAudioModal(false)}
        selectedVoice={selectedVoice}
        onVoiceChange={setSelectedVoice}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        audioReady={audioReady}
        onAudioReadyChange={setAudioReady}
        audioEnabled={audioEnabled}
        onAudioEnabledChange={handleAudioEnabledChange}
        audioCache={audioCache}
        audioPlaylist={audioPlaylist}
      />
    </div>
  );
}
