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

-- Enable Row Level Security
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Games are viewable by everyone" 
ON public.games FOR SELECT 
TO authenticated, anon
USING (true);

CREATE POLICY "Only admins can create games" 
ON public.games FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.jwt_claim_admin()
  WHERE role = 'admin'
));

CREATE POLICY "Only admins can update games" 
ON public.games FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.jwt_claim_admin() 
  WHERE role = 'admin'
));

CREATE POLICY "Only admins can delete games" 
ON public.games FOR DELETE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.jwt_claim_admin() 
  WHERE role = 'admin'
));