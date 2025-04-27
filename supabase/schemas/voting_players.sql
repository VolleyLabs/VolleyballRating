create table if not exists public.voting_players (
    id uuid default gen_random_uuid() not null,
    created_at timestamp with time zone default now() not null,
    player_id bigint not null,
    voting_id uuid not null
);

comment on table public.voting_players is 'Links players to voting sessions for game participation.';

alter table only public.voting_players
    add constraint voting_players_pkey primary key (id);