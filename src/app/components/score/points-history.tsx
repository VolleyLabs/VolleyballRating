"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useTelegram } from "@context/telegram-context";
import { supabase } from "@lib/supabase-queries";
import { PointType, User } from "@/../database.types";
import { Crosshair, Swords, Shield, AlertTriangle, Circle } from "lucide-react";

interface PointWithScore {
  point: Point;
  scoreString: string;
}

interface PointsHistoryProps {
  selectedDate?: string;
  onScoreUpdate?: () => void;
  points?: Point[];
  users?: Map<number, User>;
  loadingUsers?: boolean;
}

type Point = {
  id: string;
  created_at: string;
  winner: "left" | "right";
  type: "ace" | "attack" | "block" | "error" | "unspecified";
  player_id: number | null;
};

const POINT_TYPE_ICONS: Record<
  PointType,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  ace: Crosshair, // serve ace - lightning bolt for powerful serve
  attack: Swords, // spike/attack - crossed swords
  block: Shield, // block - shield
  error: AlertTriangle, // error - warning triangle for mistakes
  unspecified: Circle, // generic - circle
};

export default function PointsHistory({
  onScoreUpdate,
  points: propPoints = [],
  users = new Map(),
  loadingUsers = false,
}: PointsHistoryProps) {
  const { theme, isAdmin } = useTelegram();
  const [points, setPoints] = useState<Point[]>(propPoints);

  // Update local points when props change
  useEffect(() => {
    setPoints(propPoints);
  }, [propPoints]);

  // No need to group points by date since we're fetching for a specific date

  // Calculate running scores for a day's points
  const calculateRunningScores = (
    dayPoints: Point[]
  ): (
    | PointWithScore
    | {
        type: "set-separator";
        leftSets: number;
        rightSets: number;
        setScore: string;
      }
  )[] => {
    let leftScore = 0;
    let rightScore = 0;
    let leftSets = 0;
    let rightSets = 0;
    const result: (
      | PointWithScore
      | {
          type: "set-separator";
          leftSets: number;
          rightSets: number;
          setScore: string;
        }
    )[] = [];

    for (const point of dayPoints) {
      // Add the point to the score
      if (point.winner === "left") {
        leftScore += 1;
      } else {
        rightScore += 1;
      }

      // Check if this completes a set (25+ with 2+ advantage)
      const isSetComplete =
        (leftScore >= 25 || rightScore >= 25) &&
        Math.abs(leftScore - rightScore) >= 2;

      const scoreString = `${leftScore}-${rightScore}`;
      result.push({ point, scoreString });

      // If set is complete, add set separator and reset scores for next set
      if (isSetComplete) {
        // Update set wins
        if (leftScore > rightScore) {
          leftSets += 1;
        } else {
          rightSets += 1;
        }

        // Add set separator with final set score and global score
        result.push({
          type: "set-separator",
          leftSets,
          rightSets,
          setScore: scoreString,
        });

        leftScore = 0;
        rightScore = 0;
      }
    }

    return result;
  };

  // Format time for display
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Delete a specific point
  const deletePoint = async (point: Point) => {
    if (!isAdmin) return;

    try {
      console.log("Deleting point:", point.id, "created at:", point.created_at);

      const { error: deleteError } = await supabase
        .from("points")
        .delete()
        .eq("id", point.id);

      if (deleteError) {
        throw deleteError;
      }

      // Remove from local state
      setPoints(points.filter((p) => p.id !== point.id));
      console.log("Point deleted successfully from database and local state");

      // Trigger score update in parent component
      if (onScoreUpdate) {
        onScoreUpdate();
      }
    } catch (err) {
      console.error("Error deleting point:", err);
    }
  };

  // Get player information by player_id
  const getPlayerInfo = (playerId: number | null) => {
    if (!playerId) return null;
    return users.get(playerId) || null;
  };

  // Since we're fetching points for the specific date, we can use them directly
  const pointsWithScores = calculateRunningScores(points);
  const reversedPoints = [...pointsWithScores].reverse(); // Show all points for the day

  return (
    <div
      className={`w-full max-w-md mx-auto mt-4 ${theme.cardBg} rounded-lg shadow-sm flex-1 flex flex-col`}
      style={theme.cardBgStyle}
    >
      {/* Content - only today's points */}
      <div className="flex-1 overflow-y-auto p-4">
        {reversedPoints.length === 0 ? (
          <div className="text-center py-8">
            <p
              className={`${theme.secondaryText} italic`}
              style={theme.secondaryTextStyle}
            >
              No points recorded for this date
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {reversedPoints.map((item, index) => {
              // Handle set separator
              if ("type" in item && item.type === "set-separator") {
                return (
                  <div
                    key={`set-separator-${index}`}
                    className="flex items-center justify-center py-3 my-2"
                  >
                    <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                    <div className="mx-4 text-center">
                      <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        Set Complete: {item.setScore}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Sets: {item.leftSets} - {item.rightSets}
                      </div>
                    </div>
                    <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                  </div>
                );
              }

              // Handle regular point
              const { point, scoreString } = item as PointWithScore;
              const playerInfo = getPlayerInfo(point.player_id);

              return (
                <div
                  key={`${point.id}-${index}`}
                  className={`relative group p-3 rounded-lg ${
                    point.winner === "left"
                      ? "bg-blue-500 bg-opacity-70"
                      : "bg-red-500 bg-opacity-70"
                  } text-white`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Score */}
                      <span className="text-xs font-mono bg-black bg-opacity-20 px-2 py-1 rounded">
                        {scoreString}
                      </span>

                      {/* Point type icon */}
                      {point.type !== "unspecified" && (
                        <div className="flex items-center">
                          {React.createElement(POINT_TYPE_ICONS[point.type], {
                            size: 16,
                            className: "text-white",
                          })}
                        </div>
                      )}

                      {/* Player info */}
                      {playerInfo && (
                        <div className="flex items-center space-x-2">
                          {/* Player avatar */}
                          <div className="w-6 h-6 relative">
                            <Image
                              src={
                                playerInfo.photo_url || "/default-avatar.svg"
                              }
                              alt={playerInfo.first_name}
                              fill
                              className="rounded-full object-cover"
                            />
                          </div>

                          {/* Player name/username */}
                          <div className="flex flex-col">
                            <span className="text-xs font-medium">
                              {playerInfo.first_name}{" "}
                              {playerInfo.last_name || ""}
                            </span>
                            {playerInfo.username && (
                              <span className="text-xs opacity-80">
                                @{playerInfo.username}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Generic message for error with no player */}
                      {!playerInfo && point.type === "error" && (
                        <span
                          className={`text-xs italic ${theme.secondaryText}`}
                          style={theme.secondaryTextStyle}
                        >
                          Mistake by the opposing team
                        </span>
                      )}

                      {/* Loading indicator for user data */}
                      {loadingUsers && point.player_id && !playerInfo && (
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full animate-pulse"></div>
                          <div className="h-3 w-16 bg-white bg-opacity-20 rounded animate-pulse"></div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Time */}
                      <span className="text-xs opacity-90">
                        {formatTime(point.created_at)}
                      </span>

                      {/* Delete button (admin only) */}
                      {isAdmin && (
                        <button
                          onClick={() => deletePoint(point)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 rounded p-1 text-xs"
                          title="Delete point"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
