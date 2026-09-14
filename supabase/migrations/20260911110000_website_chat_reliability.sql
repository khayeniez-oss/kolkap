begin;

-- Requires the already-applied 20260911100000 handover migration.
alter table public.customer_conversations add column if not exists website_message_sequence bigint not null default 0;
alter table public.customer_messages add column if not exists website_message_sequence bigint;

-- Backfill only once. New rows are numbered while holding their conversation lock,
-- so a later commit cannot slip behind a visitor's history cursor.
with numbered as (
  select m.id, row_number() over(partition by m.conversation_id order by m.created_at,m.id) as n
  from public.customer_messages m join public.customer_conversations c on c.id=m.conversation_id
  where c.customer_channel='website_chat'
), offsets as (
  select conversation_id,coalesce(max(website_message_sequence),0) as n from public.customer_messages group by conversation_id
)
update public.customer_messages m set website_message_sequence=numbered.n+coalesce(offsets.n,0)
from numbered,offsets where m.id=numbered.id and offsets.conversation_id=m.conversation_id and m.website_message_sequence is null;
update public.customer_conversations c set website_message_sequence=greatest(c.website_message_sequence,s.n)
from(select conversation_id,max(website_message_sequence) as n from public.customer_messages group by conversation_id) s
where c.id=s.conversation_id and s.n is not null;
create unique index if not exists website_message_sequence_idx on public.customer_messages(conversation_id,website_message_sequence)
  where website_message_sequence is not null;

create or replace function public.number_website_chat_message()
returns trigger language plpgsql security definer set search_path='' as $$
declare c public.customer_conversations;
begin
  select * into c from public.customer_conversations where id=new.conversation_id and customer_channel='website_chat' for update;
  if found then
    if new.workspace_id is distinct from c.workspace_id or new.owner_user_id is distinct from c.owner_user_id then
      raise exception 'Wrong workspace conversation';
    end if;
    update public.customer_conversations set website_message_sequence=website_message_sequence+1 where id=c.id
      returning website_message_sequence into new.website_message_sequence;
  end if;
  return new;
end; $$;
revoke all on function public.number_website_chat_message() from public,anon,authenticated;
drop trigger if exists kolkap_number_website_message on public.customer_messages;
create trigger kolkap_number_website_message before insert on public.customer_messages
  for each row execute function public.number_website_chat_message();

create table if not exists public.website_chat_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,
  conversation_id uuid not null references public.customer_conversations(id) on delete cascade,
  request_id uuid not null,
  visitor_hash text not null,
  fingerprint text not null,
  initial_request boolean not null default false,
  incoming_message_id uuid references public.customer_messages(id) on delete set null,
  reply_message_id uuid references public.customer_messages(id) on delete set null,
  ai_staff_id uuid references public.ai_staff(id) on delete set null,
  handover_version bigint not null,
  generation_allowed boolean not null default false,
  completed boolean not null default false,
  reply_text text,
  credits_recorded integer not null default 0,
  created_at timestamptz not null default now(),
  unique(workspace_id,visitor_hash,request_id)
);
alter table public.website_chat_requests enable row level security;
revoke all on public.website_chat_requests from anon,authenticated;
grant select,insert,update,delete on public.website_chat_requests to service_role;
create index if not exists website_chat_pending_idx on public.website_chat_requests(workspace_id,created_at) where not completed;

create or replace function public.receive_website_chat_message(
  p_workspace_id uuid,p_conversation_id uuid,p_request_id uuid,p_visitor_hash text,p_fingerprint text,
  p_text text,p_name text,p_email text,p_phone text,p_staff_id uuid,p_request_human boolean
) returns jsonb language plpgsql security definer set search_path=pg_catalog,public,pg_temp as $$
declare r public.website_chat_requests; c public.customer_conversations; s public.workspace_website_chat_settings;
  w public.business_workspaces; m public.customer_messages; allow_ai boolean; remaining bigint; reserved bigint;
begin
  if length(p_text) not between 1 and 2000 or length(p_visitor_hash)>128 or length(p_fingerprint)>128 then raise exception 'Invalid message'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_workspace_id::text||p_visitor_hash||p_request_id::text,0));
  select * into r from public.website_chat_requests where workspace_id=p_workspace_id and visitor_hash=p_visitor_hash and request_id=p_request_id;
  if found then
    if r.fingerprint<>p_fingerprint or (p_conversation_id is null and not r.initial_request)
      or (p_conversation_id is not null and r.conversation_id<>p_conversation_id)
      or r.created_at<now()-interval '30 days' then raise exception 'Request does not match'; end if;
    -- A timed-out worker is never automatically rerun (or charged twice).
    if not r.completed and r.created_at<now()-interval '3 minutes' then
      update public.website_chat_requests set completed=true,reply_text='Your message is saved. The team can follow up.' where id=r.id returning * into r;
    end if;
    return jsonb_build_object('created',false,'request',to_jsonb(r));
  end if;
  select * into w from public.business_workspaces where id=p_workspace_id;
  select * into s from public.workspace_website_chat_settings where workspace_id=p_workspace_id for share;
  if w.id is null or s.id is null or not s.is_active then raise exception 'Website Chat is unavailable'; end if;
  if p_conversation_id is not null then
    select * into c from public.customer_conversations where id=p_conversation_id and workspace_id=p_workspace_id and customer_channel='website_chat' for update;
    if not found then raise exception 'Conversation is unavailable'; end if;
  else
    insert into public.customer_conversations(workspace_id,owner_user_id,customer_channel,customer_name,customer_email,customer_phone,status,lead_status)
      values(w.id,w.owner_user_id,'website_chat',coalesce(nullif(p_name,''),'Website Visitor'),nullif(p_email,''),nullif(p_phone,''),'open','new') returning * into c;
  end if;
  update public.customer_conversations set
    customer_name=coalesce(nullif(p_name,''),customer_name),customer_email=coalesce(nullif(p_email,''),customer_email),customer_phone=coalesce(nullif(p_phone,''),customer_phone),
    handover_requested=coalesce(handover_requested,false) or p_request_human,
    status=case when p_request_human then 'handover' else status end,
    last_message=p_text,last_message_at=clock_timestamp(),updated_at=clock_timestamp()
    where id=c.id returning * into c;
  allow_ai:=s.ai_enabled and s.auto_reply_enabled and not coalesce(c.handover_requested,false)
    and exists(select 1 from public.ai_staff where id=p_staff_id and workspace_id=w.id and status='active' and deleted_at is null);
  if allow_ai then
    select greatest(0,plan_credits+purchased_credits-used_credits) into remaining from public.workspace_credit_balances where workspace_id=w.id for update;
    select count(*)*3 into reserved from public.website_chat_requests where workspace_id=w.id and generation_allowed and not completed and created_at>now()-interval '3 minutes';
    allow_ai:=coalesce(remaining,0)-reserved>=3;
  end if;
  insert into public.customer_messages(conversation_id,workspace_id,owner_user_id,ai_staff_id,sender_type,message_text)
    values(c.id,w.id,w.owner_user_id,p_staff_id,'customer',p_text) returning * into m;
  if allow_ai then update public.customer_conversations set ai_staff_id=p_staff_id where id=c.id; end if;
  insert into public.website_chat_requests(workspace_id,conversation_id,request_id,visitor_hash,fingerprint,initial_request,incoming_message_id,
    ai_staff_id,handover_version,generation_allowed,completed,reply_text)
    values(w.id,c.id,p_request_id,p_visitor_hash,p_fingerprint,p_conversation_id is null,m.id,p_staff_id,c.handover_version,allow_ai,not allow_ai,
      case when not allow_ai then 'Your message is saved. The team can follow up.' end) returning * into r;
  perform public.record_workspace_usage(p_workspace_id=>w.id,p_owner_user_id=>w.owner_user_id,p_user_id=>w.owner_user_id,
    p_event_type=>'website_chat_customer_message_received',p_channel=>'website_chat',p_source_page=>'website_chat',p_credits_used=>0,
    p_event_count=>1,p_status=>'success',p_metadata=>jsonb_build_object('conversation_id',c.id,'message_id',m.id));
  return jsonb_build_object('created',true,'request',to_jsonb(r));
end; $$;

create or replace function public.complete_website_chat_reply(p_request_id uuid,p_reply text,p_generated boolean,p_metadata jsonb default '{}')
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,pg_temp as $$
declare r public.website_chat_requests; c public.customer_conversations; s public.workspace_website_chat_settings; m public.customer_messages;
  publish boolean; owner_id uuid;
begin
  -- Match intake's lock order: settings, conversation, request, credit balance.
  select * into r from public.website_chat_requests where id=p_request_id;
  if not found then raise exception 'Unknown message'; end if;
  select * into s from public.workspace_website_chat_settings where workspace_id=r.workspace_id for share;
  select * into c from public.customer_conversations where id=r.conversation_id for update;
  select * into r from public.website_chat_requests where id=p_request_id for update;
  if r.completed then return to_jsonb(r); end if;
  if p_generated and (not r.generation_allowed or nullif(btrim(p_reply),'') is null) then raise exception 'Invalid generated reply'; end if;
  publish:=p_generated and s.is_active and s.ai_enabled and s.auto_reply_enabled
    and not coalesce(c.handover_requested,false) and c.handover_version=r.handover_version
    and coalesce((select ai_staff_id from public.channel_ai_assignments
      where workspace_id=r.workspace_id and channel_type='website_chat' and channel_connection_id=s.id and is_enabled
      order by is_default desc,priority asc limit 1),s.selected_ai_staff_id)=r.ai_staff_id
    and exists(select 1 from public.ai_staff where id=r.ai_staff_id and workspace_id=r.workspace_id and status='active' and deleted_at is null);
  if p_generated then
    perform 1 from public.workspace_credit_balances where workspace_id=r.workspace_id for update;
    select owner_user_id into owner_id from public.business_workspaces where id=r.workspace_id;
    -- Intentional: successful generation costs 3 credits, including a reply held
    -- back because a person took over while generation was running.
    perform public.record_workspace_usage(p_workspace_id=>r.workspace_id,p_owner_user_id=>owner_id,p_user_id=>owner_id,
      p_event_type=>'website_chat_ai_reply_generated',p_channel=>'website_chat',p_source_page=>'website_chat',p_credits_used=>3,
      p_event_count=>1,p_status=>'success',p_metadata=>coalesce(p_metadata,'{}')||jsonb_build_object('conversation_id',c.id,'website_request_id',r.id,'reply_published',publish));
  end if;
  if publish then
    insert into public.customer_messages(conversation_id,workspace_id,owner_user_id,ai_staff_id,sender_type,message_text)
      values(c.id,c.workspace_id,c.owner_user_id,r.ai_staff_id,'ai',p_reply) returning * into m;
    update public.customer_conversations set last_message=p_reply,last_message_at=m.created_at,updated_at=clock_timestamp() where id=c.id;
  end if;
  update public.website_chat_requests set completed=true,credits_recorded=case when p_generated then 3 else 0 end,
    reply_message_id=m.id,reply_text=case when publish then p_reply else 'Your message is saved. The team can follow up.' end
    where id=r.id returning * into r;
  return to_jsonb(r);
end; $$;

create table if not exists public.website_chat_manual_requests (
  conversation_id uuid not null references public.customer_conversations(id) on delete cascade,
  request_id uuid not null,actor_id uuid not null,message_id uuid references public.customer_messages(id) on delete cascade,
  primary key(conversation_id,request_id)
);
alter table public.website_chat_manual_requests enable row level security;
revoke all on public.website_chat_manual_requests from anon,authenticated;
grant select,insert,update,delete on public.website_chat_manual_requests to service_role;

create or replace function public.save_website_chat_human_reply(p_conversation_id uuid,p_workspace_id uuid,p_request_id uuid,p_actor_id uuid,p_text text)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,pg_temp as $$
declare c public.customer_conversations; r public.website_chat_manual_requests; m public.customer_messages;
begin
  if length(btrim(p_text)) not between 1 and 4096 then raise exception 'Invalid reply'; end if;
  select * into c from public.customer_conversations where id=p_conversation_id and workspace_id=p_workspace_id and customer_channel='website_chat' for update;
  if not found then raise exception 'Conversation is unavailable'; end if;
  select * into r from public.website_chat_manual_requests where conversation_id=c.id and request_id=p_request_id;
  if found then
    select * into m from public.customer_messages where id=r.message_id;
    if r.actor_id<>p_actor_id or m.message_text<>p_text then raise exception 'Reply request does not match'; end if;
    return to_jsonb(m);
  end if;
  update public.customer_conversations set handover_requested=true,status='handover' where id=c.id;
  insert into public.customer_messages(conversation_id,workspace_id,owner_user_id,ai_staff_id,sender_type,message_text)
    values(c.id,c.workspace_id,c.owner_user_id,c.ai_staff_id,'human',p_text) returning * into m;
  update public.customer_conversations set last_message=p_text,last_message_at=m.created_at,updated_at=clock_timestamp() where id=c.id;
  insert into public.website_chat_manual_requests values(c.id,p_request_id,p_actor_id,m.id);
  perform public.record_workspace_usage(p_workspace_id=>c.workspace_id,p_owner_user_id=>c.owner_user_id,p_user_id=>p_actor_id,
    p_event_type=>'manual_website_chat_reply_queued',p_channel=>'website_chat',p_source_page=>'dashboard_inbox',p_credits_used=>0,
    p_event_count=>1,p_status=>'pending',p_metadata=>jsonb_build_object('conversation_id',c.id,'message_id',m.id));
  return to_jsonb(m);
end; $$;

create or replace function public.save_workspace_website_settings(p_workspace_id uuid,p_actor_id uuid,p_settings jsonb,p_staff_ids uuid[])
returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.workspace_website_chat_settings; staff uuid; owner_id uuid; pos integer:=0; first_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('website-settings:'||p_workspace_id::text,0));
  select owner_user_id into owner_id from public.business_workspaces where id=p_workspace_id;
  s:=jsonb_populate_record(null::public.workspace_website_chat_settings,p_settings);
  first_id:=nullif(p_settings->>'selected_ai_staff_id','')::uuid;
  if owner_id is null or (first_id is not null and not(first_id=any(p_staff_ids))) then raise exception 'Invalid AI team'; end if;
  foreach staff in array p_staff_ids loop
    if not exists(select 1 from public.ai_staff where id=staff and workspace_id=p_workspace_id and status='active' and deleted_at is null) then raise exception 'Choose active AI staff from this workspace'; end if;
  end loop;
  insert into public.workspace_website_chat_settings(workspace_id,owner_user_id,selected_ai_staff_id,widget_title,widget_subtitle,welcome_message,
    is_active,ai_enabled,auto_reply_enabled,handover_enabled,allowed_domains)
  values(p_workspace_id,owner_id,first_id,p_settings->>'widget_title',p_settings->>'widget_subtitle',p_settings->>'welcome_message',
    (p_settings->>'is_active')::boolean,(p_settings->>'ai_enabled')::boolean,(p_settings->>'auto_reply_enabled')::boolean,(p_settings->>'handover_enabled')::boolean,
    s.allowed_domains)
  on conflict(workspace_id) do update set selected_ai_staff_id=excluded.selected_ai_staff_id,widget_title=excluded.widget_title,
    widget_subtitle=excluded.widget_subtitle,welcome_message=excluded.welcome_message,is_active=excluded.is_active,ai_enabled=excluded.ai_enabled,
    auto_reply_enabled=excluded.auto_reply_enabled,handover_enabled=excluded.handover_enabled,allowed_domains=excluded.allowed_domains
  returning * into s;
  delete from public.channel_ai_assignments where workspace_id=p_workspace_id and channel_type='website_chat' and channel_connection_id=s.id;
  foreach staff in array p_staff_ids loop
    pos:=pos+10;
    insert into public.channel_ai_assignments(workspace_id,channel_type,channel_connection_id,ai_staff_id,is_enabled,is_default,priority,created_by_user_id)
      values(p_workspace_id,'website_chat',s.id,staff,true,staff=first_id,pos,p_actor_id);
  end loop;
  return to_jsonb(s);
end; $$;

revoke insert,update,delete on public.workspace_website_chat_settings from anon,authenticated;
drop policy if exists kolkap_website_assignments_insert on public.channel_ai_assignments;
create policy kolkap_website_assignments_insert on public.channel_ai_assignments as restrictive for insert to authenticated with check(channel_type<>'website_chat');
drop policy if exists kolkap_website_assignments_update on public.channel_ai_assignments;
create policy kolkap_website_assignments_update on public.channel_ai_assignments as restrictive for update to authenticated using(channel_type<>'website_chat') with check(channel_type<>'website_chat');
drop policy if exists kolkap_website_assignments_delete on public.channel_ai_assignments;
create policy kolkap_website_assignments_delete on public.channel_ai_assignments as restrictive for delete to authenticated using(channel_type<>'website_chat');

revoke all on function public.receive_website_chat_message(uuid,uuid,uuid,text,text,text,text,text,text,uuid,boolean) from public,anon,authenticated;
revoke all on function public.complete_website_chat_reply(uuid,text,boolean,jsonb) from public,anon,authenticated;
revoke all on function public.save_website_chat_human_reply(uuid,uuid,uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.save_workspace_website_settings(uuid,uuid,jsonb,uuid[]) from public,anon,authenticated;
grant execute on function public.receive_website_chat_message(uuid,uuid,uuid,text,text,text,text,text,text,uuid,boolean) to service_role;
grant execute on function public.complete_website_chat_reply(uuid,text,boolean,jsonb) to service_role;
grant execute on function public.save_website_chat_human_reply(uuid,uuid,uuid,uuid,text) to service_role;
grant execute on function public.save_workspace_website_settings(uuid,uuid,jsonb,uuid[]) to service_role;
commit;
