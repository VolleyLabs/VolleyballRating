import { AudioCache } from "./audioCache";

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

  // Get current playlist status
  public getStatus() {
    return {
      isPlaying: this.isPlaying,
      currentIndex: this.currentIndex,
      queueLength: this.queue.length,
      isInterrupted: this.isInterrupted,
      currentFile: this.queue[this.currentIndex] || null,
      remainingFiles: this.queue.slice(this.currentIndex + 1),
    };
  }

  // Get remaining queue items
  public getRemainingQueue(): string[] {
    return this.queue.slice(this.currentIndex);
  }

  // Check if playlist is empty
  public isEmpty(): boolean {
    return this.queue.length === 0;
  }

  // Pause current playback (if possible)
  public pause() {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
      console.log("Playlist playback paused");
    }
  }

  // Resume current playback (if possible)
  public resume() {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play().catch(console.error);
      console.log("Playlist playback resumed");
    }
  }
}

// Singleton instance
let audioPlaylist: AudioPlaylist | null = null;

// Get or create audio playlist instance
export const getAudioPlaylist = (audioCache?: AudioCache): AudioPlaylist => {
  if (!audioPlaylist && audioCache) {
    audioPlaylist = new AudioPlaylist(audioCache);
  }
  return audioPlaylist!;
};
