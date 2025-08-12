create extension if not exists "pgjwt" with schema "extensions";


drop policy "Users can insert their own votes" on "public"."votes";

drop policy "Users can view their own votes" on "public"."votes";

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



