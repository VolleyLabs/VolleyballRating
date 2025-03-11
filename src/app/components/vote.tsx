"use client";

import { useCallback, useEffect, useState } from "react";
import { getRandomVotePair, submitVote, VotePair, User } from "@/app/lib/supabaseQueries";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { PostgrestError } from "@supabase/supabase-js";

export default function Vote({ voterId }: { voterId: number }) {
  const [pairs, setPairs] = useState<VotePair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  const loadNewPairs = useCallback(async function loadNewPairs() {
    try {
      setError(null);
      setIsLoading(true);
      const data = await getRandomVotePair(voterId);
      setPairs(data);
    } catch (error) {
      console.error("Error prefetching next pair:", error);
      setError(error as PostgrestError);
    } finally {
      setIsLoading(false);
    }
  }, [voterId]);

  // Initial fetch
  useEffect(() => {
    loadNewPairs();
  }, [loadNewPairs]);

  async function handleVote(winnerId: number | null) {
    if (!pairs[0] || isVoting) return;

    setIsVoting(true);
    setSelectedPlayer(winnerId);

    // Optimistically update UI
    const currentPair = pairs[0];
    
    // Use the prefetched pair immediately
    setPairs(pairs.slice(1));
    setSelectedPlayer(null);

    // Submit vote in background
    try {
      const success = await submitVote(voterId, currentPair.playerA.id, currentPair.playerB.id, winnerId);
      if (!success) {
        console.error("Failed to submit vote");
      }
      
      if (pairs.length == 0) {
        loadNewPairs();
      }
    } catch (error) {
      console.error("Error submitting vote:", error);
    } finally {
      setIsVoting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px] w-full">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) return <p className="text-center text-base p-4">Error loading pairs: {error.message}</p>;
  if (pairs.length == 0) return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-sm text-center">
      <p className="text-lg mb-2">You already voted for all players</p>
      <p className="text-sm text-gray-500">Thank you for participating!</p>
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={`${pairs[0].playerA.id}-${pairs[0].playerB.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md mx-auto p-4 bg-white rounded-lg shadow-sm"
      >
        <motion.h2 
          className="text-lg font-medium text-center mb-4"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          Who plays better?
        </motion.h2>

        <div className="grid grid-cols-2 gap-3 w-full">
          <PlayerCard 
            player={pairs[0].playerA} 
            onVote={() => handleVote(pairs[0].playerA.id)} 
            isSelected={selectedPlayer === pairs[0].playerA.id}
            isDisabled={isVoting}
          />
          <PlayerCard 
            player={pairs[0].playerB} 
            onVote={() => handleVote(pairs[0].playerB.id)} 
            isSelected={selectedPlayer === pairs[0].playerB.id}
            isDisabled={isVoting}
          />
        </div>

        <motion.button 
          onClick={() => handleVote(null)} 
          className="w-full mt-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-md shadow-sm transition-all duration-200 ease-in-out text-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isVoting}
        >
          ❓ Don&apos;t know
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}

function PlayerCard({ 
  player, 
  onVote, 
  isSelected = false,
  isDisabled = false
}: { 
  player: User | null; 
  onVote: () => void; 
  isSelected?: boolean;
  isDisabled?: boolean;
}) {
  return (
    <motion.div 
      className={`flex flex-col items-center p-3 border rounded-lg shadow-sm transition-all duration-300 ${
        isSelected ? "border-blue-500 bg-blue-50" : "hover:shadow-md"
      }`}
      whileHover={{ y: -2 }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative mb-2 overflow-hidden rounded-full">
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        >
          <Image 
            src={player?.photoUrl ?? "/default-avatar.svg"} 
            alt={player?.firstName ?? "Player"} 
            width={80} 
            height={80}
            priority
            className="rounded-full object-cover border-2 border-white shadow-sm" 
          />
        </motion.div>
      </div>
      <h3 className="mt-1 text-sm font-medium text-center">{player?.firstName} {player?.lastName}</h3>
      <p className="text-xs text-gray-500 mb-2 text-center">@{player?.username ?? "No username"}</p>
      <motion.button 
        onClick={onVote} 
        className={`w-full py-2 bg-blue-500 text-white rounded-md shadow-sm transition-all duration-200 text-xs ${
          isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
        }`}
        whileHover={!isDisabled ? { scale: 1.05 } : {}}
        whileTap={!isDisabled ? { scale: 0.95 } : {}}
        disabled={isDisabled}
      >
        {isSelected ? "✓ Selected" : "👍 Vote"}
      </motion.button>
    </motion.div>
  );
}