import { Router, Request, Response } from 'express';
import { handleIncomingMessage } from '../services/whatsapp';
import { processSuccessfulPayment } from '../services/payhere';
import { db } from '../config/firebase';

const router = Router();

// 1. Meta WhatsApp Webhook Verification (GET)
router.get('/whatsapp', (req: Request, res: Response) => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'autobiz_verify_token';
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WhatsApp webhook verified successfully!');
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }
  return res.status(400).send('Bad Request');
});

// 2. Meta WhatsApp Webhook Event (POST)
router.post('/whatsapp', async (req: Request, res: Response) => {
  const body = req.body;

  if (body.object === 'whatsapp_business_account') {
    try {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (message) {
        const from = message.from; // Customer phone number
        const text = message.text?.body || '';
        const type = message.type || 'text';

        // Find which business this message belongs to based on display_phone_number / phone_number_id
        const displayPhoneNumber = value?.metadata?.display_phone_number;
        const incomingPhoneId = value?.metadata?.phone_number_id;
        
        let businessId = process.env.DEFAULT_BUSINESS_ID || 'demo-clothing-store';

        if (displayPhoneNumber || incomingPhoneId) {
          try {
            const normalizedDisplay = displayPhoneNumber ? displayPhoneNumber.replace(/\D/g, '') : '';
            const businessesSnap = await db.collection('businesses').get();
            const foundBiz = businessesSnap.docs.find((doc: any) => {
              const data = doc.data();
              if (data) {
                // Match by phone number ID first if available
                if (incomingPhoneId && data.phoneNumberId === incomingPhoneId) {
                  return true;
                }
                // Fallback to match by whatsapp number
                if (normalizedDisplay && data.whatsappNumber) {
                  const normBizNum = data.whatsappNumber.replace(/\D/g, '');
                  return normBizNum === normalizedDisplay;
                }
              }
              return false;
            });

            if (foundBiz) {
              businessId = foundBiz.id;
              console.log(`[Webhook Dynamic Routing] Matched business ID: ${businessId} for display phone: ${displayPhoneNumber}, ID: ${incomingPhoneId}`);
            } else {
              console.log(`[Webhook Dynamic Routing] No matching business found for phone: ${displayPhoneNumber}, ID: ${incomingPhoneId}. Using default business: ${businessId}`);
            }
          } catch (e) {
            console.error('[Webhook Dynamic Routing] Error querying business matching number:', e);
          }
        }
        
        await handleIncomingMessage(businessId, from, text, type);
      }
      return res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
      console.error('Error processing Meta webhook event:', error);
      return res.status(500).send('Internal Server Error');
    }
  }
  return res.status(404).send('Not Found');
});

// 3. Simulated Incoming Message Endpoint (POST)
// Use this to test customer chats directly from the browser sandbox UI!
router.post('/simulate/incoming', async (req: Request, res: Response) => {
  const { businessId, fromPhone, text, type } = req.body;

  if (!businessId || !fromPhone || !text) {
    return res.status(400).json({ error: 'Missing businessId, fromPhone, or text' });
  }

  try {
    await handleIncomingMessage(businessId, fromPhone, text, type || 'text');
    return res.status(200).json({ success: true, message: 'Message simulated successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// 4. PayHere Webhook (POST)
router.post('/payhere/webhook', async (req: Request, res: Response) => {
  const { merchant_id, order_id, payhere_amount, payhere_currency, status_code } = req.body;
  
  console.log(`[PayHere Webhook Received] Order: ${order_id}, Status: ${status_code}, Amount: ${payhere_amount}`);

  // Status code 2 is successful payment on PayHere
  if (Number(status_code) === 2) {
    try {
      await processSuccessfulPayment(order_id, Number(payhere_amount));
      return res.status(200).send('OK');
    } catch (error) {
      console.error('Error processing payment in webhook:', error);
      return res.status(500).send('Internal Server Error');
    }
  }

  return res.status(200).send('Ignored');
});

export default router;
