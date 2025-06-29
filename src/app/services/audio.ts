// Audio context for Web Audio API fallbacks
let audioContext: AudioContext | null = null;

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

// Audio cache system for .ogg files (similar to Angular implementation)
export class AudioCache {
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

  // Stop all currently playing audio files
  public stopAllAudio() {
    if (!this.isClient) return;

    this.audioCache.forEach((audio) => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    console.log("Stopped all playing audio files");
  }
}

// Audio playlist management for .ogg files
export class AudioPlaylist {
  private queue: string[] = [];
  private isPlaying: boolean = false;
  private currentIndex: number = 0;
  private currentAudio: HTMLAudioElement | null = null;
  private audioCache: AudioCache;
  private isInterrupted: boolean = false; // Flag to prevent continued playback after stop

  constructor(audioCache: AudioCache) {
    this.audioCache = audioCache;
  }

  addToQueue(filename: string) {
    this.queue.push(filename);
    console.log(`Added to audio queue: "${filename}"`);
    if (!this.isPlaying && !this.isInterrupted) {
      this.playNext();
    }
  }

  private async playNext() {
    // Check if interrupted before processing
    if (this.isInterrupted) {
      console.log("Playback interrupted, stopping");
      this.reset();
      return;
    }

    if (this.currentIndex < this.queue.length) {
      const currentFilename = this.queue[this.currentIndex];
      this.isPlaying = true;
      console.log(`Playing from queue: "${currentFilename}"`);

      if (currentFilename === "pause.ogg") {
        // Short pause - check if interrupted during pause
        await new Promise((resolve) => setTimeout(resolve, 300));
        if (this.isInterrupted) {
          console.log("Interrupted during pause");
          this.reset();
          return;
        }
        this.currentIndex++;
        this.playNext();
      } else {
        const audio = this.audioCache.getAudio(currentFilename);
        if (audio) {
          // Store reference to current audio for potential stopping
          this.currentAudio = audio;
          audio.currentTime = 0; // Reset to beginning

          // Wait for audio to finish
          await new Promise<void>((resolve) => {
            // Check if interrupted before setting up listeners
            if (this.isInterrupted) {
              console.log("Interrupted before playing audio");
              this.currentAudio = null;
              resolve();
              return;
            }

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

          // Check if interrupted after audio finished
          if (this.isInterrupted) {
            console.log("Interrupted after audio finished");
            this.reset();
            return;
          }

          // Move to next item
          this.currentIndex++;
          setTimeout(() => {
            // Check if interrupted before next item
            if (!this.isInterrupted) {
              this.playNext();
            } else {
              console.log("Interrupted before next item");
              this.reset();
            }
          }, 200); // Small delay between sounds
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

    // Set interrupted flag first to prevent any ongoing operations
    this.isInterrupted = true;

    // Stop current audio if playing
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      console.log("Stopped currently playing audio");
    }

    // Also stop any other audio files that might be playing
    this.audioCache.stopAllAudio();

    this.clear();
  }

  clear() {
    this.queue = [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.isInterrupted = true; // Mark as interrupted
    console.log("Audio queue cleared");
  }

  // Reset interrupted flag to allow new playback
  public resetInterruption() {
    this.isInterrupted = false;
    console.log("Interruption flag reset - ready for new playback");
  }

  private reset() {
    this.isPlaying = false;
    this.currentIndex = 0;
    this.queue = [];
    this.currentAudio = null;
    this.isInterrupted = false; // Reset interruption flag for new playback
    console.log("Audio queue finished and reset");
  }
}

// Game logic functions
export const isControlBall = (score1: number, score2: number): boolean => {
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

export const isMatchOver = (score1: number, score2: number): boolean => {
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

// Score announcement functions - volleyball rules
// В волейболе принято объявлять счет в порядке: подающая команда - принимающая команда
// Если не знаем кто подает, объявляем сначала команду которая только что забила очко
export const announceScoreVolleyball = (
  leftScore: number,
  rightScore: number,
  leftScored: boolean,
  rightScored: boolean,
  audioPlaylist: AudioPlaylist,
  servingTeam?: "left" | "right"
) => {
  console.log(
    `Volleyball score announcement: ${leftScore}-${rightScore}, left scored: ${leftScored}, right scored: ${rightScored}`
  );

  // Stop any currently playing audio and clear queue
  audioPlaylist.stop();

  // Reset interrupted flag to allow new playback
  audioPlaylist.resetInterruption();

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

// Простая функция для объявления текущего счета (без определения кто забил)
export const announceCurrentScore = (
  leftScore: number,
  rightScore: number,
  audioPlaylist: AudioPlaylist
) => {
  console.log(`Announcing current score: ${leftScore}-${rightScore}`);

  // Stop any currently playing audio and clear queue
  audioPlaylist.stop();

  // Reset interrupted flag to allow new playback
  audioPlaylist.resetInterruption();

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
