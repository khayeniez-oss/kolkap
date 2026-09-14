import { channelAccess, channelErrorResponse, channelRpc, ChannelError } from '@/lib/whatsapp/server';
import { isUuid } from '@/lib/whatsapp/policy';
export const runtime='nodejs';
export async function POST(request:Request) {
  try {
    const body=await request.json();
    const {user}=await channelAccess(request,body.workspace_id,'settings');
    if(!isUuid(body.connection_id)||!Array.isArray(body.staff_ids)||body.staff_ids.length>50||!body.staff_ids.every(isUuid)) throw new ChannelError('Choose a valid number and AI team.');
    const settings=body.settings;
    if(!settings||!['ai_enabled','auto_reply_enabled','handover_enabled','is_primary'].every(key=>typeof settings[key]==='boolean')) throw new ChannelError('Invalid channel settings.');
    if(settings.selected_ai_staff_id!==null&&!isUuid(settings.selected_ai_staff_id)) throw new ChannelError('Choose valid AI staff.');
    if((settings.auto_reply_enabled&&(!settings.ai_enabled||!settings.selected_ai_staff_id))||(settings.selected_ai_staff_id&&!body.staff_ids.includes(settings.selected_ai_staff_id))) throw new ChannelError('Choose a first responder in your AI team before enabling replies.');
    await channelRpc('save_workspace_whatsapp_settings',{p_connection_id:body.connection_id,p_workspace_id:body.workspace_id,p_user_id:user.id,
      p_staff_ids:[...new Set(body.staff_ids)],p_settings:{...settings,connection_label:String(settings.connection_label||'').slice(0,120),notes:String(settings.notes||'').slice(0,2000)}});
    return Response.json({success:true});
  }catch(error){return channelErrorResponse(error);}
}
