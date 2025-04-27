create table "public"."game_locations" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "address" text not null,
    "google_link" text not null
);


create table "public"."game_schedules" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "day_of_week" text not null,
    "time" time without time zone not null,
    "duration_minutes" smallint not null,
    "location" uuid not null default gen_random_uuid(),
    "voting_in_advance_days" smallint not null,
    "voting_time" time without time zone not null,
    "players_count" smallint not null,
    "state" text not null
);


create table "public"."games" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "team_a" text[] not null,
    "team_b" text[] not null,
    "team_a_score" smallint,
    "team_b_score" smallint,
    "state" text not null,
    "creator" bigint not null,
    "finisher" bigint
);


create table "public"."users" (
    "id" bigint not null,
    "first_name" text not null,
    "last_name" text,
    "username" text,
    "photo_url" text,
    "created_at" timestamp without time zone default now(),
    "admin" boolean default false,
    "chat_id" text,
    "pickup_height" integer
);


create table "public"."votes" (
    "id" uuid not null default uuid_generate_v4(),
    "voter_id" bigint,
    "player_a" bigint,
    "player_b" bigint,
    "winner_id" bigint,
    "created_at" timestamp without time zone default now()
);


create table "public"."voting_players" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "player_id" bigint not null,
    "voting_id" uuid not null
);


create table "public"."votings" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "game_time" timestamp without time zone,
    "state" text not null,
    "poll_id" text not null,
    "chat_id" bigint not null,
    "game_schedule_id" uuid not null
);


CREATE UNIQUE INDEX game_locations_pkey ON public.game_locations USING btree (id);

CREATE UNIQUE INDEX game_schedules_pkey ON public.game_schedules USING btree (id);

CREATE UNIQUE INDEX games_pkey ON public.games USING btree (id);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX votes_pkey ON public.votes USING btree (id);

CREATE UNIQUE INDEX voting_players_pkey ON public.voting_players USING btree (id);

CREATE UNIQUE INDEX votings_pkey ON public.votings USING btree (id);

alter table "public"."game_locations" add constraint "game_locations_pkey" PRIMARY KEY using index "game_locations_pkey";

alter table "public"."game_schedules" add constraint "game_schedules_pkey" PRIMARY KEY using index "game_schedules_pkey";

alter table "public"."games" add constraint "games_pkey" PRIMARY KEY using index "games_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."votes" add constraint "votes_pkey" PRIMARY KEY using index "votes_pkey";

alter table "public"."voting_players" add constraint "voting_players_pkey" PRIMARY KEY using index "voting_players_pkey";

alter table "public"."votings" add constraint "votings_pkey" PRIMARY KEY using index "votings_pkey";

alter table "public"."votes" add constraint "votes_player_a_fkey" FOREIGN KEY (player_a) REFERENCES users(id) not valid;

alter table "public"."votes" validate constraint "votes_player_a_fkey";

alter table "public"."votes" add constraint "votes_player_b_fkey" FOREIGN KEY (player_b) REFERENCES users(id) not valid;

alter table "public"."votes" validate constraint "votes_player_b_fkey";

alter table "public"."votes" add constraint "votes_voter_id_fkey" FOREIGN KEY (voter_id) REFERENCES users(id) not valid;

alter table "public"."votes" validate constraint "votes_voter_id_fkey";

alter table "public"."votes" add constraint "votes_winner_id_fkey" FOREIGN KEY (winner_id) REFERENCES users(id) not valid;

alter table "public"."votes" validate constraint "votes_winner_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.calculate_player_ratings()
 RETURNS TABLE(id bigint, first_name text, last_name text, username text, photo_url text, rating numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.username,
    u.photo_url,
    ROUND(
      (POWER((COALESCE(wins.win_count, 0)::numeric / (COALESCE(losses.loss_count, 0) + 1)) + 1, 1.0/5) * 1000)::numeric,
      -1
    ) AS rating
  FROM users u
  LEFT JOIN (
    SELECT winner_id AS user_id, COUNT(*) AS win_count
    FROM votes
    WHERE winner_id IS NOT NULL
    GROUP BY winner_id
  ) AS wins ON u.id = wins.user_id
  LEFT JOIN (
    SELECT loser_id AS user_id, COUNT(*) AS loss_count FROM (
      SELECT
        CASE
          WHEN winner_id = player_a THEN player_b
          WHEN winner_id = player_b THEN player_a
        END AS loser_id
      FROM votes
      WHERE winner_id IS NOT NULL
    ) AS sub
    GROUP BY loser_id
  ) AS losses ON u.id = losses.user_id
  ORDER BY rating DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_random_vote_pair(voter_id_param bigint)
 RETURNS TABLE(player_a_id bigint, player_a_first_name text, player_a_last_name text, player_a_username text, player_a_photo_url text, player_b_id bigint, player_b_first_name text, player_b_last_name text, player_b_username text, player_b_photo_url text)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        u1.id, u1.first_name, u1.last_name, u1.username, u1.photo_url,
        u2.id, u2.first_name, u2.last_name, u2.username, u2.photo_url
    FROM users u1, users u2
    WHERE u1.id < u2.id
      AND u1.id != voter_id_param
      AND u2.id != voter_id_param
      AND NOT EXISTS (
        SELECT 1 FROM votes v
        WHERE v.voter_id = voter_id_param
          AND ((v.player_a = u1.id AND v.player_b = u2.id) OR (v.player_a = u2.id AND v.player_b = u1.id))
          AND v.created_at > now() - interval '30 days'
      )
    ORDER BY RANDOM()
    LIMIT 100;
END;
$function$
;

grant delete on table "public"."game_locations" to "anon";

grant insert on table "public"."game_locations" to "anon";

grant references on table "public"."game_locations" to "anon";

grant select on table "public"."game_locations" to "anon";

grant trigger on table "public"."game_locations" to "anon";

grant truncate on table "public"."game_locations" to "anon";

grant update on table "public"."game_locations" to "anon";

grant delete on table "public"."game_locations" to "authenticated";

grant insert on table "public"."game_locations" to "authenticated";

grant references on table "public"."game_locations" to "authenticated";

grant select on table "public"."game_locations" to "authenticated";

grant trigger on table "public"."game_locations" to "authenticated";

grant truncate on table "public"."game_locations" to "authenticated";

grant update on table "public"."game_locations" to "authenticated";

grant delete on table "public"."game_locations" to "service_role";

grant insert on table "public"."game_locations" to "service_role";

grant references on table "public"."game_locations" to "service_role";

grant select on table "public"."game_locations" to "service_role";

grant trigger on table "public"."game_locations" to "service_role";

grant truncate on table "public"."game_locations" to "service_role";

grant update on table "public"."game_locations" to "service_role";

grant delete on table "public"."game_schedules" to "anon";

grant insert on table "public"."game_schedules" to "anon";

grant references on table "public"."game_schedules" to "anon";

grant select on table "public"."game_schedules" to "anon";

grant trigger on table "public"."game_schedules" to "anon";

grant truncate on table "public"."game_schedules" to "anon";

grant update on table "public"."game_schedules" to "anon";

grant delete on table "public"."game_schedules" to "authenticated";

grant insert on table "public"."game_schedules" to "authenticated";

grant references on table "public"."game_schedules" to "authenticated";

grant select on table "public"."game_schedules" to "authenticated";

grant trigger on table "public"."game_schedules" to "authenticated";

grant truncate on table "public"."game_schedules" to "authenticated";

grant update on table "public"."game_schedules" to "authenticated";

grant delete on table "public"."game_schedules" to "service_role";

grant insert on table "public"."game_schedules" to "service_role";

grant references on table "public"."game_schedules" to "service_role";

grant select on table "public"."game_schedules" to "service_role";

grant trigger on table "public"."game_schedules" to "service_role";

grant truncate on table "public"."game_schedules" to "service_role";

grant update on table "public"."game_schedules" to "service_role";

grant delete on table "public"."games" to "anon";

grant insert on table "public"."games" to "anon";

grant references on table "public"."games" to "anon";

grant select on table "public"."games" to "anon";

grant trigger on table "public"."games" to "anon";

grant truncate on table "public"."games" to "anon";

grant update on table "public"."games" to "anon";

grant delete on table "public"."games" to "authenticated";

grant insert on table "public"."games" to "authenticated";

grant references on table "public"."games" to "authenticated";

grant select on table "public"."games" to "authenticated";

grant trigger on table "public"."games" to "authenticated";

grant truncate on table "public"."games" to "authenticated";

grant update on table "public"."games" to "authenticated";

grant delete on table "public"."games" to "service_role";

grant insert on table "public"."games" to "service_role";

grant references on table "public"."games" to "service_role";

grant select on table "public"."games" to "service_role";

grant trigger on table "public"."games" to "service_role";

grant truncate on table "public"."games" to "service_role";

grant update on table "public"."games" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

grant delete on table "public"."votes" to "anon";

grant insert on table "public"."votes" to "anon";

grant references on table "public"."votes" to "anon";

grant select on table "public"."votes" to "anon";

grant trigger on table "public"."votes" to "anon";

grant truncate on table "public"."votes" to "anon";

grant update on table "public"."votes" to "anon";

grant delete on table "public"."votes" to "authenticated";

grant insert on table "public"."votes" to "authenticated";

grant references on table "public"."votes" to "authenticated";

grant select on table "public"."votes" to "authenticated";

grant trigger on table "public"."votes" to "authenticated";

grant truncate on table "public"."votes" to "authenticated";

grant update on table "public"."votes" to "authenticated";

grant delete on table "public"."votes" to "service_role";

grant insert on table "public"."votes" to "service_role";

grant references on table "public"."votes" to "service_role";

grant select on table "public"."votes" to "service_role";

grant trigger on table "public"."votes" to "service_role";

grant truncate on table "public"."votes" to "service_role";

grant update on table "public"."votes" to "service_role";

grant delete on table "public"."voting_players" to "anon";

grant insert on table "public"."voting_players" to "anon";

grant references on table "public"."voting_players" to "anon";

grant select on table "public"."voting_players" to "anon";

grant trigger on table "public"."voting_players" to "anon";

grant truncate on table "public"."voting_players" to "anon";

grant update on table "public"."voting_players" to "anon";

grant delete on table "public"."voting_players" to "authenticated";

grant insert on table "public"."voting_players" to "authenticated";

grant references on table "public"."voting_players" to "authenticated";

grant select on table "public"."voting_players" to "authenticated";

grant trigger on table "public"."voting_players" to "authenticated";

grant truncate on table "public"."voting_players" to "authenticated";

grant update on table "public"."voting_players" to "authenticated";

grant delete on table "public"."voting_players" to "service_role";

grant insert on table "public"."voting_players" to "service_role";

grant references on table "public"."voting_players" to "service_role";

grant select on table "public"."voting_players" to "service_role";

grant trigger on table "public"."voting_players" to "service_role";

grant truncate on table "public"."voting_players" to "service_role";

grant update on table "public"."voting_players" to "service_role";

grant delete on table "public"."votings" to "anon";

grant insert on table "public"."votings" to "anon";

grant references on table "public"."votings" to "anon";

grant select on table "public"."votings" to "anon";

grant trigger on table "public"."votings" to "anon";

grant truncate on table "public"."votings" to "anon";

grant update on table "public"."votings" to "anon";

grant delete on table "public"."votings" to "authenticated";

grant insert on table "public"."votings" to "authenticated";

grant references on table "public"."votings" to "authenticated";

grant select on table "public"."votings" to "authenticated";

grant trigger on table "public"."votings" to "authenticated";

grant truncate on table "public"."votings" to "authenticated";

grant update on table "public"."votings" to "authenticated";

grant delete on table "public"."votings" to "service_role";

grant insert on table "public"."votings" to "service_role";

grant references on table "public"."votings" to "service_role";

grant select on table "public"."votings" to "service_role";

grant trigger on table "public"."votings" to "service_role";

grant truncate on table "public"."votings" to "service_role";

grant update on table "public"."votings" to "service_role";


