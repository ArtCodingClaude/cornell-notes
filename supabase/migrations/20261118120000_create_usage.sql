-- Daily message counter for the chat Edge Function.
-- One row per user per day. Only the Edge Function (service_role) reads or
-- writes it: RLS is on and there are no policies, so the browser can't touch it.

create table public.usage (
  user_id uuid    not null references auth.users (id) on delete cascade,
  date    date    not null,
  count   integer not null default 0 check (count >= 0),
  primary key (user_id, date)
);

alter table public.usage enable row level security;

-- Counts one message for today (Brussels time) if the user is under the limit.
-- Returns how many messages are left after this one, or -1 if the limit is
-- already reached (in that case nothing is counted).
-- Done in one statement so two messages sent at the same time can't both slip
-- past the limit.
create or replace function public.consume_message(p_user_id uuid, p_limit integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Europe/Brussels')::date;
  v_count integer;
begin
  insert into public.usage as u (user_id, date, count)
  values (p_user_id, v_today, 1)
  on conflict (user_id, date)
  do update set count = u.count + 1
  where u.count < p_limit
  returning u.count into v_count;

  if v_count is null then
    return -1;
  end if;

  return p_limit - v_count;
end;
$$;

revoke all on function public.consume_message(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_message(uuid, integer) to service_role;
