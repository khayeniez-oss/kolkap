begin;

alter table public.customer_conversations
  add column if not exists whatsapp_connection_id uuid references public.workspace_whatsapp_connections(id) on delete set null,
  add column if not exists whatsapp_last_customer_at timestamptz,
  add column if not exists handover_version bigint not null default 0;
alter table public.customer_messages
  add column if not exists delivery_status text,
  add column if not exists delivery_error text;
alter table public.whatsapp_message_logs add column if not exists delivery_status text;

-- Only attach unambiguous legacy history. Mixed-number history remains readable;
-- new messages get their own correctly bound conversation. No history is deleted.
with candidates as (
  select c.id, (array_agg(distinct w.id))[1] as connection_id,
    max(l.created_at) filter (where l.direction = 'inbound') as last_customer_at
  from public.customer_conversations c
  join public.whatsapp_message_logs l on l.conversation_id = c.id
  join public.workspace_whatsapp_connections w on w.id = l.connection_id and w.workspace_id = c.workspace_id
  where c.customer_channel = 'whatsapp' and c.whatsapp_connection_id is null
  group by c.id having count(distinct w.id) = 1
), ranked as (
  select x.*, row_number() over (partition by x.connection_id, c.customer_phone order by c.updated_at desc, c.id) as n
  from candidates x join public.customer_conversations c on c.id = x.id
)
update public.customer_conversations c set whatsapp_connection_id = r.connection_id,
  whatsapp_last_customer_at = r.last_customer_at
from ranked r where r.id = c.id and r.n = 1 and not exists (
  select 1 from public.customer_conversations bound where bound.whatsapp_connection_id=r.connection_id
  and bound.customer_phone=c.customer_phone and bound.customer_channel='whatsapp'
);

create unique index if not exists customer_whatsapp_number_customer_unique
  on public.customer_conversations(whatsapp_connection_id, customer_phone)
  where customer_channel = 'whatsapp' and whatsapp_connection_id is not null;

create unique index if not exists kolkap_meta_phone_unique
  on public.workspace_whatsapp_connections(meta_phone_number_id)
  where provider='meta' and meta_phone_number_id is not null;
revoke insert,update,delete on public.workspace_whatsapp_connections from anon,authenticated;
drop policy if exists kolkap_whatsapp_assignments_insert on public.channel_ai_assignments;
create policy kolkap_whatsapp_assignments_insert on public.channel_ai_assignments as restrictive for insert to authenticated with check(channel_type<>'whatsapp');
drop policy if exists kolkap_whatsapp_assignments_update on public.channel_ai_assignments;
create policy kolkap_whatsapp_assignments_update on public.channel_ai_assignments as restrictive for update to authenticated using(channel_type<>'whatsapp') with check(channel_type<>'whatsapp');
drop policy if exists kolkap_whatsapp_assignments_delete on public.channel_ai_assignments;
create policy kolkap_whatsapp_assignments_delete on public.channel_ai_assignments as restrictive for delete to authenticated using(channel_type<>'whatsapp');

create or replace function public.guard_whatsapp_conversation_binding()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.whatsapp_connection_id is not null and not exists(select 1 from public.workspace_whatsapp_connections
    where id=new.whatsapp_connection_id and workspace_id=new.workspace_id and provider='meta') then raise exception 'Wrong workspace number'; end if;
  if tg_op='UPDATE' and new.handover_requested is distinct from old.handover_requested then new.handover_version=old.handover_version+1; end if;
  return new;
end; $$;
revoke all on function public.guard_whatsapp_conversation_binding() from public,anon,authenticated;
drop trigger if exists kolkap_guard_whatsapp_conversation on public.customer_conversations;
create trigger kolkap_guard_whatsapp_conversation before insert or update on public.customer_conversations
  for each row execute function public.guard_whatsapp_conversation_binding();

create table if not exists public.whatsapp_message_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,
  connection_id uuid not null references public.workspace_whatsapp_connections(id) on delete cascade,
  conversation_id uuid not null references public.customer_conversations(id) on delete cascade,
  request_key text not null,
  inbound_message_id uuid references public.customer_messages(id) on delete set null,
  meta_inbound_id text,
  outbound_message_id uuid references public.customer_messages(id) on delete set null,
  meta_outbound_id text,
  reply_kind text not null check (reply_kind in ('ai','manual','template')),
  reply_text text,
  reply_payload jsonb,
  ai_staff_id uuid references public.ai_staff(id) on delete set null,
  requested_by_user_id uuid,
  phase text not null default 'pending' check (phase in ('pending','generating','ready','sending','sent','failed','skipped','unknown')),
  lease_token uuid,
  lease_expires_at timestamptz,
  handover_version bigint not null default 0,
  credit_cost integer not null check (credit_cost >= 0),
  credits_recorded integer not null default 0,
  delivery_status text,
  delivery_status_at timestamptz,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(connection_id, request_key)
);
create index if not exists whatsapp_jobs_meta_message on public.whatsapp_message_jobs(connection_id, meta_outbound_id);
alter table public.whatsapp_message_jobs enable row level security;
revoke all on public.whatsapp_message_jobs from public, anon, authenticated;
grant select, insert, update, delete on public.whatsapp_message_jobs to service_role;

create or replace function public.kolkap_can_manage_inbox(p_workspace_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.business_workspaces w where w.id = p_workspace_id and w.owner_user_id = auth.uid())
  or exists(select 1 from public.workspace_team_members m where m.workspace_id = p_workspace_id
    and lower(m.email) = lower(auth.jwt()->>'email') and m.status = 'active'
    and lower(coalesce(nullif(m.permission_level::text,''),m.role::text,'')) in ('admin','manager','inbox','inbox agent','sales','sales agent'));
$$;
revoke all on function public.kolkap_can_manage_inbox(uuid) from public, anon;
grant execute on function public.kolkap_can_manage_inbox(uuid) to authenticated, service_role;

-- Restrictive policies supplement existing workspace isolation policies.
drop policy if exists kolkap_inbox_conversation_writes on public.customer_conversations;
create policy kolkap_inbox_conversation_writes on public.customer_conversations as restrictive
  for update to authenticated using(public.kolkap_can_manage_inbox(workspace_id))
  with check(public.kolkap_can_manage_inbox(workspace_id));
drop policy if exists kolkap_inbox_message_inserts on public.customer_messages;
create policy kolkap_inbox_message_inserts on public.customer_messages as restrictive
  for insert to authenticated with check(public.kolkap_can_manage_inbox(workspace_id));

create or replace function public.receive_workspace_whatsapp_message(
  p_connection_id uuid, p_meta_message_id text, p_customer_phone text, p_customer_name text,
  p_message_text text, p_message_type text, p_sent_at timestamptz, p_ai_staff_id uuid,
  p_handover boolean, p_credit_cost integer, p_raw jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  w public.workspace_whatsapp_connections%rowtype;
  c public.customer_conversations%rowtype;
  j public.whatsapp_message_jobs%rowtype;
  msg uuid;
begin
  if p_meta_message_id is null or length(p_meta_message_id) not between 1 and 512
    or p_customer_phone is null or p_customer_phone !~ '^[0-9]{7,15}$'
    or p_sent_at is null or p_sent_at > now() + interval '1 minute' then raise exception 'Invalid message'; end if;
  select * into w from public.workspace_whatsapp_connections where id = p_connection_id and provider = 'meta';
  if not found then raise exception 'Unknown number'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(w.id::text || ':' || p_customer_phone,0));
  select * into j from public.whatsapp_message_jobs where connection_id = w.id and request_key = 'inbound:' || p_meta_message_id;
  if found then return jsonb_build_object('job',to_jsonb(j),'created',false); end if;
  -- Events processed by the old release must not be sent or charged again.
  if exists(select 1 from public.whatsapp_message_logs where connection_id = w.id and meta_message_id = p_meta_message_id and direction = 'inbound') then
    return jsonb_build_object('legacy_duplicate',true,'created',false);
  end if;
  select * into c from public.customer_conversations where whatsapp_connection_id = w.id
    and customer_channel = 'whatsapp' and customer_phone = p_customer_phone for update;
  if not found then
    insert into public.customer_conversations(workspace_id,owner_user_id,ai_staff_id,customer_name,customer_phone,
      customer_channel,whatsapp_connection_id,whatsapp_last_customer_at,status,lead_status,handover_requested,last_message,last_message_at)
    values(w.workspace_id,w.owner_user_id,p_ai_staff_id,nullif(p_customer_name,''),p_customer_phone,
      'whatsapp',w.id,p_sent_at,case when p_handover then 'handover' else 'open' end,'new',p_handover,p_message_text,p_sent_at)
    returning * into c;
  else
    update public.customer_conversations set
      whatsapp_last_customer_at = greatest(whatsapp_last_customer_at,p_sent_at),
      customer_name = coalesce(nullif(p_customer_name,''),customer_name),
      ai_staff_id = coalesce(p_ai_staff_id,ai_staff_id),
      handover_requested = handover_requested or p_handover,
      handover_version = handover_version + case when p_handover then 1 else 0 end,
      status = case when handover_requested or p_handover then 'handover' else 'open' end,
      last_message = case when last_message_at is null or last_message_at <= p_sent_at then p_message_text else last_message end,
      last_message_at = greatest(last_message_at,p_sent_at),updated_at = now()
      where id = c.id returning * into c;
  end if;
  insert into public.customer_messages(conversation_id,workspace_id,owner_user_id,ai_staff_id,sender_type,message_text,created_at)
    values(c.id,w.workspace_id,w.owner_user_id,p_ai_staff_id,'customer',p_message_text,p_sent_at) returning id into msg;
  insert into public.whatsapp_message_logs(workspace_id,connection_id,conversation_id,customer_message_id,direction,status,
    customer_phone,display_phone_number,meta_phone_number_id,meta_waba_id,meta_message_id,message_type,message_text,credits_used,raw_meta_payload,created_at)
    values(w.workspace_id,w.id,c.id,msg,'inbound','received',p_customer_phone,w.display_phone_number,w.meta_phone_number_id,
      w.meta_waba_id,p_meta_message_id,p_message_type,p_message_text,0,p_raw,p_sent_at);
  insert into public.whatsapp_message_jobs(workspace_id,connection_id,conversation_id,request_key,inbound_message_id,
    meta_inbound_id,reply_kind,ai_staff_id,handover_version,credit_cost)
    values(w.workspace_id,w.id,c.id,'inbound:' || p_meta_message_id,msg,p_meta_message_id,'ai',p_ai_staff_id,c.handover_version,p_credit_cost)
    returning * into j;
  update public.workspace_whatsapp_connections set last_inbound_at = greatest(last_inbound_at,p_sent_at),updated_at = now() where id = w.id;
  return jsonb_build_object('job',to_jsonb(j),'conversation',to_jsonb(c),'created',true);
end; $$;

create or replace function public.prepare_whatsapp_manual_send(
  p_request_id uuid,p_conversation_id uuid,p_actor_id uuid,p_text text,p_template jsonb,p_credit_cost integer
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare c public.customer_conversations%rowtype; j public.whatsapp_message_jobs%rowtype; w public.workspace_whatsapp_connections%rowtype;
begin
  if p_request_id is null or p_actor_id is null or p_text is null or length(trim(p_text)) not between 1 and 4096 then raise exception 'Invalid reply'; end if;
  select * into c from public.customer_conversations where id = p_conversation_id for update;
  if not found or c.whatsapp_connection_id is null then raise exception 'Number binding required'; end if;
  select * into w from public.workspace_whatsapp_connections where id = c.whatsapp_connection_id and workspace_id = c.workspace_id and provider = 'meta';
  if not found or w.status <> 'connected' then raise exception 'Number not connected'; end if;
  select * into j from public.whatsapp_message_jobs where connection_id = w.id and request_key = 'manual:' || p_request_id::text;
  if found then
    if j.conversation_id <> c.id or j.requested_by_user_id <> p_actor_id or j.reply_text <> p_text or j.reply_payload is distinct from p_template then
      raise exception 'Request already used for another reply';
    end if;
    return to_jsonb(j);
  end if;
  if p_template is null and (c.whatsapp_last_customer_at is null or c.whatsapp_last_customer_at <= now() - interval '24 hours') then
    raise exception 'An approved template is required';
  end if;
  update public.customer_conversations set handover_requested = true,handover_version = handover_version + 1,
    status = 'handover',updated_at = now() where id = c.id returning * into c;
  insert into public.whatsapp_message_jobs(workspace_id,connection_id,conversation_id,request_key,reply_kind,reply_text,
    reply_payload,requested_by_user_id,handover_version,credit_cost,phase)
  values(w.workspace_id,w.id,c.id,'manual:' || p_request_id::text,case when p_template is null then 'manual' else 'template' end,
    p_text,p_template,p_actor_id,c.handover_version,p_credit_cost,'ready') returning * into j;
  return to_jsonb(j);
end; $$;

create or replace function public.whatsapp_job_step(p_job_id uuid,p_action text,p_token uuid,p_data jsonb)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare
  j public.whatsapp_message_jobs%rowtype;
  c public.customer_conversations%rowtype;
  w public.workspace_whatsapp_connections%rowtype;
  accepted_status text;
  event_time timestamptz;
  message_id uuid;
  event_name text;
begin
  if p_action='claim' then
    select conversation_id into message_id from public.whatsapp_message_jobs where id=p_job_id;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('wa-job:' || message_id::text,0));
  end if;
  select * into j from public.whatsapp_message_jobs where id = p_job_id for update;
  if not found then raise exception 'Unknown message job'; end if;
  select * into w from public.workspace_whatsapp_connections where id = j.connection_id;
  select * into c from public.customer_conversations where id = j.conversation_id;

  if p_action = 'claim' then
    if j.phase = 'sending' and j.lease_expires_at <= now() then
      update public.whatsapp_message_jobs set phase='unknown',delivery_status='unknown',
        error_message='Delivery is unconfirmed. Check WhatsApp before sending this message again.',updated_at=now() where id=j.id returning * into j;
    end if;
    if j.phase in ('sent','failed','skipped','unknown') then return jsonb_build_object('action','done','job',to_jsonb(j)); end if;
    if j.lease_token is not null and j.lease_expires_at > now() then return jsonb_build_object('action','busy'); end if;
    if exists(select 1 from public.whatsapp_message_jobs other where other.conversation_id=j.conversation_id
      and other.id<>j.id and other.lease_expires_at>now() and other.phase in ('generating','ready','sending')) then
      return jsonb_build_object('action','busy');
    end if;
    update public.whatsapp_message_jobs set lease_token=gen_random_uuid(),lease_expires_at=now()+interval '2 minutes',
      phase=case when phase='ready' then 'ready' else 'generating' end,updated_at=now() where id=j.id returning * into j;
    return jsonb_build_object('action',case when j.phase='ready' then 'send' else 'generate' end,'job',to_jsonb(j));
  end if;

  if p_action not in ('accepted','receipt') and (j.lease_token is distinct from p_token or p_token is null or j.lease_expires_at <= now()) then
    raise exception 'Message processing lease expired';
  end if;
  if p_action = 'release' then
    update public.whatsapp_message_jobs set lease_token=null,lease_expires_at=null,updated_at=now() where id=j.id and phase in ('generating','ready');
  elsif p_action = 'ready' then
    if j.phase='ready' then return to_jsonb(j); end if;
    if j.phase <> 'generating' or p_data->>'text' is null or length(trim(p_data->>'text')) not between 1 and 4096 then raise exception 'Invalid generated reply'; end if;
    -- Saving generation and its charge is one transaction. Provider retries cannot charge twice.
    perform public.record_workspace_usage(p_workspace_id=>j.workspace_id,p_owner_user_id=>w.owner_user_id,
      p_user_id=>w.owner_user_id,p_event_type=>'whatsapp_ai_reply_generated',p_channel=>'whatsapp',p_source_page=>'/api/whatsapp/webhook',
      p_credits_used=>j.credit_cost,p_event_count=>1,p_status=>'success',
      p_metadata=>coalesce(p_data->'metadata','{}'::jsonb) || jsonb_build_object('job_id',j.id,'connection_id',w.id,'conversation_id',c.id,'meta_inbound_message_id',j.meta_inbound_id));
    update public.whatsapp_message_jobs set reply_text=p_data->>'text',phase='ready',credits_recorded=credit_cost,
      lease_expires_at=now()+interval '2 minutes',updated_at=now() where id=j.id;
  elsif p_action = 'skip' then
    update public.whatsapp_message_jobs set phase='skipped',error_code=p_data->>'code',error_message=p_data->>'message',
      lease_token=null,lease_expires_at=null,updated_at=now() where id=j.id and phase in ('generating','ready');
  elsif p_action = 'begin_send' then
    if j.phase <> 'ready' then raise exception 'Reply is not ready'; end if;
    select * into w from public.workspace_whatsapp_connections where id=j.connection_id;
    select * into c from public.customer_conversations where id=j.conversation_id for update;
    if w.status <> 'connected' or c.whatsapp_connection_id is distinct from w.id or
      (j.reply_kind='ai' and (c.handover_requested or c.handover_version<>j.handover_version or not w.ai_enabled or not w.auto_reply_enabled
        or w.selected_ai_staff_id is distinct from j.ai_staff_id)) then
      update public.whatsapp_message_jobs set phase='skipped',error_code='ai_paused',error_message='Reply stopped because channel or conversation settings changed.',
        lease_token=null,lease_expires_at=null,updated_at=now() where id=j.id returning * into j;
      return to_jsonb(j);
    end if;
    if j.reply_kind <> 'template' and (c.whatsapp_last_customer_at is null or c.whatsapp_last_customer_at <= now()-interval '24 hours') then
      update public.whatsapp_message_jobs set phase='skipped',error_code='template_required',error_message='The reply window has closed. Use an approved template.',
        lease_token=null,lease_expires_at=null,updated_at=now() where id=j.id returning * into j;
      return to_jsonb(j);
    end if;
    update public.whatsapp_message_jobs set phase='sending',lease_expires_at=now()+interval '2 minutes',updated_at=now() where id=j.id;
  elsif p_action in ('failed','unknown') then
    if j.phase not in ('sending','ready') then return to_jsonb(j); end if;
    update public.whatsapp_message_jobs set phase=p_action,delivery_status=p_action,error_code=p_data->>'code',
      error_message=p_data->>'message',lease_token=null,lease_expires_at=null,updated_at=now() where id=j.id;
    update public.workspace_whatsapp_connections set last_error_at=now(),last_error_code=coalesce(p_data->>'code','delivery_unconfirmed'),
      last_error_message=p_data->>'message',updated_at=now() where id=w.id;
  elsif p_action in ('accepted','receipt') then
    if nullif(p_data->>'meta_message_id','') is null then raise exception 'Meta message ID required'; end if;
    if j.meta_outbound_id is not null and j.meta_outbound_id <> p_data->>'meta_message_id' then raise exception 'Meta message mismatch'; end if;
    if j.phase not in ('sending','unknown','sent','failed') then raise exception 'No send was attempted'; end if;
    accepted_status=coalesce(p_data->>'status','sent');
    if accepted_status not in ('sent','delivered','read','failed') then raise exception 'Invalid delivery status'; end if;
    event_time=coalesce((p_data->>'at')::timestamptz,now());
    if j.delivery_status='read' or (j.delivery_status='delivered' and accepted_status<>'read')
      or (j.delivery_status_at > event_time and accepted_status not in ('read','delivered')) then
      accepted_status=j.delivery_status; event_time=j.delivery_status_at;
    end if;
    if j.reply_kind <> 'ai' and j.credits_recorded = 0 then
      event_name=case when j.reply_kind='template' then 'manual_whatsapp_template_sent' else 'manual_whatsapp_reply_sent' end;
      perform public.record_workspace_usage(p_workspace_id=>j.workspace_id,p_owner_user_id=>w.owner_user_id,
        p_user_id=>j.requested_by_user_id,p_event_type=>event_name,p_channel=>'whatsapp',p_source_page=>'dashboard_inbox',
        p_credits_used=>j.credit_cost,p_event_count=>1,p_status=>'success',
        p_metadata=>jsonb_build_object('job_id',j.id,'connection_id',w.id,'conversation_id',c.id,'meta_message_id',p_data->>'meta_message_id'));
    end if;
    message_id=j.outbound_message_id;
    if message_id is null then
      insert into public.customer_messages(conversation_id,workspace_id,owner_user_id,ai_staff_id,sender_type,message_text,delivery_status,delivery_error)
      values(c.id,w.workspace_id,w.owner_user_id,j.ai_staff_id,case when j.reply_kind='ai' then 'ai' else 'human' end,
        j.reply_text,accepted_status,case when accepted_status='failed' then p_data->>'error' else null end) returning id into message_id;
      insert into public.whatsapp_message_logs(workspace_id,connection_id,conversation_id,customer_message_id,direction,status,customer_phone,
        display_phone_number,meta_phone_number_id,meta_waba_id,meta_message_id,message_type,message_text,credits_used)
      values(w.workspace_id,w.id,c.id,message_id,'outbound','sent',c.customer_phone,w.display_phone_number,w.meta_phone_number_id,
        w.meta_waba_id,p_data->>'meta_message_id',case when j.reply_kind='template' then 'template' else 'text' end,j.reply_text,j.credit_cost);
      update public.customer_conversations set last_message=j.reply_text,last_message_at=now(),updated_at=now() where id=c.id;
    else
      update public.customer_messages set delivery_status=accepted_status,delivery_error=case when accepted_status='failed' then p_data->>'error' else null end where id=message_id;
    end if;
    update public.whatsapp_message_jobs set phase='sent',meta_outbound_id=p_data->>'meta_message_id',outbound_message_id=message_id,
      credits_recorded=credit_cost,delivery_status=accepted_status,delivery_status_at=event_time,
      error_code=case when accepted_status='failed' then p_data->>'code' else null end,
      error_message=case when accepted_status='failed' then p_data->>'error' else null end,
      lease_token=null,lease_expires_at=null,updated_at=now() where id=j.id;
    update public.whatsapp_message_logs set delivery_status=accepted_status where connection_id=w.id and meta_message_id=p_data->>'meta_message_id' and direction='outbound';
    update public.workspace_whatsapp_connections set last_outbound_at=greatest(last_outbound_at,event_time),last_status_at=now(),
      last_error_code=case when accepted_status='failed' then p_data->>'code' else null end,
      last_error_message=case when accepted_status='failed' then p_data->>'error' else null end,updated_at=now() where id=w.id;
  else raise exception 'Unknown message action'; end if;
  select * into j from public.whatsapp_message_jobs where id=p_job_id;
  return to_jsonb(j);
end; $$;

create or replace function public.set_workspace_conversation_handover(p_conversation_id uuid,p_workspace_id uuid,p_paused boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c public.customer_conversations%rowtype;
begin
  update public.customer_conversations set handover_requested=p_paused,handover_version=handover_version+1,
    status=case when p_paused then 'handover' else 'open' end,updated_at=now()
    where id=p_conversation_id and workspace_id=p_workspace_id returning * into c;
  if not found then raise exception 'Conversation not found'; end if;
  return to_jsonb(c);
end; $$;

-- Keep native Business-app human replies on the same per-number thread.
create or replace function public.record_whatsapp_business_app_echo(
  p_connection_id uuid,p_meta_message_id text,p_customer_phone text,p_message_text text,p_message_type text,p_sent_at timestamptz
) returns boolean language plpgsql security definer set search_path = '' as $$
declare w public.workspace_whatsapp_connections%rowtype; c public.customer_conversations%rowtype; msg uuid;
begin
  if nullif(p_meta_message_id,'') is null or p_customer_phone is null or p_customer_phone !~ '^[0-9]{7,15}$' or p_message_text is null or p_sent_at is null then raise exception 'Invalid app reply'; end if;
  select * into w from public.workspace_whatsapp_connections where id=p_connection_id and provider='meta';
  if not found then return false; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(w.id::text || ':' || p_customer_phone,0));
  insert into public.whatsapp_business_app_echoes(connection_id,meta_message_id) values(w.id,p_meta_message_id) on conflict do nothing;
  if not found then return false; end if;
  select * into c from public.customer_conversations where whatsapp_connection_id=w.id and customer_phone=p_customer_phone and customer_channel='whatsapp' for update;
  if not found then
    insert into public.customer_conversations(workspace_id,owner_user_id,customer_phone,customer_channel,whatsapp_connection_id,
      status,lead_status,handover_requested,last_message,last_message_at)
      values(w.workspace_id,w.owner_user_id,p_customer_phone,'whatsapp',w.id,'handover','new',true,p_message_text,p_sent_at) returning * into c;
  else
    update public.customer_conversations set handover_requested=true,handover_version=handover_version+1,status='handover',
      last_message=case when last_message_at is null or last_message_at<=p_sent_at then p_message_text else last_message end,
      last_message_at=greatest(last_message_at,p_sent_at),updated_at=now() where id=c.id;
  end if;
  insert into public.customer_messages(conversation_id,workspace_id,owner_user_id,sender_type,message_text,created_at,delivery_status)
    values(c.id,w.workspace_id,w.owner_user_id,'human',p_message_text,p_sent_at,'sent') returning id into msg;
  insert into public.whatsapp_message_logs(workspace_id,connection_id,conversation_id,customer_message_id,direction,status,customer_phone,
    display_phone_number,meta_phone_number_id,meta_waba_id,meta_message_id,message_type,message_text,credits_used,created_at)
    values(w.workspace_id,w.id,c.id,msg,'outbound','sent',p_customer_phone,w.display_phone_number,w.meta_phone_number_id,w.meta_waba_id,
      p_meta_message_id,p_message_type,p_message_text,0,p_sent_at);
  update public.workspace_whatsapp_connections set last_outbound_at=greatest(last_outbound_at,p_sent_at),updated_at=now() where id=w.id;
  return true;
end; $$;

create or replace function public.save_workspace_whatsapp_settings(p_connection_id uuid,p_workspace_id uuid,p_user_id uuid,p_settings jsonb,p_staff_ids uuid[])
returns boolean language plpgsql security definer set search_path = '' as $$
declare w public.workspace_whatsapp_connections%rowtype; staff_id uuid; first_id uuid; i integer=0;
begin
  perform 1 from public.business_workspaces where id=p_workspace_id for update;
  select * into w from public.workspace_whatsapp_connections where id=p_connection_id and workspace_id=p_workspace_id for update;
  if not found then raise exception 'Number not found'; end if;
  first_id=nullif(p_settings->>'selected_ai_staff_id','')::uuid;
  if cardinality(p_staff_ids)>50 or (first_id is not null and not first_id=any(p_staff_ids)) then raise exception 'Invalid AI team'; end if;
  foreach staff_id in array p_staff_ids loop
    if not exists(select 1 from public.ai_staff where id=staff_id and workspace_id=p_workspace_id and deleted_at is null
      and lower(coalesce(status,'')) not in ('deleted','disabled','inactive','archived')) then raise exception 'AI staff unavailable'; end if;
  end loop;
  if (p_settings->>'auto_reply_enabled')::boolean and (first_id is null or not (p_settings->>'ai_enabled')::boolean) then raise exception 'Choose AI staff before enabling replies'; end if;
  if (p_settings->>'is_primary')::boolean then update public.workspace_whatsapp_connections set is_primary=false where workspace_id=p_workspace_id and id<>w.id; end if;
  update public.workspace_whatsapp_connections set connection_label=nullif(p_settings->>'connection_label',''),selected_ai_staff_id=first_id,
    ai_enabled=(p_settings->>'ai_enabled')::boolean,auto_reply_enabled=(p_settings->>'auto_reply_enabled')::boolean,
    handover_enabled=(p_settings->>'handover_enabled')::boolean,is_primary=(p_settings->>'is_primary')::boolean,
    notes=nullif(p_settings->>'notes',''),updated_at=now() where id=w.id;
  delete from public.channel_ai_assignments where workspace_id=p_workspace_id and channel_type='whatsapp' and channel_connection_id=w.id;
  foreach staff_id in array p_staff_ids loop
    i=i+1;
    insert into public.channel_ai_assignments(workspace_id,channel_type,channel_connection_id,ai_staff_id,is_enabled,is_default,priority,created_by_user_id)
      values(p_workspace_id,'whatsapp',w.id,staff_id,true,staff_id=first_id,i*10,p_user_id);
  end loop;
  return true;
end; $$;

-- These functions are only reachable through authenticated server routes or signed Meta events.
revoke all on function public.receive_workspace_whatsapp_message(uuid,text,text,text,text,text,timestamptz,uuid,boolean,integer,jsonb) from public,anon,authenticated;
revoke all on function public.prepare_whatsapp_manual_send(uuid,uuid,uuid,text,jsonb,integer) from public,anon,authenticated;
revoke all on function public.whatsapp_job_step(uuid,text,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.set_workspace_conversation_handover(uuid,uuid,boolean) from public,anon,authenticated;
revoke all on function public.record_whatsapp_business_app_echo(uuid,text,text,text,text,timestamptz) from public,anon,authenticated;
revoke all on function public.save_workspace_whatsapp_settings(uuid,uuid,uuid,jsonb,uuid[]) from public,anon,authenticated;
grant execute on function public.receive_workspace_whatsapp_message(uuid,text,text,text,text,text,timestamptz,uuid,boolean,integer,jsonb) to service_role;
grant execute on function public.prepare_whatsapp_manual_send(uuid,uuid,uuid,text,jsonb,integer) to service_role;
grant execute on function public.whatsapp_job_step(uuid,text,uuid,jsonb) to service_role;
grant execute on function public.set_workspace_conversation_handover(uuid,uuid,boolean) to service_role;
grant execute on function public.record_whatsapp_business_app_echo(uuid,text,text,text,text,timestamptz) to service_role;
grant execute on function public.save_workspace_whatsapp_settings(uuid,uuid,uuid,jsonb,uuid[]) to service_role;

commit;
