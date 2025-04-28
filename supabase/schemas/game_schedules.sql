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

-- Enable Row Level Security
ALTER TABLE public.game_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Game schedules are viewable by everyone" 
ON public.game_schedules FOR SELECT 
TO authenticated, anon
USING (true);

CREATE POLICY "Only admins can create game schedules" 
ON public.game_schedules FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.jwt_claim_admin()
  WHERE role = 'admin'
));

CREATE POLICY "Only admins can update game schedules" 
ON public.game_schedules FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.jwt_claim_admin() 
  WHERE role = 'admin'
));

CREATE POLICY "Only admins can delete game schedules" 
ON public.game_schedules FOR DELETE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.jwt_claim_admin() 
  WHERE role = 'admin'
));

-- Seed data
INSERT INTO public.game_schedules (id, created_at, day_of_week, time, duration_minutes, location, voting_in_advance_days, voting_time, players_count, state) 
VALUES 
('05189544-8d89-4a76-b07e-9c7f2b7d51d0', '2025-03-16 01:03:18.511514+00', 'SUNDAY', '20:00:00', '120', '3ebcb7b6-37c1-4555-b1a2-252d9a13d41b', '2', '22:10:00', '12', 'ACTIVE'),
('32fe07bf-ca6f-4bb9-83e2-5947c5478d17', '2025-03-16 01:03:18.511514+00', 'THURSDAY', '21:00:00', '120', '3ebcb7b6-37c1-4555-b1a2-252d9a13d41b', '2', '22:00:00', '12', 'ACTIVE'),
('3ac54cad-2d6d-48bb-86f0-54f7fbd80ef9', '2025-03-16 01:03:18.511514+00', 'SATURDAY', '20:00:00', '120', '3ebcb7b6-37c1-4555-b1a2-252d9a13d41b', '2', '22:00:00', '12', 'ACTIVE'),
('97a60c40-2fb2-460d-8c6a-37efe9a95708', '2025-03-16 01:03:18.511514+00', 'TUESDAY', '20:00:00', '120', '3ebcb7b6-37c1-4555-b1a2-252d9a13d41b', '2', '22:00:00', '12', 'ACTIVE'),
('c3394bc3-a1d4-41c2-a75c-7cbc0c685d97', '2025-03-16 01:03:18.511514+00', 'MONDAY', '20:00:00', '120', '3ebcb7b6-37c1-4555-b1a2-252d9a13d41b', '2', '22:00:00', '12', 'ACTIVE'),
('d4f97d6d-da82-4536-8cc6-84207d186c10', '2025-03-16 01:03:18.511514+00', 'FRIDAY', '20:00:00', '120', '3ebcb7b6-37c1-4555-b1a2-252d9a13d41b', '2', '22:00:00', '12', 'ACTIVE'),
('dc8b6df9-63e6-4aa7-9263-16f401fe9e0c', '2025-03-16 01:03:18.511514+00', 'MONDAY', '23:01:00', '120', '3ebcb7b6-37c1-4555-b1a2-252d9a13d41b', '2', '12:58:00', '12', 'ACTIVE');