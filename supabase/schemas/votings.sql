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

-- Enable Row Level Security
ALTER TABLE public.votings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Votings are viewable by everyone" 
ON public.votings FOR SELECT 
TO authenticated, anon
USING (true);

CREATE POLICY "Only admins can create votings" 
ON public.votings FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.jwt_claim_admin()
  WHERE role = 'admin'
));

CREATE POLICY "Only admins can update votings" 
ON public.votings FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.jwt_claim_admin() 
  WHERE role = 'admin'
));

CREATE POLICY "Only admins can delete votings" 
ON public.votings FOR DELETE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.jwt_claim_admin() 
  WHERE role = 'admin'
));