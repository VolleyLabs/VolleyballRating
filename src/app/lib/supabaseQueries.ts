import { createClient } from '@/app/utils/supabase/client';

const supabase = createClient();

export type User = {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
};

export type VotePair = {
  playerA: User;
  playerB: User;
};

export async function getRandomVotePair(voterId: number): Promise<VotePair | null> {
  const { data, error } = await supabase
    .rpc("get_random_vote_pair", { voter_id_param: voterId });

  if (error) {
    console.error("Error fetching vote pair:", error);
    return null;
  }

  return data ? {
    playerA: {
      id: data[0].player_a_id,
      firstName: data[0].player_a_first_name,
      lastName: data[0].player_a_last_name,
      photoUrl: data[0].player_a_photo_url,
      username: data[0].player_a_username,
    },
    playerB: {
      id: data[0].player_b_id,
      firstName: data[0].player_b_first_name,
      lastName: data[0].player_b_last_name,
      photoUrl: data[0].player_b_photo_url,
      username: data[0].player_b_username,
    }
  } : null;
}

export async function submitVote(voterId: number, playerA: number, playerB: number, winnerId: number | null) {
  const { error } = await supabase.from("votes").insert([{ voter_id: voterId, player_a: playerA, player_b: playerB, winner_id: winnerId }]);

  if (error) {
    console.error("Error submitting vote:", error);
    return false;
  }

  return true;
}