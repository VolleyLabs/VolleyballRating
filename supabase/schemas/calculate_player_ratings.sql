CREATE OR REPLACE FUNCTION public.calculate_player_ratings()
RETURNS TABLE(
    id bigint,
    first_name text,
    last_name text,
    username text,
    photo_url text,
    rating numeric
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
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
$$;

COMMENT ON FUNCTION public.calculate_player_ratings() IS 'Calculates player ratings based on wins and losses from voting records.';