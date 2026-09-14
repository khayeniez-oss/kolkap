import "server-only";
import { ChannelError } from "./server";
import { metaGraphVersion } from "./sendMessage";
import { whatsappCredentials, type WhatsAppConnection } from "./messages";

type Component = { type: string; format?: string; text?: string; buttons?: Array<{ url?: string; type?: string }> };
type MetaTemplate = { id: string; name: string; language: string; status: string; components: Component[] };
export type ReplyTemplate = { id: string; name: string; language: string; body: string; fields: Array<{ key: string; label: string }> };

function describe(template: MetaTemplate): ReplyTemplate | null {
  if (template.status !== "APPROVED" || !template.components?.some(c=>c.type==='BODY')) return null;
  const fields: ReplyTemplate['fields'] = [];
  for (const component of template.components) {
    if (component.type === 'HEADER' && component.format !== 'TEXT') return null;
    if (component.type === 'BUTTONS' && component.buttons?.some(b=>!['URL','PHONE_NUMBER','QUICK_REPLY'].includes(b.type || '') || b.url?.includes('{{'))) return null;
    if (!['HEADER','BODY','FOOTER','BUTTONS'].includes(component.type)) return null;
    for (const match of (component.text || '').matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)) {
      const key = `${component.type.toLowerCase()}:${match[1]}`;
      if (!fields.some(f=>f.key===key)) fields.push({ key, label: `${component.type.toLowerCase()} ${match[1]}` });
    }
  }
  return { id: template.id, name: template.name, language: template.language,
    body: template.components.filter(c=>c.text).map(c=>c.text).join('\n'), fields };
}

async function loadTemplates(connection: WhatsAppConnection) {
  const credentials = await whatsappCredentials(connection);
  if (!connection.meta_waba_id || !/^\d+$/.test(connection.meta_waba_id)) throw new ChannelError('This number has no linked WhatsApp business account.',409);
  const templates: MetaTemplate[] = [];
  let after = '';
  for (let page=0; page<5; page++) {
    const url = new URL(`https://graph.facebook.com/${metaGraphVersion()}/${connection.meta_waba_id}/message_templates`);
    url.searchParams.set('fields','id,name,language,status,components'); url.searchParams.set('limit','100');
    if (after) url.searchParams.set('after',after);
    const response = await fetch(url,{headers:{Authorization:`Bearer ${credentials.accessToken}`},signal:AbortSignal.timeout(15_000),cache:'no-store'});
    const data = await response.json();
    if (!response.ok || data.error) throw new ChannelError('Approved templates could not be loaded from Meta. Check this number’s connection.',502);
    templates.push(...(data.data || []));
    if (!data.paging?.next || !data.paging?.cursors?.after) break;
    after = data.paging.cursors.after;
  }
  return templates;
}

export async function listReplyTemplates(connection: WhatsAppConnection) {
  return (await loadTemplates(connection)).map(describe).filter((t): t is ReplyTemplate=>t!==null);
}

export async function buildReplyTemplate(connection: WhatsAppConnection, id: string, values: Record<string,string>) {
  const template = (await loadTemplates(connection)).find(t=>t.id===id);
  const summary = template && describe(template);
  if (!template || !summary) throw new ChannelError('Choose an approved text template available for this number.');
  for (const field of summary.fields) if (typeof values[field.key] !== 'string' || !values[field.key].trim() || values[field.key].length>1024) throw new ChannelError('Complete all template fields (up to 1,024 characters each).');
  const components = ['header','body'].map(type=>({type,parameters:summary.fields.filter(f=>f.key.startsWith(type+':')).map(f=>{
    const name=f.key.split(':')[1];
    return {type:'text',text:values[f.key].trim(),...(/^\d+$/.test(name)?{}:{parameter_name:name})};
  })})).filter(c=>c.parameters.length);
  const text = template.components.filter(c=>c.text).map(c=>(c.text || '').replace(/\{\{([a-zA-Z0-9_]+)\}\}/g,(_,name)=>values[`${c.type.toLowerCase()}:${name}`]?.trim() || '')).join('\n');
  if (text.length>4096) throw new ChannelError('This template reply is too long. Shorten its fields.');
  return { text, payload:{name:template.name,language:{code:template.language},components} };
}
