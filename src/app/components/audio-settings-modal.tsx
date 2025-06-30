"use client";

import { useTelegram } from "@context/telegram-context";
import {
  AudioCache,
  AudioPlaylist,
  initializeAudio,
  announceScoreVolleyball,
  announceCurrentScore,
  VOICE_OPTIONS,
} from "../services/audio";

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  audioReady: boolean;
  onAudioReadyChange: (ready: boolean) => void;
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
  onAudioReadyChange,
  audioCache,
  audioPlaylist,
}: AudioSettingsModalProps) {
  const { theme } = useTelegram();

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
            className={`text-xl font-semibold ${theme.text}`}
            style={theme.textStyle}
          >
            🔊 Audio Settings
          </h2>
          <button
            onClick={onClose}
            className={`text-2xl ${theme.secondaryText} hover:${theme.text} transition-colors`}
            title="Close settings"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Voice Selection */}
          <div>
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
              className={`w-full p-3 text-base bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg ${theme.text}`}
            >
              {VOICE_OPTIONS.map((option: { value: string; name: string }) => (
                <option key={option.value} value={option.value}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Volume Control */}
          <div>
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
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
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
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                  disabled={volume <= 0}
                >
                  🔉 Decrease
                </button>
                <button
                  onClick={() => onVolumeChange(Math.min(1, volume + 0.1))}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                  disabled={volume >= 1}
                >
                  🔊 Increase
                </button>
              </div>
            </div>
          </div>

          {/* Audio Status */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.text} mb-2`}
              style={theme.textStyle}
            >
              Audio Status
            </label>
            <div className="flex items-center space-x-2 mb-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  audioReady ? "bg-green-500" : "bg-yellow-500"
                }`}
              ></div>
              <span
                className={`text-sm ${theme.secondaryText}`}
                style={theme.secondaryTextStyle}
              >
                {audioReady ? "Audio ready" : "Tap to enable audio"}
              </span>
            </div>
          </div>

          {/* Test Buttons */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.text} mb-3`}
              style={theme.textStyle}
            >
              Test Audio
            </label>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={async () => {
                  const success = await initializeAudio();
                  onAudioReadyChange(success);
                  console.log(
                    `Testing volleyball audio at ${Math.round(
                      volume * 100
                    )}% volume`
                  );
                  announceScoreVolleyball(15, 12, true, false, audioPlaylist);
                }}
                className="w-full py-3 px-4 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>🔊</span>
                <span>Test Volleyball Score (15-12)</span>
              </button>

              <button
                onClick={async () => {
                  const success = await initializeAudio();
                  onAudioReadyChange(success);
                  console.log(
                    `Testing current score audio at ${Math.round(
                      volume * 100
                    )}% volume`
                  );
                  announceCurrentScore(24, 23, audioPlaylist);
                }}
                className="w-full py-3 px-4 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>🎯</span>
                <span>Test Current Score (24-23)</span>
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
