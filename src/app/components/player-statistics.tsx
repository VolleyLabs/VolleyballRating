"use client";

import { useState } from "react";
import Image from "next/image";
import { useTelegram } from "@context/telegram-context";
import { DailyScoreData } from "@lib/supabase-queries";
import { User } from "@/../database.types";
import { Plus, Crosshair, Swords, Shield, AlertTriangle } from "lucide-react";

interface PlayerStatisticsProps {
  scoreData: DailyScoreData;
  allUsers: Map<number, User>;
  loadingUsers: boolean;
}

export default function PlayerStatistics({
  scoreData,
  allUsers,
  loadingUsers,
}: PlayerStatisticsProps) {
  const { theme } = useTelegram();
  const [activeStatsTab, setActiveStatsTab] = useState<
    "total" | "attacks" | "blocks" | "serves"
  >("total");

  // Calculate top players by category
  const calculateTopPlayers = () => {
    if (!scoreData.points || scoreData.points.length === 0) {
      return {
        topAttackers: [],
        topBlockers: [],
        topAceServers: [],
      };
    }

    const points = scoreData.points;
    const playerStats = new Map<
      number,
      { attacks: number; blocks: number; aces: number }
    >();

    // Count points by player and type
    points.forEach((point) => {
      if (point.player_id) {
        const stats = playerStats.get(point.player_id) || {
          attacks: 0,
          blocks: 0,
          aces: 0,
        };

        if (point.type === "attack") stats.attacks++;
        else if (point.type === "block") stats.blocks++;
        else if (point.type === "ace") stats.aces++;

        playerStats.set(point.player_id, stats);
      }
    });

    // Convert to arrays and sort
    const playersArray = Array.from(playerStats.entries()).map(
      ([playerId, stats]) => ({
        playerId,
        ...stats,
      })
    );

    const topAttackers = playersArray
      .filter((p) => p.attacks > 0)
      .sort((a, b) => b.attacks - a.attacks);

    const topBlockers = playersArray
      .filter((p) => p.blocks > 0)
      .sort((a, b) => b.blocks - a.blocks);

    const topAceServers = playersArray
      .filter((p) => p.aces > 0)
      .sort((a, b) => b.aces - a.aces);

    return {
      topAttackers,
      topBlockers,
      topAceServers,
    };
  };

  const topPlayers = calculateTopPlayers();

  // Don't render if no points data
  if (!scoreData.points || scoreData.points.length === 0) {
    return null;
  }

  return (
    <div
      className={`${theme.border} border rounded-lg p-4 mb-6 relative z-10`}
      style={theme.borderStyle}
    >
      <h2
        className={`text-lg font-semibold ${theme.text} mb-4 text-center`}
        style={theme.textStyle}
      >
        📊 Player Statistics
      </h2>

      {/* Tab Navigation */}
      <div
        className="flex flex-wrap justify-center mb-4 border-b"
        style={theme.borderStyle}
      >
        <button
          onClick={() => setActiveStatsTab("total")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeStatsTab === "total"
              ? `${theme.text} border-b-2 border-blue-500`
              : `${theme.secondaryText} hover:${theme.text}`
          }`}
          style={
            activeStatsTab === "total"
              ? theme.textStyle
              : theme.secondaryTextStyle
          }
        >
          📊 Total
        </button>
        <button
          onClick={() => setActiveStatsTab("attacks")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeStatsTab === "attacks"
              ? `${theme.text} border-b-2 border-red-500`
              : `${theme.secondaryText} hover:${theme.text}`
          }`}
          style={
            activeStatsTab === "attacks"
              ? theme.textStyle
              : theme.secondaryTextStyle
          }
        >
          🗡️ Attacks
        </button>
        <button
          onClick={() => setActiveStatsTab("blocks")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeStatsTab === "blocks"
              ? `${theme.text} border-b-2 border-blue-500`
              : `${theme.secondaryText} hover:${theme.text}`
          }`}
          style={
            activeStatsTab === "blocks"
              ? theme.textStyle
              : theme.secondaryTextStyle
          }
        >
          🛡️ Blocks
        </button>
        <button
          onClick={() => setActiveStatsTab("serves")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeStatsTab === "serves"
              ? `${theme.text} border-b-2 border-green-500`
              : `${theme.secondaryText} hover:${theme.text}`
          }`}
          style={
            activeStatsTab === "serves"
              ? theme.textStyle
              : theme.secondaryTextStyle
          }
        >
          🎯 Serves
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-3">
        {activeStatsTab === "total" &&
          (() => {
            // Create a comprehensive list of all players with their stats directly from points data
            const allPlayersStats = new Map<
              number,
              {
                attacks: number;
                blocks: number;
                aces: number;
                errors: number;
                unspecified: number;
                total: number;
              }
            >();

            // Calculate stats for all players from the actual points data
            if (scoreData.points && scoreData.points.length > 0) {
              scoreData.points.forEach((point) => {
                if (point.player_id) {
                  const stats = allPlayersStats.get(point.player_id) || {
                    attacks: 0,
                    blocks: 0,
                    aces: 0,
                    errors: 0,
                    unspecified: 0,
                    total: 0,
                  };

                  // Count points by type
                  if (point.type === "attack") stats.attacks++;
                  else if (point.type === "block") stats.blocks++;
                  else if (point.type === "ace") stats.aces++;
                  else if (point.type === "error") stats.errors++;
                  else if (point.type === "unspecified") stats.unspecified++;

                  stats.total =
                    stats.attacks +
                    stats.blocks +
                    stats.aces +
                    stats.errors +
                    stats.unspecified;
                  allPlayersStats.set(point.player_id, stats);
                }
              });
            }

            // Convert to array and sort by total points
            const sortedPlayers = Array.from(allPlayersStats.entries())
              .map(([playerId, stats]) => ({ playerId, ...stats }))
              .sort((a, b) => b.total - a.total);

            return sortedPlayers.map((player, index) => {
              const userInfo = allUsers.get(player.playerId);
              return (
                <div
                  key={player.playerId}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-sm font-bold ${theme.secondaryText} w-6 text-center`}
                      style={theme.secondaryTextStyle}
                    >
                      #{index + 1}
                    </span>
                    {loadingUsers && !userInfo ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse"></div>
                        <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
                      </div>
                    ) : userInfo ? (
                      <>
                        <div className="w-8 h-8 relative">
                          <Image
                            src={userInfo.photo_url || "/default-avatar.svg"}
                            alt={userInfo.first_name}
                            fill
                            className="rounded-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span
                            className={`text-sm font-medium ${theme.text}`}
                            style={theme.textStyle}
                          >
                            {userInfo.first_name} {userInfo.last_name || ""}
                          </span>
                          {userInfo.username && (
                            <span
                              className={`text-xs ${theme.secondaryText}`}
                              style={theme.secondaryTextStyle}
                            >
                              @{userInfo.username}
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <span
                        className={`text-sm ${theme.secondaryText}`}
                        style={theme.secondaryTextStyle}
                      >
                        Player #{player.playerId}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Attacks */}
                    {player.attacks > 0 && (
                      <div className="flex items-center space-x-1">
                        <Swords size={14} className="text-red-600" />
                        <span
                          className={`text-sm font-semibold ${theme.text} bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded`}
                          style={theme.textStyle}
                        >
                          {player.attacks}
                        </span>
                      </div>
                    )}

                    {/* Blocks */}
                    {player.blocks > 0 && (
                      <div className="flex items-center space-x-1">
                        <Shield size={14} className="text-blue-600" />
                        <span
                          className={`text-sm font-semibold ${theme.text} bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded`}
                          style={theme.textStyle}
                        >
                          {player.blocks}
                        </span>
                      </div>
                    )}

                    {/* Aces */}
                    {player.aces > 0 && (
                      <div className="flex items-center space-x-1">
                        <Crosshair size={14} className="text-green-600" />
                        <span
                          className={`text-sm font-semibold ${theme.text} bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded`}
                          style={theme.textStyle}
                        >
                          {player.aces}
                        </span>
                      </div>
                    )}

                    {/* Errors */}
                    {player.errors > 0 && (
                      <div className="flex items-center space-x-1">
                        <AlertTriangle size={14} className="text-orange-600" />
                        <span
                          className={`text-sm font-semibold ${theme.text} bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded`}
                          style={theme.textStyle}
                        >
                          {player.errors}
                        </span>
                      </div>
                    )}

                    {/* Unspecified */}
                    {player.unspecified > 0 && (
                      <div className="flex items-center space-x-1">
                        <Plus size={14} className="text-gray-600" />
                        <span
                          className={`text-sm font-semibold ${theme.text} bg-gray-100 dark:bg-gray-900/30 px-2 py-1 rounded`}
                          style={theme.textStyle}
                        >
                          {player.unspecified}
                        </span>
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded border"></div>
                      <span
                        className={`text-sm font-bold ${theme.text} bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded`}
                        style={theme.textStyle}
                      >
                        {player.total}
                      </span>
                    </div>
                  </div>
                </div>
              );
            });
          })()}

        {activeStatsTab === "attacks" &&
          topPlayers.topAttackers.map((player, index) => {
            const userInfo = allUsers.get(player.playerId);
            return (
              <div
                key={player.playerId}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`text-sm font-bold ${theme.secondaryText} w-6 text-center`}
                    style={theme.secondaryTextStyle}
                  >
                    #{index + 1}
                  </span>
                  {loadingUsers && !userInfo ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse"></div>
                      <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  ) : userInfo ? (
                    <>
                      <div className="w-8 h-8 relative">
                        <Image
                          src={userInfo.photo_url || "/default-avatar.svg"}
                          alt={userInfo.first_name}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`text-sm font-medium ${theme.text}`}
                          style={theme.textStyle}
                        >
                          {userInfo.first_name} {userInfo.last_name || ""}
                        </span>
                        {userInfo.username && (
                          <span
                            className={`text-xs ${theme.secondaryText}`}
                            style={theme.secondaryTextStyle}
                          >
                            @{userInfo.username}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <span
                      className={`text-sm ${theme.secondaryText}`}
                      style={theme.secondaryTextStyle}
                    >
                      Player #{player.playerId}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <Swords size={14} className="text-red-600" />
                  <span
                    className={`text-sm font-bold ${theme.text} bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded`}
                    style={theme.textStyle}
                  >
                    {player.attacks}
                  </span>
                </div>
              </div>
            );
          })}

        {activeStatsTab === "blocks" &&
          topPlayers.topBlockers.map((player, index) => {
            const userInfo = allUsers.get(player.playerId);
            return (
              <div
                key={player.playerId}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`text-sm font-bold ${theme.secondaryText} w-6 text-center`}
                    style={theme.secondaryTextStyle}
                  >
                    #{index + 1}
                  </span>
                  {loadingUsers && !userInfo ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse"></div>
                      <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  ) : userInfo ? (
                    <>
                      <div className="w-8 h-8 relative">
                        <Image
                          src={userInfo.photo_url || "/default-avatar.svg"}
                          alt={userInfo.first_name}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`text-sm font-medium ${theme.text}`}
                          style={theme.textStyle}
                        >
                          {userInfo.first_name} {userInfo.last_name || ""}
                        </span>
                        {userInfo.username && (
                          <span
                            className={`text-xs ${theme.secondaryText}`}
                            style={theme.secondaryTextStyle}
                          >
                            @{userInfo.username}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <span
                      className={`text-sm ${theme.secondaryText}`}
                      style={theme.secondaryTextStyle}
                    >
                      Player #{player.playerId}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <Shield size={14} className="text-blue-600" />
                  <span
                    className={`text-sm font-bold ${theme.text} bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded`}
                    style={theme.textStyle}
                  >
                    {player.blocks}
                  </span>
                </div>
              </div>
            );
          })}

        {activeStatsTab === "serves" &&
          topPlayers.topAceServers.map((player, index) => {
            const userInfo = allUsers.get(player.playerId);
            return (
              <div
                key={player.playerId}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`text-sm font-bold ${theme.secondaryText} w-6 text-center`}
                    style={theme.secondaryTextStyle}
                  >
                    #{index + 1}
                  </span>
                  {loadingUsers && !userInfo ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse"></div>
                      <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  ) : userInfo ? (
                    <>
                      <div className="w-8 h-8 relative">
                        <Image
                          src={userInfo.photo_url || "/default-avatar.svg"}
                          alt={userInfo.first_name}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`text-sm font-medium ${theme.text}`}
                          style={theme.textStyle}
                        >
                          {userInfo.first_name} {userInfo.last_name || ""}
                        </span>
                        {userInfo.username && (
                          <span
                            className={`text-xs ${theme.secondaryText}`}
                            style={theme.secondaryTextStyle}
                          >
                            @{userInfo.username}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <span
                      className={`text-sm ${theme.secondaryText}`}
                      style={theme.secondaryTextStyle}
                    >
                      Player #{player.playerId}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <Crosshair size={14} className="text-green-600" />
                  <span
                    className={`text-sm font-bold ${theme.text} bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded`}
                    style={theme.textStyle}
                  >
                    {player.aces}
                  </span>
                </div>
              </div>
            );
          })}
      </div>

      {/* Legend for Total tab */}
      {activeStatsTab === "total" && (
        <div className="mt-4 pt-3 border-t" style={theme.borderStyle}>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            <div className="flex items-center space-x-1">
              <Swords size={12} className="text-red-600" />
              <span
                className={theme.secondaryText}
                style={theme.secondaryTextStyle}
              >
                Attacks
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Shield size={12} className="text-blue-600" />
              <span
                className={theme.secondaryText}
                style={theme.secondaryTextStyle}
              >
                Blocks
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Crosshair size={12} className="text-green-600" />
              <span
                className={theme.secondaryText}
                style={theme.secondaryTextStyle}
              >
                Aces
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <AlertTriangle size={12} className="text-orange-600" />
              <span
                className={theme.secondaryText}
                style={theme.secondaryTextStyle}
              >
                Errors
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Plus size={12} className="text-gray-600" />
              <span
                className={theme.secondaryText}
                style={theme.secondaryTextStyle}
              >
                Other
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded border"></div>
              <span
                className={theme.secondaryText}
                style={theme.secondaryTextStyle}
              >
                Total
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
