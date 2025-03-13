import { createClient } from '@/app/utils/supabase/client';

export const supabase = createClient();

export type User = {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  admin: boolean;
};

export type DB_RandomVotePair = {
  player_a_id: number;
  player_a_first_name: string;
  player_a_last_name: string | null;
  player_a_photo_url: string | null;
  player_a_username: string | null;
  player_b_id: number;
  player_b_first_name: string;
  player_b_last_name: string | null;
  player_b_photo_url: string | null;
  player_b_username: string | null;
};

export type VotePair = {
  playerA: User;
  playerB: User;
};

export type Game = {
  id: string,
  team_a: string[],
  team_b: string[],
  team_a_score: number,
  team_b_score: number,
  state: GameState,
  creator: number,
  finisher: number
}

export enum GameState {
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED'
}

export async function getRandomVotePair(voterId: number): Promise<VotePair[]> {
  const { data, error } = await supabase
    .rpc("get_random_vote_pair", { voter_id_param: voterId });

  if (error) {
    console.error("Error fetching vote pair:", error);
    throw error;
  }

  return data?.map((pair: DB_RandomVotePair) => ({
    playerA: {
      id: pair.player_a_id,
      firstName: pair.player_a_first_name,
      lastName: pair.player_a_last_name,
      photoUrl: pair.player_a_photo_url,
      username: pair.player_a_username,
    },
    playerB: {
      id: pair.player_b_id,
      firstName: pair.player_b_first_name,
      lastName: pair.player_b_last_name,
      photoUrl: pair.player_b_photo_url,
      username: pair.player_b_username,
    }
  })) ?? [];
}

export async function submitVote(voterId: number, playerA: number, playerB: number, winnerId: number | null) {
  const { error } = await supabase.from("votes").insert([{ voter_id: voterId, player_a: playerA, player_b: playerB, winner_id: winnerId }]);

  if (error) {
    console.error("Error submitting vote:", error);
    return false;
  }

  return true;
}

export async function upsertUser(id: number, first_name: string, last_name: string | undefined, username: string | undefined, photo_url: string | undefined) {
  const { error } = await supabase
    .from('users')
    .upsert([{ id, first_name, last_name, username, photo_url }], { onConflict: 'id' });

  if (error) {
    console.error('Error updating user in Supabase:', error);
  }
}

export async function isAdmin(id: number) {
  const result = await supabase.from('users').select('admin').eq('id', id).limit(1)

  if (result.error) {
    console.error('Error selecting admin status', result.error);
    throw result.error;
  }
  if (result.data.length != 1) {
    console.error('Error selecting admin status, user not found', result.error);
    throw new Error('User not found')
  }
  return result.data[0].admin
}

export async function getActiveGame(): Promise<Game | null> {
  const result = await supabase.from('games').select().eq('state', 'ACTIVE').limit(1)

  if (result.error) {
    console.error('Error getting active game', result.error);
    throw result.error;
  }

  return result.data.length == 0
    ? null
    : result.data[0] as Game
}

export async function createActiveGame(game: Game) {
  const result = await supabase.from('games').insert([game])

  if (result.error) {
    console.error('Error creating active game', result.error);
    throw result.error;
  }

}