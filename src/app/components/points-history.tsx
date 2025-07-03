"use client";

import { useEffect, useState } from "react";
import { useTelegram } from "@context/telegram-context";
import { supabase } from "@lib/supabase-queries";
import { Point, PointType } from "@/../database.types";

interface PointWithScore {
  point: Point;
  scoreString: string;
}

const POINT_TYPE_EMOJIS: Record<PointType, string> = {
  ace: "⚡", // serve ace
  attack: "💥", // spike/attack
  block: "🛡️", // block
  error: "❌", // error
  unspecified: "🏐", // generic volleyball
};

export default function PointsHistory() {
  const { theme, isAdmin } = useTelegram();
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch points data and set up real-time subscription
  useEffect(() => {
    fetchPoints();

    // Set up real-time subscription for points changes
    const channel = supabase
      .channel("points-history")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "points",
        },
        (payload) => {
          console.log("Points change detected:", payload);

          try {
            if (payload.eventType === "INSERT") {
              // Add new point to existing state
              const newPoint = payload.new as Point;
              setPoints((prevPoints) => [...prevPoints, newPoint]);
            } else if (payload.eventType === "DELETE") {
              // Remove deleted point from state
              const deletedId = payload.old?.id;
              if (deletedId) {
                setPoints((prevPoints) =>
                  prevPoints.filter((p) => p.id !== deletedId)
                );
              }
            } else {
              // For UPDATE events or if we can't handle incrementally, refetch
              fetchPoints();
            }
          } catch (err) {
            console.error("Error handling real-time update:", err);
            // Fallback to refetching if there's an error
            fetchPoints();
          }
        }
      )
      .subscribe((status) => {
        console.log("Points history subscription status:", status);
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchPoints = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("points")
        .select("*")
        .order("created_at", { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setPoints(data || []);
    } catch (err) {
      console.error("Error fetching points:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch points");
    } finally {
      setLoading(false);
    }
  };

  // Group points by date
  const groupedPoints = points.reduce((groups, point) => {
    const date = point.created_at.split("T")[0]; // Extract YYYY-MM-DD
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(point);
    return groups;
  }, {} as Record<string, Point[]>);

  // Calculate running scores for a day's points
  const calculateRunningScores = (dayPoints: Point[]): PointWithScore[] => {
    let leftScore = 0;
    let rightScore = 0;
    const result: PointWithScore[] = [];

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

      // If set is complete, reset scores for next set
      if (isSetComplete) {
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
      const { error: deleteError } = await supabase
        .from("points")
        .delete()
        .eq("id", point.id);

      if (deleteError) {
        throw deleteError;
      }

      // Remove from local state
      setPoints(points.filter((p) => p.id !== point.id));
      console.log("Point deleted successfully");
    } catch (err) {
      console.error("Error deleting point:", err);
    }
  };

  // Get today's points only
  const today = new Date().toISOString().split("T")[0];
  const todayPoints = groupedPoints[today] || [];
  const todayPointsWithScores = calculateRunningScores(todayPoints);
  const reversedTodayPoints = [...todayPointsWithScores].reverse().slice(0, 15); // Show last 15 points

  return (
    <div
      className={`w-full max-w-md mx-auto mt-4 ${theme.cardBg} rounded-lg shadow-sm flex-1 flex flex-col`}
      style={theme.cardBgStyle}
    >
      {/* Content - only today's points */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">
            <p>Error: {error}</p>
            <p className="text-xs mt-2 opacity-75">
              Real-time updates will retry automatically
            </p>
          </div>
        ) : reversedTodayPoints.length === 0 ? (
          <div className="text-center py-8">
            <p
              className={`${theme.secondaryText} italic`}
              style={theme.secondaryTextStyle}
            >
              No points recorded today
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {reversedTodayPoints.map(({ point, scoreString }, index) => (
              <div
                key={`${point.id}-${index}`}
                className={`relative group p-2 rounded-lg ${
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

                    {/* Point type emoji */}
                    {point.type !== "unspecified" && (
                      <span className="text-lg">
                        {POINT_TYPE_EMOJIS[point.type]}
                      </span>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
