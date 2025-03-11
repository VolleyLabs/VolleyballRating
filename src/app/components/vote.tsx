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
      <div className="flex justify-center items-center min-h-[300px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) return <p className="text-center text-lg">Error loading pairs: {error.message}</p>;
  if (pairs.length == 0) return <p className="text-center text-lg">You already voted for all players</p>;

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={`${pairs[0].playerA.id}-${pairs[0].playerB.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-4 p-4"
      >
        <motion.h1 
          className="text-2xl font-bold text-center mb-6"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          Who plays better?
        </motion.h1>

        <div className="flex flex-col md:flex-row gap-8 w-full justify-center">
          <PlayerCard 
            player={pairs[0].playerA} 
            onVote={() => handleVote(pairs[0].playerA.id)} 
            isSelected={selectedPlayer === pairs[0].playerA.id}
            isDisabled={isVoting}
          />
          <div className="flex items-center justify-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                repeat: Infinity, 
                repeatType: "reverse", 
                duration: 1.5 
              }}
              className="text-2xl hidden md:block"
            >
              VS
            </motion.div>
          </div>
          <PlayerCard 
            player={pairs[0].playerB} 
            onVote={() => handleVote(pairs[0].playerB.id)} 
            isSelected={selectedPlayer === pairs[0].playerB.id}
            isDisabled={isVoting}
          />
        </div>

        <motion.button 
          onClick={() => handleVote(null)} 
          className="mt-6 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg shadow-md transition-all duration-200 ease-in-out"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
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
      className={`flex flex-col items-center p-6 border rounded-xl shadow-lg transition-all duration-300 ${
        isSelected ? "border-blue-500 bg-blue-50" : "hover:shadow-xl"
      }`}
      whileHover={{ y: -5 }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative mb-4 overflow-hidden rounded-full">
        <motion.div
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.3 }}
        >
          <Image 
            src={player?.photoUrl ?? "/default-avatar.svg"} 
            alt={player?.firstName ?? "Player"} 
            width={120} 
            height={120}  priority
            className="rounded-full object-cover border-4 border-white shadow-md" 
          />
        </motion.div>
      </div>
      <h2 className="mt-2 text-xl font-bold">{player?.firstName} {player?.lastName}</h2>
      <p className="text-sm text-gray-500 mb-4">@{player?.username ?? "No username"}</p>
      <motion.button 
        onClick={onVote} 
        className={`mt-2 px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md transition-all duration-200 ${
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