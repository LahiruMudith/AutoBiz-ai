import { db } from '../config/firebase';
import { generateAIResponse } from './ai-agent';
import { broadcastSSE } from './sse';

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '';
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || '';

export async function sendWhatsAppMessage(
  businessId: string,
  toPhone: string,
  text: string
): Promise<boolean> {
  console.log(`[WhatsApp Outgoing] Business: ${businessId}, To: ${toPhone}, Content: "${text}"`);

  // 1. Record message in local/firebase database
  const conversationId = toPhone; // Using phone number as conversation ID for simplicity
  const conversationRef = db.collection('businesses').doc(businessId).collection('conversations').doc(conversationId);
  const messagesRef = conversationRef.collection('messages');

  const messageData = {
    role: 'model',
    content: text,
    timestamp: new Date().toISOString(),
    type: 'text'
  };

  await messagesRef.add(messageData);

  // Update conversation status
  await conversationRef.set({
    customerId: conversationId,
    lastMessage: text,
    lastMessageTime: new Date().toISOString(),
    unread: false
  }, { merge: true });

  // Broadcast update to SSE clients
  broadcastSSE(businessId, 'chat_updated', { customerId: conversationId });

  // 2. Get business configuration (database config overrides global env variables)
  let token = WHATSAPP_TOKEN;
  let phoneId = PHONE_NUMBER_ID;

  try {
    const bizRef = db.collection('businesses').doc(businessId);
    const bizSnap = await bizRef.get();
    if (bizSnap.exists) {
      const bizData = bizSnap.data();
      if (bizData?.whatsappToken) {
        token = bizData.whatsappToken;
      }
      if (bizData?.phoneNumberId) {
        phoneId = bizData.phoneNumberId;
      }
    }
  } catch (err) {
    console.error('Error fetching business WhatsApp config from DB:', err);
  }

  // 3. If configuration exists, send to actual Meta API
  if (token && phoneId) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${phoneId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: toPhone,
            type: 'text',
            text: { body: text }
          })
        }
      );

      const resJson = await response.json();
      if (!response.ok) {
        console.error('Meta API response failed:', resJson);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Error sending WhatsApp message to Meta:', e);
      return false;
    }
  }

  return true; // Return true for mock/simulation
}

/**
 * Handles incoming WhatsApp messages from either webhook (Meta) or simulated UI.
 */
export async function handleIncomingMessage(
  businessId: string,
  fromPhone: string,
  text: string,
  type: string = 'text'
): Promise<void> {
  console.log(`[WhatsApp Incoming] Business: ${businessId}, From: ${fromPhone}, Content: "${text}"`);

  const conversationId = fromPhone;
  const conversationRef = db.collection('businesses').doc(businessId).collection('conversations').doc(conversationId);
  const messagesRef = conversationRef.collection('messages');

  // 1. Record user message
  await messagesRef.add({
    role: 'user',
    content: text,
    timestamp: new Date().toISOString(),
    type
  });

  // Update conversation doc
  const convSnap = await conversationRef.get();
  const convData = convSnap.exists ? convSnap.data() : { aiActive: true };
  const aiActive = convData?.aiActive !== false; // Default to true if not specified

  await conversationRef.set({
    customerId: conversationId,
    lastMessage: text,
    lastMessageTime: new Date().toISOString(),
    unread: true,
    aiActive
  }, { merge: true });

  // Broadcast update to SSE clients
  broadcastSSE(businessId, 'chat_updated', { customerId: conversationId });

  // 2. Trigger AI Response if enabled
  if (aiActive) {
    // Fetch recent message history (last 10 messages)
    const historySnap = await messagesRef.orderBy('timestamp', 'desc').limit(10).get();
    
    // Sort chronologically
    const historyDocs = [...historySnap.docs].reverse();
    const chatHistory = historyDocs
      .filter(doc => doc.id !== historyDocs[historyDocs.length - 1].id) // exclude the current message we just added
      .map(doc => {
        const data = doc.data();
        return {
          role: data.role === 'model' ? 'model' as const : 'user' as const,
          content: data.content || ''
        };
      });

    // Generate response using AI
    // Simulate thinking time (1-2s) to make it feel natural
    setTimeout(async () => {
      const aiReply = await generateAIResponse(businessId, fromPhone, chatHistory, text);
      await sendWhatsAppMessage(businessId, fromPhone, aiReply);
    }, 1200);
  }
}
