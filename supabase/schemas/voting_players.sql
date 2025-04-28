create table if not exists public.voting_players (
    id uuid default gen_random_uuid() not null,
    created_at timestamp with time zone default now() not null,
    player_id bigint not null,
    voting_id uuid not null
);

comment on table public.voting_players is 'Links players to voting sessions for game participation.';

alter table only public.voting_players
    add constraint voting_players_pkey primary key (id);

-- Enable Row Level Security
ALTER TABLE public.voting_players ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Voting players are viewable by everyone" 
ON public.voting_players FOR SELECT 
TO authenticated, anon
USING (true);

CREATE POLICY "Only admins can create voting players" 
ON public.voting_players FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.jwt_claim_admin()
  WHERE role = 'admin'
));

CREATE POLICY "Only admins can update voting players" 
ON public.voting_players FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.jwt_claim_admin() 
  WHERE role = 'admin'
));

CREATE POLICY "Only admins can delete voting players" 
ON public.voting_players FOR DELETE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.jwt_claim_admin() 
  WHERE role = 'admin'
));