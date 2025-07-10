drop function if exists "public"."touch_updated_at"();

drop function if exists "public"."update_updated_at_column"();

alter table "public"."users" drop column "chat_id";

alter table "public"."users" add column "allows_write_to_pm" boolean;

alter table "public"."users" add column "is_bot" boolean default false;

alter table "public"."users" add column "is_premium" boolean;

alter table "public"."users" add column "language_code" text;

alter table "public"."users" add column "last_auth" timestamp without time zone default now();

alter table "public"."users" add column "updated_at" timestamp without time zone default now();

alter table "public"."users" alter column "power_group" set default 2;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$function$
;

CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION set_updated_at();


