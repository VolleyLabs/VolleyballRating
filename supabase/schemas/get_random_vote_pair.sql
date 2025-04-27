create or replace function public.get_random_vote_pair(voter_id_param bigint)
returns table(
    player_a_id bigint,
    player_a_first_name text,
    player_a_last_name text,
    player_a_username text,
    player_a_photo_url text,
    player_b_id bigint,
    player_b_first_name text,
    player_b_last_name text,
    player_b_username text,
    player_b_photo_url text
)
language plpgsql
security invoker
set search_path = ''
as $$
begin
    return query
    select 
        u1.id, u1.first_name, u1.last_name, u1.username, u1.photo_url,
        u2.id, u2.first_name, u2.last_name, u2.username, u2.photo_url
    from public.users u1, public.users u2
    where u1.id < u2.id
      and u1.id != voter_id_param
      and u2.id != voter_id_param
      and not exists (
        select 1 from public.votes v
        where v.voter_id = voter_id_param
          and ((v.player_a = u1.id and v.player_b = u2.id) or (v.player_a = u2.id and v.player_b = u1.id))
          and v.created_at > now() - interval '30 days'
      )
    order by random()
    limit 100;
end;
$$;

comment on function public.get_random_vote_pair(bigint) is 'Returns a random pair of players for voting that the voter has not voted on in the last 30 days.'; 