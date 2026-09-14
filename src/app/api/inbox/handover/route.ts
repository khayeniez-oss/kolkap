import { inboxConversation } from '@/lib/whatsapp/inbox';
import { channelErrorResponse, channelRpc, ChannelError } from '@/lib/whatsapp/server';
export const runtime='nodejs';
export async function POST(request:Request) {
  try {
    const body=await request.json();
    if (typeof body.paused!=='boolean') throw new ChannelError('Choose pause or resume.');
    const { conversation }=await inboxConversation(request,body.conversation_id);
    const updated=await channelRpc('set_workspace_conversation_handover',{p_conversation_id:conversation.id,p_workspace_id:conversation.workspace_id,p_paused:body.paused});
    return Response.json({success:true,conversation:updated});
  } catch(error) {return channelErrorResponse(error);}
}
