import * as crypto from 'crypto';
import { db } from '../config/firebase';

const PAYHERE_MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID || 'MOCK_MERCHANT_ID';
const PAYHERE_SECRET = process.env.PAYHERE_SECRET || 'MOCK_SECRET';

export interface PayHereParams {
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  currency: string;
  amount: number;
  hash: string;
}

export function generatePayHereParams(
  businessId: string,
  plan: 'starter' | 'business' | 'enterprise'
): PayHereParams {
  const planDetails = {
    starter: { price: 7000, name: 'AutoBiz AI Starter Plan' },
    business: { price: 15000, name: 'AutoBiz AI Business Plan' },
    enterprise: { price: 50000, name: 'AutoBiz AI Enterprise Plan' }
  };

  const selected = planDetails[plan];
  const orderId = `SUB_${businessId}_${Date.now()}`;
  const amount = selected.price;
  const currency = 'LKR';

  // Generate MD5 hash for PayHere signature:
  // Hash = UpperCase (MD5 (merchant_id + order_id + amount + currency + UpperCase(MD5(payhere_secret))))
  const hashedSecret = crypto.createHash('md5').update(PAYHERE_SECRET).digest('hex').toUpperCase();
  const rawString = PAYHERE_MERCHANT_ID + orderId + amount.toFixed(2) + currency + hashedSecret;
  const hash = crypto.createHash('md5').update(rawString).digest('hex').toUpperCase();

  // Return params (normally these are submitted to PayHere Sandbox or Production via form submit)
  // For our dashboard, we will redirect to a simulated payment gateway UI route
  return {
    merchant_id: PAYHERE_MERCHANT_ID,
    return_url: `http://localhost:3000/dashboard/settings?payment=success&plan=${plan}`,
    cancel_url: `http://localhost:3000/dashboard/settings?payment=cancelled`,
    notify_url: `http://localhost:5000/api/payhere/webhook`, // Express backend URL
    order_id: orderId,
    items: selected.name,
    currency,
    amount,
    hash
  };
}

export async function processSuccessfulPayment(orderId: string, amount: number) {
  // Extract businessId and plan from orderId
  // E.g. SUB_businessId_timestamp
  const parts = orderId.split('_');
  if (parts[0] === 'SUB' && parts.length >= 3) {
    const businessId = parts[1];
    
    // Map amount back to plan
    let plan = 'starter';
    if (amount >= 50000) plan = 'enterprise';
    else if (amount >= 15000) plan = 'business';

    console.log(`[PayHere Webhook] Updating subscription for ${businessId} to ${plan}`);

    await db.collection('businesses').doc(businessId).set({
      subscription: {
        plan,
        status: 'active',
        lastPayment: new Date().toISOString(),
        orderId
      }
    }, { merge: true });
  }
}
