// Audio context for Web Audio API fallbacks
let audioContext: AudioContext | null = null;

// Voice options constant
export const VOICE_OPTIONS = [
  { value: "default", name: "Default" },
  { value: "boris", name: "Boris" },
  { value: "julia", name: "Julia" },
  { value: "natalia", name: "Natalia" },
  { value: "sergey", name: "Sergey" },
  { value: "english", name: "English" },
  { value: "spongebob", name: "SpongeBob" },
];

// Audio file extensions and paths
export const AUDIO_EXTENSIONS = {
  OGG: ".ogg",
  MP3: ".mp3",
  WAV: ".wav",
} as const;

export const AUDIO_BASE_PATH = "/audio";

// Special audio files
export const SPECIAL_AUDIO_FILES = [
  "whistle.ogg",
  "win.ogg",
  "pause.ogg",
  "controlball.ogg",
] as const;

// Number range for score audio files
export const SCORE_AUDIO_RANGE = {
  MIN: 0,
  MAX: 31,
} as const;

// Initialize audio context (optional for fallbacks)
export const initializeAudio = async (): Promise<boolean> => {
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

    console.log("Audio context initialized successfully");
    return true;
  } catch (error) {
    console.log("Audio context initialization failed:", error);
    return false;
  }
};

// Get current audio context
export const getAudioContext = (): AudioContext | null => {
  return audioContext;
};

// Audio volume utilities
export const normalizeVolume = (volume: number): number => {
  return Math.max(0, Math.min(1, volume));
};

export const volumeToPercentage = (volume: number): number => {
  return Math.round(normalizeVolume(volume) * 100);
};

export const percentageToVolume = (percentage: number): number => {
  return normalizeVolume(percentage / 100);
};

// Audio file path utilities
export const getAudioFilePath = (
  voicePath: string,
  filename: string
): string => {
  return `${AUDIO_BASE_PATH}/${voicePath}/${filename}`;
};

export const generateNumberAudioPaths = (voicePath: string): string[] => {
  const paths: string[] = [];
  for (let i = SCORE_AUDIO_RANGE.MIN; i <= SCORE_AUDIO_RANGE.MAX; i++) {
    paths.push(getAudioFilePath(voicePath, `${i}.ogg`));
  }
  return paths;
};

export const generateSpecialAudioPaths = (voicePath: string): string[] => {
  return SPECIAL_AUDIO_FILES.map((filename) =>
    getAudioFilePath(voicePath, filename)
  );
};

// Browser capability detection
export const isAudioSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!(window.Audio || window.HTMLAudioElement);
};

export const isWebAudioSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!(
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  );
};

export const isSpeechSynthesisSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!window.speechSynthesis;
};

// Audio format detection
export const getSupportedAudioFormat = (): string => {
  if (typeof window === "undefined") return "ogg";

  const audio = new Audio();

  if (audio.canPlayType("audio/ogg")) {
    return "ogg";
  } else if (audio.canPlayType("audio/mpeg")) {
    return "mp3";
  } else if (audio.canPlayType("audio/wav")) {
    return "wav";
  }

  return "ogg"; // Default fallback
};

// Audio preloading utilities
export const preloadAudioFile = (url: string): Promise<HTMLAudioElement> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.preload = "auto";

    audio.onloadeddata = () => {
      resolve(audio);
    };

    audio.onerror = () => {
      reject(new Error(`Failed to load audio: ${url}`));
    };

    audio.load();
  });
};

export const preloadMultipleAudioFiles = async (
  urls: string[]
): Promise<HTMLAudioElement[]> => {
  try {
    const audioElements = await Promise.all(
      urls.map((url) => preloadAudioFile(url))
    );
    console.log(`Successfully preloaded ${audioElements.length} audio files`);
    return audioElements;
  } catch (error) {
    console.error("Error preloading audio files:", error);
    throw error;
  }
};

// Performance utilities
export const measureAudioLoadTime = async (url: string): Promise<number> => {
  const startTime = performance.now();
  try {
    await preloadAudioFile(url);
    const endTime = performance.now();
    return endTime - startTime;
  } catch (error) {
    console.error(`Failed to measure load time for ${url}:`, error);
    return -1;
  }
};

// Debug utilities
export const getAudioDebugInfo = () => {
  return {
    audioSupported: isAudioSupported(),
    webAudioSupported: isWebAudioSupported(),
    speechSynthesisSupported: isSpeechSynthesisSupported(),
    supportedFormat: getSupportedAudioFormat(),
    audioContextState: audioContext?.state || "not initialized",
    userAgent:
      typeof window !== "undefined" ? window.navigator.userAgent : "N/A",
  };
};
