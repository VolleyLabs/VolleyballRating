CREATE TABLE IF NOT EXISTS public.game_schedules (
    id uuid default gen_random_uuid() not null,
    created_at timestamp with time zone default now() not null,
    day_of_week text not null,
    time time without time zone not null,
    duration_minutes smallint not null,
    location uuid default gen_random_uuid() not null,
    voting_in_advance_days smallint not null,
    voting_time time without time zone not null,
    players_count smallint not null,
    state text not null
);

COMMENT ON TABLE public.game_schedules IS 'Stores recurring game schedule information including day, time, location, and voting parameters.';

ALTER TABLE ONLY public.game_schedules
    ADD CONSTRAINT game_schedules_pkey PRIMARY KEY (id);