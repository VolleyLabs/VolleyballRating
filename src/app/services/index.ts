// Barrel export for all audio services
// TTS is disabled by default - use enableTTS() after user interaction to activate

// TTS Service
export {
  TextToSpeech,
  getTextToSpeech,
  hasRussianTTS,
  getRussianTTSInfo,
  announceWithTTS,
  sayWelcomeToScore,
  announceScoreWithTTS,
} from "./ttsService";

// Audio Cache
export { AudioCache, getAudioCache } from "./audioCache";

// Audio Playlist
export { AudioPlaylist, getAudioPlaylist } from "./audioPlaylist";

// Game Logic
export {
  isControlBall,
  isMatchOver,
  isDeuce,
  getWinner,
  isMatchPoint,
  getGameState,
  isValidScore,
  areValidScores,
} from "./gameLogic";

// Score Announcements
export {
  announceScoreVolleyball,
  announceCurrentScore,
  announceScoreWithFallback,
  announceSpecialEvent,
  announceTimeout,
  announceMatchEnd,
  createScoreAnnouncementQueue,
} from "./scoreAnnouncement";

// Audio Utils
export {
  VOICE_OPTIONS,
  AUDIO_EXTENSIONS,
  AUDIO_BASE_PATH,
  SPECIAL_AUDIO_FILES,
  SCORE_AUDIO_RANGE,
  initializeAudio,
  getAudioContext,
  normalizeVolume,
  volumeToPercentage,
  percentageToVolume,
  getAudioFilePath,
  generateNumberAudioPaths,
  generateSpecialAudioPaths,
  isAudioSupported,
  isWebAudioSupported,
  isSpeechSynthesisSupported,
  getSupportedAudioFormat,
  preloadAudioFile,
  preloadMultipleAudioFiles,
  measureAudioLoadTime,
  getAudioDebugInfo,
} from "./audioUtils";

// Unified audio system initialization
export const enableAllAudio = async (): Promise<{
  audioContext: boolean;
  tts: boolean;
  russianTTS: boolean;
}> => {
  const { initializeAudio } = await import("./audioUtils");
  const { getTextToSpeech } = await import("./ttsService");

  const results = { audioContext: false, tts: false, russianTTS: false };

  // Enable Web Audio Context
  try {
    results.audioContext = await initializeAudio();
  } catch (error) {
    console.warn("Failed to enable audio context:", error);
  }

  // Initialize TTS but don't auto-enable it (requires explicit user interaction)
  try {
    const tts = getTextToSpeech();
    results.tts = tts.isEnabled(); // Only true if already enabled

    // Check for Russian voices availability (but don't enable TTS)
    if (tts.isSupported()) {
      results.russianTTS = tts.hasRussianVoices();
      if (results.russianTTS) {
        console.log(
          "Russian TTS voices available:",
          tts.getRussianVoices().map((v) => v.name)
        );
      } else {
        console.log("No Russian TTS voices found on this system");
      }
    }

    console.log(
      "TTS initialized but disabled by default. Call enableTTS() to activate after user interaction."
    );
  } catch (error) {
    console.warn("Failed to initialize TTS:", error);
  }

  console.log("Audio systems initialized:", results);
  return results;
};

// Explicit TTS enablement function (requires user interaction)
export const enableTTS = async (): Promise<boolean> => {
  const { getTextToSpeech } = await import("./ttsService");

  try {
    const tts = getTextToSpeech();
    const enabled = await tts.enable();

    if (enabled) {
      console.log("TTS enabled successfully");
    } else {
      console.warn("Failed to enable TTS");
    }

    return enabled;
  } catch (error) {
    console.warn("Error enabling TTS:", error);
    return false;
  }
};

// Unified audio initialization with caching
export const initializeAllAudioSystems = async () => {
  const { getAudioCache } = await import("./audioCache");
  const { getAudioPlaylist } = await import("./audioPlaylist");
  const { getTextToSpeech } = await import("./ttsService");
  const { initializeAudio } = await import("./audioUtils");

  const audioCache = getAudioCache();
  const audioPlaylist = getAudioPlaylist(audioCache);
  const tts = getTextToSpeech();
  const audioContextReady = await initializeAudio();

  return {
    audioCache,
    audioPlaylist,
    tts,
    audioContext: audioContextReady,
  };
};

// Backward compatibility - maintain the original combined function names
export const announceWithFallback = async (
  text: string,
  useOggFirst: boolean = true
): Promise<void> => {
  const { announceWithTTS } = await import("./ttsService");

  if (useOggFirst) {
    // Try OGG files first, fallback to TTS if needed
    // For now, just use TTS for custom text
    try {
      await announceWithTTS(text);
    } catch (error) {
      console.warn("TTS failed, no fallback available:", error);
    }
  } else {
    // Use TTS directly
    try {
      await announceWithTTS(text);
    } catch (error) {
      console.warn("TTS not available:", error);
    }
  }
};
