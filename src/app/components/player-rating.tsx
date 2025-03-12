"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/app/utils/supabase/client";
import { useTelegram } from "../context/telegram-context";

// Type for a player's rating info returned by the stored procedure
export type PlayerRating = {
  id: number;
  first_name: string;
  last_name: string | null;
  username: string | null;
  photo_url: string | null; // Optional: you can include this in your stored procedure or join with users
  rating: number;
};

export default function RatingTable() {
  const [ratings, setRatings] = useState<PlayerRating[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTelegram();
  
  // Create Supabase client instance
  const supabase = useRef(createClient());

  // Fetch ratings from Supabase by calling the stored procedure
  useEffect(() => {
    if (!supabase) {
      return
    }
    fetchRatings();
    const interval = setInterval(fetchRatings, 30000);
    return () => clearInterval(interval);
  }, [supabase]);

  async function fetchRatings() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.current.rpc("calculate_player_ratings");
    if (error) {
      console.error("Error fetching ratings:", error);
      setError(error.message);
    } else {
      setRatings(data as PlayerRating[]);
    }
    setLoading(false);
  }

  // Common container for both states to avoid layout shifts
  const containerClasses = `w-full max-w-md mx-auto ${theme.cardBg} rounded-lg shadow-sm overflow-hidden`;

  if (error) {
    return (
      <p 
        className={`text-center text-base ${theme.text} p-4 ${containerClasses}`}
        style={{...theme.textStyle, ...theme.cardBgStyle}}
      >
        Error: {error}
      </p>
    );
  }

  return (
    <div 
      className={containerClasses}
      style={theme.cardBgStyle}
    >
      <h2 
        className={`text-xl font-bold p-4 ${theme.headerBg} ${theme.text} text-center border-b ${theme.border}`}
        style={{...theme.headerBgStyle, ...theme.textStyle, borderColor: theme.borderStyle.borderColor}}
      >
        Player Ratings
      </h2>
      
      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-full table-auto">
          <thead>
            <tr 
              className={`${theme.tableHeaderBg} text-sm`}
              style={theme.tableHeaderBgStyle}
            >
              <th 
                className={`py-2 px-2 sm:px-3 text-left font-medium ${theme.tableHeaderText}`}
                style={theme.tableHeaderTextStyle}
              >
                Rank
              </th>
              <th 
                className={`py-2 px-2 sm:px-3 text-left font-medium ${theme.tableHeaderText}`}
                style={theme.tableHeaderTextStyle}
              >
                Avatar
              </th>
              <th 
                className={`py-2 px-2 sm:px-3 text-left font-medium ${theme.tableHeaderText}`}
                style={theme.tableHeaderTextStyle}
              >
                Name
              </th>
              <th 
                className={`py-2 px-2 sm:px-3 text-left font-medium ${theme.tableHeaderText} hidden sm:table-cell`}
                style={theme.tableHeaderTextStyle}
              >
                Username
              </th>
              <th 
                className={`py-2 px-2 sm:px-3 text-right font-medium ${theme.tableHeaderText}`}
                style={theme.tableHeaderTextStyle}
              >
                Rating
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Table row skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <tr 
                  key={`skeleton-${index}`} 
                  className={`border-t ${theme.tableBorder} animate-pulse`}
                  style={theme.tableBorderStyle}
                >
                  <td className={`py-3 px-2 sm:px-3 text-sm`}>
                    <div className="h-4 w-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  </td>
                  <td className="py-3 px-2 sm:px-3">
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                  </td>
                  <td className={`py-3 px-2 sm:px-3 text-sm`}>
                    <div className="h-4 w-16 sm:w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  </td>
                  <td className={`py-3 px-2 sm:px-3 text-xs hidden sm:table-cell`}>
                    <div className="h-3 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  </td>
                  <td className={`py-3 px-2 sm:px-3 text-right`}>
                    <div className="h-4 w-8 bg-gray-300 dark:bg-gray-700 rounded ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : (
              ratings.map((player, index) => (
                <tr 
                  key={player.id} 
                  className={`border-t ${theme.tableBorder} ${theme.tableRowHover} ${player.username ? 'cursor-pointer': undefined}`} 
                  style={theme.tableBorderStyle}
                  onClick={player.username ? () => window.open('https://t.me/' + player.username, '_blank'): undefined}
                >
                  <td 
                    className={`py-3 px-2 sm:px-3 text-sm ${theme.text}`}
                    style={theme.textStyle}
                  >
                    {index + 1}
                  </td>
                  <td className="py-3 px-2 sm:px-3">
                    <div className="w-8 h-8 relative">
                      <Image
                        src={player.photo_url || "/default-avatar.svg"}
                        alt={player.first_name}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                  </td>
                  <td 
                    className={`py-3 px-2 sm:px-3 text-sm ${theme.text}`}
                    style={theme.textStyle}
                  >
                    {player.first_name} {player.last_name || ""}
                  </td>
                  <td 
                    className={`py-3 px-2 sm:px-3 text-xs ${theme.secondaryText} hidden sm:table-cell`}
                    style={theme.secondaryTextStyle}
                  >
                    {player.username ? "@" + player.username : "No username"}
                  </td>
                  <td 
                    className={`py-3 px-2 sm:px-3 text-right font-medium ${theme.text}`}
                    style={theme.textStyle}
                  >
                    {player.rating.toFixed(0)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}