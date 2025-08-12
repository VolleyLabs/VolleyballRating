drop extension if exists "pgjwt";

drop policy "Users can insert their own votes" on "public"."votes";

drop policy "Users can view their own votes" on "public"."votes";


  create policy "Users can insert their own votes"
  on "public"."votes"
  as permissive
  for insert
  to authenticated
with check ((voter_id = ( SELECT
        CASE
            WHEN (((auth.jwt() -> 'app_metadata'::text) ->> 'tg_id'::text) IS NOT NULL) THEN (((auth.jwt() -> 'app_metadata'::text) ->> 'tg_id'::text))::bigint
            WHEN (((auth.jwt() -> 'user_metadata'::text) ->> 'tg_id'::text) IS NOT NULL) THEN (((auth.jwt() -> 'user_metadata'::text) ->> 'tg_id'::text))::bigint
            ELSE NULL::bigint
        END AS "case")));



  create policy "Users can view their own votes"
  on "public"."votes"
  as permissive
  for select
  to authenticated
using ((voter_id = ( SELECT
        CASE
            WHEN (((auth.jwt() -> 'app_metadata'::text) ->> 'tg_id'::text) IS NOT NULL) THEN (((auth.jwt() -> 'app_metadata'::text) ->> 'tg_id'::text))::bigint
            WHEN (((auth.jwt() -> 'user_metadata'::text) ->> 'tg_id'::text) IS NOT NULL) THEN (((auth.jwt() -> 'user_metadata'::text) ->> 'tg_id'::text))::bigint
            ELSE NULL::bigint
        END AS "case")));



