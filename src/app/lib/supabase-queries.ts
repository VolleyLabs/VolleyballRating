import { createClient } from "@/app/utils/supabase/client";
import { PointInsert, User } from "../../../database.types";
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
        first_name: pair.player_a_first_name,
        last_name: pair.player_a_last_name,
        photo_url: pair.player_a_photo_url,
        username: pair.player_a_username,
        admin: null,
        chat_id: null,
        created_at: null,
        pickup_height: null,
      } as User,
      playerB: {
        id: pair.player_b_id,
        first_name: pair.player_b_first_name,
        last_name: pair.player_b_last_name,
        photo_url: pair.player_b_photo_url,
        username: pair.player_b_username,
        admin: null,
        chat_id: null,
        created_at: null,
        pickup_height: null,
      } as User,
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

      // Always update Telegram fields to reflect current state
      updates.first_name = first_name;
      updates.last_name = last_name || null;
      updates.username = username || null;
      updates.photo_url = photo_url || null;

      // Only update app-specific fields when explicitly provided
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

export type Point = {
  id: string;
  created_at: string;
  winner: "left" | "right";
  type: "ace" | "attack" | "block" | "error" | "unspecified";
  player_id: number | null;
};

export type SetSummary = {
  set_idx: number;
  left_score: number;
  right_score: number;
  is_finished: boolean;
  set_winner: "left" | "right" | null;
  set_start: string;
  set_end: string;
  serving_team: "left" | "right";
};

export type MatchSummary = {
  match_idx: number;
  left_sets: number;
  right_sets: number;
  match_winner: "left" | "right" | null;
  match_start: string;
  match_end: string;
};

export type DailyScoreData = {
  sets: SetSummary | null;
  totals: MatchSummary | null;
  points: Point[];
};

export type DailyScoreSubscriptionCallback = (
  scoreData: DailyScoreData
) => void;

export type DailyScoreSubscription = {
  unsubscribe: () => void;
  cleanup?: () => void;
};

// Client-side calculation functions
export const calculateScoresFromPoints = (points: Point[]): DailyScoreData => {
  if (points.length === 0) {
    // Return initial state ready for the first game
    const now = new Date().toISOString();
    return {
      sets: {
        set_idx: 1,
        left_score: 0,
        right_score: 0,
        is_finished: false,
        set_winner: null,
        set_start: now,
        set_end: now,
        serving_team: "left", // Left team serves first by default
      },
      totals: {
        match_idx: 1,
        left_sets: 0,
        right_sets: 0,
        match_winner: null,
        match_start: now,
        match_end: now,
      },
      points: [],
    };
  }

  // Sort points by creation time
  const sortedPoints = [...points].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Calculate running scores and sets
  let leftScore = 0;
  let rightScore = 0;
  let setIndex = 1;
  let leftSets = 0;
  let rightSets = 0;
  let currentSetStart = sortedPoints[0].created_at;
  let currentSetEnd = sortedPoints[0].created_at;
  const matchStart = sortedPoints[0].created_at;
  const matchEnd = sortedPoints[sortedPoints.length - 1].created_at;

  // Track serving - left team serves first in each set
  let servingTeam: "left" | "right" = "left";

  for (const point of sortedPoints) {
    // Add point to current set score
    if (point.winner === "left") {
      leftScore += 1;
    } else {
      rightScore += 1;
    }

    // Update serving team based on volleyball rules:
    // The serving team continues to serve until they lose a point
    // When the receiving team wins a point, they become the serving team
    if (point.winner !== servingTeam) {
      servingTeam = point.winner;
    }

    currentSetEnd = point.created_at;

    // Check if set is complete (25+ points with 2+ point lead)
    const isSetComplete =
      (leftScore >= 25 || rightScore >= 25) &&
      Math.abs(leftScore - rightScore) >= 2;

    if (isSetComplete) {
      // Determine set winner
      if (leftScore > rightScore) {
        leftSets += 1;
      } else {
        rightSets += 1;
      }

      // Reset for next set
      leftScore = 0;
      rightScore = 0;
      setIndex += 1;
      currentSetStart = point.created_at;
      // Reset serving to left team for new set
      servingTeam = "left";
    }
  }

  // Create current set summary
  const currentSet: SetSummary = {
    set_idx: setIndex,
    left_score: leftScore,
    right_score: rightScore,
    is_finished:
      (leftScore >= 25 || rightScore >= 25) &&
      Math.abs(leftScore - rightScore) >= 2,
    set_winner:
      (leftScore >= 25 || rightScore >= 25) &&
      Math.abs(leftScore - rightScore) >= 2
        ? leftScore > rightScore
          ? "left"
          : "right"
        : null,
    set_start: currentSetStart,
    set_end: currentSetEnd,
    serving_team: servingTeam,
  };

  // Create match summary
  const matchSummary: MatchSummary = {
    match_idx: 1,
    left_sets: leftSets,
    right_sets: rightSets,
    match_winner: leftSets >= 3 ? "left" : rightSets >= 3 ? "right" : null,
    match_start: matchStart,
    match_end: matchEnd,
  };

  return {
    sets: currentSet,
    totals: matchSummary,
    points: sortedPoints,
  };
};

// Helper function to get local date string in YYYY-MM-DD format
const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper function to get UTC date range for a local date
const getUTCDateRange = (localDateString: string) => {
  // Parse the local date string (YYYY-MM-DD)
  const [year, month, day] = localDateString.split("-").map(Number);

  // Create start of day in local time (00:00:00)
  const startOfLocalDay = new Date(year, month - 1, day, 0, 0, 0, 0);

  // Create end of day in local time (23:59:59.999)
  const endOfLocalDay = new Date(year, month - 1, day, 23, 59, 59, 999);

  return {
    start: startOfLocalDay.toISOString(),
    end: endOfLocalDay.toISOString(),
  };
};

export const getTodaysScores = async (): Promise<DailyScoreData> => {
  // Get today's date in local time
  const todayLocal = getLocalDateString();

  const { start, end } = getUTCDateRange(todayLocal);

  // Get all points for today (local time)
  const { data: points, error } = await supabase
    .from("points")
    .select("*")
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching today's points:", error);
    throw error;
  }

  // Calculate scores from points on client side
  return calculateScoresFromPoints(points || []);
};

export const getScoresForDate = async (
  date: string
): Promise<DailyScoreData> => {
  const { start, end } = getUTCDateRange(date);

  // Get all points for the specified date (local time)
  const { data: points, error } = await supabase
    .from("points")
    .select("*")
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(`Error fetching points for date ${date}:`, error);
    throw error;
  }

  // Calculate scores from points on client side
  return calculateScoresFromPoints(points || []);
};

export const getAvailableDates = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from("points")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1000); // Get recent points

  if (error) {
    console.error("Error fetching available dates:", error);
    return [];
  }

  // Extract unique dates from points (using local time)
  const dbDates = data
    ? Array.from(
        new Set(
          data.map((point) => {
            const date = new Date(point.created_at);
            return getLocalDateString(date);
          })
        )
      )
    : [];

  // Always include today (local time) even if no data yet
  const todayLocal = getLocalDateString();

  // Use Set to ensure uniqueness, then convert back to array
  const uniqueDates = Array.from(new Set([todayLocal, ...dbDates]));

  // Sort by date descending (most recent first)
  return uniqueDates.sort((a, b) => b.localeCompare(a));
};

export const subscribeToDailyScores = (
  callback: DailyScoreSubscriptionCallback
): DailyScoreSubscription => {
  // Get today's date in local time
  const today = getLocalDateString();

  console.log("Creating real-time subscription for points table...");

  // Check if we have authentication
  supabase.auth.getSession().then(({ data: { session } }) => {
    console.log("Current auth session:", session?.user?.id || "No session");
  });

  // Set up periodic fallback check every 10 seconds
  // This ensures we catch changes even if real-time subscription misses them
  let fallbackInterval: NodeJS.Timeout | null = null;
  let lastScoreData: DailyScoreData | null = null;

  const checkForUpdates = async () => {
    try {
      const currentScoreData = await getTodaysScores();

      // Only trigger callback if data actually changed
      if (JSON.stringify(currentScoreData) !== JSON.stringify(lastScoreData)) {
        console.log("Periodic check detected score changes:", currentScoreData);
        lastScoreData = currentScoreData;
        callback(currentScoreData);
      }
    } catch (error) {
      console.error("Error in periodic score check:", error);
    }
  };

  // Start periodic checking (less frequent since we're using direct point queries)
  fallbackInterval = setInterval(checkForUpdates, 30000); // Check every 30 seconds

  const channel = supabase
    .channel(`daily-scores-${Math.random()}`) // Use unique channel name to avoid conflicts
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "points",
        filter: undefined, // No filter needed
      },
      async (payload) => {
        console.log("Real-time points change received:", payload);

        // For DELETE events, we can't reliably get the date from payload.old
        // since it only contains the primary key. So we refresh for all DELETE events.
        // For INSERT/UPDATE events, check if the change is for today
        if (payload.eventType === "DELETE") {
          console.log("DELETE event detected, refreshing scores for today...");
          try {
            const scoreData = await getTodaysScores();
            console.log("Updated score data after DELETE:", scoreData);

            // Update our cached data
            lastScoreData = scoreData;
            callback(scoreData);
          } catch (error) {
            console.error("Error fetching updated scores after DELETE:", error);
          }
        } else {
          // For INSERT/UPDATE events, check the date
          const pointData = payload.new as {
            created_at?: string;
          };
          const changeDate = pointData?.created_at
            ? getLocalDateString(new Date(pointData.created_at))
            : null;

          console.log(
            `Point change date: ${changeDate}, today: ${today}, event: ${payload.eventType}`
          );

          if (changeDate === today) {
            console.log("Fetching updated scores for today...");
            try {
              const scoreData = await getTodaysScores();
              console.log("Updated score data:", scoreData);

              // Update our cached data
              lastScoreData = scoreData;
              callback(scoreData);
            } catch (error) {
              console.error("Error fetching updated scores:", error);
            }
          } else {
            console.log("Point change is not for today, ignoring");
          }
        }
      }
    )
    .subscribe((status) => {
      console.log("Real-time subscription status:", status);
      if (status === "SUBSCRIBED") {
        console.log(
          "✅ Successfully subscribed to daily scores real-time updates"
        );
      } else if (status === "CHANNEL_ERROR") {
        console.error("❌ Error subscribing to daily scores");
        // If real-time fails, the periodic check will still work
      } else if (status === "CLOSED") {
        console.log("🔒 Real-time subscription closed");
        // Clean up the periodic check when subscription is closed
        if (fallbackInterval) {
          clearInterval(fallbackInterval);
          fallbackInterval = null;
        }
      } else if (status === "TIMED_OUT") {
        console.warn("⏰ Real-time subscription timed out");
      }
    });

  // Return a proper subscription object
  return {
    unsubscribe: () => {
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
        fallbackInterval = null;
      }
      channel.unsubscribe();
    },
    cleanup: () => {
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
        fallbackInterval = null;
      }
      channel.unsubscribe();
    },
  };
};

export const addPoint = async (point: PointInsert) => {
  const { data, error } = await supabase
    .from("points")
    .insert([
      {
        winner: point.winner,
        type: point.type || "unspecified",
        player_id: point.player_id || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error adding point:", error);
    throw error;
  }

  return data;
};

export const getTodaysPoints = async () => {
  // Get today's date in local time
  const today = getLocalDateString();

  const { start, end } = getUTCDateRange(today);

  const { data, error } = await supabase
    .from("points")
    .select("*")
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching today's points:", error);
    throw error;
  }

  return data || [];
};
