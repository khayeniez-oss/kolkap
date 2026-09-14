const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { randomUUID, webcrypto, createHmac } = require('node:crypto');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function load(file, modules={}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText, {
    exports, Buffer, URL, Request, Response, console, process:{env:{SUPABASE_SERVICE_ROLE_KEY:'offline-secret',NEXT_PUBLIC_SUPABASE_URL:'https://database.invalid'}},
    require(name) { if(name in modules) return modules[name]; if(name.startsWith('@/')) return load('src/'+name.slice(2)+'.ts',modules); return require(name); },
  });
  return exports;
}

test('domains reject lookalikes and page-origin mismatches; page tracking drops secrets',()=>{
  const p=load('src/lib/website-chat/policy.ts');
  assert.equal(p.allowedWebsiteRequest(new Request('https://kolkap.invalid',{headers:{origin:'https://shop.example.com'}}),'https://shop.example.com/store',['example.com']),true);
  for(const origin of ['https://example.com.attacker.test','https://badexample.com','null','https://attacker.test']) {
    assert.equal(p.allowedWebsiteRequest(new Request('https://kolkap.invalid',{headers:{origin}}),'',['example.com']),false);
  }
  assert.equal(p.allowedWebsiteRequest(new Request('https://kolkap.invalid',{headers:{origin:'https://example.com'}}),'https://other.test/',['example.com']),false);
  assert.equal(p.websiteHost('https://user:password@example.com'),'');
  assert.equal(p.websitePageUrl('https://example.com/account?token=secret#private'),'https://example.com/account');
});

function endpoint() {
  const workspace=randomUUID(),conversation=randomUUID(),visitor=randomUUID();
  const filters=[];
  const db={from(table) {
    const q={select(){return q;},eq(k,v){filters.push([table,k,v]);return q;},in(k,v){filters.push([table,k,v]);return q;},gt(k,v){filters.push([table,k,v]);return q;},
      order(){return q;},limit(){return q;},maybeSingle(){return q;},update(){return q;},then(resolve){
        let data=table==='business_workspaces'?{id:workspace,owner_user_id:randomUUID(),stripe_subscription_id:'sub_test'}:
          table==='workspace_website_chat_settings'?{id:randomUUID(),is_active:true,allowed_domains:['example.com'],widget_title:'Live title',widget_subtitle:'Live subtitle',welcome_message:'Hello'}:
          table==='customer_conversations'?{id:conversation}:[];
        return Promise.resolve({data,error:null}).then(resolve);
      }};return q;
  }};
  const route=load('src/app/api/website-chat/message/route.ts',{
    'next/server':{NextResponse:Response},'@supabase/supabase-js':{createClient:()=>db},
    '@/lib/kolkap-ai/brain':{runKolkapBrain:()=>{throw Error('Unexpected AI generation');}},
    '@/lib/kolkap-notifications/createNotification':{createKolkapNotification:async()=>{}},
    '@/lib/kolkap-ai-staff/channelAssignments':{chooseDefaultChannelAiStaffId:async()=>null},
    '@/lib/whatsapp/server':{channelRpc:()=>{throw Error('Unexpected write');}},
  });
  const token=(overrides={})=>{
    const value=Buffer.from(JSON.stringify({workspaceId:workspace,conversationId:conversation,visitorId:visitor,host:'example.com',expiresAt:Date.now()+60000,...overrides})).toString('base64url');
    return value+'.'+createHmac('sha256','offline-secret').update(value).digest('base64url');
  };
  const url=new URL('https://kolkap.invalid/api/website-chat/message');
  for(const [k,v] of Object.entries({workspace_id:workspace,conversation_id:conversation,visitor_id:visitor,mode:'history',after:'150'})) url.searchParams.set(k,v);
  return {route,token,url,filters,workspace,conversation,visitor};
}

test('history requires a matching signed visitor/workspace/conversation and expiry',async()=>{
  const e=endpoint();
  for(const token of ['forged',e.token({visitorId:randomUUID()}),e.token({workspaceId:randomUUID()}),e.token({conversationId:randomUUID()}),e.token({expiresAt:0}),e.token({host:'other.test'})]) {
    const result=await e.route.GET(new Request(e.url,{headers:{origin:'https://example.com','x-kolkap-session':token}}));
    assert.equal(result.status,401);
  }
  const result=await e.route.GET(new Request(e.url,{headers:{origin:'https://example.com','x-kolkap-session':e.token()}}));
  assert.equal(result.status,200);
  assert.ok(e.filters.some(([table,k,v])=>table==='customer_messages'&&k==='website_message_sequence'&&v===150));
  assert.ok(e.filters.some(([table,k,v])=>table==='customer_conversations'&&k==='customer_channel'&&v==='website_chat'));
});

test('forged conversation POST is rejected before a write or generation',async()=>{
  const e=endpoint();
  const response=await e.route.POST(new Request(e.url,{method:'POST',headers:{origin:'https://example.com','Content-Type':'application/json'},body:JSON.stringify({workspace_id:e.workspace,conversation_id:e.conversation,visitor_id:e.visitor,request_id:randomUUID(),session_token:'forged',message:'hello'})}));
  assert.equal(response.status,401);
  assert.equal(e.filters.length,0);
});

// Minimal DOM harness: exercises the shipped widget, with no external browser or network.
class Element {
  constructor(tag) {this.tag=tag;this.children=[];this.attrs={};this.listeners={};this.style={};this.value='';this.className='';this.textContent='';
    const classes=new Set();this.classList={add:v=>classes.add(v),remove:v=>classes.delete(v),contains:v=>classes.has(v),toggle:(v,on)=>on?classes.add(v):classes.delete(v)};
  }
  appendChild(child){child.remove();child.parentNode=this;this.children.push(child);return child;}
  remove(){if(this.parentNode){this.parentNode.children=this.parentNode.children.filter(x=>x!==this);this.parentNode=null;}}
  setAttribute(k,v){this.attrs[k]=v;} getAttribute(k){return this.attrs[k]||null;}
  addEventListener(k,fn){this.listeners[k]=fn;} focus(){} requestSubmit(){this.emit('submit');}
  emit(k,props={}){return this.listeners[k]?.({preventDefault(){},...props});}
}
const settle=async()=>{for(let i=0;i<8;i++)await new Promise(resolve=>setImmediate(resolve));};
async function widget({store=new Map(),blocked=false,active=true,onPost,history=[]}={}) {
  const body=new Element('body'),head=new Element('head'),calls=[],timers=[];
  const script=new Element('script');script.src='https://kolkap.invalid/widget.js';script.attrs['data-workspace-id']='workspace';
  const document={body,head,currentScript:script,readyState:'complete',hidden:false,createElement:tag=>new Element(tag),getElementById:()=>null,querySelector:()=>null};
  const window={document,crypto:webcrypto,location:new URL('https://example.com/contact?token=hidden#secret'),
    localStorage:{getItem:k=>{if(blocked)throw Error('blocked');return store.get(k);},setItem:(k,v)=>{if(blocked)throw Error('blocked');store.set(k,v);},removeItem:k=>{if(blocked)throw Error('blocked');store.delete(k);}},
    setTimeout:(fn,ms)=>{const t={fn,ms};timers.push(t);return t;},clearTimeout:t=>{if(t)t.stopped=true;},
    setInterval:(fn,ms)=>{const t={fn,ms,interval:true};timers.push(t);return t;},clearInterval:t=>{if(t)t.stopped=true;},
  };
  const fetch=async(url,options={})=>{
    const u=new URL(url);calls.push({url:u,options});
    if(u.searchParams.get('mode')==='config') return Response.json({active,title:'Saved title',subtitle:'Saved subtitle',welcome_message:'Welcome'});
    if(options.method==='POST') return onPost?onPost(JSON.parse(options.body)):Response.json({conversation_id:'conversation',session_token:'session',reply_message_id:'ai-1'});
    const after=Number(u.searchParams.get('after')||0);const rows=history.filter(m=>m.website_message_sequence>after).slice(0,100);
    return Response.json({messages:rows,next_cursor:rows.at(-1)?.website_message_sequence||after,has_more:rows.length===100});
  };
  vm.runInNewContext(fs.readFileSync(path.join(root,'public/widget.js'),'utf8'),{window,document,fetch,URL,AbortController,Uint8Array,console});
  await settle();
  const all=()=>{const result=[];const visit=e=>{result.push(e);e.children.forEach(visit);};visit(body);return result;};
  const find=cls=>all().find(e=>e.className===cls);
  return {store,calls,timers,find,all,open:async()=>{find('kolkap-widget-button').emit('click');await settle();},send:async text=>{find('kolkap-widget-input').value=text;find('kolkap-widget-form').emit('submit');await settle();}};
}

test('inactive chat stays hidden; active widget uses saved configuration',async()=>{
  assert.equal((await widget({active:false})).find('kolkap-widget-root'),undefined);
  const w=await widget();assert.equal(w.find('kolkap-widget-title').textContent,'Saved title');
  assert.ok(w.calls.every(c=>!c.url.toString().includes('hidden')));
});

test('blocked local storage retains visitor identity and conversation within the tab',async()=>{
  const posts=[];
  const w=await widget({blocked:true,onPost:async body=>{posts.push(body);return Response.json({conversation_id:'conversation',session_token:'token',reply:'Saved'});}});
  await w.open();await w.send('First');await w.send('Second');
  assert.equal(posts.length,2);assert.equal(posts[0].visitor_id,posts[1].visitor_id);
  assert.equal(posts[1].conversation_id,'conversation');assert.equal(posts[1].session_token,'token');
  assert.notEqual(posts[0].request_id,posts[1].request_id);
});

test('repeated submit while sending cannot create a duplicate request',async()=>{
  let release;let posts=0;
  const w=await widget({onPost:()=>{posts++;return new Promise(resolve=>{release=resolve;});}});
  await w.open();await w.send('Hello');w.find('kolkap-widget-form').emit('submit');await settle();
  assert.equal(posts,1);release(Response.json({conversation_id:'conversation',session_token:'token',reply:'Saved'}));await settle();
});

test('lost response keeps the draft and reuses the exact request on retry and reload',async()=>{
  const posts=[];const store=new Map();
  const w=await widget({store,onPost:body=>{posts.push(body);throw Error('connection lost');}});
  await w.open();await w.send('Recover me');
  assert.equal(w.find('kolkap-widget-input').value,'Recover me');
  const reloaded=await widget({store,onPost:body=>{posts.push(body);return Response.json({conversation_id:'conversation',session_token:'token',reply:'Saved'});}});
  await reloaded.open();assert.equal(posts.length,2);assert.deepEqual(posts[0],posts[1]);
  assert.equal(store.has('kolkap_widget_workspace_pending_message'),false);
});

test('reload restores all conversation messages, including replies after the first hundred',async()=>{
  const store=new Map([['kolkap_widget_workspace_conversation_id','conversation'],['kolkap_widget_workspace_session_token','token'],['kolkap_widget_workspace_delivered_messages','["1"]']]);
  const history=Array.from({length:105},(_,i)=>({id:String(i+1),sender_type:i%2?'human':'customer',message_text:'Message '+(i+1),website_message_sequence:i+1}));
  const w=await widget({store,history});await w.open();
  assert.equal(w.all().filter(e=>/^Message \d+$/.test(e.textContent)).length,105);
  const polls=w.calls.filter(c=>c.url.searchParams.get('mode')==='history');
  assert.deepEqual(polls.map(c=>c.url.searchParams.get('after')),['0','100']);
  assert.ok(polls.every(c=>!c.url.searchParams.has('session_token')&&c.options.headers['X-Kolkap-Session']==='token'));
  await w.timers.find(t=>t.interval).fn();await settle();
  assert.equal(w.all().filter(e=>/^Message \d+$/.test(e.textContent)).length,105);
});
