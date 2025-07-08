"use client";

import { useState, useEffect } from "react";
import { useTelegram } from "@context/telegram-context";
import {
  Volume2,
  Music,
  MessageSquare,
  X,
  Volume1,
  Play,
  AlertTriangle,
  Gamepad2,
} from "lucide-react";
import {
  AudioCache,
  AudioPlaylist,
  initializeAudio,
  announceCurrentScore,
  announceSpecialEvent,
  VOICE_OPTIONS,
  getTextToSpeech,
  enableTTS,
  getRussianTTSInfo,
  announceWithTTS,
} from "../../services/audio";

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  audioReady: boolean;
  _onAudioReadyChange: (ready: boolean) => void;
  audioEnabled: boolean;
  onAudioEnabledChange: (enabled: boolean) => void;
  audioCache: AudioCache;
  audioPlaylist: AudioPlaylist;
}

export default function AudioSettingsModal({
  isOpen,
  onClose,
  selectedVoice,
  onVoiceChange,
  volume,
  onVolumeChange,
  audioReady,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _onAudioReadyChange, // unused but kept for interface compatibility
  audioEnabled,
  onAudioEnabledChange,
  audioCache,
  audioPlaylist,
}: AudioSettingsModalProps) {
  const { theme } = useTelegram();

  // TTS-specific state
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [selectedRussianVoice, setSelectedRussianVoice] = useState<string>("");
  const [availableRussianVoices, setAvailableRussianVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Initialize TTS settings when modal opens
  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    // Load TTS settings from localStorage
    const savedTtsEnabled = localStorage.getItem("volleyball-tts-enabled");
    const isTtsEnabled = savedTtsEnabled === "true";
    setTtsEnabled(isTtsEnabled);

    const savedRussianVoice = localStorage.getItem(
      "volleyball-tts-russian-voice"
    );
    if (savedRussianVoice) {
      setSelectedRussianVoice(savedRussianVoice);
    }

    // Initialize TTS and get Russian voices
    const initTTS = async () => {
      const tts = getTextToSpeech();
      setTtsSupported(tts.isSupported());

      if (tts.isSupported()) {
        const russianInfo = getRussianTTSInfo();
        setAvailableRussianVoices(russianInfo.russianVoices);

        // Set initial voice if none selected and voices are available
        if (!savedRussianVoice && russianInfo.russianVoices.length > 0) {
          const firstRussianVoice = russianInfo.russianVoices[0].name;
          setSelectedRussianVoice(firstRussianVoice);
          localStorage.setItem(
            "volleyball-tts-russian-voice",
            firstRussianVoice
          );
        }

        // Apply the selected voice if TTS is enabled
        if (isTtsEnabled && savedRussianVoice) {
          tts.setVoice(savedRussianVoice);
        }
      }
    };

    initTTS();
  }, [isOpen]);

  // Handle TTS enable/disable
  const handleTtsEnabledChange = async (enabled: boolean) => {
    setTtsEnabled(enabled);
    localStorage.setItem("volleyball-tts-enabled", enabled.toString());

    if (enabled) {
      try {
        const success = await enableTTS();
        if (success) {
          console.log("TTS enabled successfully");

          // Apply selected Russian voice if available
          if (selectedRussianVoice) {
            const tts = getTextToSpeech();
            tts.setVoice(selectedRussianVoice);
          }
        } else {
          console.warn("Failed to enable TTS");
          setTtsEnabled(false);
          localStorage.setItem("volleyball-tts-enabled", "false");
        }
      } catch (error) {
        console.error("Error enabling TTS:", error);
        setTtsEnabled(false);
        localStorage.setItem("volleyball-tts-enabled", "false");
      }
    }
  };

  // Handle Russian voice selection
  const handleRussianVoiceChange = (voiceName: string) => {
    setSelectedRussianVoice(voiceName);
    localStorage.setItem("volleyball-tts-russian-voice", voiceName);

    // Apply the voice immediately if TTS is enabled
    if (ttsEnabled) {
      const tts = getTextToSpeech();
      tts.setVoice(voiceName);
      console.log("Russian voice changed to:", voiceName);
    }
  };

  // Test TTS functionality
  const handleTestTTS = async () => {
    if (!ttsEnabled) return;

    setIsTesting(true);
    try {
      await announceWithTTS("Тест русского голоса. Счёт: пятнадцать ноль.");
      console.log("TTS test completed");
    } catch (error) {
      console.error("TTS test failed:", error);
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`${theme.cardBg} rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto`}
        style={theme.cardBgStyle}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2
            className={`text-xl font-semibold ${theme.text} flex items-center gap-2`}
            style={theme.textStyle}
          >
            <Volume2 size={24} />
            Audio Settings
          </h2>
          <button
            onClick={onClose}
            className={`${theme.secondaryText} hover:${theme.text} transition-colors`}
            title="Close settings"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Audio Files Section */}
          <div>
            <h3
              className={`text-lg font-semibold ${theme.text} mb-4 flex items-center gap-2`}
              style={theme.textStyle}
            >
              <Music size={20} />
              Audio Files
            </h3>

            {/* Audio Enable/Disable Toggle */}
            <div className="mb-4">
              <label
                className={`block text-sm font-medium ${theme.text} mb-3`}
                style={theme.textStyle}
              >
                Enable Audio Files
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onAudioEnabledChange(!audioEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    audioEnabled
                      ? "bg-blue-600"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      audioEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span
                  className={`text-sm ${theme.text} font-medium`}
                  style={theme.textStyle}
                >
                  {audioEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <p
                className={`text-xs ${theme.secondaryText} mt-2`}
                style={theme.secondaryTextStyle}
              >
                Turn on to hear pre-recorded audio announcements
              </p>
            </div>

            {/* Voice Selection */}
            <div className={audioEnabled ? "" : "opacity-50"}>
              <label
                className={`block text-sm font-medium ${theme.text} mb-2`}
                style={theme.textStyle}
              >
                Voice Selection
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => {
                  onVoiceChange(e.target.value);
                  audioCache.changeVoice(e.target.value);
                }}
                disabled={!audioEnabled}
                className={`w-full p-3 text-base bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg ${theme.text} disabled:cursor-not-allowed`}
              >
                {VOICE_OPTIONS.map(
                  (option: { value: string; name: string }) => (
                    <option key={option.value} value={option.value}>
                      {option.name}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Volume Control */}
            <div className={`mt-4 ${audioEnabled ? "" : "opacity-50"}`}>
              <label
                className={`block text-sm font-medium ${theme.text} mb-2`}
                style={theme.textStyle}
              >
                Volume: {Math.round(volume * 100)}%
              </label>
              <div className="space-y-3">
                {/* Volume Slider */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  disabled={!audioEnabled}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 disabled:cursor-not-allowed"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                      volume * 100
                    }%, #d1d5db ${volume * 100}%, #d1d5db 100%)`,
                  }}
                />
                {/* Volume Buttons */}
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => onVolumeChange(Math.max(0, volume - 0.1))}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    disabled={!audioEnabled || volume <= 0}
                  >
                    <Volume1 size={16} />
                    Decrease
                  </button>
                  <button
                    onClick={() => onVolumeChange(Math.min(1, volume + 0.1))}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    disabled={!audioEnabled || volume >= 1}
                  >
                    <Volume2 size={16} />
                    Increase
                  </button>
                </div>
              </div>
            </div>

            {/* Audio Status */}
            <div className={`mt-4 ${audioEnabled ? "" : "opacity-50"}`}>
              <label
                className={`block text-sm font-medium ${theme.text} mb-2`}
                style={theme.textStyle}
              >
                Audio Status
              </label>
              <div className="flex items-center space-x-2 mb-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    !audioEnabled
                      ? "bg-red-500"
                      : audioReady
                      ? "bg-green-500"
                      : "bg-yellow-500"
                  }`}
                ></div>
                <span
                  className={`text-sm ${theme.secondaryText}`}
                  style={theme.secondaryTextStyle}
                >
                  {!audioEnabled
                    ? "Audio disabled"
                    : audioReady
                    ? "Audio ready"
                    : "Tap to enable audio"}
                </span>
              </div>
            </div>
          </div>

          {/* TTS Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3
              className={`text-lg font-semibold ${theme.text} mb-4 flex items-center gap-2`}
              style={theme.textStyle}
            >
              <MessageSquare size={20} />
              Text-to-Speech
            </h3>

            {/* TTS Support Check */}
            {!ttsSupported ? (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <p
                  className={`text-sm ${theme.text} flex items-center gap-2`}
                  style={theme.textStyle}
                >
                  <AlertTriangle size={16} />
                  Text-to-Speech is not supported in this browser.
                </p>
              </div>
            ) : (
              <>
                {/* TTS Enable/Disable */}
                <div className="mb-4">
                  <label
                    className={`block text-sm font-medium ${theme.text} mb-3`}
                    style={theme.textStyle}
                  >
                    Enable Text-to-Speech
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleTtsEnabledChange(!ttsEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        ttsEnabled
                          ? "bg-green-600"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          ttsEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span
                      className={`text-sm ${theme.text} font-medium`}
                      style={theme.textStyle}
                    >
                      {ttsEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <p
                    className={`mt-1 text-xs ${theme.secondaryText}`}
                    style={theme.secondaryTextStyle}
                  >
                    Turn on to hear live Russian voice announcements
                  </p>
                </div>

                {/* Russian Voice Selection */}
                <div className={`mb-4 ${ttsEnabled ? "" : "opacity-50"}`}>
                  <label
                    className={`block text-sm font-medium ${theme.text} mb-2`}
                    style={theme.textStyle}
                  >
                    Russian Voice Selection
                  </label>

                  {availableRussianVoices.length === 0 ? (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                      <p
                        className={`text-sm ${theme.text} flex items-center gap-2`}
                        style={theme.textStyle}
                      >
                        <AlertTriangle size={16} />
                        No Russian voices found on this device. The system will
                        use the default voice.
                      </p>
                    </div>
                  ) : (
                    <>
                      <select
                        value={selectedRussianVoice}
                        onChange={(e) =>
                          handleRussianVoiceChange(e.target.value)
                        }
                        disabled={!ttsEnabled}
                        className={`w-full p-3 text-base bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg ${theme.text} disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        <option value="">Select a Russian voice...</option>
                        {availableRussianVoices.map((voice) => (
                          <option key={voice.name} value={voice.name}>
                            {voice.name} ({voice.lang})
                          </option>
                        ))}
                      </select>
                      <p
                        className={`mt-1 text-xs ${theme.secondaryText}`}
                        style={theme.secondaryTextStyle}
                      >
                        Choose a Russian voice for score announcements
                      </p>
                    </>
                  )}
                </div>

                {/* TTS Test Button */}
                <div className={`mb-4 ${ttsEnabled ? "" : "opacity-50"}`}>
                  <button
                    onClick={handleTestTTS}
                    disabled={!ttsEnabled || isTesting || !selectedRussianVoice}
                    className={`w-full px-4 py-3 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${theme.primaryButton} hover:brightness-95 hover:shadow-md flex items-center justify-center gap-2`}
                    style={theme.primaryButtonStyle}
                  >
                    <Play size={16} />
                    {isTesting ? "Testing..." : "Test Russian Voice"}
                  </button>
                  <p
                    className={`mt-1 text-xs ${theme.secondaryText}`}
                    style={theme.secondaryTextStyle}
                  >
                    Test the selected Russian voice with a sample announcement
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Test Buttons for Audio Files */}
          <div
            className={`border-t border-gray-200 dark:border-gray-700 pt-6 ${
              audioEnabled ? "" : "opacity-50"
            }`}
          >
            <h3
              className={`text-lg font-semibold ${theme.text} mb-4 flex items-center gap-2`}
              style={theme.textStyle}
            >
              <Gamepad2 size={20} />
              Test Audio Files
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={async () => {
                  if (audioEnabled && audioReady) {
                    try {
                      await initializeAudio();
                      announceCurrentScore(15, 12, audioPlaylist);
                    } catch (error) {
                      console.error("Test score announcement failed:", error);
                    }
                  }
                }}
                disabled={!audioEnabled || !audioReady}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Play size={14} />
                Test Score
              </button>
              <button
                onClick={() => {
                  if (audioEnabled && audioReady) {
                    announceSpecialEvent("whistle", audioPlaylist);
                  }
                }}
                disabled={!audioEnabled || !audioReady}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Volume2 size={14} />
                Test Whistle
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
