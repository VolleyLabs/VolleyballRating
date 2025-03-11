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
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-lg text-red-600">Error: {error}</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">Player Ratings</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 border-b text-left">Rank</th>
              <th className="py-3 px-4 border-b text-left">Avatar</th>
              <th className="py-3 px-4 border-b text-left">Name</th>
              <th className="py-3 px-4 border-b text-left">Username</th>
              <th className="py-3 px-4 border-b text-right">Rating</th>
            </tr>
          </thead>
          <tbody>
            {ratings.map((player, index) => (
              <tr key={player.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 border-b">{index + 1}</td>
                <td className="py-3 px-4 border-b">
                  <div className="w-10 h-10 relative">
                    <Image
                      src={player.photo_url || "/default-avatar.svg"}
                      alt={player.first_name}
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                </td>
                <td className="py-3 px-4 border-b">
                  {player.first_name} {player.last_name || ""}
                </td>
                <td className="py-3 px-4 border-b">
                  {player.username ? "@" + player.username : "No username"}
                </td>
                <td className="py-3 px-4 border-b text-right">{player.rating.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}