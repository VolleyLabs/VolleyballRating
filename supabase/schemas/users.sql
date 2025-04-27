CREATE TABLE IF NOT EXISTS public.users (
    id bigint NOT NULL,  -- Telegram user ID
    first_name text NOT NULL,
    last_name text,
    username text,
    photo_url text,
    created_at timestamp without time zone DEFAULT now(),
    admin boolean DEFAULT false,
    chat_id text,
    pickup_height integer
);

COMMENT ON TABLE public.users IS 'Main users table storing Telegram user information for the Telegram mini app.';

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);