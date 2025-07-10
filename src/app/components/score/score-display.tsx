"use client";

import { useEffect, useState } from "react";
import { useTelegram } from "@context/telegram-context";
import { DailyScoreData, addPoint, supabase } from "@lib/supabase-queries";
import { User } from "@/../database.types";
import {
  AudioCache,
  AudioPlaylist,
  initializeAudio,
  announceScoreVolleyball,
  enableAllAudio,
} from "../../services/audio";
import AudioSettingsModal from "./audio-settings-modal";
import PointsHistory from "./points-history";
import PlayerStatistics from "./player-statistics";
import DayStatistics from "./day-statistics";
import CurrentSetDisplay from "./current-set-display";
import { Plus, Settings, Volume2, Award } from "lucide-react";

// Global audio instances
const audioCache = new AudioCache();
const audioPlaylist = new AudioPlaylist(audioCache);

interface ScoreDisplayProps {
  scoreData: DailyScoreData;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  selectedDate: string;
  isHistoricalView: boolean;
  daySelector?: React.ReactNode;
  onRefreshScores?: () => void;
}

export default function ScoreDisplay({
  scoreData,
  isFullscreen,
  onToggleFullscreen,
  selectedDate,
  isHistoricalView,
  daySelector,
  onRefreshScores,
}: ScoreDisplayProps) {
  const { theme, isAdmin } = useTelegram();
  const [leftFlash, setLeftFlash] = useState(false);
  const [rightFlash, setRightFlash] = useState(false);
  const [previousScoreData, setPreviousScoreData] =
    useState<DailyScoreData | null>(null);
  const [dynamicFontSize, setDynamicFontSize] = useState("110vh");
  const [audioReady, setAudioReady] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>("default");
  const [volume, setVolume] = useState<number>(0.7); // 70% default volume
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true); // Audio enabled by default
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [allUsers, setAllUsers] = useState<Map<number, User>>(new Map());
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

  const currentSets = scoreData.sets;
  const dailyTotals = scoreData.totals;

  // Calculate optimal font size based on viewport dimensions
  const calculateOptimalFontSize = () => {
    if (typeof window === "undefined") return "80vh";

    const width = window.innerWidth;
    const height = window.innerHeight;

    // For each side (half width), calculate max font size
    // Account for up to 2-digit numbers and minimal side padding. Increase multipliers to utilize more space.
    const maxWidthBasedSize = width * 0.5 * 1.0; // 90% of half width for 2-digit numbers
    const maxHeightBasedSize = height * 1.0; // 90% of height accounting for top/bottom elements

    return `${Math.min(maxWidthBasedSize, maxHeightBasedSize)}px`;
  };

  // Initialize audio enabled preference from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load audio enabled preference from localStorage (default: false for TTS)
    const savedTtsEnabled = localStorage.getItem("volleyball-tts-enabled");
    const isTtsEnabled = savedTtsEnabled === "true";
    setAudioEnabled(isTtsEnabled);

    // Load and apply Russian voice selection if TTS is enabled
    if (isTtsEnabled) {
      const savedRussianVoice = localStorage.getItem(
        "volleyball-tts-russian-voice"
      );
      if (savedRussianVoice) {
        // Import and apply the voice setting
        import("../../services/audio").then(({ getTextToSpeech }) => {
          const tts = getTextToSpeech();
          if (tts.isSupported()) {
            tts.setVoice(savedRussianVoice);
            console.log("Applied saved Russian voice:", savedRussianVoice);
          }
        });
      }
    }
  }, []);

  // Initialize audio when enabled state changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    // If audio is enabled, try to initialize it automatically
    if (audioEnabled) {
      const initAudioAutomatically = async () => {
        try {
          const results = await enableAllAudio();
          const success = results.audioContext || results.tts;
          setAudioReady(success);
          if (success) {
            console.log("Audio systems initialized automatically:", results);
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
          const results = await enableAllAudio();
          const success = results.audioContext || results.tts;
          setAudioReady(success);
          if (success) {
            console.log(
              "Audio systems initialized via user interaction:",
              results
            );
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

  // Wake Lock management for fullscreen mode
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator && isFullscreen) {
          // Only request if we don't already have one
          if (!wakeLock) {
            const wakeLockSentinel = await navigator.wakeLock.request("screen");
            setWakeLock(wakeLockSentinel);
            console.log("Screen wake lock activated for fullscreen mode");

            // Listen for wake lock release
            wakeLockSentinel.addEventListener("release", () => {
              console.log("Screen wake lock released");
              setWakeLock(null);
            });
          }
        }
      } catch (err) {
        console.error("Failed to request wake lock:", err);
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLock) {
        try {
          await wakeLock.release();
          console.log("Screen wake lock released manually");
          setWakeLock(null);
        } catch (err) {
          console.error("Failed to release wake lock:", err);
        }
      }
    };

    const exitBrowserFullscreen = async () => {
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
          console.log("Browser fullscreen exited");
        }
      } catch (err) {
        console.error("Failed to exit browser fullscreen:", err);
      }
    };

    if (isFullscreen) {
      requestWakeLock();
    } else {
      releaseWakeLock();
      exitBrowserFullscreen();
    }

    // Cleanup function - only release wake lock, don't exit fullscreen
    return () => {
      if (wakeLock) {
        wakeLock.release().catch(console.error);
      }
    };
  }, [isFullscreen]); // Removed wakeLock from dependencies to prevent loops

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
            currentSets.left_score || 0,
            currentSets.right_score || 0,
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

    // Save to localStorage using TTS settings key
    if (typeof window !== "undefined") {
      localStorage.setItem("volleyball-tts-enabled", enabled.toString());
    }

    // If disabling audio, reset audio ready state
    if (!enabled) {
      setAudioReady(false);
    } else {
      // If enabling audio, try to initialize it
      const initAudio = async () => {
        const results = await enableAllAudio();
        const success = results.audioContext || results.tts;
        setAudioReady(success);

        // Apply Russian voice setting if available
        if (success && typeof window !== "undefined") {
          const savedRussianVoice = localStorage.getItem(
            "volleyball-tts-russian-voice"
          );
          if (savedRussianVoice) {
            const { getTextToSpeech } = await import("../../services/audio");
            const tts = getTextToSpeech();
            if (tts.isSupported()) {
              tts.setVoice(savedRussianVoice);
              console.log(
                "Applied Russian voice in score component:",
                savedRussianVoice
              );
            }
          }
        }
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

  // Fetch user data for all players (both top players and points history)
  useEffect(() => {
    if (!supabase || !scoreData.points || scoreData.points.length === 0) {
      return;
    }

    const fetchAllPlayersUsers = async () => {
      // Extract unique player_ids from points (for points history)
      const pointsPlayerIds = scoreData.points
        .map((point) => point.player_id)
        .filter((id): id is number => id !== null);

      // Get all unique player IDs
      const allPlayerIds = [...new Set(pointsPlayerIds)];

      if (allPlayerIds.length === 0) {
        return;
      }

      setLoadingUsers(true);
      try {
        const { data: userData, error } = await supabase
          .from("users")
          .select("id, first_name, last_name, username, photo_url")
          .in("id", allPlayerIds);

        if (error) {
          console.error("Error fetching users:", error);
        } else if (userData) {
          // Create a map for efficient lookup
          const userMap = new Map<number, User>();
          userData.forEach((user) => {
            userMap.set(user.id, user as User);
          });
          setAllUsers(userMap);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchAllPlayersUsers();
  }, [scoreData.points, supabase]);

  if (isFullscreen) {
    return (
      <div
        className="fixed inset-0 bg-black z-50 flex flex-col"
        onClick={async () => {
          // Try to initialize audio when user taps the fullscreen area
          if (audioEnabled && !audioReady) {
            const results = await enableAllAudio();
            const success = results.audioContext || results.tts;
            setAudioReady(success);
            if (success) {
              console.log(
                "Audio systems initialized via fullscreen tap:",
                results
              );
            }
          }
        }}
        title={!audioReady && audioEnabled ? "Tap to enable audio" : ""}
      >
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
            <span className="mr-6">{dailyTotals.left_sets}</span>
            <span className="ml-6">{dailyTotals.right_sets}</span>
          </div>
        )}

        {/* Main score area - full height */}
        <div className="flex-1 flex relative">
          {/* Left side */}
          <div className="flex-1 flex flex-col items-center justify-center bg-black border-r border-gray-600 relative">
            <div
              className={`font-light transition-all duration-200 ${
                leftFlash ? "scale-125" : ""
              } ${
                currentSets?.serving_team === "left" ? "brightness-110" : ""
              }`}
              style={{
                fontSize: dynamicFontSize,
                lineHeight: "0.4",
                fontFamily: "system-ui, -apple-system",
                color: leftFlash ? "#60a5fa" : "#60a5fa", // Always bright blue
                textShadow: leftFlash
                  ? "0 0 40px rgba(96, 165, 250, 1), 0 0 80px rgba(96, 165, 250, 0.5)"
                  : currentSets?.serving_team === "left"
                  ? "0 0 20px rgba(96, 165, 250, 0.6)"
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
              } ${
                currentSets?.serving_team === "right" ? "brightness-110" : ""
              }`}
              style={{
                fontSize: dynamicFontSize,
                lineHeight: "0.4",
                fontFamily: "system-ui, -apple-system",
                color: rightFlash ? "#f87171" : "#f87171", // Always bright red
                textShadow: rightFlash
                  ? "0 0 40px rgba(248, 113, 113, 1), 0 0 80px rgba(248, 113, 113, 0.5)"
                  : currentSets?.serving_team === "right"
                  ? "0 0 20px rgba(248, 113, 113, 0.6)"
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
      className={`w-full max-w-md mx-auto p-3 sm:p-4 ${theme.cardBg} rounded-lg shadow-sm overflow-hidden flex-1 flex flex-col`}
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

      {/* Header with day selector and controls */}
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="flex-1 min-w-0">{daySelector}</div>
        <div className="flex space-x-2 flex-shrink-0">
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
            className={`text-lg font-semibold ${theme.text} mb-3 text-center flex items-center justify-center gap-2`}
            style={theme.textStyle}
          >
            <Award size={20} className="text-purple-500" />
            Match Results
          </h2>
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col items-center">
              <div className="text-blue-500 font-bold text-3xl mb-1">
                {dailyTotals.left_sets}
              </div>
              <div
                className={`text-sm ${theme.secondaryText} font-medium`}
                style={theme.secondaryTextStyle}
              >
                LEFT SETS
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
                {dailyTotals.right_sets}
              </div>
              <div
                className={`text-sm ${theme.secondaryText} font-medium`}
                style={theme.secondaryTextStyle}
              >
                RIGHT SETS
              </div>
            </div>
          </div>

          {/* Day Statistics */}
          <DayStatistics scoreData={scoreData} theme={theme} />
        </div>
      )}

      {/* Player Statistics */}
      <PlayerStatistics
        scoreData={scoreData}
        allUsers={allUsers}
        loadingUsers={loadingUsers}
      />

      {/* Current Set Score Display */}
      <CurrentSetDisplay
        currentSets={currentSets}
        leftFlash={leftFlash}
        rightFlash={rightFlash}
        theme={theme}
        audioEnabled={audioEnabled}
        audioReady={audioReady}
        onAudioReadyChange={setAudioReady}
        isHistoricalView={isHistoricalView}
      />

      {/* Points History Section */}
      <PointsHistory
        selectedDate={selectedDate}
        onScoreUpdate={onRefreshScores}
        points={scoreData.points}
        users={allUsers}
        loadingUsers={loadingUsers}
      />

      {/* Admin Test Controls */}
      {isAdmin && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center">
            <Settings size={16} className="mr-2" />
            Admin Test Controls
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => addPoint({ winner: "left" })}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded flex items-center gap-1"
            >
              <Plus size={12} />
              Left
            </button>
            <button
              onClick={() => addPoint({ winner: "right" })}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded flex items-center gap-1"
            >
              <Plus size={12} />
              Right
            </button>
          </div>
        </div>
      )}

      {/* Audio Settings Modal */}
      <AudioSettingsModal
        isOpen={showAudioModal}
        onClose={() => setShowAudioModal(false)}
        selectedVoice={selectedVoice}
        onVoiceChange={setSelectedVoice}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        audioReady={audioReady}
        _onAudioReadyChange={setAudioReady}
        audioEnabled={audioEnabled}
        onAudioEnabledChange={handleAudioEnabledChange}
        audioCache={audioCache}
        audioPlaylist={audioPlaylist}
      />
    </div>
  );
}
