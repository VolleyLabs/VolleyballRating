-- Drop existing views and tables if they exist to handle migration
DROP VIEW IF EXISTS point_history;
DROP VIEW IF EXISTS daily_point_summaries;
DROP VIEW IF EXISTS match_summaries;
DROP VIEW IF EXISTS set_summaries;

-- now the table can go
DROP TABLE IF EXISTS points CASCADE;      -- CASCADE is safe after the views are gone
DROP TYPE  IF EXISTS point_type;
DROP TYPE  IF EXISTS point_winner;

-- 🏐 1. Domain enums ----------------------------------------------------------
CREATE TYPE point_winner  AS ENUM ('left', 'right');               -- who won the rally
CREATE TYPE point_type    AS ENUM (                                -- discrete volleyball skills
    'ace',        -- serve that lands untouched (= immediate point)
    'attack',     -- spike/tip that tries to score
    'block',      -- block touch at the net
    'error',      -- any fault that directly ends the rally (net, out, etc.)
    'unspecified' -- unspecified/other
);

-- 🏐 3. Point-by-point detail --------------------------------------------------
CREATE TABLE points (
    id         UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),

    winner     point_winner NOT NULL,            
    type       point_type   NOT NULL DEFAULT 'unspecified',
    player_id  BIGINT       REFERENCES users(id)
);

COMMENT ON TABLE points IS 'Stores individual volleyball points with winner, type, and optional player attribution.';

-- 🏐 4. Helpful indexes --------------------------------------------------------
CREATE INDEX idx_points_created_at  ON points(created_at);
CREATE INDEX idx_points_winner      ON points(winner);
CREATE INDEX idx_points_action      ON points(type);

-- 🏐 5. RLS skeleton (tighten later) ------------------------------------------
ALTER TABLE points ENABLE ROW LEVEL SECURITY; 
CREATE POLICY "public_rw_points" ON points FOR ALL USING (true) WITH CHECK (true);

-- New view: one row per calendar day
CREATE VIEW daily_point_summaries AS
SELECT
    created_at::date                             AS day,          -- local date of the rally
    COUNT(*)                                     AS total_points, -- rallies played that day

    -- who won
    COUNT(*) FILTER (WHERE winner = 'left')      AS left_points,
    COUNT(*) FILTER (WHERE winner = 'right')     AS right_points,

    -- action-type breakdown
    COUNT(*) FILTER (WHERE type = 'ace')         AS ace_points,
    COUNT(*) FILTER (WHERE type = 'attack')      AS attack_points,
    COUNT(*) FILTER (WHERE type = 'block')       AS block_points,
    COUNT(*) FILTER (WHERE type = 'error')       AS error_points,

    MIN(created_at)                              AS first_rally_at,
    MAX(created_at)                              AS last_rally_at
FROM points
GROUP BY created_at::date
ORDER BY day DESC;

-- ①  Per-set view ------------------------------------------------------------
CREATE VIEW set_summaries AS
WITH RECURSIVE ordered AS (           -- points ordered per day
    SELECT p.*,
           p.created_at::date AS day,
           ROW_NUMBER() OVER (PARTITION BY p.created_at::date
                              ORDER BY p.created_at, p.id) AS seq
    FROM   points p
),
scored AS (                           -- running scoreboard
    SELECT o.*, 1 AS set_idx,
           (o.winner='left')::int  AS lpts,
           (o.winner='right')::int AS rpts
    FROM   ordered o WHERE seq = 1
    UNION ALL
    SELECT o.*,
           CASE WHEN set_over THEN s.set_idx+1 ELSE s.set_idx END,
           CASE WHEN set_over THEN (o.winner='left')::int
                ELSE s.lpts + (o.winner='left')::int  END,
           CASE WHEN set_over THEN (o.winner='right')::int
                ELSE s.rpts + (o.winner='right')::int END
    FROM   scored s
    JOIN   ordered o ON o.day = s.day AND o.seq = s.seq + 1
    CROSS JOIN LATERAL (
        SELECT ((s.lpts >= 25 OR s.rpts >= 25)
                AND abs(s.lpts - s.rpts) >= 2) AS set_over
    ) z
)
SELECT
    day,
    set_idx,
    MIN(created_at) AS set_start,
    MAX(created_at) AS set_end,
    MAX(lpts)       AS left_score,
    MAX(rpts)       AS right_score,
    /* finished? ≥25 pts and 2-pt lead */
    (MAX(lpts)>=25 OR MAX(rpts)>=25)
        AND abs(MAX(lpts)-MAX(rpts))>=2        AS is_finished,
    CASE WHEN (MAX(lpts)>=25 OR MAX(rpts)>=25)
              AND abs(MAX(lpts)-MAX(rpts))>=2
         THEN CASE WHEN MAX(lpts) > MAX(rpts) THEN 'left' ELSE 'right' END
         ELSE NULL END                         AS set_winner
FROM   scored
GROUP  BY day, set_idx;

-- ②  Per-match view (best-of-5) ----------------------------------------------
CREATE VIEW match_summaries AS
WITH ranked AS (
    SELECT *,
           SUM(match_break) OVER (PARTITION BY day ORDER BY set_idx) + 1
               AS match_idx
    FROM (
        SELECT s.*,
               CASE
                   WHEN  SUM((set_winner='left')::int)
                         OVER (PARTITION BY day ORDER BY set_idx) = 3
                     OR SUM((set_winner='right')::int)
                         OVER (PARTITION BY day ORDER BY set_idx) = 3
                   THEN 1 ELSE 0
               END AS match_break
        FROM   set_summaries s
        WHERE  is_finished        -- unfinished sets don't count yet
    ) x
)
SELECT
    day,
    match_idx,
    COUNT(*) FILTER (WHERE set_winner='left')  AS left_sets,
    COUNT(*) FILTER (WHERE set_winner='right') AS right_sets,
    MIN(set_start) AS match_start,
    MAX(set_end)   AS match_end,
    CASE WHEN COUNT(*) FILTER (WHERE set_winner='left')  >
               COUNT(*) FILTER (WHERE set_winner='right')
         THEN 'left' ELSE 'right' END          AS match_winner
FROM   ranked
GROUP  BY day, match_idx
ORDER  BY day DESC, match_idx;

-- Latest rally first ─────────────────────────────────────────────
CREATE OR REPLACE VIEW point_history AS
WITH RECURSIVE ordered AS (
    SELECT p.*,
           p.created_at::date AS day,
           ROW_NUMBER() OVER (PARTITION BY p.created_at::date
                              ORDER BY p.created_at, p.id) AS seq
    FROM   points p
),
scored AS (
    SELECT o.*,
           1 AS set_idx,
           (o.winner='left')::int  AS left_score,
           (o.winner='right')::int AS right_score
    FROM   ordered o
    WHERE  o.seq = 1
    UNION ALL
    SELECT o.*,
           CASE WHEN set_over THEN s.set_idx + 1 ELSE s.set_idx END,
           CASE WHEN set_over THEN (o.winner='left')::int
                ELSE s.left_score  + (o.winner='left')::int END,
           CASE WHEN set_over THEN (o.winner='right')::int
                ELSE s.right_score + (o.winner='right')::int END
    FROM   scored  s
    JOIN   ordered o ON o.day = s.day AND o.seq = s.seq + 1
    CROSS JOIN LATERAL (
        SELECT ( (s.left_score>=25 OR s.right_score>=25)
                 AND ABS(s.left_score-s.right_score)>=2 ) AS set_over
    ) z
)
SELECT id,
       day,
       set_idx,
       created_at,
       winner,
       type,
       player_id,
       left_score,
       right_score,
       left_score || '-' || right_score AS score_string
FROM   scored
ORDER  BY created_at DESC, id DESC;   -- latest points first 