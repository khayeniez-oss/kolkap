begin;

-- Fail explicitly if old duplicate links exist; never reassign an owner's number.
create unique index if not exists workspace_whatsapp_connections_meta_phone_unique
  on public.workspace_whatsapp_connections(meta_phone_number_id)
  where meta_phone_number_id is not null;

alter table public.whatsapp_connection_secrets enable row level security;
revoke all on table public.whatsapp_connection_secrets from public, anon, authenticated;
grant select, insert, update, delete on table public.whatsapp_connection_secrets to service_role;

create table if not exists public.whatsapp_number_registration_secrets (
  connection_id uuid primary key references public.workspace_whatsapp_connections(id) on delete cascade,
  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,
  registration_pin text not null check (registration_pin ~ '^[0-9]{6}$'),
  created_at timestamptz not null default now()
);

alter table public.whatsapp_number_registration_secrets enable row level security;
revoke all on table public.whatsapp_number_registration_secrets from public, anon, authenticated;
grant select, insert, update, delete on table public.whatsapp_number_registration_secrets to service_role;

comment on table public.whatsapp_number_registration_secrets is
  'Server-only two-step verification PINs for new Cloud API numbers. Never used to register Business-app Coexistence numbers.';

create table if not exists public.whatsapp_business_app_echoes (
  connection_id uuid not null references public.workspace_whatsapp_connections(id) on delete cascade,
  meta_message_id text not null,
  created_at timestamptz not null default now(),
  primary key (connection_id, meta_message_id)
);
alter table public.whatsapp_business_app_echoes enable row level security;
revoke all on table public.whatsapp_business_app_echoes from public, anon, authenticated;
grant select, insert, delete on table public.whatsapp_business_app_echoes to service_role;

-- One transaction records the app reply and pauses the AI. A failed write
-- rolls back the deduplication marker too, so Meta can retry the whole event.
create or replace function public.record_whatsapp_business_app_echo(
  p_connection_id uuid,
  p_meta_message_id text,
  p_customer_phone text,
  p_message_text text,
  p_message_type text,
  p_sent_at timestamptz
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  connection public.workspace_whatsapp_connections%rowtype;
  conversation_id uuid;
  inbox_message_id uuid;
begin
  if p_meta_message_id is null or p_meta_message_id = '' or
     p_customer_phone is null or p_customer_phone !~ '^[0-9]{7,15}$' or
     p_message_text is null or p_sent_at is null then
    raise exception 'Invalid business app message';
  end if;
  select * into connection from public.workspace_whatsapp_connections
    where id = p_connection_id and provider = 'meta';
  if not found then return false; end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(connection.workspace_id::text || ':' || p_customer_phone, 0)
  );
  insert into public.whatsapp_business_app_echoes(connection_id, meta_message_id)
    values(p_connection_id, p_meta_message_id) on conflict do nothing;
  if not found then return false; end if;

  select c.id into conversation_id from public.customer_conversations c
    where c.workspace_id = connection.workspace_id
      and c.customer_channel = 'whatsapp' and c.customer_phone = p_customer_phone
    order by c.updated_at desc limit 1 for update;

  if conversation_id is null then
    insert into public.customer_conversations(
      workspace_id, owner_user_id, ai_staff_id, customer_phone, customer_channel,
      status, lead_status, handover_requested, last_message, last_message_at
    ) values (
      connection.workspace_id, connection.owner_user_id, connection.selected_ai_staff_id,
      p_customer_phone, 'whatsapp', 'open', 'new', true, p_message_text, p_sent_at
    ) returning id into conversation_id;
  else
    update public.customer_conversations c set
      handover_requested = true,
      last_message = case when c.last_message_at is null or c.last_message_at <= p_sent_at
        then p_message_text else c.last_message end,
      last_message_at = greatest(c.last_message_at, p_sent_at),
      updated_at = now()
    where c.id = conversation_id;
  end if;

  insert into public.customer_messages(
    conversation_id, workspace_id, owner_user_id, ai_staff_id, sender_type, message_text, created_at
  ) values (
    conversation_id, connection.workspace_id, connection.owner_user_id,
    connection.selected_ai_staff_id, 'human', p_message_text, p_sent_at
  ) returning id into inbox_message_id;

  insert into public.whatsapp_message_logs(
    workspace_id, connection_id, conversation_id, customer_message_id, direction, status,
    customer_phone, display_phone_number, meta_phone_number_id, meta_waba_id,
    meta_message_id, message_type, message_text, credits_used, created_at
  ) values (
    connection.workspace_id, connection.id, conversation_id, inbox_message_id, 'outbound', 'sent',
    p_customer_phone, connection.display_phone_number, connection.meta_phone_number_id,
    connection.meta_waba_id, p_meta_message_id, p_message_type, p_message_text, 0, p_sent_at
  );
  update public.workspace_whatsapp_connections c set
    last_outbound_at = greatest(c.last_outbound_at, p_sent_at), updated_at = now()
    where c.id = connection.id;
  return true;
end;
$$;

revoke all on function public.record_whatsapp_business_app_echo(uuid,text,text,text,text,timestamptz)
  from public, anon, authenticated;
grant execute on function public.record_whatsapp_business_app_echo(uuid,text,text,text,text,timestamptz)
  to service_role;

commit;
