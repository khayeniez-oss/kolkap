import { inboxConversation, boundWhatsAppConnection } from '@/lib/whatsapp/inbox';
import { channelErrorResponse, ChannelError } from '@/lib/whatsapp/server';
import { isWhatsAppWindowOpen } from '@/lib/whatsapp/policy';
import { listReplyTemplates } from '@/lib/whatsapp/templates';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request) {
  try {
    const url=new URL(request.url);
    const {db,conversation}=await inboxConversation(request,url.searchParams.get('conversation_id'));
    const connection=await boundWhatsAppConnection(conversation,db);
    const {data:jobs,error}=await db.from('whatsapp_message_jobs').select('id,reply_text,reply_kind,phase,delivery_status,error_message,created_at,credits_recorded')
      .eq('conversation_id',conversation.id).eq('workspace_id',conversation.workspace_id).is('outbound_message_id',null)
      .order('created_at',{ascending:false}).limit(10);
    if(error) throw new ChannelError('Message activity could not be loaded.',503);
    return Response.json({success:true,number:connection.display_phone_number,ai_enabled:connection.ai_enabled&&connection.auto_reply_enabled,
      window_open:isWhatsAppWindowOpen(conversation.whatsapp_last_customer_at),jobs,
      ...(url.searchParams.get('templates')==='1'?{templates:await listReplyTemplates(connection)}:{})});
  } catch(error) {return channelErrorResponse(error);}
}
