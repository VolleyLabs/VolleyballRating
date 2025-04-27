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


