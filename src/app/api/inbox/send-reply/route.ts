import { inboxConversation, boundWhatsAppConnection } from '@/lib/whatsapp/inbox';
import { channelErrorResponse, channelRpc, ChannelError } from '@/lib/whatsapp/server';
import { isUuid, isWhatsAppWindowOpen } from '@/lib/whatsapp/policy';
import { processWhatsAppJob, whatsappCredentials, whatsappCredits, type WhatsAppJob } from '@/lib/whatsapp/messages';
import { buildReplyTemplate } from '@/lib/whatsapp/templates';
import { logWorkspaceUsage } from '@/lib/kolkap-usage/logUsage';

export const runtime='nodejs';
export const maxDuration=60;

export async function POST(request:Request) {
  try {
    const body=await request.json().catch(()=>({}));
    const {db,user,conversation}=await inboxConversation(request,body.conversation_id);
    let text=typeof body.message_text==='string'?body.message_text.trim():'';
    if(conversation.customer_channel==='website_chat') {
      if(!isUuid(body.request_id)) throw new ChannelError('Refresh Inbox before sending this reply.');
      if(!text||text.length>4096) throw new ChannelError('Enter a reply of up to 4,096 characters.');
      const message=await channelRpc('save_website_chat_human_reply',{p_conversation_id:conversation.id,p_workspace_id:conversation.workspace_id,
        p_request_id:body.request_id,p_actor_id:user.id,p_text:text});
      return Response.json({success:true,message,delivered:false,delivery_status:'queued',credits_used:0,
        notice:"Reply saved for Website Chat. It will appear when the visitor opens their chat. AI is paused."});
    }
    if(conversation.customer_channel!=='whatsapp') {
      if(!text||text.length>4096) throw new ChannelError('Enter a reply of up to 4,096 characters.');
      // Pause before saving the human reply so the Website Chat worker sees takeover.
      await channelRpc('set_workspace_conversation_handover',{p_conversation_id:conversation.id,p_workspace_id:conversation.workspace_id,p_paused:true});
      const {data:message,error}=await db.from('customer_messages').insert({conversation_id:conversation.id,workspace_id:conversation.workspace_id,
        owner_user_id:conversation.owner_user_id,ai_staff_id:conversation.ai_staff_id,sender_type:'human',message_text:text}).select('*').single();
      if(error) throw new ChannelError('Reply could not be saved.',503);
      await db.from('customer_conversations').update({last_message:text,last_message_at:message.created_at,updated_at:message.created_at}).eq('id',conversation.id);
      const website=conversation.customer_channel==='website_chat';
      await logWorkspaceUsage({workspaceId:conversation.workspace_id,userId:user.id,eventType:website?'manual_website_chat_reply_queued':'manual_inbox_reply_saved',
        channel:conversation.customer_channel||'inbox',sourcePage:'dashboard_inbox',creditsUsed:0,eventCount:1,status:website?'pending':'success',
        metadata:{conversation_id:conversation.id,delivery_status:website?'queued':'saved_only'}}).catch(()=>console.error('Human reply usage event could not be recorded.'));
      return Response.json({success:true,message,delivered:false,delivery_status:website?'queued':'saved_only',credits_used:0,
        notice:website?"Reply saved for Website Chat. It will appear while the visitor's session is available. AI is paused.":"Reply saved in Inbox. Direct delivery is not connected for this channel. AI is paused."});
    }
    if(!isUuid(body.request_id)) throw new ChannelError('Refresh Inbox before sending this reply.');
    const connection=await boundWhatsAppConnection(conversation,db);
    // Return an existing operation before checking a now-expired window or balance.
    const {data:existing,error:existingError}=await db.from('whatsapp_message_jobs').select('*').eq('connection_id',connection.id).eq('request_key','manual:'+body.request_id).maybeSingle();
    if(existingError) throw new ChannelError('Reply status could not be checked.',503);
    let job:WhatsAppJob;
    if(existing) {
      if(existing.conversation_id!==conversation.id||existing.requested_by_user_id!==user.id) throw new ChannelError('This reply request belongs to another operation.',409);
      if(existing.reply_kind==='manual'&&(body.template_id||text!==existing.reply_text)) throw new ChannelError('This request was already used for a different reply. Refresh Inbox.',409);
      // Client keeps the same request ID across network retries; no second send or charge.
      job=await processWhatsAppJob(existing.id);
    } else {
      await whatsappCredentials(connection);
      let template:Record<string,unknown>|null=null;
      if(body.template_id) {
        if(body.template_consent!==true) throw new ChannelError('Confirm the customer agreed to receive WhatsApp follow-ups.');
        const built=await buildReplyTemplate(connection,String(body.template_id),body.template_values||{});
        text=built.text;template=built.payload;
      } else if(!isWhatsAppWindowOpen(conversation.whatsapp_last_customer_at)) {
        throw new ChannelError('The 24-hour reply window is closed. Use an approved template or wait for the customer to message again.',409,'template_required');
      }
      if(!text||text.length>4096) throw new ChannelError('Enter a reply of up to 4,096 characters.');
      await whatsappCredits(conversation.workspace_id,3);
      job=await channelRpc<WhatsAppJob>('prepare_whatsapp_manual_send',{p_request_id:body.request_id,p_conversation_id:conversation.id,
        p_actor_id:user.id,p_text:text,p_template:template,p_credit_cost:3});
      job=await processWhatsAppJob(job.id);
    }
    if(job.phase!=='sent') return Response.json({success:false,job_id:job.id,delivery_status:job.delivery_status||job.phase,
      error:job.error_message||'This reply has not been sent. Check message activity before trying again.'},{status:409});
    const {data:message,error:messageError}=await db.from('customer_messages').select('*').eq('id',job.outbound_message_id).single();
    if(messageError) throw new ChannelError('Reply was accepted. Refresh Inbox to see its status.',503);
    return Response.json({success:true,message,job_id:job.id,delivery_status:job.delivery_status,delivered:job.delivery_status==='delivered'||job.delivery_status==='read',
      credits_used:job.credits_recorded,notice:'Reply accepted by WhatsApp. Delivery status will update here. AI is paused for this conversation.'});
  }catch(error){return channelErrorResponse(error);}
}
