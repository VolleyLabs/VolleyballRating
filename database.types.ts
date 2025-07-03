//import { MergeDeep } from "type-fest";
import { Database as DatabaseGenerated } from "./database.types.gen";
export type { Json } from "./database.types.gen";

// https://supabase.com/docs/guides/api/rest/generating-types#helper-types-for-tables-and-joins
// Override the type for a specific column in a view:
// export type Database = MergeDeep<
//   DatabaseGenerated,
//   {
//     public: {
//       Views: {
//         movies_view: {
//           Row: {
//             // id is a primary key in public.movies, so it must be `not null`
//             id: number;
//           };
//         };
//       };
//     };
//   }
// >;

export type Database = DatabaseGenerated;

// Enums
export type PointType = Database["public"]["Enums"]["point_type"];
export type PointWinner = Database["public"]["Enums"]["point_winner"];

// Views
export type PointHistory = Database["public"]["Views"]["point_history"]["Row"];
export type DailyPointSummary =
  Database["public"]["Views"]["daily_point_summaries"]["Row"];
export type MatchSummary =
  Database["public"]["Views"]["match_summaries"]["Row"];
export type SetSummary = Database["public"]["Views"]["set_summaries"]["Row"];

// User
export type User = Database["public"]["Tables"]["users"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

// Vote
export type Vote = Database["public"]["Tables"]["votes"]["Row"];
export type VoteInsert = Database["public"]["Tables"]["votes"]["Insert"];
export type VoteUpdate = Database["public"]["Tables"]["votes"]["Update"];

// GameLocation
export type GameLocation =
  Database["public"]["Tables"]["game_locations"]["Row"];
export type GameLocationInsert =
  Database["public"]["Tables"]["game_locations"]["Insert"];
export type GameLocationUpdate =
  Database["public"]["Tables"]["game_locations"]["Update"];

// GameSchedule
export type GameSchedule =
  Database["public"]["Tables"]["game_schedules"]["Row"];
export type GameScheduleInsert =
  Database["public"]["Tables"]["game_schedules"]["Insert"];
export type GameScheduleUpdate =
  Database["public"]["Tables"]["game_schedules"]["Update"];

// Voting
export type Voting = Database["public"]["Tables"]["votings"]["Row"];
export type VotingInsert = Database["public"]["Tables"]["votings"]["Insert"];
export type VotingUpdate = Database["public"]["Tables"]["votings"]["Update"];

// VotingPlayer
export type VotingPlayer =
  Database["public"]["Tables"]["voting_players"]["Row"];
export type VotingPlayerInsert =
  Database["public"]["Tables"]["voting_players"]["Insert"];
export type VotingPlayerUpdate =
  Database["public"]["Tables"]["voting_players"]["Update"];

// Game
export type Game = Database["public"]["Tables"]["games"]["Row"];
export type GameInsert = Database["public"]["Tables"]["games"]["Insert"];
export type GameUpdate = Database["public"]["Tables"]["games"]["Update"];

// Points
export type Point = Database["public"]["Tables"]["points"]["Row"];
export type PointInsert = Database["public"]["Tables"]["points"]["Insert"];
export type PointUpdate = Database["public"]["Tables"]["points"]["Update"];
