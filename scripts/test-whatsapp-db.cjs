const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require(process.env.KOLKAP_PGLITE_MODULE || '@electric-sql/pglite');
const { randomUUID } = require('node:crypto');

// Isolated PostgreSQL fixture. Never connects to a linked Supabase project.
const fixture = `
create role anon; create role authenticated; create role service_role bypassrls;
create schema auth;
create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
create function auth.jwt() returns jsonb language sql as $$ select coalesce(nullif(current_setting('test.jwt',true),''),'{}')::jsonb $$;
create table business_workspaces(id uuid primary key,owner_user_id uuid,plan_key text);
create table workspace_team_members(workspace_id uuid,email text,status text,role text,permission_level text);
create table ai_staff(id uuid primary key,workspace_id uuid,deleted_at timestamptz,status text);
create table workspace_whatsapp_connections(id uuid primary key default gen_random_uuid(),workspace_id uuid,owner_user_id uuid,
 provider text,status text,connection_label text,display_phone_number text,meta_phone_number_id text,meta_waba_id text,
 selected_ai_staff_id uuid,ai_enabled boolean default true,auto_reply_enabled boolean default true,handover_enabled boolean default true,
 is_primary boolean default false,notes text,last_inbound_at timestamptz,last_outbound_at timestamptz,last_status_at timestamptz,
 last_error_at timestamptz,last_error_code text,last_error_message text,updated_at timestamptz default now());
create table customer_conversations(id uuid primary key default gen_random_uuid(),workspace_id uuid,owner_user_id uuid,ai_staff_id uuid,
 customer_name text,customer_phone text,customer_channel text,status text,lead_status text,handover_requested boolean default false,
 last_message text,last_message_at timestamptz,created_at timestamptz default now(),updated_at timestamptz default now());
create table customer_messages(id uuid primary key default gen_random_uuid(),conversation_id uuid,workspace_id uuid,owner_user_id uuid,
 ai_staff_id uuid,sender_type text,message_text text,created_at timestamptz default now());
create table whatsapp_message_logs(id uuid primary key default gen_random_uuid(),workspace_id uuid,connection_id uuid,conversation_id uuid,
 customer_message_id uuid,direction text,status text,customer_phone text,display_phone_number text,meta_phone_number_id text,meta_waba_id text,
 meta_message_id text,message_type text,message_text text,credits_used integer,raw_meta_payload jsonb,created_at timestamptz default now());
create table whatsapp_business_app_echoes(connection_id uuid,meta_message_id text,primary key(connection_id,meta_message_id));
create table channel_ai_assignments(workspace_id uuid,channel_type text,channel_connection_id uuid,ai_staff_id uuid,is_enabled boolean,
 is_default boolean,priority integer,created_by_user_id uuid);
create table usage_events(workspace_id uuid,credits integer,event_type text,metadata jsonb);
create function record_workspace_usage(p_workspace_id uuid,p_owner_user_id uuid,p_user_id uuid,p_event_type text,p_channel text,
 p_source_page text,p_credits_used integer,p_event_count integer,p_status text,p_metadata jsonb) returns void language sql as $$
 insert into usage_events values(p_workspace_id,p_credits_used,p_event_type,p_metadata) $$;
`;

(async () => {
  const db = new PGlite(); let checks = 0;
  const test = (ok, label) => { assert.ok(ok, label); checks++; };
  await db.exec(fixture);
  const migration = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20260911100000_whatsapp_delivery_and_handover.sql'), 'utf8');
  await db.exec(migration);
  await db.exec(migration); test(true, 'migration can be reapplied');
  const owner=randomUUID(), w=randomUUID(), otherW=randomUUID(), staff=randomUUID(), connection=randomUUID(), connection2=randomUUID();
  await db.query('insert into business_workspaces values($1,$2,\'starter\'),($3,$2,\'growth\')',[w,owner,otherW]);
  await db.query('insert into ai_staff values($1,$2,null,\'active\')',[staff,w]);
  for (const id of [connection,connection2]) await db.query(`insert into workspace_whatsapp_connections(id,workspace_id,owner_user_id,provider,status,display_phone_number,meta_phone_number_id,meta_waba_id,selected_ai_staff_id)
    values($1,$2,$3,'meta','connected','61400000000',$5,'456',$4)`,[id,w,owner,staff,id===connection?'123':'124']);
  const rpc=async (name,args)=> (await db.query(`select ${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as result`,args)).rows[0].result;
  const receive=(id,conn=connection,at=new Date().toISOString(),pause=false)=>rpc('receive_workspace_whatsapp_message',[conn,id,'61411111111','Test','Hello','text',at,staff,pause,5,{}]);
  const step=(job,action,token=null,data={})=>rpc('whatsapp_job_step',[job,action,token,data]);
  const usage=async()=>Number((await db.query('select coalesce(sum(credits),0) as n from usage_events')).rows[0].n);
  const first=await receive('incoming-1');
  const duplicate=await receive('incoming-1');
  test(first.job.id===duplicate.job.id&&!duplicate.created,'incoming retry deduplicates');
  const separate=await receive('incoming-1',connection2);
  test(separate.job.conversation_id!==first.job.conversation_id,'same customer separate business numbers');
  const claim=await step(first.job.id,'claim'); const token=claim.job.lease_token;
  test((await step(first.job.id,'claim')).action==='busy','active worker lease prevents duplicate generation');
  const next=await receive('incoming-2');
  test((await step(next.job.id,'claim')).action==='busy','one active reply per conversation');
  await step(first.job.id,'ready',token,{text:'Saved AI reply'});
  test(await usage()===5,'generation charged before sending');
  await step(first.job.id,'ready',token,{text:'Duplicate save'});
  test(await usage()===5,'duplicate generation save not charged again');
  await step(first.job.id,'release',token);
  const retry=await step(first.job.id,'claim');
  test(retry.action==='send'&&retry.job.reply_text==='Saved AI reply','interrupted processing reuses saved reply');
  await step(first.job.id,'begin_send',retry.job.lease_token);
  await step(first.job.id,'failed',retry.job.lease_token,{code:'131047',message:'Rejected'});
  test(await usage()===5&&(await step(first.job.id,'claim')).action==='done','failed send retains generation charge and does not resend');
  const nextClaim=await step(next.job.id,'claim');
  await step(next.job.id,'ready',nextClaim.job.lease_token,{text:'Old AI reply'});
  await rpc('set_workspace_conversation_handover',[next.job.conversation_id,w,true]);
  await rpc('set_workspace_conversation_handover',[next.job.conversation_id,w,false]);
  test((await step(next.job.id,'begin_send',nextClaim.job.lease_token)).phase==='skipped','pause then resume invalidates in-flight AI generation');
  const manualId=randomUUID();
  const manual=await rpc('prepare_whatsapp_manual_send',[manualId,first.job.conversation_id,owner,'Human reply',null,3]);
  test((await rpc('prepare_whatsapp_manual_send',[manualId,first.job.conversation_id,owner,'Human reply',null,3])).id===manual.id,'manual request id is idempotent');
  await assert.rejects(()=>rpc('prepare_whatsapp_manual_send',[manualId,first.job.conversation_id,owner,'Different text',null,3]));checks++;
  const mc=await step(manual.id,'claim'); await step(manual.id,'begin_send',mc.job.lease_token);
  await step(manual.id,'unknown',mc.job.lease_token,{message:'Network timed out'});
  test((await step(manual.id,'claim')).action==='done','uncertain acceptance never resends automatically');
  const before=await usage();
  await step(manual.id,'receipt',null,{meta_message_id:'out-1',status:'read',at:new Date().toISOString()});
  await step(manual.id,'accepted',null,{meta_message_id:'out-1',status:'sent',at:new Date().toISOString()});
  const settled=(await step(manual.id,'claim')).job;
  test(settled.delivery_status==='read','late HTTP response cannot regress read receipt');
  test(await usage()===before+3,'callback reconciliation charges accepted manual message once');
  await assert.rejects(()=>step(manual.id,'receipt',null,{meta_message_id:'other-message',status:'read'}));checks++;
  test((await db.query('select handover_requested from customer_conversations where id=$1',[first.job.conversation_id])).rows[0].handover_requested,'human reply keeps AI paused');
  const closed=await receive('old-message',connection2,new Date(Date.now()-25*3600000).toISOString());
  await db.query("update customer_conversations set whatsapp_last_customer_at=now()-interval '25 hours' where id=$1",[closed.job.conversation_id]);
  await assert.rejects(()=>rpc('prepare_whatsapp_manual_send',[randomUUID(),closed.job.conversation_id,owner,'Too late',null,3]));checks++;
  const last=(await db.query('select whatsapp_last_customer_at from customer_conversations where id=$1',[closed.job.conversation_id])).rows[0].whatsapp_last_customer_at;
  const echoArgs=[connection2,'echo-1','61411111111','Native human reply','text',new Date().toISOString()];
  test(await rpc('record_whatsapp_business_app_echo',echoArgs),'native Business app echo recorded');
  test(!await rpc('record_whatsapp_business_app_echo',echoArgs),'native echo retry deduplicated');
  test(String((await db.query('select whatsapp_last_customer_at from customer_conversations where id=$1',[closed.job.conversation_id])).rows[0].whatsapp_last_customer_at)===String(last),'native human reply does not reopen customer reply window');
  const settings={selected_ai_staff_id:staff,ai_enabled:true,auto_reply_enabled:true,handover_enabled:true,is_primary:true,connection_label:'Main'};
  await rpc('save_workspace_whatsapp_settings',[connection,w,owner,settings,[staff]]);
  await assert.rejects(()=>rpc('save_workspace_whatsapp_settings',[connection,w,owner,{...settings,connection_label:'Must roll back'},[randomUUID()]]));checks++;
  test((await db.query('select connection_label from workspace_whatsapp_connections where id=$1',[connection])).rows[0].connection_label==='Main','settings rollback preserves existing configuration');
  const access=(await db.query(`select r,has_function_privilege(r,'public.whatsapp_job_step(uuid,text,uuid,jsonb)','EXECUTE') as allowed from (values('anon'),('authenticated'),('service_role')) roles(r)`)).rows;
  test(!access[0].allowed&&!access[1].allowed&&access[2].allowed,'processing functions restricted to server role');
  await db.exec(migration); test(true,'migration remains repeatable with live-shaped data');
  await db.close(); console.log('WhatsApp PostgreSQL checks passed:',checks);
})().catch(error=>{console.error(error);process.exitCode=1;});
