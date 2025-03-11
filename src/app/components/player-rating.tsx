"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/app/utils/supabase/client";
import { useTheme } from "../context/theme-context";
import { tv, commonVariants } from "../utils/theme-variants";

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
  const { colorScheme } = useTheme();
  
  // Get styles based on current theme
  const styles = tv(commonVariants, colorScheme);

  // Create Supabase client instance
  const supabase = createClient();

  // Fetch ratings from Supabase by calling the stored procedure
  useEffect(() => {
    async function fetchRatings() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.rpc("calculate_player_ratings");
      if (error) {
        console.error("Error fetching ratings:", error);
        setError(error.message);
      } else {
        setRatings(data as PlayerRating[]);
      }
      setLoading(false);
    }
    fetchRatings();
  }, [supabase]);

  // Common container for both states to avoid layout shifts
  const containerClasses = `w-full max-w-md mx-auto ${styles.cardBg} rounded-lg shadow-sm overflow-hidden`;

  if (error) {
    return <p className={`text-center text-base ${styles.text} p-4 ${containerClasses}`}>Error: {error}</p>;
  }

  return (
    <div className={containerClasses}>
      <h2 className={`text-xl font-bold p-4 ${styles.headerBg} ${styles.text} text-center border-b ${styles.border}`}>
        Player Ratings
      </h2>
      
      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-full table-auto">
          <thead>
            <tr className={`${styles.tableHeaderBg} text-sm`}>
              <th className={`py-2 px-2 sm:px-3 text-left font-medium ${styles.tableHeaderText}`}>Rank</th>
              <th className={`py-2 px-2 sm:px-3 text-left font-medium ${styles.tableHeaderText}`}>Avatar</th>
              <th className={`py-2 px-2 sm:px-3 text-left font-medium ${styles.tableHeaderText}`}>Name</th>
              <th className={`py-2 px-2 sm:px-3 text-left font-medium ${styles.tableHeaderText} hidden sm:table-cell`}>Username</th>
              <th className={`py-2 px-2 sm:px-3 text-right font-medium ${styles.tableHeaderText}`}>Rating</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Table row skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`skeleton-${index}`} className={`border-t ${styles.tableBorder} animate-pulse`}>
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
                <tr key={player.id} className={`border-t ${styles.tableBorder} ${styles.tableRowHover}`}>
                  <td className={`py-3 px-2 sm:px-3 text-sm ${styles.text}`}>{index + 1}</td>
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
                  <td className={`py-3 px-2 sm:px-3 text-sm ${styles.text}`}>
                    {player.first_name} {player.last_name || ""}
                  </td>
                  <td className={`py-3 px-2 sm:px-3 text-xs ${styles.secondaryText} hidden sm:table-cell`}>
                    {player.username ? "@" + player.username : "No username"}
                  </td>
                  <td className={`py-3 px-2 sm:px-3 text-right font-medium ${styles.text}`}>{player.rating.toFixed(0)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}