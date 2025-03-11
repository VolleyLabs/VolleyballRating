"use client";

import { useEffect, useState } from "react";
import { getRandomVotePair, submitVote, VotePair, User } from "@/app/lib/supabaseQueries";
import Image from "next/image";

export default function Vote({ voterId }: { voterId: number }) {
  const [pair, setPair] = useState<VotePair | null>(null);

  useEffect(() => {
    async function fetchPair() {
      const data = await getRandomVotePair(voterId);
      console.log(data);
      setPair(data);
    }
    fetchPair();
  }, [voterId]);

  async function handleVote(winnerId: number | null) {
    if (!pair) return;

    const success = await submitVote(voterId, pair.playerA.id, pair.playerB.id, winnerId);
    if (success) setPair(await getRandomVotePair(voterId));
  }

  if (!pair) return <p>Loading vote pair...</p>;

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-xl font-bold">Who plays better?</h1>

      <div className="flex gap-8">
        <PlayerCard player={pair.playerA} onVote={() => handleVote(pair.playerA.id)} />
        <PlayerCard player={pair.playerB} onVote={() => handleVote(pair.playerB.id)} />
      </div>

      <button onClick={() => handleVote(null)} className="mt-4 px-4 py-2 bg-gray-500 text-white rounded">
        ❓ I don&apos;t know
      </button>
    </div>
  );
}

function PlayerCard({ player, onVote }: { player: User | null; onVote: () => void }) {
  return (
    <div className="flex flex-col items-center p-4 border rounded shadow-lg">
      <Image src={player?.photoUrl ?? "/default-avatar.svg"} alt={player?.firstName ?? "Player"} width={96} height={96} className="rounded-full" />
      <h2 className="mt-2 font-bold">{player?.firstName} {player?.lastName}</h2>
      <p className="text-sm text-gray-500">@{player?.username ?? "No username"}</p>
      <button onClick={onVote} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
        👍 Vote
      </button>
    </div>
  );
}