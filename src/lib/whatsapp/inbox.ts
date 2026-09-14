import "server-only";
import { channelAccess, channelUser, ChannelError } from './server';
import { isUuid } from './policy';

export async function inboxConversation(request: Request, conversationId: unknown) {
  if (!isUuid(conversationId)) throw new ChannelError('A valid conversation is required.');
  const { db } = await channelUser(request);
  const { data: conversation, error } = await db.from('customer_conversations').select('*').eq('id',conversationId).maybeSingle();
  if (error) throw new ChannelError('Conversation could not be loaded.',503);
  if (!conversation) throw new ChannelError('Conversation not found.',404);
  const access = await channelAccess(request,conversation.workspace_id);
  return { ...access, conversation };
}

export async function boundWhatsAppConnection(conversation: { workspace_id: string; whatsapp_connection_id?: string | null }, db: Awaited<ReturnType<typeof channelUser>>['db']) {
  if (!conversation.whatsapp_connection_id) throw new ChannelError('This older conversation has no confirmed business number. Ask the customer to message your connected number to start a new conversation.',409,'number_binding_required');
  const { data: connection, error } = await db.from('workspace_whatsapp_connections').select('*')
    .eq('id',conversation.whatsapp_connection_id).eq('workspace_id',conversation.workspace_id).eq('provider','meta').maybeSingle();
  if (error) throw new ChannelError('Business number could not be checked.',503);
  if (!connection || connection.status!=='connected') throw new ChannelError('Connect this conversation’s WhatsApp number before replying.',409,'number_unavailable');
  return connection;
}
