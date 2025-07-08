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

  // Get statistics about cached audio
  public getCacheStats() {
    return {
      totalFiles: this.audioCache.size,
      currentVoice: this.currentVoicePath,
      volume: this.currentVolume,
      isClient: this.isClient,
    };
  }

  // Clear all cached audio files
  public clearCache() {
    this.stopAllAudio();
    this.audioCache.clear();
    console.log("Audio cache cleared");
  }
}

// Singleton instance
let audioCache: AudioCache | null = null;

// Get or create audio cache instance
export const getAudioCache = (): AudioCache => {
  if (!audioCache) {
    audioCache = new AudioCache();
  }
  return audioCache;
};
