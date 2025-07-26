"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useTelegram } from "@context/telegram-context";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";

interface Point {
  id: string;
  created_at: string;
  winner: "left" | "right";
  type: "ace" | "attack" | "block" | "error" | "unspecified";
  player_id: number | null;
}

interface HistoryState {
  leftScore: number;
  rightScore: number;
  leftSets: number;
  rightSets: number;
  currentSet: number;
  totalPoints: number;
  timestamp: string;
  lastPointIndex: number;
  isComplete: boolean;
  setWinner: "left" | "right" | null;
  matchWinner: "left" | "right" | null;
}

interface HistoryTimelineProps {
  points: Point[];
  onHistoryStateChange?: (state: HistoryState | null) => void;
  className?: string;
}

export default function HistoryTimeline({
  points,
  onHistoryStateChange,
  className = "",
}: HistoryTimelineProps) {
  const { theme } = useTelegram();
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isHistoryMode, setIsHistoryMode] = useState(false);

  // Calculate timeline data from points
  const timelineData = useMemo(() => {
    if (points.length === 0) {
      return {
        startTime: 0,
        endTime: 0,
        timePoints: [],
        historyStates: [],
      };
    }

    const sortedPoints = [...points].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const startTime = new Date(sortedPoints[0].created_at).getTime();
    const endTime = new Date(
      sortedPoints[sortedPoints.length - 1].created_at
    ).getTime();

    // Calculate history states for each point
    const historyStates: HistoryState[] = [];
    let leftScore = 0;
    let rightScore = 0;
    let leftSets = 0;
    let rightSets = 0;
    let currentSet = 1;

    // Add initial state (before any points)
    historyStates.push({
      leftScore: 0,
      rightScore: 0,
      leftSets: 0,
      rightSets: 0,
      currentSet: 1,
      totalPoints: 0,
      timestamp: sortedPoints[0].created_at,
      lastPointIndex: -1,
      isComplete: false,
      setWinner: null,
      matchWinner: null,
    });

    sortedPoints.forEach((point, index) => {
      // Add point to current set score
      if (point.winner === "left") {
        leftScore += 1;
      } else {
        rightScore += 1;
      }

      // Check if set is complete
      const isSetComplete =
        (leftScore >= 25 || rightScore >= 25) &&
        Math.abs(leftScore - rightScore) >= 2;

      if (isSetComplete) {
        // Update set wins
        if (leftScore > rightScore) {
          leftSets += 1;
        } else {
          rightSets += 1;
        }

        // Add state after set completion
        historyStates.push({
          leftScore,
          rightScore,
          leftSets,
          rightSets,
          currentSet,
          totalPoints: index + 1,
          timestamp: point.created_at,
          lastPointIndex: index,
          isComplete: true,
          setWinner: leftScore > rightScore ? "left" : "right",
          matchWinner: leftSets >= 3 ? "left" : rightSets >= 3 ? "right" : null,
        });

        // Reset for next set
        leftScore = 0;
        rightScore = 0;
        currentSet += 1;
      } else {
        // Add regular point state
        historyStates.push({
          leftScore,
          rightScore,
          leftSets,
          rightSets,
          currentSet,
          totalPoints: index + 1,
          timestamp: point.created_at,
          lastPointIndex: index,
          isComplete: false,
          setWinner: null,
          matchWinner: leftSets >= 3 ? "left" : rightSets >= 3 ? "right" : null,
        });
      }
    });

    // Create time points for the slider
    const timePoints = sortedPoints.map((point) => ({
      timestamp: new Date(point.created_at).getTime(),
      pointIndex: sortedPoints.indexOf(point),
    }));

    return {
      startTime,
      endTime,
      timePoints,
      historyStates,
    };
  }, [points]);

  // Initialize current time to the end (live state)
  useEffect(() => {
    if (timelineData.endTime > 0) {
      setCurrentTime(timelineData.endTime);
    }
  }, [timelineData.endTime]);

  // Calculate current history state based on current time
  const currentHistoryState = useMemo(() => {
    if (timelineData.historyStates.length === 0) return null;

    // If we're at the end time (live mode), return null to show current state
    if (currentTime >= timelineData.endTime && !isHistoryMode) {
      return null;
    }

    // Find the last state that occurred before or at the current time
    let stateIndex = -1;
    for (let i = timelineData.historyStates.length - 1; i >= 0; i--) {
      const stateTime = new Date(
        timelineData.historyStates[i].timestamp
      ).getTime();
      if (stateTime <= currentTime) {
        stateIndex = i;
        break;
      }
    }

    return stateIndex >= 0
      ? timelineData.historyStates[stateIndex]
      : timelineData.historyStates[0];
  }, [
    currentTime,
    timelineData.historyStates,
    timelineData.endTime,
    isHistoryMode,
  ]);

  // Notify parent of history state changes
  useEffect(() => {
    if (onHistoryStateChange) {
      onHistoryStateChange(currentHistoryState);
    }
  }, [currentHistoryState, onHistoryStateChange]);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || timelineData.endTime === 0) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const timeStep =
          ((timelineData.endTime - timelineData.startTime) / 100) *
          playbackSpeed;
        const nextTime = prev + timeStep;

        if (nextTime >= timelineData.endTime) {
          setIsPlaying(false);
          setIsHistoryMode(false);
          return timelineData.endTime;
        }

        return nextTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, timelineData.startTime, timelineData.endTime, playbackSpeed]);

  // Handle slider change
  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseInt(event.target.value);
    setCurrentTime(newTime);
    setIsHistoryMode(newTime < timelineData.endTime);
    setIsPlaying(false);
  };

  // Play/pause toggle
  const togglePlayback = () => {
    if (currentTime >= timelineData.endTime) {
      // Start from beginning if at the end
      setCurrentTime(timelineData.startTime);
      setIsHistoryMode(true);
    }
    setIsPlaying(!isPlaying);
  };

  // Reset to live view
  const resetToLive = () => {
    setCurrentTime(timelineData.endTime);
    setIsPlaying(false);
    setIsHistoryMode(false);
  };

  // Format time for display
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  // Don't show timeline if no points
  if (points.length === 0) {
    return null;
  }

  return (
    <div
      className={`${theme.cardBg} rounded-lg p-4 ${className}`}
      style={theme.cardBgStyle}
    >
      {/* Timeline Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Clock size={16} className={theme.secondaryText} />
          <span
            className={`text-sm font-medium ${theme.text}`}
            style={theme.textStyle}
          >
            Game Timeline
          </span>
        </div>

        {isHistoryMode && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span
              className={`text-xs ${theme.secondaryText}`}
              style={theme.secondaryTextStyle}
            >
              History Mode
            </span>
          </div>
        )}
      </div>

      {/* Timeline Slider */}
      <div className="relative mb-4">
        <input
          type="range"
          min={timelineData.startTime}
          max={timelineData.endTime}
          value={currentTime}
          onChange={handleTimeChange}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
              ((currentTime - timelineData.startTime) /
                (timelineData.endTime - timelineData.startTime)) *
              100
            }%, #e5e7eb ${
              ((currentTime - timelineData.startTime) /
                (timelineData.endTime - timelineData.startTime)) *
              100
            }%, #e5e7eb 100%)`,
          }}
        />

        {/* Point markers on timeline */}
        <div className="absolute top-0 left-0 w-full h-2 pointer-events-none">
          {timelineData.timePoints.map((timePoint, index) => {
            const position =
              ((timePoint.timestamp - timelineData.startTime) /
                (timelineData.endTime - timelineData.startTime)) *
              100;
            return (
              <div
                key={index}
                className="absolute w-1 h-2 bg-gray-600 dark:bg-gray-300 opacity-50"
                style={{ left: `${position}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* Time Display */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
        <span>{formatTime(timelineData.startTime)}</span>
        <span className="font-mono">
          {formatTime(currentTime)}
          {currentHistoryState && (
            <span className="ml-2">
              ({currentHistoryState.totalPoints} points)
            </span>
          )}
        </span>
        <span>{formatTime(timelineData.endTime)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlayback}
            className={`p-2 rounded-lg ${theme.cardBg} border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
            style={theme.cardBgStyle}
          >
            {isPlaying ? (
              <Pause size={16} className={theme.text} />
            ) : (
              <Play size={16} className={theme.text} />
            )}
          </button>

          {/* Speed Control */}
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className={`text-xs px-2 py-1 rounded ${theme.cardBg} border border-gray-300 dark:border-gray-600`}
            style={theme.cardBgStyle}
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>
        </div>

        {/* Reset to Live Button */}
        <button
          onClick={resetToLive}
          className={`flex items-center space-x-1 px-3 py-1 text-xs rounded-lg ${theme.cardBg} border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
          style={theme.cardBgStyle}
        >
          <RotateCcw size={12} />
          <span>Current</span>
        </button>
      </div>

      {/* Current State Display (when in history mode) */}
      {currentHistoryState && isHistoryMode && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="font-mono">
                Set {currentHistoryState.currentSet}:{" "}
                {currentHistoryState.leftScore}-{currentHistoryState.rightScore}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                Sets: {currentHistoryState.leftSets}-
                {currentHistoryState.rightSets}
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Point {currentHistoryState.totalPoints} of {points.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
