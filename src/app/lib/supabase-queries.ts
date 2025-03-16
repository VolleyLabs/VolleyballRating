import { createClient } from '@/app/utils/supabase/client';
import { lazyAsyncSupplier } from '../utils/suppliers';

export const supabase = createClient();

export type User = {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  admin: boolean;
};
export type UserDbType = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
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
  CANCELLED = 'CANCELLED',
}

export type CreateVoting = {
  game_time: Date,
  state: VotingState,
  poll_id: string,
  game_schedule_id: string,
  chat_id: string
}

export type Voting = {
  id: string,
  game_time: Date,
  state: VotingState,
  game_schedule_id: string,
  poll_id: string,
  chat_id: string
}

export type VotingPlayer = {
  id: string,
  voting_id: string,
  player_id: number
}

export type CreateVotingPlayer = {
  voting_id: string,
  player_id: number
}

export type GameLocation = {
  id: string,
  name: string,
  address: string,
}

export type GameSchedule = {
  id: string,
  day_of_week: DayOfWeek,
  time: string,
  duration_minutes: number,
  location: string,
  voting_in_advance_days: number,
  voting_time: string,
  players_count: number,
  state: GameScheduleState
}

export enum GameScheduleState {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export enum VotingState {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export const dayOfWeekToNumber = (d: DayOfWeek) => {
  switch (d) {
    case DayOfWeek.SUNDAY: return 0;
    case DayOfWeek.MONDAY: return 1;
    case DayOfWeek.TUESDAY: return 2;
    case DayOfWeek.WEDNESDAY: return 3;
    case DayOfWeek.THURSDAY: return 4;
    case DayOfWeek.FRIDAY: return 5;
    case DayOfWeek.SATURDAY: return 6;
  }
}

export const stripSeconds = (votingTime: string) => {
  return votingTime.substring(0, 5)
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

export async function createVoting(voting: CreateVoting) {
  const result = await supabase.from('votings').insert([voting])

  if (result.error) {
    console.error('Error creating active game', result.error);
    throw result.error;
  }
}

export async function getActiveVotings() {
  const result = await supabase.from('votings').select().eq('state', 'ACTIVE')
  return (result.data as Voting[]).map(v => ({...v, game_time: new Date(v.game_time)}))
}

export const getActiveGameSchedules = lazyAsyncSupplier(async () => {
  const result = await supabase.from('game_schedules').select().eq('state', 'ACTIVE')
  return result.data as GameSchedule[]
})

export const getGameSchedule = lazyAsyncSupplier(async (schedule_id: string) => {
  const result = await supabase.from('game_schedules').select().eq('id', schedule_id)
  return result.data![0] as GameSchedule
})

export const getGameLocations = lazyAsyncSupplier(async () => {
  const result = await supabase.from('game_locations').select()
  return result.data as GameLocation[]
})

export const getVotingByPollId = async (pollId: string) => {
  const result = await supabase.from('votings').select().eq('poll_id', pollId)
  const voting = (result.data![0] as Voting)
  return {
    ...voting,
    game_time: new Date(voting.game_time),
  };
}

export const getVotingPlayers = async (votingId: string) => {
  const result = await supabase.from('voting_players').select().eq('voting_id', votingId).order('created_at')
  return result.data! as VotingPlayer[] || [] as VotingPlayer[]
}

export const addVotingPlayer = async (votingPlayer: CreateVotingPlayer) => {
  await supabase.from('voting_players')
    .insert([votingPlayer])
}

export const deleteVotingPlayer = async (votingPlayer: VotingPlayer) => {
  await supabase.from('voting_players')
    .delete()
    .eq('id', votingPlayer.id)
}

export const getUsersByIds = async (userIds: number[]) => {
  const response = await supabase.from('users').select().in('id', userIds)
  return response.data! as UserDbType[]
}

export const getUser = async (userId: number) => {
  const response = await supabase.from('users').select().eq('id', userId)
  return response.data![0] as UserDbType
}

export const closeVoting = async (voting: Voting) => {
  await supabase.from('votings').update({'state': 'CLOSED'}).eq('id', voting.id)
}