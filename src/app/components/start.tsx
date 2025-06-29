"use client";

import { useCallback, useEffect, useState } from "react";
import { useTelegram } from "@context/telegram-context";
import {
  getTodaysScores,
  subscribeToDailyScores,
  DailyScoreData,
} from "@lib/supabase-queries";

// Audio context for Web Audio API fallbacks (if needed)
let audioContext: AudioContext | null = null;
let isAudioInitialized = false;

// Initialize audio context (optional for fallbacks)
const initializeAudio = async () => {
  if (typeof window === "undefined") return false;

  try {
    if (!audioContext) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    isAudioInitialized = true;
    console.log("Audio context initialized successfully");
    return true;
  } catch (error) {
    console.log("Audio context initialization failed:", error);
    return false;
  }
};

// Audio cache system for .ogg files (similar to Angular implementation)
class AudioCache {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private currentVoicePath = "default"; // default, boris, julia, natalia, sergey, spongebob, english
  private isClient = false;
  private currentVolume = 0.7; // Default volume (70%)

  constructor() {
    this.isClient = typeof window !== "undefined";
    if (this.isClient) {
      this.loadAudioFiles("default");
    }
  }

  public loadAudioFiles(voicePath: string) {
    if (!this.isClient) return;

    this.currentVoicePath = voicePath;
    const audioUrls: string[] = [];

    // Add special audio files
    audioUrls.push(`audio/${voicePath}/whistle.ogg`);
    audioUrls.push(`audio/${voicePath}/win.ogg`);
    audioUrls.push(`audio/${voicePath}/pause.ogg`);
    audioUrls.push(`audio/${voicePath}/controlball.ogg`);

    // Add number files from 0.ogg to 31.ogg
    for (let i = 0; i <= 31; i++) {
      audioUrls.push(`audio/${voicePath}/${i}.ogg`);
    }

    this.preloadAudioFiles(audioUrls);
  }

  private preloadAudioFiles(urls: string[]) {
    if (!this.isClient) return;

    urls.forEach((url) => {
      if (!this.audioCache.has(url)) {
        const audio = new Audio(url);
        audio.preload = "auto";
        audio.volume = this.currentVolume; // Set initial volume
        audio.load();

        // Add error handling
        audio.onerror = () => {
          console.log(`Failed to load audio file: ${url}`);
        };

        audio.onloadeddata = () => {
          console.log(`Successfully loaded audio file: ${url}`);
        };

        this.audioCache.set(url, audio);
      }
    });
  }

  public getAudio(filename: string): HTMLAudioElement | undefined {
    if (!this.isClient) return undefined;

    const fullPath = `audio/${this.currentVoicePath}/${filename}`;
    const audio = this.audioCache.get(fullPath);

    // Update volume for this audio instance
    if (audio) {
      audio.volume = this.currentVolume;
    }

    return audio;
  }

  public changeVoice(voicePath: string) {
    if (!this.isClient) return;

    this.loadAudioFiles(voicePath);
  }

  public getCurrentVoice(): string {
    return this.currentVoicePath;
  }

  // Volume control methods
  public setVolume(volume: number) {
    // Clamp volume between 0 and 1
    this.currentVolume = Math.max(0, Math.min(1, volume));
    console.log(
      `Audio volume set to: ${Math.round(this.currentVolume * 100)}%`
    );

    // Update volume for all cached audio files
    this.audioCache.forEach((audio) => {
      audio.volume = this.currentVolume;
    });
  }

  public getVolume(): number {
    return this.currentVolume;
  }

  public increaseVolume(step: number = 0.1): number {
    const newVolume = Math.min(1, this.currentVolume + step);
    this.setVolume(newVolume);
    return newVolume;
  }

  public decreaseVolume(step: number = 0.1): number {
    const newVolume = Math.max(0, this.currentVolume - step);
    this.setVolume(newVolume);
    return newVolume;
  }
}

// Global audio cache instance
const audioCache = new AudioCache();

// Audio playlist management for .ogg files
class AudioPlaylist {
  private queue: string[] = [];
  private isPlaying: boolean = false;
  private currentIndex: number = 0;
  private currentAudio: HTMLAudioElement | null = null;

  addToQueue(filename: string) {
    this.queue.push(filename);
    console.log(`Added to audio queue: "${filename}"`);
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  private async playNext() {
    if (this.currentIndex < this.queue.length) {
      const currentFilename = this.queue[this.currentIndex];
      this.isPlaying = true;
      console.log(`Playing from queue: "${currentFilename}"`);

      if (currentFilename === "pause.ogg") {
        // Short pause
        await new Promise((resolve) => setTimeout(resolve, 300));
        this.currentIndex++;
        this.playNext();
      } else {
        const audio = audioCache.getAudio(currentFilename);
        if (audio) {
          // Store reference to current audio for potential stopping
          this.currentAudio = audio;
          audio.currentTime = 0; // Reset to beginning

          // Wait for audio to finish
          await new Promise<void>((resolve) => {
            audio.onended = () => {
              console.log(`Finished playing: ${currentFilename}`);
              this.currentAudio = null; // Clear reference
              resolve();
            };

            audio.onerror = () => {
              console.log(`Error playing: ${currentFilename}`);
              this.currentAudio = null; // Clear reference
              resolve();
            };

            audio.play().catch((error) => {
              console.log(`Failed to play ${currentFilename}:`, error);
              this.currentAudio = null; // Clear reference
              resolve();
            });
          });

          // Move to next item
          this.currentIndex++;
          setTimeout(() => this.playNext(), 200); // Small delay between sounds
        } else {
          console.error(`Audio file not found in cache: ${currentFilename}`);
          this.currentIndex++;
          this.playNext();
        }
      }
    } else {
      this.reset();
    }
  }

  // Stop any currently playing audio and clear queue
  public stop() {
    console.log("Stopping audio playlist");

    // Stop current audio if playing
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      console.log("Stopped currently playing audio");
    }

    this.clear();
  }

  clear() {
    this.queue = [];
    this.currentIndex = 0;
    this.isPlaying = false;
    console.log("Audio queue cleared");
  }

  private reset() {
    this.isPlaying = false;
    this.currentIndex = 0;
    this.queue = [];
    this.currentAudio = null;
    console.log("Audio queue finished and reset");
  }
}

// Global audio playlist instance
const audioPlaylist = new AudioPlaylist();

// Score announcement functions - volleyball rules
// В волейболе принято объявлять счет в порядке: подающая команда - принимающая команда
// Если не знаем кто подает, объявляем сначала команду которая только что забила очко
const announceScoreVolleyball = (
  leftScore: number,
  rightScore: number,
  leftScored: boolean,
  rightScored: boolean,
  servingTeam?: "left" | "right"
) => {
  console.log(
    `Volleyball score announcement: ${leftScore}-${rightScore}, left scored: ${leftScored}, right scored: ${rightScored}`
  );

  // Stop any currently playing audio and clear queue
  audioPlaylist.stop();

  // Add a small pause first
  audioPlaylist.addToQueue("pause.ogg");

  // Volleyball rules for score announcement:
  // 1. If we know who's serving, announce serving team first
  // 2. If we don't know who's serving, announce the team that just scored first
  // 3. This follows international volleyball conventions
  if (servingTeam === "left" || (!servingTeam && leftScored)) {
    // Left team is serving or just scored - announce left score first
    audioPlaylist.addToQueue(`${leftScore}.ogg`);
    audioPlaylist.addToQueue(`${rightScore}.ogg`);
  } else if (servingTeam === "right" || (!servingTeam && rightScored)) {
    // Right team is serving or just scored - announce right score first
    audioPlaylist.addToQueue(`${rightScore}.ogg`);
    audioPlaylist.addToQueue(`${leftScore}.ogg`);
  } else {
    // Fallback: announce left then right
    audioPlaylist.addToQueue(`${leftScore}.ogg`);
    audioPlaylist.addToQueue(`${rightScore}.ogg`);
  }

  // Check for special conditions
  if (isControlBall(leftScore, rightScore)) {
    audioPlaylist.addToQueue("controlball.ogg");
  }

  if (isMatchOver(leftScore, rightScore)) {
    audioPlaylist.addToQueue("win.ogg");
  }
};

// Game logic functions (similar to Angular implementation)
const isControlBall = (score1: number, score2: number): boolean => {
  const maxScore = 25;

  // Check if one team is at 24 points and the other has less than 24
  if ((score1 === 24 && score2 < 24) || (score2 === 24 && score1 < 24)) {
    return true;
  }

  // Check if one team can win with the next point in a deuce situation
  if (
    (score1 >= maxScore - 1 || score2 >= maxScore - 1) &&
    Math.abs(score1 - score2) === 1
  ) {
    return true;
  }

  return false;
};

const isMatchOver = (score1: number, score2: number): boolean => {
  const winningScore = 25;
  const minDifference = 2;

  // Check if one team has reached the winning score and has at least a 2-point lead
  if (
    (score1 >= winningScore || score2 >= winningScore) &&
    Math.abs(score1 - score2) >= minDifference
  ) {
    return true;
  }

  return false;
};

// Простая функция для объявления текущего счета (без определения кто забил)
const announceCurrentScore = (leftScore: number, rightScore: number) => {
  console.log(`Announcing current score: ${leftScore}-${rightScore}`);

  // Stop any currently playing audio and clear queue
  audioPlaylist.stop();
  audioPlaylist.addToQueue("pause.ogg");

  audioPlaylist.addToQueue(`${leftScore}.ogg`);
  audioPlaylist.addToQueue(`${rightScore}.ogg`);

  if (isControlBall(leftScore, rightScore)) {
    audioPlaylist.addToQueue("controlball.ogg");
  }

  if (isMatchOver(leftScore, rightScore)) {
    audioPlaylist.addToQueue("win.ogg");
  }
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
  const [audioReady, setAudioReady] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>("default");
  const [volume, setVolume] = useState<number>(0.7); // 70% default volume

  const currentSets = scoreData.sets;
  const dailyTotals = scoreData.totals;

  const voiceOptions = [
    { value: "default", name: "Default" },
    { value: "boris", name: "Boris" },
    { value: "julia", name: "Julia" },
    { value: "natalia", name: "Natalia" },
    { value: "sergey", name: "Sergey" },
    { value: "english", name: "English" },
    { value: "spongebob", name: "SpongeBob" },
  ];

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

  // Initialize audio on first user interaction
  useEffect(() => {
    const initAudioOnInteraction = async () => {
      if (!isAudioInitialized) {
        const success = await initializeAudio();
        setAudioReady(success);
      }
    };

    const handleUserInteraction = () => {
      initAudioOnInteraction();
      // Remove listeners after first interaction
      document.removeEventListener("touchstart", handleUserInteraction);
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };

    // Add listeners for user interaction
    document.addEventListener("touchstart", handleUserInteraction, {
      passive: true,
    });
    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("keydown", handleUserInteraction);

    return () => {
      document.removeEventListener("touchstart", handleUserInteraction);
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };
  }, []);

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

        // Announce the current score (both scores)
        announceScoreVolleyball(
          currentSets.left_score,
          currentSets.right_score,
          leftChanged,
          rightChanged
        );

        // Vibrate for any score change
        if ("vibrate" in navigator) {
          navigator.vibrate([150, 100, 150]);
        }
      }
    }
    setPreviousScoreData(scoreData);
  }, [scoreData, previousScoreData]);

  // Volume control handler with localStorage persistence
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    audioCache.setVolume(newVolume);

    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("volleyball-audio-volume", newVolume.toString());
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
          {/* Voice Selection Dropdown */}
          <select
            value={selectedVoice}
            onChange={(e) => {
              setSelectedVoice(e.target.value);
              audioCache.changeVoice(e.target.value);
            }}
            className="text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
            title="Select voice"
          >
            {voiceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.name}
              </option>
            ))}
          </select>

          {/* Volume Control */}
          <div
            className="flex items-center space-x-1"
            title={`Volume: ${Math.round(volume * 100)}%`}
          >
            <button
              onClick={() => handleVolumeChange(Math.max(0, volume - 0.2))}
              className="text-xs px-1 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title="Decrease volume"
              disabled={volume <= 0}
            >
              🔉
            </button>
            <span className="text-sm">🔈</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                  volume * 100
                }%, #d1d5db ${volume * 100}%, #d1d5db 100%)`,
              }}
            />
            <button
              onClick={() => handleVolumeChange(Math.min(1, volume + 0.2))}
              className="text-xs px-1 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title="Increase volume"
              disabled={volume >= 1}
            >
              🔊
            </button>
            <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[2rem]">
              {Math.round(volume * 100)}%
            </span>
          </div>

          <button
            onClick={async () => {
              const success = await initializeAudio();
              setAudioReady(success);
              // Test volleyball score announcement (left team scored: 15-12) - stops previous audio
              console.log(
                `Testing volleyball audio at ${Math.round(
                  volume * 100
                )}% volume`
              );
              announceScoreVolleyball(15, 12, true, false);
            }}
            className="text-lg bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 px-3 py-2 rounded transition-colors"
            title={`Test volleyball score audio - left team scored (15-12) - Volume: ${Math.round(
              volume * 100
            )}%`}
          >
            🔊
          </button>

          <button
            onClick={async () => {
              const success = await initializeAudio();
              setAudioReady(success);
              // Test current score announcement (24-23) - stops previous audio
              console.log(
                `Testing current score audio at ${Math.round(
                  volume * 100
                )}% volume`
              );
              announceCurrentScore(24, 23);
            }}
            className="text-lg bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 px-3 py-2 rounded transition-colors"
            title={`Test current score audio (24-23) - Volume: ${Math.round(
              volume * 100
            )}%`}
          >
            🎯
          </button>

          <button
            onClick={onToggleFullscreen}
            className="text-3xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-4 py-3 rounded transition-colors"
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

        {/* Status Indicators */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span
              className={`text-sm ${theme.secondaryText} font-medium`}
              style={theme.secondaryTextStyle}
            >
              Live tracking
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                audioReady ? "bg-green-500" : "bg-yellow-500"
              }`}
            ></div>
            <span
              className={`text-sm ${theme.secondaryText} font-medium`}
              style={theme.secondaryTextStyle}
            >
              {audioReady ? "Audio ready" : "Tap to enable audio"}
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
