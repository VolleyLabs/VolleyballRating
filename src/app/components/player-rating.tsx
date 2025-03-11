"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/app/utils/supabase/client";

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px] w-full">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-base text-red-600 p-4">Error: {error}</p>;
  }

  return (
    <div className="w-full max-w-md mx-auto mt-8 bg-white rounded-lg shadow-sm overflow-hidden">
      <h2 className="text-xl font-bold p-4 bg-gray-100 text-center border-b">
        Player Ratings
      </h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-sm">
              <th className="py-2 px-3 text-left font-medium text-gray-600">Rank</th>
              <th className="py-2 px-3 text-left font-medium text-gray-600">Avatar</th>
              <th className="py-2 px-3 text-left font-medium text-gray-600">Name</th>
              <th className="py-2 px-3 text-left font-medium text-gray-600">Username</th>
              <th className="py-2 px-3 text-right font-medium text-gray-600">Rating</th>
            </tr>
          </thead>
          <tbody>
            {ratings.map((player, index) => (
              <tr key={player.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-3 text-sm">{index + 1}</td>
                <td className="py-3 px-3">
                  <div className="w-8 h-8 relative">
                    <Image
                      src={player.photo_url || "/default-avatar.svg"}
                      alt={player.first_name}
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                </td>
                <td className="py-3 px-3 text-sm">
                  {player.first_name} {player.last_name || ""}
                </td>
                <td className="py-3 px-3 text-xs text-gray-500">
                  {player.username ? "@" + player.username : "No username"}
                </td>
                <td className="py-3 px-3 text-right font-medium">{player.rating.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}