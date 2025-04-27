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

-- Seed data
INSERT INTO public.game_locations (id, created_at, name, address, google_link) 
VALUES ('3ebcb7b6-37c1-4555-b1a2-252d9a13d41b', '2025-03-16 00:59:56.771437+00', 'Нибрас', 'Zen Star Sports Nibras School (Green Community DIP1)', 'https://maps.app.goo.gl/9M6NsHJdRAGfnZw1A');