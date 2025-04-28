create table "public"."admins" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "user_id" bigint not null,
    "granted_by" bigint
);


alter table "public"."admins" enable row level security;

alter table "public"."game_locations" enable row level security;

alter table "public"."game_schedules" enable row level security;

alter table "public"."games" enable row level security;

alter table "public"."users" enable row level security;

alter table "public"."votes" enable row level security;

alter table "public"."voting_players" enable row level security;

alter table "public"."votings" enable row level security;

CREATE UNIQUE INDEX admins_pkey ON public.admins USING btree (id);

alter table "public"."admins" add constraint "admins_pkey" PRIMARY KEY using index "admins_pkey";

alter table "public"."admins" add constraint "admins_granted_by_fkey" FOREIGN KEY (granted_by) REFERENCES users(id) not valid;

alter table "public"."admins" validate constraint "admins_granted_by_fkey";

alter table "public"."admins" add constraint "admins_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) not valid;

alter table "public"."admins" validate constraint "admins_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.jwt_claim_admin()
 RETURNS TABLE(role text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT COALESCE(current_setting('request.jwt.claim.app_metadata.role', TRUE), '') AS role;
$function$
;

grant delete on table "public"."admins" to "anon";

grant insert on table "public"."admins" to "anon";

grant references on table "public"."admins" to "anon";

grant select on table "public"."admins" to "anon";

grant trigger on table "public"."admins" to "anon";

grant truncate on table "public"."admins" to "anon";

grant update on table "public"."admins" to "anon";

grant delete on table "public"."admins" to "authenticated";

grant insert on table "public"."admins" to "authenticated";

grant references on table "public"."admins" to "authenticated";

grant select on table "public"."admins" to "authenticated";

grant trigger on table "public"."admins" to "authenticated";

grant truncate on table "public"."admins" to "authenticated";

grant update on table "public"."admins" to "authenticated";

grant delete on table "public"."admins" to "service_role";

grant insert on table "public"."admins" to "service_role";

grant references on table "public"."admins" to "service_role";

grant select on table "public"."admins" to "service_role";

grant trigger on table "public"."admins" to "service_role";

grant truncate on table "public"."admins" to "service_role";

grant update on table "public"."admins" to "service_role";

create policy "Admins table is viewable by admins only"
on "public"."admins"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));


create policy "Only admins can create admin records"
on "public"."admins"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));


create policy "Only admins can delete admin records"
on "public"."admins"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));


create policy "Only admins can update admin records"
on "public"."admins"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));


create policy "Game locations are viewable by everyone"
on "public"."game_locations"
as permissive
for select
to authenticated, anon
using (true);


create policy "Only admins can create game locations"
on "public"."game_locations"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));


create policy "Only admins can delete game locations"
on "public"."game_locations"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));


create policy "Only admins can update game locations"
on "public"."game_locations"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));


create policy "Game schedules are viewable by everyone"
on "public"."game_schedules"
as permissive
for select
to authenticated, anon
using (true);


create policy "Only admins can create game schedules"
on "public"."game_schedules"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));


create policy "Only admins can delete game schedules"
on "public"."game_schedules"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));


create policy "Only admins can update game schedules"
on "public"."game_schedules"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));


create policy "Games are viewable by everyone"
on "public"."games"
as permissive
for select
to authenticated, anon
using (true);


create policy "Only admins can create games"
on "public"."games"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));


create policy "Only admins can delete games"
on "public"."games"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));


create policy "Only admins can update games"
on "public"."games"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));


create policy "Public users are viewable by everyone"
on "public"."users"
as permissive
for select
to authenticated, anon
using (true);


create policy "Users can update own record"
on "public"."users"
as permissive
for update
to authenticated
using (((auth.uid())::text = (id)::text))
with check (((auth.uid())::text = (id)::text));


create policy "Admins can view all votes"
on "public"."votes"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));


create policy "Users can insert their own votes"
on "public"."votes"
as permissive
for insert
to authenticated
with check (((auth.uid())::text = (voter_id)::text));


create policy "Users can view their own votes"
on "public"."votes"
as permissive
for select
to authenticated
using (((auth.uid())::text = (voter_id)::text));


create policy "Only admins can create voting players"
on "public"."voting_players"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));


create policy "Only admins can delete voting players"
on "public"."voting_players"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));


create policy "Only admins can update voting players"
on "public"."voting_players"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));


create policy "Voting players are viewable by everyone"
on "public"."voting_players"
as permissive
for select
to authenticated, anon
using (true);


create policy "Only admins can create votings"
on "public"."votings"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));


create policy "Only admins can delete votings"
on "public"."votings"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));


create policy "Only admins can update votings"
on "public"."votings"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM jwt_claim_admin() jwt_claim_admin(role)
  WHERE (jwt_claim_admin.role = 'admin'::text))));


create policy "Votings are viewable by everyone"
on "public"."votings"
as permissive
for select
to authenticated, anon
using (true);



