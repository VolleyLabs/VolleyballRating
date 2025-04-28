CREATE TABLE IF NOT EXISTS public.admins (
    id uuid default gen_random_uuid() not null,
    created_at timestamp with time zone default now() not null,
    user_id bigint not null,
    granted_by bigint
);

COMMENT ON TABLE public.admins IS 'Stores admin users who have elevated permissions within the application.';

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.users(id);

-- Enable Row Level Security
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins table is viewable by admins only" 
ON public.admins FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.jwt_claim_admin()
  WHERE role = 'admin'
));

CREATE POLICY "Only admins can create admin records" 
ON public.admins FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.jwt_claim_admin()
  WHERE role = 'admin'
));

CREATE POLICY "Only admins can update admin records" 
ON public.admins FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.jwt_claim_admin() 
  WHERE role = 'admin'
));

CREATE POLICY "Only admins can delete admin records" 
ON public.admins FOR DELETE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.jwt_claim_admin() 
  WHERE role = 'admin'
)); 