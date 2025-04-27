create table if not exists public.game_locations (
    id uuid default gen_random_uuid() not null,
    created_at timestamp with time zone default now() not null,
    name text not null,
    address text not null,
    google_link text not null
);

comment on table public.game_locations is 'Stores volleyball game location information including name, address, and map link.';

alter table only public.game_locations
    add constraint game_locations_pkey primary key (id);