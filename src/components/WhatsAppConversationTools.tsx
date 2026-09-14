"use client";
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { deliveryLabel } from '@/lib/whatsapp/policy';

type Template={id:string;name:string;language:string;body:string;fields:Array<{key:string;label:string}>};
type Activity={id:string;reply_text:string|null;reply_kind:string;phase:string;error_message:string|null;credits_recorded:number};
type Context={number:string;window_open:boolean;ai_enabled:boolean;jobs:Activity[]};

export default function WhatsAppConversationTools({conversationId,onSent}:{conversationId:string;onSent:()=>void}) {
  const [context,setContext]=useState<Context|null>(null);
  const [error,setError]=useState('');
  const [showTemplates,setShowTemplates]=useState(false);
  const [templates,setTemplates]=useState<Template[]>([]);
  const [templateId,setTemplateId]=useState('');
  const [values,setValues]=useState<Record<string,string>>({});
  const [consent,setConsent]=useState(false);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');
  const requestRef=useRef({key:'',id:''});
  const template=templates.find(t=>t.id===templateId);
  async function headers() {
    const {data}=await createClient().auth.getSession();
    return {'Content-Type':'application/json',Authorization:`Bearer ${data.session?.access_token||''}`};
  }
  useEffect(()=>{
    let active=true;
    async function load(){
      try {
        const response=await fetch(`/api/inbox/whatsapp?conversation_id=${conversationId}`,{headers:await headers(),cache:'no-store'});
        const result=await response.json();
        if(!active)return;
        if(!response.ok) throw new Error(result.error||'WhatsApp status is unavailable.');
        setContext(result);setError('');
      }catch(e){if(active)setError(e instanceof Error?e.message:'WhatsApp status is unavailable.');}
    }
    void load();const timer=setInterval(load,8000);
    return()=>{active=false;clearInterval(timer);};
  },[conversationId]);
  async function loadTemplates(){
    setBusy(true);setNotice('');
    try{
      const response=await fetch(`/api/inbox/whatsapp?conversation_id=${conversationId}&templates=1`,{headers:await headers()});
      const result=await response.json();if(!response.ok)throw new Error(result.error);
      setTemplates(result.templates);setShowTemplates(true);
    }catch(e){setNotice(e instanceof Error?e.message:'Templates could not be loaded.');}
    finally{setBusy(false);}
  }
  async function sendTemplate(){
    if(!template||!consent)return;
    const key=JSON.stringify([conversationId,template.id,values]);
    if(requestRef.current.key!==key)requestRef.current={key,id:crypto.randomUUID()};
    setBusy(true);setNotice('');
    try{
      const response=await fetch('/api/inbox/send-reply',{method:'POST',headers:await headers(),body:JSON.stringify({conversation_id:conversationId,
        request_id:requestRef.current.id,template_id:template.id,template_values:values,template_consent:consent})});
      const result=await response.json();if(!response.ok)throw new Error(result.error);
      setNotice(result.notice);setShowTemplates(false);setValues({});setConsent(false);requestRef.current={key:'',id:''};onSent();
    }catch(e){setNotice(e instanceof Error?e.message:'Reply status is unconfirmed. Refresh before sending again.');}
    finally{setBusy(false);}
  }
  return <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 text-sm">
    {error?<p role="alert" className="text-red-700">{error}</p>:context?<>
      <p className="font-bold">Business number: {context.number}</p>
      <p>{context.window_open?'The customer’s 24-hour reply window is open.':'The reply window is closed. Use an approved template or wait for the customer to message again.'}</p>
      {!context.ai_enabled?<p>Automatic replies are off for this number. Enable them in WhatsApp settings when ready.</p>:null}
      <button type="button" disabled={busy} onClick={loadTemplates} className="justify-self-start font-bold text-blue-700 disabled:opacity-50">{busy?'Please wait…':'Use an approved template'}</button>
      {(context.jobs||[]).filter(j=>['failed','unknown','sending','ready','generating'].includes(j.phase)||j.phase==='skipped'&&j.credits_recorded>0).map(job=><div key={job.id} className="rounded-xl bg-slate-50 p-3">
        <p className="font-bold">{job.reply_kind==='ai'?'AI reply':'Team reply'} · {deliveryLabel(job.phase)}</p>
        <p>{job.error_message||'Reply processing is in progress.'}</p>
        {job.reply_text?<p className="mt-1 line-clamp-3">{job.reply_text}</p>:null}
        {job.credits_recorded>0?<p className="mt-1">{job.credits_recorded} credits used.</p>:null}
      </div>)}
    </>:<p>Loading WhatsApp status…</p>}
    {showTemplates?<div className="grid gap-3 border-t border-slate-200 pt-4">
      <p className="font-bold">Approved text templates</p>
      <p>Templates are managed in Meta WhatsApp Manager. Media templates and buttons with variable values are not supported in this Inbox yet.</p>
      {!templates.length?<p>No supported approved templates were found for this number.</p>:<>
        <label>Template<select value={templateId} onChange={e=>{setTemplateId(e.target.value);setValues({});setConsent(false);}}
          className="mt-1 block w-full rounded-xl border border-slate-300 p-3"><option value="">Choose a template</option>{templates.map(t=><option key={t.id} value={t.id}>{t.name} · {t.language}</option>)}</select></label>
        {template?<><p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-3">{template.body}</p>
          {template.fields.map(f=><label key={f.key}>{f.label}<input value={values[f.key]||''} maxLength={1024} onChange={e=>setValues(v=>({...v,[f.key]:e.target.value}))} className="mt-1 block w-full rounded-xl border border-slate-300 p-3"/></label>)}
          <label className="flex gap-2"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>The customer agreed to receive WhatsApp follow-ups.</label>
          <button type="button" disabled={busy||!consent||template.fields.some(f=>!values[f.key]?.trim())} onClick={sendTemplate} className="rounded-full bg-[#07111F] p-3 font-bold text-white disabled:opacity-50">Send template · 3 credits</button>
        </>:null}
      </>}
    </div>:null}
    {notice?<p role="status">{notice}</p>:null}
  </div>;
}
