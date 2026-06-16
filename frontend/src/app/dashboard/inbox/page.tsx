'use client';

import React, { useState, useEffect, useRef } from 'react';
import Icons from '../../../components/ui/icons';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  type: string;
}

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
  aiActive: boolean;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  language: string;
  tags: string[];
  totalSpent?: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

export default function Inbox() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Cart builder state
  const [cartItems, setCartItems] = useState<{ product: Product; qty: number }[]>([]);
  const [generatedLink, setGeneratedLink] = useState('');

  // UI inputs
  const [inputText, setInputText] = useState('');
  const [simText, setSimText] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showSimulator, setShowSimulator] = useState(false);
  
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [businessId, setBusinessId] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial loading
  useEffect(() => {
    const bizId = localStorage.getItem('selectedBusinessId') || 'demo-clothing-store';
    setBusinessId(bizId);
    fetchChats(bizId);
    fetchProducts(bizId);
  }, []);

  // Poll chats list and active message updates every 3 seconds to keep inbox "live"
  useEffect(() => {
    if (!businessId) return;

    const interval = setInterval(() => {
      fetchChats(businessId, false);
      if (activeChat) {
        fetchMessages(businessId, activeChat.id, false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [businessId, activeChat]);

  // Fetch chats list
  const fetchChats = async (bizId: string, showSpinner = true) => {
    if (showSpinner) setLoadingChats(true);
    try {
      const res = await fetch(`http://localhost:5000/api/businesses/${bizId}/chats`);
      if (res.ok) {
        const data = await res.json();
        setChats(data);
        // Default select first chat if none selected and it's initial load
        if (data.length > 0 && !activeChat && showSpinner) {
          handleSelectChat(bizId, data[0]);
        }
      }
    } catch (e) {
      console.warn('Fallback local chats list');
      setChats([
        { id: '94772223333', name: 'Lahiru Mudith', lastMessage: 'black shirt thiyeda size L?', lastMessageTime: new Date().toISOString(), unread: true, aiActive: true },
        { id: '94711112222', name: 'Nimal Silva', lastMessage: 'අපගේ delivery ගාස්තුව රු. 350 කි.', lastMessageTime: new Date(Date.now() - 3600000).toISOString(), unread: false, aiActive: true },
        { id: '94755556666', name: 'Sanduni Perera', lastMessage: 'Do you have denim jackets?', lastMessageTime: new Date(Date.now() - 7200000).toISOString(), unread: false, aiActive: true }
      ]);
    } finally {
      if (showSpinner) setLoadingChats(false);
    }
  };

  // Fetch products catalog for cart builder
  const fetchProducts = async (bizId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/businesses/${bizId}/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      setProducts([
        { id: '1', name: 'Slim Fit Cotton Shirt', price: 3450 },
        { id: '2', name: 'Linen Casual Shirt', price: 2900 },
        { id: '3', name: 'Floral Summer Dress', price: 4200 }
      ]);
    }
  };

  // Select Chat thread
  const handleSelectChat = async (bizId: string, chat: Chat) => {
    setActiveChat(chat);
    setCartItems([]);
    setGeneratedLink('');
    await fetchMessages(bizId, chat.id, true);
    await fetchCustomerCRM(bizId, chat.id);
  };

  // Fetch chat messages
  const fetchMessages = async (bizId: string, chatId: string, showSpinner = true) => {
    if (showSpinner) setLoadingMessages(true);
    try {
      const res = await fetch(`http://localhost:5000/api/businesses/${bizId}/chats/${chatId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      setMessages([
        { id: 'm1', role: 'user', content: 'Hi, product details kiyanna puluwanda?', timestamp: new Date(Date.now() - 7200000).toISOString(), type: 'text' },
        { id: 'm2', role: 'model', content: 'Hi! Welcome to StyleHub. Slim Fit Cotton Shirt thiyenawa. LKR 3450. Mona wageda balanne?', timestamp: new Date(Date.now() - 7190000).toISOString(), type: 'text' }
      ]);
    } finally {
      if (showSpinner) setLoadingMessages(false);
    }
  };

  // Fetch Customer CRM profile
  const fetchCustomerCRM = async (bizId: string, customerPhone: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/businesses/${bizId}/customers`);
      if (res.ok) {
        const list: Customer[] = await res.json();
        const found = list.find(c => c.id === customerPhone);
        if (found) {
          setCustomer(found);
          return;
        }
      }
      // Fallback
      setCustomer({
        id: customerPhone,
        name: chatName(customerPhone),
        phone: customerPhone,
        language: 'Singlish',
        tags: ['New Customer'],
        totalSpent: 0
      });
    } catch (e) {
      setCustomer({
        id: customerPhone,
        name: chatName(customerPhone),
        phone: customerPhone,
        language: 'Singlish',
        tags: ['New Customer'],
        totalSpent: 0
      });
    }
  };

  // Toggle AI switch
  const handleToggleAI = async () => {
    if (!activeChat) return;
    const newState = !activeChat.aiActive;
    
    // Update local state first for instant responsiveness
    setActiveChat({ ...activeChat, aiActive: newState });
    setChats(chats.map(c => c.id === activeChat.id ? { ...c, aiActive: newState } : c));

    try {
      await fetch(`http://localhost:5000/api/businesses/${businessId}/chats/${activeChat.id}/toggle-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiActive: newState })
      });
    } catch (err) {
      console.error('Failed to toggle AI in backend:', err);
    }
  };

  // Send Manual Agent Response
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    const textToSend = inputText;
    setInputText('');

    // Append temporarily
    const tempMsg: Message = {
      id: Math.random().toString(),
      role: 'model',
      content: textToSend,
      timestamp: new Date().toISOString(),
      type: 'text'
    };
    setMessages([...messages, tempMsg]);

    try {
      await fetch(`http://localhost:5000/api/businesses/${businessId}/chats/${activeChat.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSend })
      });
      fetchChats(businessId, false);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Simulate Customer Incoming Message
  const handleSimulateIncoming = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simText.trim() || !activeChat) return;

    const textToSend = simText;
    setSimText('');

    // Append to local view instantly
    const tempMsg: Message = {
      id: Math.random().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
      type: 'text'
    };
    setMessages([...messages, tempMsg]);

    try {
      await fetch(`http://localhost:5000/api/webhook/simulate/incoming`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          fromPhone: activeChat.id,
          text: textToSend
        })
      });
      
      // Fetch latest updates right away
      setTimeout(() => {
        fetchChats(businessId, false);
        fetchMessages(businessId, activeChat.id, false);
      }, 1500);
    } catch (err) {
      console.error('Error simulating incoming message:', err);
    }
  };

  // Add tag to customer profile
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim() || !customer || !activeChat) return;

    const updatedTags = [...(customer.tags || []), newTag.trim()];
    setCustomer({ ...customer, tags: updatedTags });
    setNewTag('');

    try {
      await fetch(`http://localhost:5000/api/businesses/${businessId}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          tags: updatedTags,
          language: customer.language
        })
      });
    } catch (err) {
      console.error('Error saving customer tag:', err);
    }
  };

  // Cart helper actions
  const addToCart = (product: Product) => {
    const existing = cartItems.find(item => item.product.id === product.id);
    if (existing) {
      setCartItems(cartItems.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCartItems([...cartItems, { product, qty: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.product.id !== productId));
  };

  const generatePaymentLink = async () => {
    if (cartItems.length === 0 || !activeChat) return;
    
    // Create new order via API
    const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.qty), 0) + 350; // Total + 350 delivery
    
    try {
      const orderRes = await fetch(`http://localhost:5000/api/businesses/${businessId}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: activeChat.id,
          items: cartItems.map(item => ({ name: item.product.name, price: item.product.price, qty: item.qty })),
          status: 'pending',
          total
        })
      });

      if (orderRes.ok) {
        const orderData = await orderRes.json();
        
        // Generate mock PayHere checkout link
        const checkParamsRes = await fetch(`http://localhost:5000/api/payhere/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            plan: 'business' // standard plan checkout structure
          })
        });

        if (checkParamsRes.ok) {
          // Send simulated link directly to customer chat
          const checkoutUrl = `http://localhost:3000/checkout?order=${orderData.id}&amount=${total}&business=${businessId}`;
          setGeneratedLink(checkoutUrl);

          const linkMsg = `🛒 *Your Cart is Ready!*\n\n` + 
            cartItems.map(item => `- ${item.product.name} x${item.qty} (LKR ${item.product.price})`).join('\n') + 
            `\nDelivery: LKR 350\n*Total: LKR ${total}*\n\nComplete secure payment here: ${checkoutUrl}`;
          
          await fetch(`http://localhost:5000/api/businesses/${businessId}/chats/${activeChat.id}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: linkMsg })
          });
          
          fetchMessages(businessId, activeChat.id, false);
          setCartItems([]);
        }
      }
    } catch (e) {
      console.error('Failed generating cart order:', e);
    }
  };

  // Helper name resolver
  const chatName = (id: string) => {
    if (id === '94772223333') return 'Lahiru Mudith';
    if (id === '94711112222') return 'Nimal Silva';
    if (id === '94755556666') return 'Sanduni Perera';
    return id;
  };

  return (
    <div className="h-[calc(100vh-10rem)] grid grid-cols-12 gap-4 relative">
      {/* 1. Chats Sidebar (Left 3 cols) */}
      <div className="col-span-3 bg-slate-900/50 border border-slate-900 rounded-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-900/80">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Icons.MessageSquare size={16} />
            Conversations
          </h3>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {loadingChats ? (
            <div className="flex justify-center items-center h-20">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-400" />
            </div>
          ) : (
            chats.map((chat) => {
              const isActive = activeChat?.id === chat.id;
              return (
                <button
                  key={chat.id}
                  onClick={() => handleSelectChat(businessId, chat)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group ${
                    isActive ? 'bg-indigo-600/20 border border-indigo-500/20' : 'hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {chat.name}
                      </span>
                      <span className="text-[9px] text-slate-500 font-semibold">
                        {new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate leading-relaxed">
                      {chat.lastMessage}
                    </p>
                  </div>
                  {chat.unread && (
                    <div className="w-2 h-2 rounded-full bg-emerald-500 ml-2 animate-pulse" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Main Chat Panel (Middle 6 cols) */}
      <div className="col-span-6 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col overflow-hidden relative">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="px-5 py-3 border-b border-slate-900/80 flex items-center justify-between bg-slate-900/60">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  {activeChat.name}
                  <span className="text-[9px] font-semibold text-slate-500 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-850">
                    {activeChat.id}
                  </span>
                </h4>
              </div>

              {/* AI Auto Reply Toggle */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400">AI AUTO-REPLY</span>
                <button
                  onClick={handleToggleAI}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors relative ${
                    activeChat.aiActive ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    activeChat.aiActive ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* Message History Container */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400" />
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div key={msg.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs ${
                        isUser
                          ? 'bg-slate-850 text-slate-100 border border-slate-800'
                          : 'bg-indigo-600/80 text-white shadow-md'
                      }`}>
                        {/* Bot marker badge */}
                        {!isUser && (
                          <div className="flex items-center gap-1 text-[8px] font-extrabold uppercase text-indigo-300 tracking-wider mb-1">
                            <Icons.Bot size={10} />
                            AI Assistant
                          </div>
                        )}
                        <p className="whitespace-pre-wrap leading-relaxed select-text">{msg.content}</p>
                        <span className="block text-[8px] text-slate-400/80 text-right mt-1 font-semibold">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-900/80 flex gap-2 bg-slate-900/30">
              <input
                type="text"
                placeholder="Type your manual response here... (AI is paused during your replies)"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
              <button
                type="submit"
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-colors"
              >
                <Icons.Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <Icons.MessageSquare size={32} className="mb-2 text-slate-700" />
            <p className="text-xs">No active conversation selected.</p>
          </div>
        )}
      </div>

      {/* 3. CRM Info Card (Right 3 cols) */}
      <div className="col-span-3 bg-slate-900/50 border border-slate-900 rounded-2xl flex flex-col overflow-hidden">
        {customer ? (
          <div className="p-4 flex flex-col gap-5 overflow-y-auto flex-1">
            {/* Customer Details Header */}
            <div>
              <h3 className="font-bold text-sm text-white">Customer Profile</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">CRM DATA ISOLATION</p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Name:</span>
                <span className="text-white font-semibold">{customer.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Phone:</span>
                <span className="text-white font-semibold">{customer.phone}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Language:</span>
                <span className="text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-900/30">
                  {customer.language || 'English'}
                </span>
              </div>
            </div>

            {/* Segmentation Tags */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-400">SEGMENTATION TAGS</span>
              <div className="flex flex-wrap gap-1.5">
                {(customer.tags || []).map((tag) => (
                  <span key={tag} className="px-2 py-0.5 text-[9px] bg-slate-800 text-indigo-400 border border-slate-700 rounded-full font-medium">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Add Tag Form */}
              <form onSubmit={handleAddTag} className="flex gap-1.5 mt-1">
                <input
                  type="text"
                  placeholder="New tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-lg px-2.5 py-1 text-[10px] text-white placeholder-slate-500 outline-none transition-all"
                />
                <button type="submit" className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white rounded-lg transition-colors">
                  Add
                </button>
              </form>
            </div>

            {/* Shopping Cart Builder */}
            <div className="border-t border-slate-800 pt-4 flex flex-col gap-3">
              <div>
                <h4 className="font-bold text-xs text-white">Create WhatsApp Cart</h4>
                <p className="text-[9px] text-slate-400 mt-0.5">Select items to send as a PayHere checkout cart</p>
              </div>

              {/* Products list selection */}
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                {products.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="w-full flex items-center justify-between text-[10px] text-left p-1.5 rounded-lg hover:bg-slate-800/40 border border-transparent transition-colors group"
                  >
                    <span className="text-slate-300 group-hover:text-white truncate max-w-[120px]">{p.name}</span>
                    <span className="text-emerald-400 font-bold shrink-0">LKR {p.price} +</span>
                  </button>
                ))}
              </div>

              {/* Cart contents */}
              {cartItems.length > 0 && (
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-2 text-[10px]">
                  <div className="flex flex-col gap-1 border-b border-slate-800 pb-1.5">
                    {cartItems.map(item => (
                      <div key={item.product.id} className="flex items-center justify-between">
                        <span className="text-slate-300 truncate max-w-[120px]">{item.product.name} x{item.qty}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-200">LKR {item.product.price * item.qty}</span>
                          <button onClick={() => removeFromCart(item.product.id)} className="text-rose-500 font-bold hover:text-rose-400">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-white font-bold">
                    <span>Total + Delivery:</span>
                    <span>LKR {cartItems.reduce((sum, item) => sum + (item.product.price * item.qty), 0) + 350}</span>
                  </div>
                  <button
                    onClick={generatePaymentLink}
                    className="w-full py-1.5 bg-gradient-to-r from-indigo-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-[10px] font-bold text-white rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    Send Checkout Link
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center text-slate-600 text-xs">
            Select a thread to load profile
          </div>
        )}
      </div>

      {/* Floating Simulation Panel Switcher (Bottom Right) */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        {showSimulator && activeChat && (
          <div className="w-80 bg-slate-900 border border-emerald-500/40 p-4 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col gap-3 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 live-indicator" />
                  WhatsApp Simulator
                </h4>
                <p className="text-[9px] text-slate-400 mt-0.5">Send a message *as* the customer to test AI response</p>
              </div>
              <button onClick={() => setShowSimulator(false)} className="text-slate-500 hover:text-white">×</button>
            </div>

            <form onSubmit={handleSimulateIncoming} className="flex flex-col gap-2">
              <textarea
                placeholder="Type Singlish: 'black shirt thiyeda?' or Sinhala: 'මිල කීයද?' or English: 'refund policy?'"
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                className="w-full h-16 bg-slate-950 border border-slate-800 focus:border-emerald-500/40 rounded-lg p-2 text-[10px] text-white placeholder-slate-500 outline-none resize-none transition-all"
                required
              />
              <button
                type="submit"
                className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-[10px] font-bold text-white rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                Send as Customer
              </button>
            </form>
          </div>
        )}

        {activeChat && (
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-[11px] font-bold text-white rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            <Icons.Bot size={16} />
            Test AI (WhatsApp Simulator)
          </button>
        )}
      </div>
    </div>
  );
}
