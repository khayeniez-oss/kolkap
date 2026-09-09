begin;

alter table if exists public.workspace_website_chat_settings
add column if not exists last_seen_at timestamptz;

alter table if exists public.customer_conversations
add column if not exists customer_email text;

create table if not exists public.website_chat_rate_limit_events (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,
  rate_key_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists website_chat_rate_limit_lookup_idx
on public.website_chat_rate_limit_events (workspace_id, rate_key_hash, created_at desc);

create index if not exists website_chat_rate_limit_created_idx
on public.website_chat_rate_limit_events (created_at);

create index if not exists website_chat_rate_limit_created_idx
on public.website_chat_rate_limit_events (created_at);

alter table public.website_chat_rate_limit_events enable row level security;

revoke all on table public.website_chat_rate_limit_events from public;
revoke all on table public.website_chat_rate_limit_events from anon;
revoke all on table public.website_chat_rate_limit_events from authenticated;
grant all on table public.website_chat_rate_limit_events to service_role;

revoke all on sequence public.website_chat_rate_limit_events_id_seq from public;
revoke all on sequence public.website_chat_rate_limit_events_id_seq from anon;
revoke all on sequence public.website_chat_rate_limit_events_id_seq from authenticated;
grant usage, select on sequence public.website_chat_rate_limit_events_id_seq to service_role;

create or replace function public.check_website_chat_rate_limit(
  p_workspace_id uuid,
  p_rate_key_hash text,
  p_request_limit integer default 12,
  p_window_seconds integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
  safe_limit integer := greatest(1, least(coalesce(p_request_limit, 12), 100));
  safe_window integer := greatest(10, least(coalesce(p_window_seconds, 60), 3600));
begin
  if p_workspace_id is null or coalesce(trim(p_rate_key_hash), '') = '' then
    return false;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_workspace_id::text || ':' || p_rate_key_hash, 0)
  );

  delete from public.website_chat_rate_limit_events
  where created_at < now() - interval '1 hour';

  select count(*)
  into current_count
  from public.website_chat_rate_limit_events
  where workspace_id = p_workspace_id
    and rate_key_hash = p_rate_key_hash
    and created_at >= now() - make_interval(secs => safe_window);

  if current_count >= safe_limit then
    return false;
  end if;

  insert into public.website_chat_rate_limit_events (
    workspace_id,
    rate_key_hash
  ) values (
    p_workspace_id,
    p_rate_key_hash
  );

  return true;
end;
$$;

revoke all on function public.check_website_chat_rate_limit(uuid, text, integer, integer)
from public;

revoke execute on function public.check_website_chat_rate_limit(uuid, text, integer, integer)
from anon;

revoke execute on function public.check_website_chat_rate_limit(uuid, text, integer, integer)
from authenticated;

grant execute on function public.check_website_chat_rate_limit(uuid, text, integer, integer)
to service_role;

commit;
