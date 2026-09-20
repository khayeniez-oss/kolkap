begin;

-- Gmail/Google Workspace connection metadata. OAuth secrets live in the
-- separate server-only table below and are never exposed to browser clients.
create table if not exists public.workspace_email_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'google' check (provider = 'google'),
  mailbox_email text,
  google_subject text,
  connection_label text,
  status text not null default 'connecting' check (
    status in (
      'connecting',
      'connected',
      'reauthorization_required',
      'paused',
      'failed',
      'revoked'
    )
  ),
  granted_scopes text[] not null default '{}'::text[],
  selected_ai_staff_id uuid references public.ai_staff(id) on delete set null,
  ai_enabled boolean not null default false,
  auto_reply_enabled boolean not null default false,
  handover_enabled boolean not null default true,
  is_primary boolean not null default false,
  last_history_id text,
  watch_topic_name text,
  watch_expiration timestamptz,
  last_watch_renewed_at timestamptz,
  last_history_sync_at timestamptz,
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  last_error_at timestamptz,
  last_error_code text,
  last_error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (mailbox_email is null or length(mailbox_email) between 3 and 320),
  check (google_subject is null or length(google_subject) between 1 and 255),
  check (last_history_id is null or last_history_id ~ '^[0-9]+$')
);

create unique index if not exists workspace_email_google_subject_unique
  on public.workspace_email_connections(provider, google_subject)
  where google_subject is not null;

create unique index if not exists workspace_email_mailbox_unique
  on public.workspace_email_connections(workspace_id, lower(mailbox_email))
  where mailbox_email is not null;

create unique index if not exists workspace_email_one_primary_idx
  on public.workspace_email_connections(workspace_id)
  where is_primary = true and status <> 'revoked';

create index if not exists workspace_email_status_idx
  on public.workspace_email_connections(workspace_id, status);

create index if not exists workspace_email_watch_renewal_idx
  on public.workspace_email_connections(watch_expiration)
  where status = 'connected';

create table if not exists public.email_connection_secrets (
  connection_id uuid primary key references public.workspace_email_connections(id) on delete cascade,
  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,
  refresh_token_ciphertext text not null,
  token_key_version integer not null default 1 check (token_key_version > 0),
  refresh_token_expires_at timestamptz,
  last_refreshed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(refresh_token_ciphertext) between 20 and 20000)
);

comment on table public.email_connection_secrets is
  'Server-only encrypted Google OAuth refresh tokens. The encryption key and Google OAuth client secret must remain outside the database.';

-- One-time OAuth state and encrypted PKCE verifier. The callback consumes the
-- row, preventing state replay and cross-workspace mailbox attachment.
create table if not exists public.email_oauth_states (
  state_hash text primary key,
  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  pkce_verifier_ciphertext text not null,
  return_to text,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz not null default now(),
  check (state_hash ~ '^[a-f0-9]{64}$'),
  check (length(pkce_verifier_ciphertext) between 20 and 20000),
  check (return_to is null or (left(return_to, 1) = '/' and left(return_to, 2) <> '//'))
);

create index if not exists email_oauth_states_expiry_idx
  on public.email_oauth_states(expires_at);

-- Reuse the shared inbox while preserving Gmail's stable thread identity.
alter table public.customer_conversations
  add column if not exists email_connection_id uuid references public.workspace_email_connections(id) on delete set null,
  add column if not exists email_thread_id text,
  add column if not exists email_subject text,
  add column if not exists email_last_customer_at timestamptz;

create unique index if not exists customer_email_thread_unique
  on public.customer_conversations(email_connection_id, email_thread_id)
  where customer_channel = 'email'
    and email_connection_id is not null
    and email_thread_id is not null;

create index if not exists customer_email_customer_idx
  on public.customer_conversations(email_connection_id, lower(customer_email), last_message_at desc)
  where customer_channel = 'email' and email_connection_id is not null;

-- Provider identifiers and delivery facts are kept separately from the inbox
-- body. provider_metadata must contain only operational metadata, never OAuth
-- tokens or duplicated raw email bodies.
create table if not exists public.email_message_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,
  connection_id uuid not null references public.workspace_email_connections(id) on delete cascade,
  conversation_id uuid not null references public.customer_conversations(id) on delete cascade,
  customer_message_id uuid references public.customer_messages(id) on delete set null,
  direction text not null check (direction in ('inbound', 'outbound')),
  status text not null check (status in ('received', 'sent', 'failed', 'unknown')),
  gmail_message_id text not null,
  gmail_thread_id text not null,
  rfc_message_id text,
  sender_email text,
  recipient_emails text[] not null default '{}'::text[],
  cc_emails text[] not null default '{}'::text[],
  subject text,
  snippet text,
  provider_metadata jsonb not null default '{}'::jsonb,
  credits_used integer not null default 0 check (credits_used >= 0),
  message_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(connection_id, gmail_message_id),
  check (length(gmail_message_id) between 1 and 512),
  check (length(gmail_thread_id) between 1 and 512),
  check (rfc_message_id is null or length(rfc_message_id) <= 998)
);

create index if not exists email_message_logs_thread_idx
  on public.email_message_logs(connection_id, gmail_thread_id, message_at);

create index if not exists email_message_logs_conversation_idx
  on public.email_message_logs(conversation_id, message_at);

-- Durable jobs make Pub/Sub and HTTP retries idempotent. Automatic AI email
-- replies are charged only when Gmail has accepted the send.
create table if not exists public.email_message_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,
  connection_id uuid not null references public.workspace_email_connections(id) on delete cascade,
  conversation_id uuid not null references public.customer_conversations(id) on delete cascade,
  request_key text not null,
  inbound_message_id uuid references public.customer_messages(id) on delete set null,
  gmail_inbound_id text,
  outbound_message_id uuid references public.customer_messages(id) on delete set null,
  gmail_outbound_id text,
  rfc_outbound_message_id text,
  reply_kind text not null check (reply_kind in ('ai', 'human', 'suggestion')),
  reply_text text,
  reply_payload jsonb not null default '{}'::jsonb,
  ai_staff_id uuid references public.ai_staff(id) on delete set null,
  requested_by_user_id uuid,
  phase text not null default 'pending' check (
    phase in ('pending', 'generating', 'ready', 'generated', 'sending', 'sent', 'failed', 'skipped', 'unknown')
  ),
  lease_token uuid,
  lease_expires_at timestamptz,
  handover_version bigint not null default 0,
  credit_cost integer not null default 0 check (credit_cost >= 0),
  credits_recorded integer not null default 0 check (credits_recorded >= 0),
  usage_recorded boolean not null default false,
  delivery_status text,
  delivery_status_at timestamptz,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(connection_id, request_key),
  check (gmail_inbound_id is null or length(gmail_inbound_id) between 1 and 512),
  check (gmail_outbound_id is null or length(gmail_outbound_id) between 1 and 512),
  check (rfc_outbound_message_id is null or length(rfc_outbound_message_id) <= 998)
);

create unique index if not exists email_jobs_gmail_outbound_unique
  on public.email_message_jobs(connection_id, gmail_outbound_id)
  where gmail_outbound_id is not null;

create unique index if not exists email_jobs_rfc_outbound_unique
  on public.email_message_jobs(connection_id, rfc_outbound_message_id)
  where rfc_outbound_message_id is not null;

create index if not exists email_jobs_pending_idx
  on public.email_message_jobs(connection_id, created_at)
  where phase in ('pending', 'generating', 'ready', 'sending', 'unknown');

create or replace function public.set_email_record_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_workspace_email_connections_updated_at on public.workspace_email_connections;
create trigger set_workspace_email_connections_updated_at
before update on public.workspace_email_connections
for each row execute function public.set_email_record_updated_at();

drop trigger if exists set_email_connection_secrets_updated_at on public.email_connection_secrets;
create trigger set_email_connection_secrets_updated_at
before update on public.email_connection_secrets
for each row execute function public.set_email_record_updated_at();

drop trigger if exists set_email_message_logs_updated_at on public.email_message_logs;
create trigger set_email_message_logs_updated_at
before update on public.email_message_logs
for each row execute function public.set_email_record_updated_at();

drop trigger if exists set_email_message_jobs_updated_at on public.email_message_jobs;
create trigger set_email_message_jobs_updated_at
before update on public.email_message_jobs
for each row execute function public.set_email_record_updated_at();

create or replace function public.guard_email_conversation_binding()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.customer_channel = 'email' then
    if new.email_connection_id is null or nullif(new.email_thread_id, '') is null then
      raise exception 'Email conversations require a mailbox connection and Gmail thread.';
    end if;
  elsif new.email_connection_id is not null or new.email_thread_id is not null then
    raise exception 'Email identifiers can only be attached to email conversations.';
  end if;

  if new.email_connection_id is not null and not exists (
    select 1
    from public.workspace_email_connections connection
    where connection.id = new.email_connection_id
      and connection.workspace_id = new.workspace_id
  ) then
    raise exception 'Email connection must belong to the same workspace.';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_email_conversation_binding() from public, anon, authenticated;

drop trigger if exists kolkap_guard_email_conversation on public.customer_conversations;
create trigger kolkap_guard_email_conversation
before insert or update on public.customer_conversations
for each row execute function public.guard_email_conversation_binding();

-- Add email to the shared AI assignment layer.
alter table public.channel_ai_assignments
  drop constraint if exists channel_ai_assignments_channel_type_check;

alter table public.channel_ai_assignments
  add constraint channel_ai_assignments_channel_type_check
  check (channel_type in ('website_chat', 'whatsapp', 'email')) not valid;

alter table public.channel_ai_assignments
  validate constraint channel_ai_assignments_channel_type_check;

create or replace function public.validate_channel_ai_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  channel_exists boolean;
  staff_exists boolean;
begin
  select exists (
    select 1
    from public.ai_staff staff
    where staff.id = new.ai_staff_id
      and staff.workspace_id = new.workspace_id
      and staff.deleted_at is null
      and coalesce(staff.status, 'active') = 'active'
  ) into staff_exists;

  if not staff_exists then
    raise exception 'AI staff must be active and belong to the same workspace.';
  end if;

  if new.channel_type = 'website_chat' then
    select exists (
      select 1
      from public.workspace_website_chat_settings settings
      where settings.id = new.channel_connection_id
        and settings.workspace_id = new.workspace_id
    ) into channel_exists;
  elsif new.channel_type = 'whatsapp' then
    select exists (
      select 1
      from public.workspace_whatsapp_connections connection
      where connection.id = new.channel_connection_id
        and connection.workspace_id = new.workspace_id
    ) into channel_exists;
  elsif new.channel_type = 'email' then
    select exists (
      select 1
      from public.workspace_email_connections connection
      where connection.id = new.channel_connection_id
        and connection.workspace_id = new.workspace_id
        and connection.status <> 'revoked'
    ) into channel_exists;
  else
    channel_exists := false;
  end if;

  if not channel_exists then
    raise exception 'Channel connection must belong to the same workspace.';
  end if;

  if new.is_default = true and new.is_enabled = true then
    update public.channel_ai_assignments
    set is_default = false,
        updated_at = now()
    where workspace_id = new.workspace_id
      and channel_type = new.channel_type
      and channel_connection_id = new.channel_connection_id
      and id is distinct from new.id
      and is_default = true;
  end if;

  return new;
end;
$$;

revoke all on function public.validate_channel_ai_assignment() from public, anon, authenticated;

-- All sensitive and delivery tables are backend-only. The non-secret
-- connection record is readable by workspace inbox users, but mutations still
-- pass through server routes and the service role.
alter table public.workspace_email_connections enable row level security;
alter table public.email_connection_secrets enable row level security;
alter table public.email_oauth_states enable row level security;
alter table public.email_message_logs enable row level security;
alter table public.email_message_jobs enable row level security;

revoke all on table public.workspace_email_connections from public, anon, authenticated;
grant select on table public.workspace_email_connections to authenticated;
grant select, insert, update, delete on table public.workspace_email_connections to service_role;

drop policy if exists workspace_email_connections_select_inbox on public.workspace_email_connections;
create policy workspace_email_connections_select_inbox
on public.workspace_email_connections
for select to authenticated
using (public.kolkap_can_manage_inbox(workspace_id));

revoke all on table public.email_connection_secrets from public, anon, authenticated;
revoke all on table public.email_oauth_states from public, anon, authenticated;
revoke all on table public.email_message_logs from public, anon, authenticated;
revoke all on table public.email_message_jobs from public, anon, authenticated;

grant select, insert, update, delete on table public.email_connection_secrets to service_role;
grant select, insert, update, delete on table public.email_oauth_states to service_role;
grant select, insert, update, delete on table public.email_message_logs to service_role;
grant select, insert, update, delete on table public.email_message_jobs to service_role;

drop policy if exists kolkap_email_assignments_insert on public.channel_ai_assignments;
create policy kolkap_email_assignments_insert
on public.channel_ai_assignments as restrictive
for insert to authenticated
with check (channel_type <> 'email');

drop policy if exists kolkap_email_assignments_update on public.channel_ai_assignments;
create policy kolkap_email_assignments_update
on public.channel_ai_assignments as restrictive
for update to authenticated
using (channel_type <> 'email')
with check (channel_type <> 'email');

drop policy if exists kolkap_email_assignments_delete on public.channel_ai_assignments;
create policy kolkap_email_assignments_delete
on public.channel_ai_assignments as restrictive
for delete to authenticated
using (channel_type <> 'email');

create or replace function public.create_email_oauth_state(
  p_state_hash text,
  p_workspace_id uuid,
  p_actor_user_id uuid,
  p_pkce_verifier_ciphertext text,
  p_return_to text default '/dashboard/integrations/email'
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  state_row public.email_oauth_states%rowtype;
begin
  if p_state_hash is null or p_state_hash !~ '^[a-f0-9]{64}$'
    or length(coalesce(p_pkce_verifier_ciphertext, '')) not between 20 and 20000
    or p_return_to is null or left(p_return_to, 1) <> '/' or left(p_return_to, 2) = '//' then
    raise exception 'Invalid OAuth state.';
  end if;

  if not exists (
    select 1
    from public.business_workspaces workspace
    where workspace.id = p_workspace_id
      and workspace.owner_user_id = p_actor_user_id
  ) then
    raise exception 'Only the workspace owner can connect a mailbox.';
  end if;

  delete from public.email_oauth_states where expires_at <= now();

  insert into public.email_oauth_states(
    state_hash,
    workspace_id,
    actor_user_id,
    pkce_verifier_ciphertext,
    return_to
  ) values (
    p_state_hash,
    p_workspace_id,
    p_actor_user_id,
    p_pkce_verifier_ciphertext,
    p_return_to
  )
  on conflict (state_hash) do nothing
  returning * into state_row;

  if state_row.state_hash is null then
    raise exception 'OAuth state already exists.';
  end if;

  return to_jsonb(state_row);
end;
$$;

create or replace function public.consume_email_oauth_state(p_state_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  state_row public.email_oauth_states%rowtype;
begin
  delete from public.email_oauth_states
  where state_hash = p_state_hash
    and expires_at > now()
  returning * into state_row;

  if state_row.state_hash is null then
    raise exception 'OAuth state is invalid or expired.';
  end if;

  return to_jsonb(state_row);
end;
$$;

create or replace function public.complete_workspace_email_connection(
  p_workspace_id uuid,
  p_actor_user_id uuid,
  p_connection_id uuid,
  p_mailbox_email text,
  p_google_subject text,
  p_granted_scopes text[],
  p_refresh_token_ciphertext text,
  p_token_key_version integer,
  p_initial_history_id text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  owner_id uuid;
  connection_row public.workspace_email_connections%rowtype;
  resolved_connection_id uuid;
  normalized_email text := lower(btrim(coalesce(p_mailbox_email, '')));
  safe_scopes text[] := coalesce(p_granted_scopes, '{}'::text[]);
begin
  select workspace.owner_user_id into owner_id
  from public.business_workspaces workspace
  where workspace.id = p_workspace_id
  for update;

  if owner_id is null or owner_id <> p_actor_user_id then
    raise exception 'Only the workspace owner can connect a mailbox.';
  end if;

  if length(normalized_email) not between 3 and 320
    or position('@' in normalized_email) <= 1
    or length(coalesce(p_google_subject, '')) not between 1 and 255
    or (p_initial_history_id is not null and p_initial_history_id !~ '^[0-9]+$') then
    raise exception 'Invalid Google mailbox identity.';
  end if;

  if not exists (
    select 1 from unnest(safe_scopes) scope
    where scope in ('https://www.googleapis.com/auth/gmail.readonly', 'https://mail.google.com/')
  ) or not exists (
    select 1 from unnest(safe_scopes) scope
    where scope in ('https://www.googleapis.com/auth/gmail.send', 'https://mail.google.com/')
  ) then
    raise exception 'Gmail read-only and send permissions are required.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('google-mailbox:' || p_google_subject, 0));

  if exists (
    select 1
    from public.workspace_email_connections connection
    where connection.provider = 'google'
      and connection.google_subject = p_google_subject
      and connection.workspace_id <> p_workspace_id
  ) then
    raise exception 'This Google mailbox is already connected to another workspace.';
  end if;

  resolved_connection_id := p_connection_id;
  if resolved_connection_id is null then
    select connection.id into resolved_connection_id
    from public.workspace_email_connections connection
    where connection.workspace_id = p_workspace_id
      and connection.provider = 'google'
      and connection.google_subject = p_google_subject;
  elsif not exists (
    select 1
    from public.workspace_email_connections connection
    where connection.id = resolved_connection_id
      and connection.workspace_id = p_workspace_id
      and connection.provider = 'google'
  ) then
    raise exception 'Email connection was not found.';
  end if;

  if resolved_connection_id is null then
    insert into public.workspace_email_connections(
      workspace_id,
      owner_user_id,
      provider,
      mailbox_email,
      google_subject,
      status,
      granted_scopes,
      last_history_id
    ) values (
      p_workspace_id,
      owner_id,
      'google',
      normalized_email,
      p_google_subject,
      'connected',
      safe_scopes,
      p_initial_history_id
    ) returning * into connection_row;
    resolved_connection_id := connection_row.id;
  else
    update public.workspace_email_connections connection
    set mailbox_email = normalized_email,
        google_subject = p_google_subject,
        status = 'connected',
        granted_scopes = safe_scopes,
        last_history_id = coalesce(p_initial_history_id, connection.last_history_id),
        watch_expiration = null,
        last_error_at = null,
        last_error_code = null,
        last_error_message = null,
        updated_at = now()
    where connection.id = resolved_connection_id
    returning * into connection_row;
  end if;

  if nullif(p_refresh_token_ciphertext, '') is not null then
    insert into public.email_connection_secrets(
      connection_id,
      workspace_id,
      refresh_token_ciphertext,
      token_key_version
    ) values (
      resolved_connection_id,
      p_workspace_id,
      p_refresh_token_ciphertext,
      greatest(coalesce(p_token_key_version, 1), 1)
    )
    on conflict (connection_id) do update
    set workspace_id = excluded.workspace_id,
        refresh_token_ciphertext = excluded.refresh_token_ciphertext,
        token_key_version = excluded.token_key_version,
        updated_at = now();
  elsif not exists (
    select 1
    from public.email_connection_secrets secret
    where secret.connection_id = resolved_connection_id
  ) then
    raise exception 'Google did not return a refresh token. Reconnect with consent enabled.';
  end if;

  return to_jsonb(connection_row);
end;
$$;

create or replace function public.save_workspace_email_settings(
  p_connection_id uuid,
  p_workspace_id uuid,
  p_actor_user_id uuid,
  p_settings jsonb,
  p_staff_ids uuid[]
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  connection_row public.workspace_email_connections%rowtype;
  owner_id uuid;
  staff_id uuid;
  first_id uuid;
  position_value integer := 0;
  ai_enabled_value boolean;
  auto_reply_value boolean;
  handover_value boolean;
  primary_value boolean;
begin
  select workspace.owner_user_id into owner_id
  from public.business_workspaces workspace
  where workspace.id = p_workspace_id
  for update;

  if owner_id is null or owner_id <> p_actor_user_id then
    raise exception 'Only the workspace owner can change email settings.';
  end if;

  select * into connection_row
  from public.workspace_email_connections connection
  where connection.id = p_connection_id
    and connection.workspace_id = p_workspace_id
  for update;

  if not found then
    raise exception 'Email connection was not found.';
  end if;

  first_id := nullif(p_settings->>'selected_ai_staff_id', '')::uuid;
  ai_enabled_value := coalesce((p_settings->>'ai_enabled')::boolean, connection_row.ai_enabled);
  auto_reply_value := coalesce((p_settings->>'auto_reply_enabled')::boolean, connection_row.auto_reply_enabled);
  handover_value := coalesce((p_settings->>'handover_enabled')::boolean, connection_row.handover_enabled);
  primary_value := coalesce((p_settings->>'is_primary')::boolean, connection_row.is_primary);

  if coalesce(cardinality(p_staff_ids), 0) > 50
    or (first_id is not null and not (first_id = any(coalesce(p_staff_ids, '{}'::uuid[])))) then
    raise exception 'Invalid AI team.';
  end if;

  foreach staff_id in array coalesce(p_staff_ids, '{}'::uuid[]) loop
    if not exists (
      select 1
      from public.ai_staff staff
      where staff.id = staff_id
        and staff.workspace_id = p_workspace_id
        and staff.deleted_at is null
        and coalesce(staff.status, 'active') = 'active'
    ) then
      raise exception 'Choose active AI staff from this workspace.';
    end if;
  end loop;

  if auto_reply_value and (
    connection_row.status <> 'connected'
    or not ai_enabled_value
    or first_id is null
  ) then
    raise exception 'Connect the mailbox and choose AI staff before enabling automatic replies.';
  end if;

  if primary_value then
    update public.workspace_email_connections
    set is_primary = false,
        updated_at = now()
    where workspace_id = p_workspace_id
      and id <> p_connection_id;
  end if;

  update public.workspace_email_connections connection
  set connection_label = nullif(btrim(p_settings->>'connection_label'), ''),
      selected_ai_staff_id = first_id,
      ai_enabled = ai_enabled_value,
      auto_reply_enabled = auto_reply_value,
      handover_enabled = handover_value,
      is_primary = primary_value,
      updated_at = now()
  where connection.id = p_connection_id
  returning * into connection_row;

  delete from public.channel_ai_assignments assignment
  where assignment.workspace_id = p_workspace_id
    and assignment.channel_type = 'email'
    and assignment.channel_connection_id = p_connection_id;

  foreach staff_id in array coalesce(p_staff_ids, '{}'::uuid[]) loop
    position_value := position_value + 10;
    insert into public.channel_ai_assignments(
      workspace_id,
      channel_type,
      channel_connection_id,
      ai_staff_id,
      is_enabled,
      is_default,
      priority,
      created_by_user_id
    ) values (
      p_workspace_id,
      'email',
      p_connection_id,
      staff_id,
      true,
      staff_id = first_id,
      position_value,
      p_actor_user_id
    );
  end loop;

  return to_jsonb(connection_row);
end;
$$;

create or replace function public.save_workspace_email_watch(
  p_connection_id uuid,
  p_history_id text,
  p_watch_expiration timestamptz,
  p_topic_name text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  connection_row public.workspace_email_connections%rowtype;
begin
  if p_history_id is null or p_history_id !~ '^[0-9]+$'
    or p_watch_expiration is null or p_watch_expiration <= now()
    or nullif(btrim(p_topic_name), '') is null then
    raise exception 'Invalid Gmail watch response.';
  end if;

  update public.workspace_email_connections connection
  set status = 'connected',
      last_history_id = p_history_id,
      watch_expiration = p_watch_expiration,
      watch_topic_name = p_topic_name,
      last_watch_renewed_at = now(),
      last_error_at = null,
      last_error_code = null,
      last_error_message = null,
      updated_at = now()
  where connection.id = p_connection_id
    and connection.status <> 'revoked'
  returning * into connection_row;

  if not found then
    raise exception 'Email connection was not found.';
  end if;

  return to_jsonb(connection_row);
end;
$$;

create or replace function public.advance_workspace_email_history(
  p_connection_id uuid,
  p_expected_history_id text,
  p_new_history_id text
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  connection_row public.workspace_email_connections%rowtype;
begin
  if p_new_history_id is null or p_new_history_id !~ '^[0-9]+$'
    or (p_expected_history_id is not null and p_expected_history_id !~ '^[0-9]+$') then
    raise exception 'Invalid Gmail history cursor.';
  end if;

  select * into connection_row
  from public.workspace_email_connections connection
  where connection.id = p_connection_id
  for update;

  if not found then
    raise exception 'Email connection was not found.';
  end if;

  if connection_row.last_history_id is distinct from p_expected_history_id then
    return false;
  end if;

  update public.workspace_email_connections connection
  set last_history_id = p_new_history_id,
      last_history_sync_at = now(),
      updated_at = now()
  where connection.id = p_connection_id;

  return true;
end;
$$;

create or replace function public.receive_workspace_email_message(
  p_connection_id uuid,
  p_gmail_message_id text,
  p_gmail_thread_id text,
  p_rfc_message_id text,
  p_sender_email text,
  p_sender_name text,
  p_subject text,
  p_body_text text,
  p_sent_at timestamptz,
  p_auto_reply_candidate boolean,
  p_request_human boolean,
  p_provider_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  connection_row public.workspace_email_connections%rowtype;
  conversation_row public.customer_conversations%rowtype;
  message_row public.customer_messages%rowtype;
  job_row public.email_message_jobs%rowtype;
  staff_id uuid;
  normalized_sender text := lower(btrim(coalesce(p_sender_email, '')));
  normalized_body text := coalesce(p_body_text, '');
  allow_ai boolean := false;
  skip_code text;
  remaining_credits bigint := 0;
  reserved_credits bigint := 0;
begin
  if length(coalesce(p_gmail_message_id, '')) not between 1 and 512
    or length(coalesce(p_gmail_thread_id, '')) not between 1 and 512
    or (p_rfc_message_id is not null and length(p_rfc_message_id) > 998)
    or length(normalized_sender) not between 3 and 320
    or position('@' in normalized_sender) <= 1
    or p_sent_at is null
    or p_sent_at > now() + interval '5 minutes'
    or length(normalized_body) > 100000
    or octet_length(coalesce(p_provider_metadata, '{}'::jsonb)::text) > 65536 then
    raise exception 'Invalid email message.';
  end if;

  select * into connection_row
  from public.workspace_email_connections connection
  where connection.id = p_connection_id
    and connection.provider = 'google'
    and connection.status = 'connected';

  if not found then
    raise exception 'Email connection is unavailable.';
  end if;

  if normalized_sender = lower(connection_row.mailbox_email) then
    raise exception 'Mailbox-sent messages must use the sent-message recorder.';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('email-thread:' || connection_row.id::text || ':' || p_gmail_thread_id, 0)
  );

  select job.* into job_row
  from public.email_message_jobs job
  where job.connection_id = connection_row.id
    and job.request_key = 'inbound:' || p_gmail_message_id;

  if found then
    return jsonb_build_object('created', false, 'job', to_jsonb(job_row));
  end if;

  if exists (
    select 1
    from public.email_message_logs log
    where log.connection_id = connection_row.id
      and log.gmail_message_id = p_gmail_message_id
  ) then
    return jsonb_build_object('created', false, 'legacy_duplicate', true);
  end if;

  select assignment.ai_staff_id into staff_id
  from public.channel_ai_assignments assignment
  where assignment.workspace_id = connection_row.workspace_id
    and assignment.channel_type = 'email'
    and assignment.channel_connection_id = connection_row.id
    and assignment.is_enabled
  order by assignment.is_default desc, assignment.priority asc
  limit 1;

  staff_id := coalesce(staff_id, connection_row.selected_ai_staff_id);

  select * into conversation_row
  from public.customer_conversations conversation
  where conversation.email_connection_id = connection_row.id
    and conversation.customer_channel = 'email'
    and conversation.email_thread_id = p_gmail_thread_id
  for update;

  if not found then
    insert into public.customer_conversations(
      workspace_id,
      owner_user_id,
      ai_staff_id,
      customer_name,
      customer_email,
      customer_channel,
      email_connection_id,
      email_thread_id,
      email_subject,
      email_last_customer_at,
      status,
      lead_status,
      handover_requested,
      last_message,
      last_message_at
    ) values (
      connection_row.workspace_id,
      connection_row.owner_user_id,
      staff_id,
      coalesce(nullif(btrim(p_sender_name), ''), normalized_sender),
      normalized_sender,
      'email',
      connection_row.id,
      p_gmail_thread_id,
      nullif(p_subject, ''),
      p_sent_at,
      case when coalesce(p_request_human, false) then 'handover' else 'open' end,
      'new',
      coalesce(p_request_human, false),
      case when nullif(btrim(normalized_body), '') is null then '[No text content]' else normalized_body end,
      p_sent_at
    ) returning * into conversation_row;
  else
    update public.customer_conversations conversation
    set customer_name = coalesce(nullif(btrim(p_sender_name), ''), conversation.customer_name),
        customer_email = normalized_sender,
        ai_staff_id = coalesce(staff_id, conversation.ai_staff_id),
        email_subject = coalesce(nullif(p_subject, ''), conversation.email_subject),
        email_last_customer_at = greatest(conversation.email_last_customer_at, p_sent_at),
        handover_requested = conversation.handover_requested or coalesce(p_request_human, false),
        status = case
          when conversation.handover_requested or coalesce(p_request_human, false) then 'handover'
          else 'open'
        end,
        last_message = case
          when conversation.last_message_at is null or conversation.last_message_at <= p_sent_at
            then case when nullif(btrim(normalized_body), '') is null then '[No text content]' else normalized_body end
          else conversation.last_message
        end,
        last_message_at = greatest(conversation.last_message_at, p_sent_at),
        updated_at = now()
    where conversation.id = conversation_row.id
    returning * into conversation_row;
  end if;

  insert into public.customer_messages(
    conversation_id,
    workspace_id,
    owner_user_id,
    ai_staff_id,
    sender_type,
    message_text,
    created_at,
    delivery_status
  ) values (
    conversation_row.id,
    connection_row.workspace_id,
    connection_row.owner_user_id,
    staff_id,
    'customer',
    case when nullif(btrim(normalized_body), '') is null then '[No text content]' else normalized_body end,
    p_sent_at,
    'received'
  ) returning * into message_row;

  insert into public.email_message_logs(
    workspace_id,
    connection_id,
    conversation_id,
    customer_message_id,
    direction,
    status,
    gmail_message_id,
    gmail_thread_id,
    rfc_message_id,
    sender_email,
    recipient_emails,
    subject,
    snippet,
    provider_metadata,
    credits_used,
    message_at
  ) values (
    connection_row.workspace_id,
    connection_row.id,
    conversation_row.id,
    message_row.id,
    'inbound',
    'received',
    p_gmail_message_id,
    p_gmail_thread_id,
    nullif(p_rfc_message_id, ''),
    normalized_sender,
    array[connection_row.mailbox_email],
    nullif(p_subject, ''),
    left(normalized_body, 500),
    coalesce(p_provider_metadata, '{}'::jsonb),
    0,
    p_sent_at
  );

  allow_ai := coalesce(p_auto_reply_candidate, false)
    and nullif(btrim(normalized_body), '') is not null
    and connection_row.ai_enabled
    and connection_row.auto_reply_enabled
    and not conversation_row.handover_requested
    and staff_id is not null
    and exists (
      select 1
      from public.ai_staff staff
      where staff.id = staff_id
        and staff.workspace_id = connection_row.workspace_id
        and staff.deleted_at is null
        and coalesce(staff.status, 'active') = 'active'
    );

  if not coalesce(p_auto_reply_candidate, false) then
    skip_code := 'filtered_message';
  elsif nullif(btrim(normalized_body), '') is null then
    skip_code := 'no_text_content';
  elsif conversation_row.handover_requested then
    skip_code := 'human_handover';
  elsif not connection_row.ai_enabled or not connection_row.auto_reply_enabled or staff_id is null then
    skip_code := 'ai_paused';
  end if;

  if allow_ai then
    select greatest(0, balance.plan_credits + balance.purchased_credits - balance.used_credits)
    into remaining_credits
    from public.workspace_credit_balances balance
    where balance.workspace_id = connection_row.workspace_id
    for update;

    select coalesce(sum(job.credit_cost), 0)
    into reserved_credits
    from public.email_message_jobs job
    where job.workspace_id = connection_row.workspace_id
      and job.reply_kind in ('ai', 'suggestion')
      and job.phase in ('pending', 'generating', 'ready', 'sending', 'unknown')
      and not job.usage_recorded;

    allow_ai := coalesce(remaining_credits, 0) - reserved_credits >= 3;
    if not allow_ai then
      skip_code := 'insufficient_credits';
    end if;
  end if;

  insert into public.email_message_jobs(
    workspace_id,
    connection_id,
    conversation_id,
    request_key,
    inbound_message_id,
    gmail_inbound_id,
    reply_kind,
    ai_staff_id,
    phase,
    handover_version,
    credit_cost,
    error_code,
    error_message
  ) values (
    connection_row.workspace_id,
    connection_row.id,
    conversation_row.id,
    'inbound:' || p_gmail_message_id,
    message_row.id,
    p_gmail_message_id,
    'ai',
    staff_id,
    case when allow_ai then 'pending' else 'skipped' end,
    conversation_row.handover_version,
    3,
    case when allow_ai then null else skip_code end,
    case
      when allow_ai then null
      when skip_code = 'insufficient_credits' then 'Incoming email saved. Automatic AI reply paused because the workspace has insufficient credits.'
      else 'Incoming email saved without an automatic AI reply.'
    end
  ) returning * into job_row;

  perform public.record_workspace_usage(
    p_workspace_id => connection_row.workspace_id,
    p_owner_user_id => connection_row.owner_user_id,
    p_user_id => connection_row.owner_user_id,
    p_event_type => 'customer_message_received',
    p_channel => 'email',
    p_source_page => 'gmail_push',
    p_credits_used => 0,
    p_event_count => 1,
    p_status => 'success',
    p_metadata => jsonb_build_object(
      'connection_id', connection_row.id,
      'conversation_id', conversation_row.id,
      'message_id', message_row.id,
      'email_job_id', job_row.id
    )
  );

  update public.workspace_email_connections connection
  set last_inbound_at = greatest(connection.last_inbound_at, p_sent_at),
      updated_at = now()
  where connection.id = connection_row.id;

  return jsonb_build_object(
    'created', true,
    'auto_reply_queued', allow_ai,
    'conversation', to_jsonb(conversation_row),
    'message', to_jsonb(message_row),
    'job', to_jsonb(job_row)
  );
end;
$$;

create or replace function public.prepare_email_human_send(
  p_request_id uuid,
  p_conversation_id uuid,
  p_actor_user_id uuid,
  p_text text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  conversation_row public.customer_conversations%rowtype;
  connection_row public.workspace_email_connections%rowtype;
  job_row public.email_message_jobs%rowtype;
begin
  if p_request_id is null or p_actor_user_id is null
    or length(btrim(coalesce(p_text, ''))) not between 1 and 100000 then
    raise exception 'Invalid email reply.';
  end if;

  select * into conversation_row
  from public.customer_conversations conversation
  where conversation.id = p_conversation_id
    and conversation.customer_channel = 'email'
  for update;

  if not found or conversation_row.email_connection_id is null then
    raise exception 'Email conversation was not found.';
  end if;

  if not (
    conversation_row.owner_user_id = p_actor_user_id
    or exists (
      select 1
      from auth.users actor
      join public.workspace_team_members member
        on lower(member.email) = lower(actor.email)
      where actor.id = p_actor_user_id
        and member.workspace_id = conversation_row.workspace_id
        and member.status = 'active'
        and lower(coalesce(nullif(member.permission_level::text, ''), member.role::text, ''))
          in ('admin', 'manager', 'inbox', 'inbox agent', 'sales', 'sales agent')
    )
  ) then
    raise exception 'User cannot reply from this workspace mailbox.';
  end if;

  select * into connection_row
  from public.workspace_email_connections connection
  where connection.id = conversation_row.email_connection_id
    and connection.workspace_id = conversation_row.workspace_id
    and connection.status = 'connected';

  if not found then
    raise exception 'Email connection is unavailable.';
  end if;

  select * into job_row
  from public.email_message_jobs job
  where job.connection_id = connection_row.id
    and job.request_key = 'human:' || p_request_id::text;

  if found then
    if job_row.conversation_id <> conversation_row.id
      or job_row.requested_by_user_id <> p_actor_user_id
      or job_row.reply_text <> p_text then
      raise exception 'Reply request was already used for another email.';
    end if;
    return to_jsonb(job_row);
  end if;

  update public.customer_conversations conversation
  set handover_requested = true,
      status = 'handover',
      updated_at = now()
  where conversation.id = conversation_row.id
  returning * into conversation_row;

  insert into public.email_message_jobs(
    workspace_id,
    connection_id,
    conversation_id,
    request_key,
    reply_kind,
    reply_text,
    requested_by_user_id,
    phase,
    handover_version,
    credit_cost
  ) values (
    conversation_row.workspace_id,
    connection_row.id,
    conversation_row.id,
    'human:' || p_request_id::text,
    'human',
    p_text,
    p_actor_user_id,
    'ready',
    conversation_row.handover_version,
    0
  ) returning * into job_row;

  return to_jsonb(job_row);
end;
$$;

-- A human-requested AI suggestion is separate from an automatic reply. It is
-- charged once only after generation succeeds, whether or not the human later
-- sends or edits it. Sending the chosen text is a separate zero-credit human
-- job created by prepare_email_human_send.
create or replace function public.prepare_email_ai_suggestion(
  p_request_id uuid,
  p_conversation_id uuid,
  p_actor_user_id uuid,
  p_ai_staff_id uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  conversation_row public.customer_conversations%rowtype;
  connection_row public.workspace_email_connections%rowtype;
  job_row public.email_message_jobs%rowtype;
  chosen_staff_id uuid;
  remaining_credits bigint := 0;
  reserved_credits bigint := 0;
begin
  if p_request_id is null or p_actor_user_id is null then
    raise exception 'Invalid AI suggestion request.';
  end if;

  select * into conversation_row
  from public.customer_conversations conversation
  where conversation.id = p_conversation_id
    and conversation.customer_channel = 'email'
  for update;

  if not found or conversation_row.email_connection_id is null then
    raise exception 'Email conversation was not found.';
  end if;

  if not (
    conversation_row.owner_user_id = p_actor_user_id
    or exists (
      select 1
      from auth.users actor
      join public.workspace_team_members member
        on lower(member.email) = lower(actor.email)
      where actor.id = p_actor_user_id
        and member.workspace_id = conversation_row.workspace_id
        and member.status = 'active'
        and lower(coalesce(nullif(member.permission_level::text, ''), member.role::text, ''))
          in ('admin', 'manager', 'inbox', 'inbox agent', 'sales', 'sales agent')
    )
  ) then
    raise exception 'User cannot request AI suggestions for this workspace.';
  end if;

  select * into connection_row
  from public.workspace_email_connections connection
  where connection.id = conversation_row.email_connection_id
    and connection.workspace_id = conversation_row.workspace_id
    and connection.status = 'connected';

  if not found then
    raise exception 'Email connection is unavailable.';
  end if;

  select * into job_row
  from public.email_message_jobs job
  where job.connection_id = connection_row.id
    and job.request_key = 'suggestion:' || p_request_id::text;

  if found then
    if job_row.conversation_id <> conversation_row.id
      or job_row.requested_by_user_id <> p_actor_user_id
      or (p_ai_staff_id is not null and job_row.ai_staff_id <> p_ai_staff_id) then
      raise exception 'Suggestion request was already used for another email.';
    end if;
    return to_jsonb(job_row);
  end if;

  select assignment.ai_staff_id into chosen_staff_id
  from public.channel_ai_assignments assignment
  where assignment.workspace_id = conversation_row.workspace_id
    and assignment.channel_type = 'email'
    and assignment.channel_connection_id = connection_row.id
    and assignment.is_enabled
    and (p_ai_staff_id is null or assignment.ai_staff_id = p_ai_staff_id)
  order by assignment.is_default desc, assignment.priority asc
  limit 1;

  chosen_staff_id := coalesce(chosen_staff_id, p_ai_staff_id, connection_row.selected_ai_staff_id);

  if chosen_staff_id is null or not exists (
    select 1
    from public.ai_staff staff
    where staff.id = chosen_staff_id
      and staff.workspace_id = conversation_row.workspace_id
      and staff.deleted_at is null
      and coalesce(staff.status, 'active') = 'active'
  ) then
    raise exception 'Choose active AI staff from this workspace.';
  end if;

  select greatest(0, balance.plan_credits + balance.purchased_credits - balance.used_credits)
  into remaining_credits
  from public.workspace_credit_balances balance
  where balance.workspace_id = conversation_row.workspace_id
  for update;

  select coalesce(sum(job.credit_cost), 0)
  into reserved_credits
  from public.email_message_jobs job
  where job.workspace_id = conversation_row.workspace_id
    and job.reply_kind in ('ai', 'suggestion')
    and job.phase in ('pending', 'generating', 'ready', 'sending', 'unknown')
    and not job.usage_recorded;

  if coalesce(remaining_credits, 0) - reserved_credits < 3 then
    raise exception 'Insufficient credits for an AI email suggestion.';
  end if;

  update public.customer_conversations conversation
  set handover_requested = true,
      status = 'handover',
      updated_at = now()
  where conversation.id = conversation_row.id
  returning * into conversation_row;

  insert into public.email_message_jobs(
    workspace_id,
    connection_id,
    conversation_id,
    request_key,
    reply_kind,
    ai_staff_id,
    requested_by_user_id,
    phase,
    handover_version,
    credit_cost
  ) values (
    conversation_row.workspace_id,
    connection_row.id,
    conversation_row.id,
    'suggestion:' || p_request_id::text,
    'suggestion',
    chosen_staff_id,
    p_actor_user_id,
    'pending',
    conversation_row.handover_version,
    3
  ) returning * into job_row;

  return to_jsonb(job_row);
end;
$$;

create or replace function public.email_job_step(
  p_job_id uuid,
  p_action text,
  p_token uuid,
  p_data jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  job_row public.email_message_jobs%rowtype;
  conversation_row public.customer_conversations%rowtype;
  connection_row public.workspace_email_connections%rowtype;
  message_row public.customer_messages%rowtype;
  chosen_staff_id uuid;
  event_time timestamptz;
  provider_message_id text;
  provider_rfc_message_id text;
  remaining_credits bigint := 0;
  earlier_reserved bigint := 0;
begin
  select * into job_row
  from public.email_message_jobs job
  where job.id = p_job_id
  for update;

  if not found then
    raise exception 'Unknown email job.';
  end if;

  select * into connection_row
  from public.workspace_email_connections connection
  where connection.id = job_row.connection_id;

  select * into conversation_row
  from public.customer_conversations conversation
  where conversation.id = job_row.conversation_id
  for update;

  if connection_row.id is null or conversation_row.id is null then
    raise exception 'Email job binding is unavailable.';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      'email-thread:' || connection_row.id::text || ':' || coalesce(conversation_row.email_thread_id, conversation_row.id::text),
      0
    )
  );

  if p_action = 'claim' then
    if job_row.phase = 'sending' and job_row.lease_expires_at <= now() then
      update public.email_message_jobs job
      set phase = 'unknown',
          delivery_status = 'unknown',
          error_code = 'delivery_unconfirmed',
          error_message = 'Gmail delivery is unconfirmed. Reconcile the Sent folder before retrying.',
          lease_token = null,
          lease_expires_at = null,
          updated_at = now()
      where job.id = job_row.id
      returning * into job_row;
    end if;

    if job_row.phase in ('generated', 'sent', 'failed', 'skipped', 'unknown') then
      return jsonb_build_object('action', 'done', 'job', to_jsonb(job_row));
    end if;

    if job_row.lease_token is not null and job_row.lease_expires_at > now() then
      return jsonb_build_object('action', 'busy');
    end if;

    if exists (
      select 1
      from public.email_message_jobs other
      where other.conversation_id = job_row.conversation_id
        and other.id <> job_row.id
        and other.lease_expires_at > now()
        and other.phase in ('generating', 'ready', 'sending')
    ) then
      return jsonb_build_object('action', 'busy');
    end if;

    update public.email_message_jobs job
    set lease_token = gen_random_uuid(),
        lease_expires_at = now() + interval '2 minutes',
        phase = case when job.phase = 'ready' then 'ready' else 'generating' end,
        updated_at = now()
    where job.id = job_row.id
    returning * into job_row;

    return jsonb_build_object(
      'action', case when job_row.phase = 'ready' then 'send' else 'generate' end,
      'job', to_jsonb(job_row)
    );
  end if;

  if p_action <> 'accepted' and (
    job_row.lease_token is distinct from p_token
    or p_token is null
    or job_row.lease_expires_at <= now()
  ) then
    raise exception 'Email processing lease expired.';
  end if;

  if p_action = 'release' then
    update public.email_message_jobs job
    set lease_token = null,
        lease_expires_at = null,
        updated_at = now()
    where job.id = job_row.id
      and job.phase in ('generating', 'ready');

  elsif p_action = 'ready' then
    if job_row.phase = 'ready' then
      return to_jsonb(job_row);
    end if;

    if job_row.reply_kind not in ('ai', 'suggestion')
      or job_row.phase <> 'generating'
      or length(btrim(coalesce(p_data->>'text', ''))) not between 1 and 100000 then
      raise exception 'Invalid generated email reply.';
    end if;

    if job_row.reply_kind = 'suggestion' then
      select greatest(0, balance.plan_credits + balance.purchased_credits - balance.used_credits)
      into remaining_credits
      from public.workspace_credit_balances balance
      where balance.workspace_id = job_row.workspace_id
      for update;

      select coalesce(sum(other.credit_cost), 0)
      into earlier_reserved
      from public.email_message_jobs other
      where other.workspace_id = job_row.workspace_id
        and other.reply_kind in ('ai', 'suggestion')
        and other.id <> job_row.id
        and other.phase in ('pending', 'generating', 'ready', 'sending', 'unknown')
        and not other.usage_recorded
        and (other.created_at, other.id) < (job_row.created_at, job_row.id);

      if coalesce(remaining_credits, 0) - earlier_reserved < job_row.credit_cost then
        update public.email_message_jobs job
        set phase = 'skipped',
            error_code = 'insufficient_credits',
            error_message = 'AI suggestion was not generated because the workspace has insufficient credits.',
            lease_token = null,
            lease_expires_at = null,
            updated_at = now()
        where job.id = job_row.id;
      else
        perform public.record_workspace_usage(
          p_workspace_id => job_row.workspace_id,
          p_owner_user_id => connection_row.owner_user_id,
          p_user_id => job_row.requested_by_user_id,
          p_event_type => 'ai_reply_generated',
          p_channel => 'email',
          p_source_page => 'dashboard_inbox',
          p_credits_used => job_row.credit_cost,
          p_event_count => 1,
          p_status => 'success',
          p_metadata => jsonb_build_object(
            'email_job_id', job_row.id,
            'connection_id', connection_row.id,
            'conversation_id', conversation_row.id,
            'suggestion_only', true
          )
        );

        update public.email_message_jobs job
        set reply_text = p_data->>'text',
            reply_payload = coalesce(p_data->'metadata', '{}'::jsonb),
            phase = 'generated',
            credits_recorded = job.credit_cost,
            usage_recorded = true,
            lease_token = null,
            lease_expires_at = null,
            updated_at = now()
        where job.id = job_row.id;
      end if;
    else
      -- Automatic email replies are not charged at generation time. They are
      -- charged exactly once after Gmail accepts the send.
      update public.email_message_jobs job
      set reply_text = p_data->>'text',
          reply_payload = coalesce(p_data->'metadata', '{}'::jsonb),
          phase = 'ready',
          lease_expires_at = now() + interval '2 minutes',
          updated_at = now()
      where job.id = job_row.id;
    end if;

  elsif p_action = 'skip' then
    update public.email_message_jobs job
    set phase = 'skipped',
        error_code = p_data->>'code',
        error_message = p_data->>'message',
        lease_token = null,
        lease_expires_at = null,
        updated_at = now()
    where job.id = job_row.id
      and job.phase in ('generating', 'ready');

  elsif p_action = 'begin_send' then
    if job_row.reply_kind = 'suggestion' or job_row.phase <> 'ready' then
      raise exception 'Email reply is not ready.';
    end if;

    provider_rfc_message_id := nullif(p_data->>'rfc_message_id', '');
    if provider_rfc_message_id is null or length(provider_rfc_message_id) > 998 then
      raise exception 'A deterministic RFC Message-ID is required before sending.';
    end if;

    select assignment.ai_staff_id into chosen_staff_id
    from public.channel_ai_assignments assignment
    where assignment.workspace_id = job_row.workspace_id
      and assignment.channel_type = 'email'
      and assignment.channel_connection_id = job_row.connection_id
      and assignment.is_enabled
    order by assignment.is_default desc, assignment.priority asc
    limit 1;

    chosen_staff_id := coalesce(chosen_staff_id, connection_row.selected_ai_staff_id);

    if connection_row.status <> 'connected'
      or conversation_row.email_connection_id is distinct from connection_row.id
      or (
        job_row.reply_kind = 'ai'
        and (
          conversation_row.handover_requested
          or conversation_row.handover_version <> job_row.handover_version
          or not connection_row.ai_enabled
          or not connection_row.auto_reply_enabled
          or chosen_staff_id is distinct from job_row.ai_staff_id
        )
      ) then
      update public.email_message_jobs job
      set phase = 'skipped',
          error_code = 'ai_paused',
          error_message = 'Reply stopped because the mailbox or conversation settings changed.',
          lease_token = null,
          lease_expires_at = null,
          updated_at = now()
      where job.id = job_row.id
      returning * into job_row;
      return to_jsonb(job_row);
    end if;

    if job_row.reply_kind = 'ai' then
      select greatest(0, balance.plan_credits + balance.purchased_credits - balance.used_credits)
      into remaining_credits
      from public.workspace_credit_balances balance
      where balance.workspace_id = job_row.workspace_id
      for update;

      select coalesce(sum(other.credit_cost), 0)
      into earlier_reserved
      from public.email_message_jobs other
      where other.workspace_id = job_row.workspace_id
        and other.reply_kind in ('ai', 'suggestion')
        and other.id <> job_row.id
        and other.phase in ('pending', 'generating', 'ready', 'sending', 'unknown')
        and not other.usage_recorded
        and (other.created_at, other.id) < (job_row.created_at, job_row.id);

      if coalesce(remaining_credits, 0) - earlier_reserved < job_row.credit_cost then
        update public.email_message_jobs job
        set phase = 'skipped',
            error_code = 'insufficient_credits',
            error_message = 'Automatic AI reply paused because the workspace has insufficient credits.',
            lease_token = null,
            lease_expires_at = null,
            updated_at = now()
        where job.id = job_row.id
        returning * into job_row;
        return to_jsonb(job_row);
      end if;
    end if;

    update public.email_message_jobs job
    set phase = 'sending',
        rfc_outbound_message_id = provider_rfc_message_id,
        lease_expires_at = now() + interval '2 minutes',
        updated_at = now()
    where job.id = job_row.id;

  elsif p_action in ('failed', 'unknown') then
    if job_row.phase not in ('sending', 'ready') then
      return to_jsonb(job_row);
    end if;

    update public.email_message_jobs job
    set phase = p_action,
        delivery_status = p_action,
        error_code = p_data->>'code',
        error_message = p_data->>'message',
        lease_token = null,
        lease_expires_at = null,
        updated_at = now()
    where job.id = job_row.id;

    update public.workspace_email_connections connection
    set last_error_at = now(),
        last_error_code = coalesce(p_data->>'code', 'delivery_unconfirmed'),
        last_error_message = p_data->>'message',
        updated_at = now()
    where connection.id = connection_row.id;

  elsif p_action = 'accepted' then
    provider_message_id := nullif(p_data->>'gmail_message_id', '');
    provider_rfc_message_id := nullif(p_data->>'rfc_message_id', '');

    if provider_message_id is null or length(provider_message_id) > 512 then
      raise exception 'Gmail message ID is required.';
    end if;

    if job_row.gmail_outbound_id is not null
      and job_row.gmail_outbound_id <> provider_message_id then
      raise exception 'Gmail message ID does not match this job.';
    end if;

    if job_row.rfc_outbound_message_id is not null
      and provider_rfc_message_id is not null
      and job_row.rfc_outbound_message_id <> provider_rfc_message_id then
      raise exception 'RFC Message-ID does not match this job.';
    end if;

    if job_row.phase = 'sent' and job_row.gmail_outbound_id = provider_message_id then
      return to_jsonb(job_row);
    end if;

    if job_row.phase not in ('sending', 'unknown', 'failed') then
      raise exception 'No email send was attempted.';
    end if;

    event_time := coalesce((p_data->>'at')::timestamptz, now());

    if not job_row.usage_recorded then
      perform public.record_workspace_usage(
        p_workspace_id => job_row.workspace_id,
        p_owner_user_id => connection_row.owner_user_id,
        p_user_id => case when job_row.reply_kind = 'human' then job_row.requested_by_user_id else connection_row.owner_user_id end,
        p_event_type => case when job_row.reply_kind = 'ai' then 'ai_reply_sent' else 'human_reply_sent' end,
        p_channel => 'email',
        p_source_page => case when job_row.reply_kind = 'ai' then 'gmail_push' else 'dashboard_inbox' end,
        p_credits_used => case when job_row.reply_kind = 'ai' then job_row.credit_cost else 0 end,
        p_event_count => 1,
        p_status => 'success',
        p_metadata => jsonb_build_object(
          'email_job_id', job_row.id,
          'connection_id', connection_row.id,
          'conversation_id', conversation_row.id,
          'gmail_message_id', provider_message_id
        )
      );
    end if;

    if job_row.outbound_message_id is null then
      insert into public.customer_messages(
        conversation_id,
        workspace_id,
        owner_user_id,
        ai_staff_id,
        sender_type,
        message_text,
        delivery_status,
        created_at
      ) values (
        conversation_row.id,
        job_row.workspace_id,
        connection_row.owner_user_id,
        job_row.ai_staff_id,
        case when job_row.reply_kind = 'ai' then 'ai' else 'human' end,
        job_row.reply_text,
        'sent',
        event_time
      ) returning * into message_row;

      insert into public.email_message_logs(
        workspace_id,
        connection_id,
        conversation_id,
        customer_message_id,
        direction,
        status,
        gmail_message_id,
        gmail_thread_id,
        rfc_message_id,
        sender_email,
        recipient_emails,
        subject,
        snippet,
        provider_metadata,
        credits_used,
        message_at
      ) values (
        job_row.workspace_id,
        connection_row.id,
        conversation_row.id,
        message_row.id,
        'outbound',
        'sent',
        provider_message_id,
        conversation_row.email_thread_id,
        coalesce(provider_rfc_message_id, job_row.rfc_outbound_message_id),
        connection_row.mailbox_email,
        case when conversation_row.customer_email is null then '{}'::text[] else array[conversation_row.customer_email] end,
        conversation_row.email_subject,
        left(job_row.reply_text, 500),
        coalesce(p_data->'metadata', '{}'::jsonb),
        case when job_row.reply_kind = 'ai' then job_row.credit_cost else 0 end,
        event_time
      );

      update public.customer_conversations conversation
      set last_message = job_row.reply_text,
          last_message_at = event_time,
          updated_at = now()
      where conversation.id = conversation_row.id;
    else
      select * into message_row
      from public.customer_messages message
      where message.id = job_row.outbound_message_id;

      update public.customer_messages message
      set delivery_status = 'sent',
          delivery_error = null
      where message.id = job_row.outbound_message_id;
    end if;

    update public.email_message_jobs job
    set phase = 'sent',
        gmail_outbound_id = provider_message_id,
        rfc_outbound_message_id = coalesce(provider_rfc_message_id, job.rfc_outbound_message_id),
        outbound_message_id = coalesce(job.outbound_message_id, message_row.id),
        credits_recorded = case when job.reply_kind = 'ai' then job.credit_cost else 0 end,
        usage_recorded = true,
        delivery_status = 'sent',
        delivery_status_at = event_time,
        error_code = null,
        error_message = null,
        lease_token = null,
        lease_expires_at = null,
        updated_at = now()
    where job.id = job_row.id;

    update public.workspace_email_connections connection
    set last_outbound_at = greatest(connection.last_outbound_at, event_time),
        last_error_at = null,
        last_error_code = null,
        last_error_message = null,
        updated_at = now()
    where connection.id = connection_row.id;

  else
    raise exception 'Unknown email job action.';
  end if;

  select * into job_row
  from public.email_message_jobs job
  where job.id = p_job_id;

  return to_jsonb(job_row);
end;
$$;

-- Sent-folder synchronization identifies direct human replies and pauses AI.
-- A deterministic RFC Message-ID links Kolkap-generated sends back to their
-- existing job, so a Gmail history notification cannot turn them into a second
-- message or a second charge.
create or replace function public.record_workspace_email_sent_message(
  p_connection_id uuid,
  p_gmail_message_id text,
  p_gmail_thread_id text,
  p_rfc_message_id text,
  p_customer_email text,
  p_subject text,
  p_body_text text,
  p_sent_at timestamptz,
  p_provider_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  connection_row public.workspace_email_connections%rowtype;
  conversation_row public.customer_conversations%rowtype;
  message_row public.customer_messages%rowtype;
  job_row public.email_message_jobs%rowtype;
  normalized_customer text := lower(btrim(coalesce(p_customer_email, '')));
begin
  if length(coalesce(p_gmail_message_id, '')) not between 1 and 512
    or length(coalesce(p_gmail_thread_id, '')) not between 1 and 512
    or (p_rfc_message_id is not null and length(p_rfc_message_id) > 998)
    or length(coalesce(p_body_text, '')) > 100000
    or p_sent_at is null
    or p_sent_at > now() + interval '5 minutes'
    or octet_length(coalesce(p_provider_metadata, '{}'::jsonb)::text) > 65536 then
    raise exception 'Invalid sent email message.';
  end if;

  select * into connection_row
  from public.workspace_email_connections connection
  where connection.id = p_connection_id
    and connection.provider = 'google'
    and connection.status <> 'revoked';

  if not found then
    raise exception 'Email connection is unavailable.';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('email-thread:' || connection_row.id::text || ':' || p_gmail_thread_id, 0)
  );

  if exists (
    select 1
    from public.email_message_logs log
    where log.connection_id = connection_row.id
      and log.gmail_message_id = p_gmail_message_id
  ) then
    return jsonb_build_object('created', false, 'duplicate', true);
  end if;

  select * into job_row
  from public.email_message_jobs job
  where job.connection_id = connection_row.id
    and (
      job.gmail_outbound_id = p_gmail_message_id
      or (
        nullif(p_rfc_message_id, '') is not null
        and job.rfc_outbound_message_id = p_rfc_message_id
      )
    )
  order by job.created_at desc
  limit 1
  for update;

  if found then
    return jsonb_build_object(
      'created', false,
      'known_job', true,
      'job', public.email_job_step(
        job_row.id,
        'accepted',
        null,
        jsonb_build_object(
          'gmail_message_id', p_gmail_message_id,
          'rfc_message_id', p_rfc_message_id,
          'at', p_sent_at,
          'metadata', coalesce(p_provider_metadata, '{}'::jsonb)
        )
      )
    );
  end if;

  select * into conversation_row
  from public.customer_conversations conversation
  where conversation.email_connection_id = connection_row.id
    and conversation.customer_channel = 'email'
    and conversation.email_thread_id = p_gmail_thread_id
  for update;

  if not found then
    if length(normalized_customer) not between 3 and 320
      or position('@' in normalized_customer) <= 1 then
      raise exception 'Customer email is required for a new sent thread.';
    end if;

    insert into public.customer_conversations(
      workspace_id,
      owner_user_id,
      customer_name,
      customer_email,
      customer_channel,
      email_connection_id,
      email_thread_id,
      email_subject,
      status,
      lead_status,
      handover_requested,
      last_message,
      last_message_at
    ) values (
      connection_row.workspace_id,
      connection_row.owner_user_id,
      normalized_customer,
      normalized_customer,
      'email',
      connection_row.id,
      p_gmail_thread_id,
      nullif(p_subject, ''),
      'handover',
      'new',
      true,
      case when nullif(btrim(coalesce(p_body_text, '')), '') is null then '[No text content]' else p_body_text end,
      p_sent_at
    ) returning * into conversation_row;
  else
    update public.customer_conversations conversation
    set handover_requested = true,
        status = 'handover',
        customer_email = coalesce(nullif(normalized_customer, ''), conversation.customer_email),
        email_subject = coalesce(nullif(p_subject, ''), conversation.email_subject),
        last_message = case
          when conversation.last_message_at is null or conversation.last_message_at <= p_sent_at
            then case when nullif(btrim(coalesce(p_body_text, '')), '') is null then '[No text content]' else p_body_text end
          else conversation.last_message
        end,
        last_message_at = greatest(conversation.last_message_at, p_sent_at),
        updated_at = now()
    where conversation.id = conversation_row.id
    returning * into conversation_row;
  end if;

  insert into public.customer_messages(
    conversation_id,
    workspace_id,
    owner_user_id,
    sender_type,
    message_text,
    delivery_status,
    created_at
  ) values (
    conversation_row.id,
    connection_row.workspace_id,
    connection_row.owner_user_id,
    'human',
    case when nullif(btrim(coalesce(p_body_text, '')), '') is null then '[No text content]' else p_body_text end,
    'sent',
    p_sent_at
  ) returning * into message_row;

  insert into public.email_message_logs(
    workspace_id,
    connection_id,
    conversation_id,
    customer_message_id,
    direction,
    status,
    gmail_message_id,
    gmail_thread_id,
    rfc_message_id,
    sender_email,
    recipient_emails,
    subject,
    snippet,
    provider_metadata,
    credits_used,
    message_at
  ) values (
    connection_row.workspace_id,
    connection_row.id,
    conversation_row.id,
    message_row.id,
    'outbound',
    'sent',
    p_gmail_message_id,
    p_gmail_thread_id,
    nullif(p_rfc_message_id, ''),
    connection_row.mailbox_email,
    case when normalized_customer = '' then '{}'::text[] else array[normalized_customer] end,
    nullif(p_subject, ''),
    left(coalesce(p_body_text, ''), 500),
    coalesce(p_provider_metadata, '{}'::jsonb),
    0,
    p_sent_at
  );

  perform public.record_workspace_usage(
    p_workspace_id => connection_row.workspace_id,
    p_owner_user_id => connection_row.owner_user_id,
    p_user_id => connection_row.owner_user_id,
    p_event_type => 'human_reply_sent',
    p_channel => 'email',
    p_source_page => 'gmail_sent_sync',
    p_credits_used => 0,
    p_event_count => 1,
    p_status => 'success',
    p_metadata => jsonb_build_object(
      'connection_id', connection_row.id,
      'conversation_id', conversation_row.id,
      'message_id', message_row.id,
      'gmail_message_id', p_gmail_message_id
    )
  );

  update public.workspace_email_connections connection
  set last_outbound_at = greatest(connection.last_outbound_at, p_sent_at),
      updated_at = now()
  where connection.id = connection_row.id;

  return jsonb_build_object(
    'created', true,
    'human_reply', true,
    'conversation', to_jsonb(conversation_row),
    'message', to_jsonb(message_row)
  );
end;
$$;

-- Every function below handles credentials, provider events, delivery, or
-- credits and is therefore callable only by trusted server routes.
revoke all on function public.create_email_oauth_state(text, uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.consume_email_oauth_state(text) from public, anon, authenticated;
revoke all on function public.complete_workspace_email_connection(uuid, uuid, uuid, text, text, text[], text, integer, text) from public, anon, authenticated;
revoke all on function public.save_workspace_email_settings(uuid, uuid, uuid, jsonb, uuid[]) from public, anon, authenticated;
revoke all on function public.save_workspace_email_watch(uuid, text, timestamptz, text) from public, anon, authenticated;
revoke all on function public.advance_workspace_email_history(uuid, text, text) from public, anon, authenticated;
revoke all on function public.receive_workspace_email_message(uuid, text, text, text, text, text, text, text, timestamptz, boolean, boolean, jsonb) from public, anon, authenticated;
revoke all on function public.prepare_email_human_send(uuid, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.prepare_email_ai_suggestion(uuid, uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.email_job_step(uuid, text, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.record_workspace_email_sent_message(uuid, text, text, text, text, text, text, timestamptz, jsonb) from public, anon, authenticated;

grant execute on function public.create_email_oauth_state(text, uuid, uuid, text, text) to service_role;
grant execute on function public.consume_email_oauth_state(text) to service_role;
grant execute on function public.complete_workspace_email_connection(uuid, uuid, uuid, text, text, text[], text, integer, text) to service_role;
grant execute on function public.save_workspace_email_settings(uuid, uuid, uuid, jsonb, uuid[]) to service_role;
grant execute on function public.save_workspace_email_watch(uuid, text, timestamptz, text) to service_role;
grant execute on function public.advance_workspace_email_history(uuid, text, text) to service_role;
grant execute on function public.receive_workspace_email_message(uuid, text, text, text, text, text, text, text, timestamptz, boolean, boolean, jsonb) to service_role;
grant execute on function public.prepare_email_human_send(uuid, uuid, uuid, text) to service_role;
grant execute on function public.prepare_email_ai_suggestion(uuid, uuid, uuid, uuid) to service_role;
grant execute on function public.email_job_step(uuid, text, uuid, jsonb) to service_role;
grant execute on function public.record_workspace_email_sent_message(uuid, text, text, text, text, text, text, timestamptz, jsonb) to service_role;

commit;
