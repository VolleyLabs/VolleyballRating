import { createClient } from "@/app/utils/supabase/client";
import { User } from "../../../database.types";
import { lazyAsyncSupplier } from "../utils/suppliers";

export const supabase = createClient();

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
  id: string;
  team_a: string[];
  team_b: string[];
  team_a_score: number;
  team_b_score: number;
  state: GameState;
  creator: number;
  finisher: number;
};

export enum GameState {
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
  CANCELLED = "CANCELLED",
}

export type CreateVoting = {
  game_time: Date;
  state: VotingState;
  poll_id: string;
  game_schedule_id: string;
  chat_id: string;
};

export type Voting = {
  id: string;
  game_time: Date;
  state: VotingState;
  game_schedule_id: string;
  poll_id: string;
  chat_id: string;
};

export type VotingPlayer = {
  id: string;
  voting_id: string;
  player_id: number;
};

export type CreateVotingPlayer = {
  voting_id: string;
  player_id: number;
};

export type GameLocation = {
  id: string;
  name: string;
  address: string;
  google_link: string;
};

export type GameSchedule = {
  id: string;
  day_of_week: DayOfWeek;
  time: string;
  duration_minutes: number;
  location: string;
  voting_in_advance_days: number;
  voting_time: string;
  players_count: number;
  state: GameScheduleState;
};

export enum GameScheduleState {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum VotingState {
  ACTIVE = "ACTIVE",
  CLOSED = "CLOSED",
}

export enum DayOfWeek {
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
  SUNDAY = "SUNDAY",
}

export const dayOfWeekToNumber = (d: DayOfWeek) => {
  switch (d) {
    case DayOfWeek.SUNDAY:
      return 0;
    case DayOfWeek.MONDAY:
      return 1;
    case DayOfWeek.TUESDAY:
      return 2;
    case DayOfWeek.WEDNESDAY:
      return 3;
    case DayOfWeek.THURSDAY:
      return 4;
    case DayOfWeek.FRIDAY:
      return 5;
    case DayOfWeek.SATURDAY:
      return 6;
  }
};

export const stripSeconds = (votingTime: string) => {
  return votingTime.substring(0, 5);
};

export async function getRandomVotePair(voterId: number): Promise<VotePair[]> {
  const { data, error } = await supabase.rpc("get_random_vote_pair", {
    voter_id_param: voterId,
  });

  if (error) {
    console.error("Error fetching vote pair:", error);
    throw error;
  }

  return (
    data?.map((pair: DB_RandomVotePair) => ({
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
      },
    })) ?? []
  );
}

export async function submitVote(
  voterId: number,
  playerA: number,
  playerB: number,
  winnerId: number | null
) {
  const { error } = await supabase.from("votes").insert([
    {
      voter_id: voterId,
      player_a: playerA,
      player_b: playerB,
      winner_id: winnerId,
    },
  ]);

  if (error) {
    console.error("Error submitting vote:", error);
    return false;
  }

  return true;
}

export async function upsertUser(
  id: number,
  first_name: string,
  last_name: string | undefined,
  username: string | undefined,
  photo_url: string | undefined,
  pickup_height?: number
) {
  try {
    // Check if user exists
    const { data, error: checkError } = await supabase
      .from("users")
      .select("*")
      .eq("id", id);

    if (checkError) {
      console.error("Error checking if user exists:", checkError);
      throw checkError;
    }

    if (data && data.length > 0) {
      // User exists, update only the provided fields
      // This preserves any fields not included in the update
      const updates: Record<
        string,
        string | number | boolean | null | undefined
      > = {};

      // Only include fields that are being updated
      if (first_name !== undefined) updates.first_name = first_name;
      if (last_name !== undefined) updates.last_name = last_name;
      if (username !== undefined) updates.username = username;
      if (photo_url !== undefined) updates.photo_url = photo_url;
      if (pickup_height !== undefined) updates.pickup_height = pickup_height;

      // Only perform update if we have fields to update
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from("users")
          .update(updates)
          .eq("id", id);

        if (updateError) {
          console.error("Error updating user:", updateError);
          throw updateError;
        }
      }
    } else {
      // User doesn't exist, insert new user
      const { error: insertError } = await supabase.from("users").insert([
        {
          id,
          first_name,
          last_name,
          username,
          photo_url,
          pickup_height,
        },
      ]);

      if (insertError) {
        console.error("Error inserting new user:", insertError);
        throw insertError;
      }
    }

    return true;
  } catch (error) {
    console.error("Error in upsertUser:", error);
    throw error;
  }
}

export async function isAdmin(id: number) {
  const result = await supabase
    .from("users")
    .select("admin")
    .eq("id", id)
    .limit(1);

  if (result.error) {
    console.error("Error selecting admin status", result.error);
    throw result.error;
  }
  if (result.data.length != 1) {
    console.error("Error selecting admin status, user not found", result.error);
    throw new Error("User not found");
  }
  return result.data[0].admin;
}

export async function getActiveGame(): Promise<Game | null> {
  const result = await supabase
    .from("games")
    .select()
    .eq("state", "ACTIVE")
    .limit(1);

  if (result.error) {
    console.error("Error getting active game", result.error);
    throw result.error;
  }

  return result.data.length == 0 ? null : (result.data[0] as Game);
}

export async function createActiveGame(game: Game) {
  const result = await supabase.from("games").insert([game]);

  if (result.error) {
    console.error("Error creating active game", result.error);
    throw result.error;
  }
}

export async function createVoting(voting: CreateVoting) {
  const result = await supabase.from("votings").insert([voting]);

  if (result.error) {
    console.error("Error creating active game", result.error);
    throw result.error;
  }
}

export async function getActiveVotings() {
  const result = await supabase.from("votings").select().eq("state", "ACTIVE");
  if (result.error) {
    console.error("Error getActiveVotings:", result.error);
    throw result.error;
  }
  return (result.data as Voting[]).map((v) => ({
    ...v,
    game_time: new Date(v.game_time),
  }));
}

export const getActiveGameSchedules = lazyAsyncSupplier(async () => {
  const result = await supabase
    .from("game_schedules")
    .select()
    .eq("state", "ACTIVE");
  if (result.error) {
    console.error("Error getActiveGameSchedules:", result.error);
    throw result.error;
  }
  return result.data as GameSchedule[];
});

export const getGameSchedule = lazyAsyncSupplier(
  async (schedule_id: string) => {
    const result = await supabase
      .from("game_schedules")
      .select()
      .eq("id", schedule_id);
    if (result.error) {
      console.error("Error getGameSchedule:", result.error);
      throw result.error;
    }
    return result.data![0] as GameSchedule;
  }
);

export const getGameLocations = lazyAsyncSupplier(async () => {
  const result = await supabase.from("game_locations").select();
  if (result.error) {
    console.error("Error getGameLocations:", result.error);
    throw result.error;
  }
  return result.data as GameLocation[];
});

export const createGameLocation = async (
  location: Omit<GameLocation, "id">
) => {
  const { data, error } = await supabase
    .from("game_locations")
    .insert([location])
    .select();

  if (error) {
    console.error("Error creating game location:", error);
    throw error;
  }

  return data[0] as GameLocation;
};

export const updateGameLocation = async (location: GameLocation) => {
  const { data, error } = await supabase
    .from("game_locations")
    .update({
      name: location.name,
      address: location.address,
      google_link: location.google_link,
    })
    .eq("id", location.id)
    .select();

  if (error) {
    console.error("Error updating game location:", error);
    throw error;
  }

  return data[0] as GameLocation;
};

export const deleteGameLocation = async (id: string) => {
  const { error } = await supabase.from("game_locations").delete().eq("id", id);

  if (error) {
    console.error("Error deleting game location:", error);
    throw error;
  }

  return true;
};

export const getVotingByPollId = async (pollId: string) => {
  const result = await supabase.from("votings").select().eq("poll_id", pollId);
  if (result.error) {
    console.error("Error getVotingByPollId:", result.error);
    throw result.error;
  }
  const voting = result.data![0] as Voting;
  return {
    ...voting,
    game_time: new Date(voting.game_time),
  };
};

export const getVotingPlayers = async (votingId: string) => {
  const result = await supabase
    .from("voting_players")
    .select()
    .eq("voting_id", votingId)
    .order("created_at");
  if (result.error) {
    console.error("Error getVotingPlayers:", result.error);
    throw result.error;
  }
  return (result.data! as VotingPlayer[]) || ([] as VotingPlayer[]);
};

export const addVotingPlayer = async (votingPlayer: CreateVotingPlayer) => {
  const result = await supabase.from("voting_players").insert([votingPlayer]);
  if (result.error) {
    console.error("Error addVotingPlayer:", result.error);
    throw result.error;
  }
};

export const deleteVotingPlayer = async (votingPlayer: VotingPlayer) => {
  const result = await supabase
    .from("voting_players")
    .delete()
    .eq("id", votingPlayer.id);
  if (result.error) {
    console.error("Error deleteVotingPlayer:", result.error);
    throw result.error;
  }
};

export const getUsersByIds = async (userIds: number[]) => {
  const result = await supabase.from("users").select().in("id", userIds);
  if (result.error) {
    console.error("Error getUsersByIds:", result.error);
    throw result.error;
  }
  return result.data! as User[];
};

export const getAdminUsers = async () => {
  const result = await supabase.from("users").select().eq("admin", true);
  if (result.error) {
    console.error("Error getUsersByIds:", result.error);
    throw result.error;
  }
  return result.data! as User[];
};

export const getUser = async (userId: number) => {
  const result = await supabase.from("users").select().eq("id", userId);
  if (result.error) {
    console.error("Error getUser:", result.error);
    throw result.error;
  }
  return result.data![0] as User;
};

export const closeVoting = async (voting: Voting) => {
  const result = await supabase
    .from("votings")
    .update({ state: "CLOSED" })
    .eq("id", voting.id);
  if (result.error) {
    console.error("Error getUser:", result.error);
    throw result.error;
  }
};

export const createGameSchedule = async (
  schedule: Omit<GameSchedule, "id" | "created_at">
) => {
  const { data, error } = await supabase
    .from("game_schedules")
    .insert([schedule])
    .select();

  if (error) {
    console.error("Error creating game schedule:", error);
    throw error;
  }

  return data[0] as GameSchedule;
};

export const updateGameSchedule = async (schedule: GameSchedule) => {
  const { data, error } = await supabase
    .from("game_schedules")
    .update({
      day_of_week: schedule.day_of_week,
      time: schedule.time,
      duration_minutes: schedule.duration_minutes,
      location: schedule.location,
      voting_in_advance_days: schedule.voting_in_advance_days,
      voting_time: schedule.voting_time,
      players_count: schedule.players_count,
      state: schedule.state,
    })
    .eq("id", schedule.id)
    .select();

  if (error) {
    console.error("Error updating game schedule:", error);
    throw error;
  }

  return data[0] as GameSchedule;
};

export const deleteGameSchedule = async (id: string) => {
  const { error } = await supabase.from("game_schedules").delete().eq("id", id);

  if (error) {
    console.error("Error deleting game schedule:", error);
    throw error;
  }

  return true;
};
