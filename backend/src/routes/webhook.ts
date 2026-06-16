import { Router, Request, Response } from 'express';
import { handleIncomingMessage } from '../services/whatsapp';
import { processSuccessfulPayment } from '../services/payhere';

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

        // We need to look up which business this incoming phone number matches
        // For Meta integration, a business's settings has a phone number ID
        // Let's find the business that has metadata matching: phone_number_id
        // (Simplified for now or matches a test businessId via environment / mapping)
        const businessId = process.env.DEFAULT_BUSINESS_ID || 'demo-clothing-store';
        
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
