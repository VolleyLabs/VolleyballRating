CREATE TABLE IF NOT EXISTS public.votes (
    id uuid default extensions.uuid_generate_v4() not null,
    voter_id bigint,
    player_a bigint,
    player_b bigint,
    winner_id bigint, -- NULL if skipped/user doesn't know
    created_at timestamp without time zone default now()
);

COMMENT ON TABLE public.votes IS 'Stores voting records where users compare two players and select a winner.';

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_player_a_fkey FOREIGN KEY (player_a) REFERENCES public.users(id);

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_player_b_fkey FOREIGN KEY (player_b) REFERENCES public.users(id);

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_voter_id_fkey FOREIGN KEY (voter_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES public.users(id);