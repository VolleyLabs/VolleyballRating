create type "public"."point_type" as enum ('ace', 'attack', 'block', 'error', 'unspecified');

create type "public"."point_winner" as enum ('left', 'right');


  create table "public"."game_locations" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "address" text not null,
    "google_link" text not null
      );


alter table "public"."game_locations" enable row level security;


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


alter table "public"."game_schedules" enable row level security;


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


alter table "public"."games" enable row level security;


  create table "public"."points" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "winner" point_winner not null,
    "type" point_type not null default 'unspecified'::point_type,
    "player_id" bigint
      );


alter table "public"."points" enable row level security;


  create table "public"."users" (
    "id" bigint not null,
    "first_name" text not null,
    "last_name" text,
    "username" text,
    "photo_url" text,
    "created_at" timestamp without time zone default now(),
    "admin" boolean default false,
    "pickup_height" integer,
    "is_female" boolean not null default false,
    "power_group" smallint not null default 2,
    "another_name" text,
    "allows_write_to_pm" boolean,
    "is_bot" boolean default false,
    "is_premium" boolean,
    "language_code" text,
    "last_auth" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now(),
    "share_stats" boolean not null default false
      );


alter table "public"."users" enable row level security;


  create table "public"."votes" (
    "id" uuid not null default uuid_generate_v4(),
    "voter_id" bigint,
    "player_a" bigint,
    "player_b" bigint,
    "winner_id" bigint,
    "created_at" timestamp without time zone default now()
      );


alter table "public"."votes" enable row level security;


  create table "public"."voting_players" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "player_id" bigint not null,
    "voting_id" uuid not null
      );


alter table "public"."voting_players" enable row level security;


  create table "public"."votings" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "game_time" timestamp without time zone,
    "state" text not null,
    "poll_id" text not null,
    "chat_id" bigint not null,
    "game_schedule_id" uuid not null
      );


alter table "public"."votings" enable row level security;

CREATE UNIQUE INDEX game_locations_pkey ON public.game_locations USING btree (id);

CREATE UNIQUE INDEX game_schedules_pkey ON public.game_schedules USING btree (id);

CREATE UNIQUE INDEX games_pkey ON public.games USING btree (id);

CREATE INDEX idx_points_action ON public.points USING btree (type);

CREATE INDEX idx_points_created_at ON public.points USING btree (created_at);

CREATE INDEX idx_points_winner ON public.points USING btree (winner);

CREATE UNIQUE INDEX points_pkey ON public.points USING btree (id);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX votes_pkey ON public.votes USING btree (id);

CREATE UNIQUE INDEX voting_players_pkey ON public.voting_players USING btree (id);

CREATE UNIQUE INDEX votings_pkey ON public.votings USING btree (id);

alter table "public"."game_locations" add constraint "game_locations_pkey" PRIMARY KEY using index "game_locations_pkey";

alter table "public"."game_schedules" add constraint "game_schedules_pkey" PRIMARY KEY using index "game_schedules_pkey";

alter table "public"."games" add constraint "games_pkey" PRIMARY KEY using index "games_pkey";

alter table "public"."points" add constraint "points_pkey" PRIMARY KEY using index "points_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."votes" add constraint "votes_pkey" PRIMARY KEY using index "votes_pkey";

alter table "public"."voting_players" add constraint "voting_players_pkey" PRIMARY KEY using index "voting_players_pkey";

alter table "public"."votings" add constraint "votings_pkey" PRIMARY KEY using index "votings_pkey";

alter table "public"."points" add constraint "points_player_id_fkey" FOREIGN KEY (player_id) REFERENCES users(id) not valid;

alter table "public"."points" validate constraint "points_player_id_fkey";

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
 SET search_path TO ''
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
  FROM public.users u
  LEFT JOIN (
    SELECT winner_id AS user_id, COUNT(*) AS win_count
    FROM public.votes
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
      FROM public.votes
      WHERE winner_id IS NOT NULL
    ) AS sub
    GROUP BY loser_id
  ) AS losses ON u.id = losses.user_id
  ORDER BY rating DESC;
END;
$function$
;

create or replace view "public"."daily_point_summaries" as  SELECT (points.created_at)::date AS day,
    count(*) AS total_points,
    count(*) FILTER (WHERE (points.winner = 'left'::point_winner)) AS left_points,
    count(*) FILTER (WHERE (points.winner = 'right'::point_winner)) AS right_points,
    count(*) FILTER (WHERE (points.type = 'ace'::point_type)) AS ace_points,
    count(*) FILTER (WHERE (points.type = 'attack'::point_type)) AS attack_points,
    count(*) FILTER (WHERE (points.type = 'block'::point_type)) AS block_points,
    count(*) FILTER (WHERE (points.type = 'error'::point_type)) AS error_points,
    min(points.created_at) AS first_rally_at,
    max(points.created_at) AS last_rally_at
   FROM points
  GROUP BY ((points.created_at)::date)
  ORDER BY ((points.created_at)::date) DESC;


CREATE OR REPLACE FUNCTION public.get_random_vote_pair(voter_id_param bigint)
 RETURNS TABLE(player_a_id bigint, player_a_first_name text, player_a_last_name text, player_a_username text, player_a_photo_url text, player_b_id bigint, player_b_first_name text, player_b_last_name text, player_b_username text, player_b_photo_url text)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
    return query
    select 
        u1.id, u1.first_name, u1.last_name, u1.username, u1.photo_url,
        u2.id, u2.first_name, u2.last_name, u2.username, u2.photo_url
    from public.users u1, public.users u2
    where u1.id < u2.id
      and u1.id != voter_id_param
      and u2.id != voter_id_param
      and not exists (
        select 1 from public.votes v
        where v.voter_id = voter_id_param
          and ((v.player_a = u1.id and v.player_b = u2.id) or (v.player_a = u2.id and v.player_b = u1.id))
          and v.created_at > now() - interval '30 days'
      )
    order by random()
    limit 100;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.jwt_claim_admin()
 RETURNS TABLE(role text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT COALESCE(current_setting('request.jwt.claim.app_metadata.role', TRUE), '') AS role;
$function$
;

create or replace view "public"."point_history" as  WITH RECURSIVE ordered AS (
         SELECT p.id,
            p.created_at,
            p.winner,
            p.type,
            p.player_id,
            (p.created_at)::date AS day,
            row_number() OVER (PARTITION BY ((p.created_at)::date) ORDER BY p.created_at, p.id) AS seq
           FROM points p
        ), scored AS (
         SELECT o.id,
            o.created_at,
            o.winner,
            o.type,
            o.player_id,
            o.day,
            o.seq,
            1 AS set_idx,
            ((o.winner = 'left'::point_winner))::integer AS left_score,
            ((o.winner = 'right'::point_winner))::integer AS right_score
           FROM ordered o
          WHERE (o.seq = 1)
        UNION ALL
         SELECT o.id,
            o.created_at,
            o.winner,
            o.type,
            o.player_id,
            o.day,
            o.seq,
                CASE
                    WHEN z.set_over THEN (s.set_idx + 1)
                    ELSE s.set_idx
                END AS set_idx,
                CASE
                    WHEN z.set_over THEN ((o.winner = 'left'::point_winner))::integer
                    ELSE (s.left_score + ((o.winner = 'left'::point_winner))::integer)
                END AS "case",
                CASE
                    WHEN z.set_over THEN ((o.winner = 'right'::point_winner))::integer
                    ELSE (s.right_score + ((o.winner = 'right'::point_winner))::integer)
                END AS "case"
           FROM ((scored s
             JOIN ordered o ON (((o.day = s.day) AND (o.seq = (s.seq + 1)))))
             CROSS JOIN LATERAL ( SELECT (((s.left_score >= 25) OR (s.right_score >= 25)) AND (abs((s.left_score - s.right_score)) >= 2)) AS set_over) z)
        )
 SELECT scored.id,
    scored.day,
    scored.set_idx,
    scored.created_at,
    scored.winner,
    scored.type,
    scored.player_id,
    scored.left_score,
    scored.right_score,
    ((scored.left_score || '-'::text) || scored.right_score) AS score_string
   FROM scored
  ORDER BY scored.created_at DESC, scored.id DESC;


create or replace view "public"."set_summaries" as  WITH RECURSIVE ordered AS (
         SELECT p.id,
            p.created_at,
            p.winner,
            p.type,
            p.player_id,
            (p.created_at)::date AS day,
            row_number() OVER (PARTITION BY ((p.created_at)::date) ORDER BY p.created_at, p.id) AS seq
           FROM points p
        ), scored AS (
         SELECT o.id,
            o.created_at,
            o.winner,
            o.type,
            o.player_id,
            o.day,
            o.seq,
            1 AS set_idx,
            ((o.winner = 'left'::point_winner))::integer AS lpts,
            ((o.winner = 'right'::point_winner))::integer AS rpts
           FROM ordered o
          WHERE (o.seq = 1)
        UNION ALL
         SELECT o.id,
            o.created_at,
            o.winner,
            o.type,
            o.player_id,
            o.day,
            o.seq,
                CASE
                    WHEN z.set_over THEN (s.set_idx + 1)
                    ELSE s.set_idx
                END AS set_idx,
                CASE
                    WHEN z.set_over THEN ((o.winner = 'left'::point_winner))::integer
                    ELSE (s.lpts + ((o.winner = 'left'::point_winner))::integer)
                END AS "case",
                CASE
                    WHEN z.set_over THEN ((o.winner = 'right'::point_winner))::integer
                    ELSE (s.rpts + ((o.winner = 'right'::point_winner))::integer)
                END AS "case"
           FROM ((scored s
             JOIN ordered o ON (((o.day = s.day) AND (o.seq = (s.seq + 1)))))
             CROSS JOIN LATERAL ( SELECT (((s.lpts >= 25) OR (s.rpts >= 25)) AND (abs((s.lpts - s.rpts)) >= 2)) AS set_over) z)
        )
 SELECT scored.day,
    scored.set_idx,
    min(scored.created_at) AS set_start,
    max(scored.created_at) AS set_end,
    max(scored.lpts) AS left_score,
    max(scored.rpts) AS right_score,
    (((max(scored.lpts) >= 25) OR (max(scored.rpts) >= 25)) AND (abs((max(scored.lpts) - max(scored.rpts))) >= 2)) AS is_finished,
        CASE
            WHEN (((max(scored.lpts) >= 25) OR (max(scored.rpts) >= 25)) AND (abs((max(scored.lpts) - max(scored.rpts))) >= 2)) THEN
            CASE
                WHEN (max(scored.lpts) > max(scored.rpts)) THEN 'left'::text
                ELSE 'right'::text
            END
            ELSE NULL::text
        END AS set_winner
   FROM scored
  GROUP BY scored.day, scored.set_idx;


CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$function$
;

create or replace view "public"."match_summaries" as  WITH ranked AS (
         SELECT x.day,
            x.set_idx,
            x.set_start,
            x.set_end,
            x.left_score,
            x.right_score,
            x.is_finished,
            x.set_winner,
            x.match_break,
            (sum(x.match_break) OVER (PARTITION BY x.day ORDER BY x.set_idx) + 1) AS match_idx
           FROM ( SELECT s.day,
                    s.set_idx,
                    s.set_start,
                    s.set_end,
                    s.left_score,
                    s.right_score,
                    s.is_finished,
                    s.set_winner,
                        CASE
                            WHEN ((sum(((s.set_winner = 'left'::text))::integer) OVER (PARTITION BY s.day ORDER BY s.set_idx) = 3) OR (sum(((s.set_winner = 'right'::text))::integer) OVER (PARTITION BY s.day ORDER BY s.set_idx) = 3)) THEN 1
                            ELSE 0
                        END AS match_break
                   FROM set_summaries s
                  WHERE s.is_finished) x
        )
 SELECT ranked.day,
    ranked.match_idx,
    count(*) FILTER (WHERE (ranked.set_winner = 'left'::text)) AS left_sets,
    count(*) FILTER (WHERE (ranked.set_winner = 'right'::text)) AS right_sets,
    min(ranked.set_start) AS match_start,
    max(ranked.set_end) AS match_end,
        CASE
            WHEN (count(*) FILTER (WHERE (ranked.set_winner = 'left'::text)) > count(*) FILTER (WHERE (ranked.set_winner = 'right'::text))) THEN 'left'::text
            ELSE 'right'::text
        END AS match_winner
   FROM ranked
  GROUP BY ranked.day, ranked.match_idx
  ORDER BY ranked.day DESC, ranked.match_idx;


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

grant delete on table "public"."points" to "anon";

grant insert on table "public"."points" to "anon";

grant references on table "public"."points" to "anon";

grant select on table "public"."points" to "anon";

grant trigger on table "public"."points" to "anon";

grant truncate on table "public"."points" to "anon";

grant update on table "public"."points" to "anon";

grant delete on table "public"."points" to "authenticated";

grant insert on table "public"."points" to "authenticated";

grant references on table "public"."points" to "authenticated";

grant select on table "public"."points" to "authenticated";

grant trigger on table "public"."points" to "authenticated";

grant truncate on table "public"."points" to "authenticated";

grant update on table "public"."points" to "authenticated";

grant delete on table "public"."points" to "service_role";

grant insert on table "public"."points" to "service_role";

grant references on table "public"."points" to "service_role";

grant select on table "public"."points" to "service_role";

grant trigger on table "public"."points" to "service_role";

grant truncate on table "public"."points" to "service_role";

grant update on table "public"."points" to "service_role";

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


  create policy "Game locations are viewable by everyone"
  on "public"."game_locations"
  as permissive
  for select
  to authenticated, anon
using (true);



  create policy "Only admins can create game locations"
  on "public"."game_locations"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));



  create policy "Only admins can delete game locations"
  on "public"."game_locations"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));



  create policy "Only admins can update game locations"
  on "public"."game_locations"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));



  create policy "Game schedules are viewable by everyone"
  on "public"."game_schedules"
  as permissive
  for select
  to authenticated, anon
using (true);



  create policy "Only admins can create game schedules"
  on "public"."game_schedules"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));



  create policy "Only admins can delete game schedules"
  on "public"."game_schedules"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));



  create policy "Only admins can update game schedules"
  on "public"."game_schedules"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));



  create policy "Games are viewable by everyone"
  on "public"."games"
  as permissive
  for select
  to authenticated, anon
using (true);



  create policy "Only admins can create games"
  on "public"."games"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));



  create policy "Only admins can delete games"
  on "public"."games"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));



  create policy "Only admins can update games"
  on "public"."games"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));



  create policy "public_rw_points"
  on "public"."points"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Public users are viewable by everyone"
  on "public"."users"
  as permissive
  for select
  to authenticated, anon
using (true);



  create policy "Users can update own record"
  on "public"."users"
  as permissive
  for update
  to authenticated
using (((auth.uid())::text = (id)::text))
with check (((auth.uid())::text = (id)::text));



  create policy "Admins can view all votes"
  on "public"."votes"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));



  create policy "Users can insert their own votes"
  on "public"."votes"
  as permissive
  for insert
  to authenticated
with check ((voter_id = ( SELECT
        CASE
            WHEN (((auth.jwt() -> 'app_metadata'::text) ->> 'tg_id'::text) IS NOT NULL) THEN (((auth.jwt() -> 'app_metadata'::text) ->> 'tg_id'::text))::bigint
            WHEN (((auth.jwt() -> 'user_metadata'::text) ->> 'tg_id'::text) IS NOT NULL) THEN (((auth.jwt() -> 'user_metadata'::text) ->> 'tg_id'::text))::bigint
            ELSE NULL::bigint
        END AS "case")));



  create policy "Users can view their own votes"
  on "public"."votes"
  as permissive
  for select
  to authenticated
using ((voter_id = ( SELECT
        CASE
            WHEN (((auth.jwt() -> 'app_metadata'::text) ->> 'tg_id'::text) IS NOT NULL) THEN (((auth.jwt() -> 'app_metadata'::text) ->> 'tg_id'::text))::bigint
            WHEN (((auth.jwt() -> 'user_metadata'::text) ->> 'tg_id'::text) IS NOT NULL) THEN (((auth.jwt() -> 'user_metadata'::text) ->> 'tg_id'::text))::bigint
            ELSE NULL::bigint
        END AS "case")));



  create policy "Only admins can create voting players"
  on "public"."voting_players"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));



  create policy "Only admins can delete voting players"
  on "public"."voting_players"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));



  create policy "Only admins can update voting players"
  on "public"."voting_players"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));



  create policy "Voting players are viewable by everyone"
  on "public"."voting_players"
  as permissive
  for select
  to authenticated, anon
using (true);



  create policy "Only admins can create votings"
  on "public"."votings"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));



  create policy "Only admins can delete votings"
  on "public"."votings"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));



  create policy "Only admins can update votings"
  on "public"."votings"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));



  create policy "Votings are viewable by everyone"
  on "public"."votings"
  as permissive
  for select
  to authenticated, anon
using (true);


CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION set_updated_at();


