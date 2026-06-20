import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../config/firebase';
import * as dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Initialize Gemini API
let genAI: any = null;
if (GEMINI_API_KEY) {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  } catch (e) {
    console.warn('Could not initialize GoogleGenerativeAI. Will fallback to simulated AI response.');
  }
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
}

interface BusinessSettings {
  name: string;
  type: string;
  faqs: { question: string; answer: string }[];
  welcomeMessage?: string;
  returnPolicy?: string;
  deliveryFee?: number;
}

export async function generateAIResponse(
  businessId: string,
  customerPhone: string,
  chatHistory: { role: 'user' | 'model'; content: string }[],
  incomingMessage: string
): Promise<string> {
  try {
    // 1. Fetch Business Settings
    const bizDoc = await db.collection('businesses').doc(businessId).get();
    if (!bizDoc.exists) {
      return "Hello, how can I assist you today?";
    }
    const bizData = bizDoc.data() as BusinessSettings;

    // 2. Fetch Products Catalog
    const productsSnap = await db.collection('businesses').doc(businessId).collection('products').get();
    const products: Product[] = [];
    productsSnap.docs.forEach(doc => {
      const data = doc.data();
      products.push({
        id: doc.id,
        name: data.name || '',
        description: data.description || '',
        price: Number(data.price) || 0,
        stock: Number(data.stock) || 0,
        category: data.category || ''
      });
    });

    // 3. Construct the system instructions
    const productCatalogStr = products.map(p => 
      `- ${p.name} (${p.category}): Price: LKR ${p.price}, Stock: ${p.stock}. Desc: ${p.description}`
    ).join('\n');

    const faqsStr = (bizData.faqs || []).map(f =>
      `Q: ${f.question}\nA: ${f.answer}`
    ).join('\n\n');

    const systemInstruction = `
You are the official AI Agent (Sales & Support) for "${bizData.name || 'our business'}", a ${bizData.type || 'retail store'} based in Sri Lanka.
Your goals:
1. Help customers with their inquiries, provide friendly customer support, and recommend appropriate products.
2. Maintain a professional, polite, and helpful tone.
3. Automatically detect the user's language. You must respond in the same language as the customer's query:
   - If they write in English, reply in English.
   - If they write in Sinhala script (e.g. ඔයාට කොහොමද?), reply in Sinhala script.
   - If they write in Singlish (e.g. hoda add-ons monada thiyenne, black shirts thiyeda?), reply in Singlish using Latin letters. Keep your Singlish responses natural, easy to read, and friendly.
4. Recommend products ONLY from the available catalog below. If a product is out of stock, politely inform the customer.
5. If the user wants to place an order, guide them to specify the product name and quantity, and tell them we will generate a checkout cart for them.
6. Return policy: ${bizData.returnPolicy || 'Returns accepted within 7 days in original condition.'}
7. Delivery fee: LKR ${bizData.deliveryFee || 350}.

Product Catalog:
${productCatalogStr || 'No products available currently.'}

Frequently Asked Questions (FAQs):
${faqsStr || 'No FAQs configured yet.'}
`;

    // 4. Send request to Gemini API if key is present, otherwise fallback to local rules
    if (GEMINI_API_KEY && genAI) {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemInstruction,
      });

      // Structure contents with history
      const contents = [
        ...chatHistory.map(h => ({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.content }]
        })),
        {
          role: 'user',
          parts: [{ text: incomingMessage }]
        }
      ];

      const result = await model.generateContent({ contents });
      const response = await result.response;
      return response.text().trim();
    } else {
      // Offline fallback: Simulated AI responses with keyword matching
      return simulateMultilingualAIResponse(incomingMessage, products, bizData);
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "Thank you for contacting us. An agent will get back to you shortly.";
  }
}

// Simulated multilingual AI logic for when the API key is not active
function simulateMultilingualAIResponse(msg: string, products: Product[], biz: BusinessSettings): string {
  const m = msg.toLowerCase();
  
  // Detect language
  const isSinhala = /[\u0d80-\u0dff]/.test(msg);
  const isSinglish = (m.includes('thiyeda') || m.includes('tiyeda') || m.includes('thiyenne') || m.includes('ganna') || m.includes('mokada') || m.includes('koheda') || m.includes('puluwanda') || m.includes('nadda') || m.includes('machan'));

  if (isSinhala) {
    if (m.includes('මිල') || m.includes('ගණන්') || m.includes('කීයද')) {
      return `ඔබට අපගේ නිෂ්පාදන මිල ගණන් දැනගැනීමට අවශ්‍යද? කරුණාකර භාණ්ඩයේ නම පවසන්න. උදාහරණයක් ලෙස: ` + 
        (products.length > 0 ? `"${products[0].name}"` : 'shirt');
    }
    if (m.includes('හායි') || m.includes('හෙලෝ') || m.includes('ආයුබෝවන්')) {
      return biz.welcomeMessage || `ආයුබෝවන්! ${biz.name} වෙත ඔබව සාදරයෙන් පිළිගනිමු. මම ඔබට අද උදවු කරන්නේ කෙසේද?`;
    }
    // Product match in Sinhala
    for (const p of products) {
      if (m.includes(p.name.toLowerCase())) {
        return `ඔව්, "${p.name}" අප සතුව ඇත. මිල: LKR ${p.price}. තොග ප්‍රමාණය: ${p.stock > 0 ? 'ලබාගත හැක' : 'නොමැත'}. ${p.description}`;
      }
    }
    return `ස්තූතියි අප හා සම්බන්ධ වීම ගැන. අපගේ නියෝජිතයෙකු ළඟදීම ඔබ හා සම්බන්ධ වනු ඇත.`;
  }

  if (isSinglish) {
    if (m.includes('hi') || m.includes('hello') || m.includes('halow') || m.includes('hey')) {
      return `Hi! Welcome to ${biz.name}. Ada kohomada oyata help karanna puluwan?`;
    }
    if (m.includes('price') || m.includes('keeyada') || m.includes('kiyada') || m.includes('mula')) {
      if (products.length > 0) {
        return `Oyata price kiyanna mona product ekatada? E.g., "${products[0].name}" eke price kiyanna puluwan.`;
      }
      return `Ape items wala prices okkoma dashboard eken bala ganna puluwan. Product eke nama kiyanna.`;
    }
    if (m.includes('return') || m.includes('policy') || m.includes('maru karanna')) {
      return `Ape return policy eka: ${biz.returnPolicy || 'Days 7k athuluwa return karanna puluwan.'}`;
    }
    // Product match in Singlish
    for (const p of products) {
      const name = p.name.toLowerCase();
      if (m.includes(name) || (name.includes('shirt') && m.includes('shirt')) || (name.includes('phone') && m.includes('phone'))) {
        return `Ow ape langa "${p.name}" thiyenawa. Price eka LKR ${p.price}. Stock: ${p.stock > 0 ? 'Thiyenawa' : 'Iwarai'}. ${p.description}`;
      }
    }
    return `Sthuthi contact karata. Ikmanatama customer care agent kenek oyata reply karawi!`;
  }

  // English fallback
  if (m.includes('hi') || m.includes('hello') || m.includes('hey')) {
    return biz.welcomeMessage || `Hello! Welcome to ${biz.name}. How can I assist you today?`;
  }
  if (m.includes('return') || m.includes('policy') || m.includes('refund')) {
    return `Our return policy: ${biz.returnPolicy || 'Within 7 days of purchase in original packaging.'}`;
  }
  if (m.includes('delivery') || m.includes('shipping') || m.includes('fee') || m.includes('charge')) {
    return `Our delivery fee is LKR ${biz.deliveryFee || 350}. We deliver island-wide.`;
  }
  // Product searches
  for (const p of products) {
    if (m.includes(p.name.toLowerCase())) {
      return `Yes, we have "${p.name}" in stock. Price: LKR ${p.price}. Description: ${p.description}. Would you like to add this to your cart?`;
    }
  }

  if (products.length > 0 && (m.includes('product') || m.includes('catalog') || m.includes('buy') || m.includes('items') || m.includes('shop'))) {
    const list = products.slice(0, 3).map(p => `- ${p.name} (LKR ${p.price})`).join('\n');
    return `We offer several products, including:\n${list}\n\nLet me know if you want details on any of these!`;
  }

  return `Thank you for messaging ${biz.name}. Our team will review your message and respond shortly.`;
}
