create table if not exists public.votings (
    id uuid default gen_random_uuid() not null,
    created_at timestamp with time zone default now() not null,
    game_time timestamp without time zone,
    state text not null,
    poll_id text not null,
    chat_id bigint not null,
    game_schedule_id uuid not null
);

comment on table public.votings is 'Stores voting sessions for game participation and scheduling.';

alter table only public.votings
    add constraint votings_pkey primary key (id);