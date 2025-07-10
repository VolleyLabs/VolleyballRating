CREATE TABLE IF NOT EXISTS public.users (
    id bigint NOT NULL,  -- Telegram user ID
    first_name text NOT NULL,
    last_name text,
    username text,
    photo_url text,
    language_code text,
    is_premium boolean,
    allows_write_to_pm boolean,
    is_bot boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    last_auth timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    admin boolean DEFAULT false,
    pickup_height integer,
    is_female boolean DEFAULT false NOT NULL,
    power_group int2 DEFAULT 2 NOT NULL,
    another_name text,
    share_stats boolean DEFAULT false NOT NULL
);

COMMENT ON TABLE public.users IS 'Main users table storing Telegram user information for the Telegram mini app.';

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public users are viewable by everyone" 
ON public.users FOR SELECT 
TO authenticated, anon
USING (true);

CREATE POLICY "Users can update own record" 
ON public.users FOR UPDATE 
TO authenticated
USING (auth.uid()::text = id::text) 
WITH CHECK (auth.uid()::text = id::text);

-- Trigger to keep updated_at current on row modification
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY invoker
set search_path = ''
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();