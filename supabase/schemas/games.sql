create table if not exists public.games (
    id uuid default gen_random_uuid() not null,
    created_at timestamp with time zone default now() not null,
    team_a text[] not null,
    team_b text[] not null,
    team_a_score smallint,
    team_b_score smallint,
    state text not null,
    creator bigint not null,
    finisher bigint
);

comment on table public.games is 'Stores volleyball game information including teams, scores, and game state.';

alter table only public.games
    add constraint games_pkey primary key (id);