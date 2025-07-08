// TTS (Text-to-Speech) functionality using Web Speech API
export class TextToSpeech {
  private synthesis: SpeechSynthesis | null = null;
  private isClient = false;
  private currentVoice: SpeechSynthesisVoice | null = null;
  private volume = 0.7;
  private rate = 1.0;
  private pitch = 1.0;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private _isEnabled = false; // Track if TTS has been enabled by user interaction
  private _isSpeaking = false; // Track if currently speaking
  private _lastEnableAttempt = 0; // Debounce enable attempts

  constructor() {
    this.isClient = typeof window !== "undefined";
    if (this.isClient && "speechSynthesis" in window) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();

      // Listen for voices changed event (voices load asynchronously)
      if (this.synthesis) {
        this.synthesis.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    }
  }

  private loadVoices() {
    if (!this.synthesis) return;

    this.availableVoices = this.synthesis.getVoices();
    console.log("Available TTS voices:", this.availableVoices.length);

    // Log available voices for debugging
    this.availableVoices.forEach((voice, index) => {
      console.log(`Voice ${index}: ${voice.name} (${voice.lang})`);
    });

    // Set default voice (prefer English if available)
    if (this.availableVoices.length > 0 && !this.currentVoice) {
      const englishVoice = this.availableVoices.find((voice) =>
        voice.lang.startsWith("en")
      );
      this.currentVoice = englishVoice || this.availableVoices[0];
      console.log("Default TTS voice set:", this.currentVoice?.name);
    }
  }

  public isSupported(): boolean {
    return this.isClient && "speechSynthesis" in window;
  }

  // Detect if text contains Russian characters
  private detectLanguage(text: string): string {
    const russianPattern = /[а-яё]/i;
    const englishPattern = /[a-z]/i;

    const hasRussian = russianPattern.test(text);
    const hasEnglish = englishPattern.test(text);

    if (hasRussian && !hasEnglish) {
      return "ru";
    } else if (hasRussian && hasEnglish) {
      return "ru"; // Prefer Russian if both are present
    } else if (hasEnglish) {
      return "en";
    } else {
      return "auto"; // Default
    }
  }

  // Get best voice for a specific language
  private getBestVoiceForLanguage(
    language: string
  ): SpeechSynthesisVoice | null {
    if (this.availableVoices.length === 0) {
      return null;
    }

    let targetVoices: SpeechSynthesisVoice[] = [];

    switch (language) {
      case "ru":
        // Look for Russian voices
        targetVoices = this.availableVoices.filter(
          (voice) =>
            voice.lang.startsWith("ru") ||
            voice.name.toLowerCase().includes("russian") ||
            voice.name.toLowerCase().includes("rus")
        );
        break;
      case "en":
        // Look for English voices
        targetVoices = this.availableVoices.filter((voice) =>
          voice.lang.startsWith("en")
        );
        break;
      default:
        // Use current voice or first available
        return this.currentVoice || this.availableVoices[0];
    }

    if (targetVoices.length > 0) {
      // Prefer local voices over network voices if available
      const localVoice = targetVoices.find((voice) => voice.localService);
      return localVoice || targetVoices[0];
    }

    // Fallback to current voice or first available
    return this.currentVoice || this.availableVoices[0];
  }

  // Set Russian voice explicitly
  public setRussianVoice(): boolean {
    const russianVoice = this.getBestVoiceForLanguage("ru");
    if (russianVoice) {
      this.currentVoice = russianVoice;
      console.log(
        `Russian TTS voice set to: ${russianVoice.name} (${russianVoice.lang})`
      );
      return true;
    } else {
      console.warn("No Russian TTS voice found");
      return false;
    }
  }

  // Set English voice explicitly
  public setEnglishVoice(): boolean {
    const englishVoice = this.getBestVoiceForLanguage("en");
    if (englishVoice) {
      this.currentVoice = englishVoice;
      console.log(
        `English TTS voice set to: ${englishVoice.name} (${englishVoice.lang})`
      );
      return true;
    } else {
      console.warn("No English TTS voice found");
      return false;
    }
  }

  // Enable TTS after user interaction with debouncing
  public async enable(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn("TTS not supported in this browser");
      return false;
    }

    // Debounce enable attempts (prevent multiple calls within 1 second)
    const now = Date.now();
    if (now - this._lastEnableAttempt < 1000) {
      console.log("TTS enable attempt debounced");
      return this._isEnabled;
    }
    this._lastEnableAttempt = now;

    // If already enabled, return success
    if (this._isEnabled) {
      console.log("TTS already enabled");
      return true;
    }

    try {
      // Test with a very short, silent utterance to "unlock" TTS
      const testUtterance = new SpeechSynthesisUtterance(" ");
      testUtterance.volume = 0.01; // Very low volume
      testUtterance.rate = 10; // Very fast

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("TTS enable timeout"));
        }, 2000); // 2 second timeout

        testUtterance.onend = () => {
          clearTimeout(timeout);
          console.log("TTS enabled successfully");
          this._isEnabled = true;
          resolve();
        };
        testUtterance.onerror = (error) => {
          clearTimeout(timeout);
          console.warn("TTS enable failed:", error);
          reject(error);
        };

        this.synthesis!.speak(testUtterance);
      });

      return this._isEnabled;
    } catch (error) {
      console.warn("Failed to enable TTS:", error);
      return false;
    }
  }

  public isEnabled(): boolean {
    return this._isEnabled;
  }

  public isSpeaking(): boolean {
    return this._isSpeaking || (this.synthesis?.speaking ?? false);
  }

  public speak(
    text: string,
    options?: {
      voice?: string;
      rate?: number;
      pitch?: number;
      volume?: number;
      onEnd?: () => void;
      onError?: (error: SpeechSynthesisErrorEvent) => void;
      allowInterrupt?: boolean; // Allow interrupting current speech
      autoDetectLanguage?: boolean; // Automatically detect and set voice based on text language
    }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis || !this.isSupported()) {
        console.warn("Text-to-Speech not supported");
        reject(new Error("TTS not supported"));
        return;
      }

      if (!this._isEnabled) {
        console.warn("TTS not enabled yet - user interaction required");
        reject(new Error("TTS not enabled - user interaction required"));
        return;
      }

      // Check if already speaking and interruption is not allowed
      if (this._isSpeaking && !options?.allowInterrupt) {
        console.log("TTS already speaking, skipping new utterance");
        resolve(); // Resolve successfully but don't speak
        return;
      }

      // Stop any current speech if interruption is allowed or if we're force-speaking
      if (this._isSpeaking || this.synthesis.speaking) {
        this.stop();
      }

      this._isSpeaking = true;
      const utterance = new SpeechSynthesisUtterance(text);

      // Auto-detect language and set appropriate voice (default behavior)
      const autoDetect = options?.autoDetectLanguage !== false; // Default to true
      if (autoDetect && !options?.voice) {
        const detectedLanguage = this.detectLanguage(text);
        const bestVoice = this.getBestVoiceForLanguage(detectedLanguage);
        if (bestVoice) {
          utterance.voice = bestVoice;
          console.log(
            `Auto-selected voice for language "${detectedLanguage}": ${bestVoice.name}`
          );
        }
      }
      // Set voice manually if specified
      else if (options?.voice) {
        const selectedVoice = this.availableVoices.find(
          (voice) =>
            voice.name.includes(options.voice!) ||
            voice.lang.includes(options.voice!)
        );
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }
      // Use current voice as fallback
      else if (this.currentVoice) {
        utterance.voice = this.currentVoice;
      }

      // Set speech parameters
      utterance.volume = options?.volume ?? this.volume;
      utterance.rate = options?.rate ?? this.rate;
      utterance.pitch = options?.pitch ?? this.pitch;

      // Set event handlers
      utterance.onend = () => {
        console.log(`TTS finished: "${text}"`);
        this._isSpeaking = false;
        options?.onEnd?.();
        resolve();
      };

      utterance.onerror = (error) => {
        console.error("TTS error:", error);
        this._isSpeaking = false;

        // Don't treat interruption as a real error for the caller
        if (error.error === "interrupted") {
          console.log("TTS was interrupted, resolving normally");
          resolve();
        } else {
          options?.onError?.(error);
          reject(error);
        }
      };

      // Speak the text
      console.log(`TTS speaking: "${text}"`);
      this.synthesis.speak(utterance);
    });
  }

  public stop() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this._isSpeaking = false;
    }
  }

  public pause() {
    if (this.synthesis) {
      this.synthesis.pause();
    }
  }

  public resume() {
    if (this.synthesis) {
      this.synthesis.resume();
    }
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    console.log(`TTS volume set to: ${Math.round(this.volume * 100)}%`);
  }

  public setRate(rate: number) {
    this.rate = Math.max(0.1, Math.min(10, rate));
    console.log(`TTS rate set to: ${this.rate}`);
  }

  public setPitch(pitch: number) {
    this.pitch = Math.max(0, Math.min(2, pitch));
    console.log(`TTS pitch set to: ${this.pitch}`);
  }

  public getVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices;
  }

  public setVoice(voiceName: string) {
    const selectedVoice = this.availableVoices.find(
      (voice) =>
        voice.name.includes(voiceName) || voice.lang.includes(voiceName)
    );
    if (selectedVoice) {
      this.currentVoice = selectedVoice;
      console.log(`TTS voice set to: ${selectedVoice.name}`);
    } else {
      console.warn(`TTS voice not found: ${voiceName}`);
    }
  }

  public getCurrentVoice(): SpeechSynthesisVoice | null {
    return this.currentVoice;
  }

  // Convenience method for common announcements
  public sayScore(leftScore: number, rightScore: number) {
    return this.speak(`Score: ${leftScore} to ${rightScore}`);
  }

  public sayWelcome() {
    return this.speak("Welcome to volleyball scoring system!");
  }

  // New convenience methods for Russian
  public sayRussianWelcome() {
    return this.speak("Привет! Добро пожаловать на волейбольное табло!");
  }

  public sayRussianScore(leftScore: number, rightScore: number) {
    return this.speak(`Счёт: ${leftScore} ${rightScore}`);
  }

  // Get available Russian voices
  public getRussianVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices.filter(
      (voice) =>
        voice.lang.startsWith("ru") ||
        voice.name.toLowerCase().includes("russian") ||
        voice.name.toLowerCase().includes("rus")
    );
  }

  // Get available English voices
  public getEnglishVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices.filter((voice) => voice.lang.startsWith("en"));
  }

  // Check if Russian voices are available
  public hasRussianVoices(): boolean {
    return this.getRussianVoices().length > 0;
  }
}

// Singleton instance
let textToSpeech: TextToSpeech | null = null;

// Get or create TTS instance
export const getTextToSpeech = (): TextToSpeech => {
  if (!textToSpeech) {
    textToSpeech = new TextToSpeech();
  }
  return textToSpeech;
};

// Check if Russian TTS is available
export const hasRussianTTS = (): boolean => {
  const tts = getTextToSpeech();
  return tts.isSupported() && tts.hasRussianVoices();
};

// Get Russian TTS voices info
export const getRussianTTSInfo = (): {
  supported: boolean;
  hasRussianVoices: boolean;
  russianVoices: SpeechSynthesisVoice[];
} => {
  const tts = getTextToSpeech();
  return {
    supported: tts.isSupported(),
    hasRussianVoices: tts.hasRussianVoices(),
    russianVoices: tts.getRussianVoices(),
  };
};

// Combined audio announcements (TTS)
export const announceWithTTS = async (
  text: string,
  options?: Parameters<TextToSpeech["speak"]>[1]
): Promise<void> => {
  const tts = getTextToSpeech();

  if (!tts.isSupported()) {
    console.log("TTS not supported for announcement");
    return;
  }

  if (!tts.isEnabled()) {
    console.log(
      "TTS not enabled - call enableTTS() first to activate TTS after user interaction"
    );
    return;
  }

  try {
    await tts.speak(text, options);
  } catch (error) {
    console.warn("TTS announcement failed:", error);
  }
};

// Welcome message for Score page (only plays if TTS is explicitly enabled)
let welcomeCallInProgress = false; // Flag to prevent multiple welcome calls
export const sayWelcomeToScore = async (): Promise<void> => {
  // Prevent multiple simultaneous welcome calls
  if (welcomeCallInProgress) {
    console.log("Welcome message already in progress, skipping");
    return;
  }

  const tts = getTextToSpeech();
  if (!tts.isSupported()) {
    console.log("TTS not supported for welcome message");
    return;
  }

  if (!tts.isEnabled()) {
    console.log(
      "TTS not enabled - welcome message requires explicit TTS activation"
    );
    return;
  }

  if (tts.isSpeaking()) {
    console.log("TTS is already speaking, skipping welcome message");
    return;
  }

  welcomeCallInProgress = true;

  try {
    await tts.speak("Привет! Добро пожаловать на волейбол.", {
      allowInterrupt: false, // Don't allow interrupting the welcome message
    });
    console.log("Welcome message completed successfully");
  } catch (error) {
    console.warn("Could not play welcome message:", error);
  } finally {
    welcomeCallInProgress = false;
  }
};

// TTS-based score announcement (requires TTS to be enabled first)
export const announceScoreWithTTS = async (
  leftScore: number,
  rightScore: number,
  leftScored: boolean,
  rightScored: boolean,
  servingTeam?: "left" | "right"
): Promise<void> => {
  const tts = getTextToSpeech();

  if (!tts.isSupported()) {
    console.log("TTS not supported for score announcement");
    return;
  }

  if (!tts.isEnabled()) {
    console.log(
      "TTS not enabled - call enableTTS() first to activate TTS after user interaction"
    );
    return;
  }

  try {
    let announcement = "";

    // Volleyball rules for score announcement:
    // 1. If we know who's serving, announce serving team first
    // 2. If we don't know who's serving, announce the team that just scored first
    if (servingTeam === "left" || (!servingTeam && leftScored)) {
      announcement = `${leftScore} ${rightScore}`;
    } else if (servingTeam === "right" || (!servingTeam && rightScored)) {
      announcement = `${rightScore} ${leftScore}`;
    } else {
      announcement = `${leftScore} ${rightScore}`;
    }

    await tts.speak(announcement);
  } catch (error) {
    console.warn("TTS score announcement failed:", error);
  }
};
