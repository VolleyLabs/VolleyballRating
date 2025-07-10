"use client";

import { useState } from "react";
import Image from "next/image";
import { useTelegram } from "@context/telegram-context";
import { DailyScoreData } from "@lib/supabase-queries";
import { User } from "../../../../database.types";
import { Crosshair, Swords, Shield, Trophy } from "lucide-react";

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
  const { theme, userId } = useTelegram();
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

  // Utility: global rank in a sorted array
  const getRank = (playerId: number, list: { playerId: number }[]): number =>
    list.findIndex((p) => p.playerId === playerId) + 1;

  // Component to show rank badge conditionally
  const RankBadge = ({ rank }: { rank: number; playerId: number }) => {
    if (rank <= 3) {
      return (
        <span
          className={`text-sm font-bold ${theme.secondaryText} w-6 text-center`}
          style={theme.secondaryTextStyle}
        >
          #{rank}
        </span>
      );
    }
    return null;
  };

  // Prepare list: always show top 3 players plus the current user (if not already included)
  const prepareDisplayList = (
    arr: { playerId: number; [key: string]: number }[]
  ) => {
    const topThree = arr.slice(0, 3);
    const current = userId ? arr.find((p) => p.playerId === userId) : undefined;
    if (current && !topThree.some((p) => p.playerId === current.playerId)) {
      return [...topThree, current];
    }
    return topThree;
  };

  const topAttackersDisplay = prepareDisplayList(topPlayers.topAttackers);
  const topBlockersDisplay = prepareDisplayList(topPlayers.topBlockers);
  const topAceServersDisplay = prepareDisplayList(topPlayers.topAceServers);

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
        className={`text-lg font-semibold ${theme.text} mb-4 text-center flex items-center justify-center gap-2`}
        style={theme.textStyle}
      >
        <Trophy size={20} className="text-yellow-500" />
        Player Statistics
      </h2>

      {/* Tab Navigation */}
      <div
        className="flex flex-wrap justify-center mb-4 border-b"
        style={theme.borderStyle}
      >
        <button
          onClick={() => setActiveStatsTab("total")}
          className={`px-4 py-2 text-sm font-medium transition-colors flex items-center space-x-2 ${
            activeStatsTab === "total"
              ? `${theme.text} border-b-2 border-gray-500`
              : `${theme.secondaryText} hover:${theme.text}`
          }`}
          style={
            activeStatsTab === "total"
              ? theme.textStyle
              : theme.secondaryTextStyle
          }
        >
          <div className="w-3 h-3 bg-gray-400 rounded border"></div>
          <span>Total</span>
        </button>
        <button
          onClick={() => setActiveStatsTab("attacks")}
          className={`px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center ${
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
          <Swords size={16} className="text-red-600" />
        </button>
        <button
          onClick={() => setActiveStatsTab("blocks")}
          className={`px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center ${
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
          <Shield size={16} className="text-blue-600" />
        </button>
        <button
          onClick={() => setActiveStatsTab("serves")}
          className={`px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center ${
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
          <Crosshair size={16} className="text-green-600" />
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-3">
        {activeStatsTab === "total" &&
          (() => {
            // Compile stats for all players from points data
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

            const sortedPlayers = Array.from(allPlayersStats.entries())
              .map(([playerId, stats]) => ({ playerId, ...stats }))
              .sort((a, b) => {
                if (b.total !== a.total) {
                  return b.total - a.total;
                }
                return b.attacks - a.attacks;
              });

            const topThree = sortedPlayers.slice(0, 3);
            const current = userId
              ? sortedPlayers.find((p) => p.playerId === userId)
              : undefined;
            const displayPlayers =
              current && !topThree.some((p) => p.playerId === current.playerId)
                ? [...topThree, current]
                : topThree;

            return displayPlayers.map((player) => {
              const userInfo = allUsers.get(player.playerId);
              return (
                <div
                  key={player.playerId}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <RankBadge
                      rank={getRank(player.playerId, sortedPlayers)}
                      playerId={player.playerId}
                    />
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
          topAttackersDisplay.map((player) => {
            const userInfo = allUsers.get(player.playerId);
            return (
              <div
                key={player.playerId}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <RankBadge
                    rank={getRank(player.playerId, topPlayers.topAttackers)}
                    playerId={player.playerId}
                  />
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
          topBlockersDisplay.map((player) => {
            const userInfo = allUsers.get(player.playerId);
            return (
              <div
                key={player.playerId}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <RankBadge
                    rank={getRank(player.playerId, topPlayers.topBlockers)}
                    playerId={player.playerId}
                  />
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
          topAceServersDisplay.map((player) => {
            const userInfo = allUsers.get(player.playerId);
            return (
              <div
                key={player.playerId}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <RankBadge
                    rank={getRank(player.playerId, topPlayers.topAceServers)}
                    playerId={player.playerId}
                  />
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
    </div>
  );
}
