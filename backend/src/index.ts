import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import * as dotenv from 'dotenv';
import { db } from './config/firebase';
import webhookRouter from './routes/webhook';
import { generatePayHereParams } from './services/payhere';
import { sendWhatsAppMessage } from './services/whatsapp';
import { addSSEClient } from './services/sse';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Logger middleware
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// Register Webhook routes
app.use('/api/webhook', webhookRouter);

// SSE connection endpoint for real-time dashboard events
app.get('/api/events/:businessId', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();
  addSSEClient(req.params.businessId, res);
});

// -------------------------------------------------------------
// Seed Sample Data Helper
// -------------------------------------------------------------
async function seedSampleData() {
  const businessId = 'demo-clothing-store';
  const bizRef = db.collection('businesses').doc(businessId);
  const bizSnap = await bizRef.get();

  if (bizSnap.exists) {
    console.log('Sample data already exists. Skipping seed.');
    return;
  }

  console.log('Seeding sample data for business:StyleHub Clothing...');
  
  // 1. Create Business Profile
  await bizRef.set({
    name: 'StyleHub Clothing',
    type: 'Clothing Store',
    whatsappNumber: '+94771234567',
    createdAt: new Date().toISOString(),
    subscription: {
      plan: 'business',
      status: 'active',
      lastPayment: new Date().toISOString(),
    },
    welcomeMessage: 'Hi! Welcome to StyleHub Clothing 🌟. I am your AI Sales Assistant. Ask me about our latest shirts, frocks, or return policy!',
    returnPolicy: 'Returns or exchanges are allowed within 7 days of purchase. Items must be in original condition with tags.',
    deliveryFee: 350,
    faqs: [
      { question: 'Do you deliver island-wide?', answer: 'Yes, we deliver to any address in Sri Lanka within 2-4 working days.' },
      { question: 'What are the payment options?', answer: 'We accept cash on delivery (COD), card payments via PayHere, and bank transfers.' },
      { question: 'Where is your shop located?', answer: 'We are an online-only store based in Colombo, Sri Lanka.' }
    ]
  });

  // 2. Add Products
  const products = [
    { name: 'Slim Fit Cotton Shirt', price: 3450, stock: 15, category: 'Shirts', description: 'Premium 100% cotton slim fit formal shirt in Black, White, and Navy Blue. Sizes M, L, XL.' },
    { name: 'Linen Casual Shirt', price: 2900, stock: 8, category: 'Shirts', description: 'Breathable linen casual shirt perfect for warm weather. Available in Pastel Pink, Light Blue, and White.' },
    { name: 'Floral Summer Dress', price: 4200, stock: 12, category: 'Dresses', description: 'Flowy floral printed dress with adjustable waist belt. Sizes S, M, L.' },
    { name: 'Denim Jacket Classic', price: 5900, stock: 5, category: 'Jackets', description: 'Unisex distressed blue denim jacket with copper buttons. Heavyweight premium denim.' },
    { name: 'Chino Trousers', price: 3800, stock: 0, category: 'Trousers', description: 'Stretch chino trousers in Khaki and Charcoal Grey. Slim fit.' }
  ];

  for (const p of products) {
    await bizRef.collection('products').add(p);
  }

  // 3. Add Customers
  const customers = [
    { id: '94772223333', name: 'Lahiru Mudith', phone: '94772223333', language: 'Singlish', tags: ['VIP Customer', 'Frequent Buyer'], totalOrders: 3, totalSpent: 10850 },
    { id: '94711112222', name: 'Nimal Silva', phone: '94711112222', language: 'Sinhala', tags: ['New Customer'], totalOrders: 1, totalSpent: 3450 },
    { id: '94755556666', name: 'Sanduni Perera', phone: '94755556666', language: 'English', tags: ['High Value Customer'], totalOrders: 2, totalSpent: 15500 }
  ];

  for (const c of customers) {
    await bizRef.collection('customers').doc(c.id).set(c);
  }

  // 4. Create Conversations & Messages
  const messagesBatch = [
    {
      customerId: '94772223333',
      messages: [
        { role: 'user', content: 'Hi, product details kiyanna puluwanda?', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), type: 'text' },
        { role: 'model', content: 'Hi! Welcome to StyleHub Clothing 🌟. Ape active items slim fit shirt (LKR 3450), linen shirt (LKR 2900) and floral dress (LKR 4200). Mona wageda balanne?', timestamp: new Date(Date.now() - 3600000 * 2 + 5000).toISOString(), type: 'text' },
        { role: 'user', content: 'black shirt thiyeda size L?', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'text' },
        { role: 'model', content: 'Ow ape langa "Slim Fit Cotton Shirt" black color L size thiyenawa. Eke price eka LKR 3450. Order ekak danna onada?', timestamp: new Date(Date.now() - 3600000 + 3000).toISOString(), type: 'text' }
      ]
    },
    {
      customerId: '94711112222',
      messages: [
        { role: 'user', content: 'ඔයාලගේ delivery fee එක කීයද?', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), type: 'text' },
        { role: 'model', content: 'අපගේ delivery ගාස්තුව රු. 350 කි. දිවයින පුරා බෙදාහැරීම් සිදුකරනු ලබයි.', timestamp: new Date(Date.now() - 3600000 * 5 + 4000).toISOString(), type: 'text' }
      ]
    },
    {
      customerId: '94755556666',
      messages: [
        { role: 'user', content: 'Do you have denim jackets?', timestamp: new Date(Date.now() - 3600000 * 10).toISOString(), type: 'text' },
        { role: 'model', content: 'Yes, we have our Denim Jacket Classic in stock for LKR 5900. It comes in a classic distressed blue.', timestamp: new Date(Date.now() - 3600000 * 10 + 2000).toISOString(), type: 'text' }
      ]
    }
  ];

  for (const mBatch of messagesBatch) {
    const convRef = bizRef.collection('conversations').doc(mBatch.customerId);
    await convRef.set({
      customerId: mBatch.customerId,
      lastMessage: mBatch.messages[mBatch.messages.length - 1].content,
      lastMessageTime: mBatch.messages[mBatch.messages.length - 1].timestamp,
      unread: mBatch.customerId === '94772223333', // Mark Lahiru's as unread
      aiActive: true
    });

    for (const msg of mBatch.messages) {
      await convRef.collection('messages').add(msg);
    }
  }

  // 5. Add Orders
  const orders = [
    { customerId: '94772223333', items: [{ name: 'Slim Fit Cotton Shirt', price: 3450, qty: 1 }], status: 'delivered', total: 3800, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { customerId: '94755556666', items: [{ name: 'Denim Jacket Classic', price: 5900, qty: 2 }], status: 'confirmed', total: 12150, createdAt: new Date(Date.now() - 86400000 * 1).toISOString() },
    { customerId: '94711112222', items: [{ name: 'Linen Casual Shirt', price: 2900, qty: 1 }], status: 'pending', total: 3250, createdAt: new Date().toISOString() }
  ];

  for (const o of orders) {
    await bizRef.collection('orders').add(o);
  }

  console.log('Seed completed successfully!');
}

// -------------------------------------------------------------
// REST API Endpoints
// -------------------------------------------------------------

// List all businesses (for demo switcher)
app.get('/api/businesses', async (req, res) => {
  try {
    const snap = await db.collection('businesses').get();
    const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create business
app.post('/api/businesses', async (req, res) => {
  try {
    const { id, name, type, whatsappNumber } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'Missing business id or name' });
    await db.collection('businesses').doc(id).set({
      name,
      type: type || 'Retail',
      whatsappNumber: whatsappNumber || '',
      createdAt: new Date().toISOString(),
      subscription: { plan: 'starter', status: 'active', lastPayment: new Date().toISOString() },
      faqs: [],
      welcomeMessage: `Welcome to ${name}!`,
      returnPolicy: 'No return policy set.',
      deliveryFee: 350
    });
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Business Stats/Analytics
app.get('/api/businesses/:businessId/stats', async (req, res) => {
  const { businessId } = req.params;
  try {
    const productsSnap = await db.collection('businesses').doc(businessId).collection('products').get();
    const customersSnap = await db.collection('businesses').doc(businessId).collection('customers').get();
    const ordersSnap = await db.collection('businesses').doc(businessId).collection('orders').get();
    const convSnap = await db.collection('businesses').doc(businessId).collection('conversations').get();

    let revenue = 0;
    let completedOrders = 0;
    ordersSnap.docs.forEach(doc => {
      const o = doc.data();
      if (o.status === 'delivered' || o.status === 'confirmed' || o.status === 'paid') {
        revenue += Number(o.total) || 0;
        completedOrders++;
      }
    });

    let totalMessages = 0;
    let automatedCount = 0;

    for (const doc of convSnap.docs) {
      const msgSnap = await db.collection('businesses').doc(businessId).collection('conversations').doc(doc.id).collection('messages').get();
      totalMessages += msgSnap.size;
      msgSnap.docs.forEach(mDoc => {
        const m = mDoc.data();
        if (m.role === 'model') automatedCount++;
      });
    }

    const automationRate = totalMessages > 0 ? Math.round((automatedCount / totalMessages) * 100) : 80;

    res.json({
      totalProducts: productsSnap.size,
      totalCustomers: customersSnap.size,
      totalOrders: ordersSnap.size,
      revenue,
      totalMessages,
      automationRate
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Chats / Inbox Feed
app.get('/api/businesses/:businessId/chats', async (req, res) => {
  const { businessId } = req.params;
  try {
    const snap = await db.collection('businesses').doc(businessId).collection('conversations').get();
    
    const chats = [];
    for (const doc of snap.docs) {
      const data = doc.data();
      // Get customer name if possible
      const custDoc = await db.collection('businesses').doc(businessId).collection('customers').doc(doc.id).get();
      const customerName = custDoc.exists ? (custDoc.data()?.name || doc.id) : doc.id;
      
      chats.push({
        id: doc.id,
        name: customerName,
        ...data
      });
    }

    chats.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
    res.json(chats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Chat messages list
app.get('/api/businesses/:businessId/chats/:chatId/messages', async (req, res) => {
  const { businessId, chatId } = req.params;
  try {
    const snap = await db.collection('businesses').doc(businessId).collection('conversations').doc(chatId).collection('messages').orderBy('timestamp', 'asc').get();
    const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Mark conversation as read since user is checking it
    await db.collection('businesses').doc(businessId).collection('conversations').doc(chatId).set({
      unread: false
    }, { merge: true });

    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Send manual chat reply from agent
app.post('/api/businesses/:businessId/chats/:chatId/send', async (req, res) => {
  const { businessId, chatId } = req.params;
  const { text } = req.body;
  try {
    const success = await sendWhatsAppMessage(businessId, chatId, text);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle AI for a chat
app.post('/api/businesses/:businessId/chats/:chatId/toggle-ai', async (req, res) => {
  const { businessId, chatId } = req.params;
  const { aiActive } = req.body;
  try {
    await db.collection('businesses').doc(businessId).collection('conversations').doc(chatId).set({
      aiActive
    }, { merge: true });
    res.json({ success: true, aiActive });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Products CRUD
app.get('/api/businesses/:businessId/products', async (req, res) => {
  const { businessId } = req.params;
  try {
    const snap = await db.collection('businesses').doc(businessId).collection('products').get();
    res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/businesses/:businessId/products', async (req, res) => {
  const { businessId } = req.params;
  const { name, price, stock, category, description } = req.body;
  try {
    const ref = await db.collection('businesses').doc(businessId).collection('products').add({
      name,
      price: Number(price) || 0,
      stock: Number(stock) || 0,
      category: category || 'Uncategorized',
      description: description || ''
    });
    res.json({ success: true, id: ref.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/businesses/:businessId/products/:productId', async (req, res) => {
  const { businessId, productId } = req.params;
  const { name, price, stock, category, description } = req.body;
  try {
    await db.collection('businesses').doc(businessId).collection('products').doc(productId).set({
      name,
      price: Number(price),
      stock: Number(stock),
      category,
      description
    }, { merge: true });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/businesses/:businessId/products/:productId', async (req, res) => {
  const { businessId, productId } = req.params;
  try {
    await db.collection('businesses').doc(businessId).collection('products').doc(productId).delete();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Customers list
app.get('/api/businesses/:businessId/customers', async (req, res) => {
  const { businessId } = req.params;
  try {
    const snap = await db.collection('businesses').doc(businessId).collection('customers').get();
    res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/businesses/:businessId/customers', async (req, res) => {
  const { businessId } = req.params;
  const { id, name, phone, tags, language } = req.body;
  try {
    await db.collection('businesses').doc(businessId).collection('customers').doc(id).set({
      id,
      name,
      phone,
      language: language || 'English',
      tags: tags || [],
      totalOrders: 0,
      totalSpent: 0
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Orders CRUD
app.get('/api/businesses/:businessId/orders', async (req, res) => {
  const { businessId } = req.params;
  try {
    const snap = await db.collection('businesses').doc(businessId).collection('orders').get();
    const orders = [];
    for (const doc of snap.docs) {
      const data = doc.data();
      // Fetch customer name
      const custDoc = await db.collection('businesses').doc(businessId).collection('customers').doc(data.customerId).get();
      const customerName = custDoc.exists ? (custDoc.data()?.name || data.customerId) : data.customerId;
      
      orders.push({
        id: doc.id,
        customerName,
        ...data
      });
    }
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/businesses/:businessId/orders', async (req, res) => {
  const { businessId } = req.params;
  const { customerId, items, status, total } = req.body;
  try {
    const ref = await db.collection('businesses').doc(businessId).collection('orders').add({
      customerId,
      items: items || [],
      status: status || 'pending',
      total: Number(total) || 0,
      createdAt: new Date().toISOString()
    });
    res.json({ success: true, id: ref.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/businesses/:businessId/orders/:orderId', async (req, res) => {
  const { businessId, orderId } = req.params;
  const { status } = req.body;
  try {
    await db.collection('businesses').doc(businessId).collection('orders').doc(orderId).set({
      status
    }, { merge: true });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get business details and settings
app.get('/api/businesses/:businessId', async (req, res) => {
  const { businessId } = req.params;
  try {
    const doc = await db.collection('businesses').doc(businessId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Business not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update settings
app.put('/api/businesses/:businessId/settings', async (req, res) => {
  const { businessId } = req.params;
  const { welcomeMessage, returnPolicy, deliveryFee, faqs, name, whatsappNumber, whatsappToken, phoneNumberId } = req.body;
  try {
    await db.collection('businesses').doc(businessId).set({
      name,
      welcomeMessage,
      returnPolicy,
      deliveryFee: Number(deliveryFee),
      faqs,
      whatsappNumber: whatsappNumber || '',
      whatsappToken: whatsappToken || '',
      phoneNumberId: phoneNumberId || ''
    }, { merge: true });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PayHere billing checkout generation
app.post('/api/payhere/checkout', (req, res) => {
  const { businessId, plan } = req.body;
  if (!businessId || !plan) {
    return res.status(400).json({ error: 'Missing businessId or plan' });
  }
  const checkoutParams = generatePayHereParams(businessId, plan);
  res.json(checkoutParams);
});

// Start Express Server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  // Seed sample data on start
  await seedSampleData();
});
