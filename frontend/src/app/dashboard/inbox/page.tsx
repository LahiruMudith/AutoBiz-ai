'use client';

import React, { useState, useEffect, useRef } from 'react';
import Icons from '../../../components/ui/icons';

// ─── Interfaces ───────────────────────────────────────────────────────────────
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
  stock?: number;
  images?: string[];
}

interface OrderItem {
  name: string;
  price: number;
  qty: number;
}

interface Order {
  id: string;
  customerId: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  items: OrderItem[];
  total: number;
  createdAt?: string;
}

interface CartItem {
  product: Product;
  qty: number;
}

// ─── Status badge helper ──────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-amber-950/50 text-amber-400 border-amber-900/40',
  paid:       'bg-blue-950/50 text-blue-400 border-blue-900/40',
  processing: 'bg-purple-950/50 text-purple-400 border-purple-900/40',
  shipped:    'bg-cyan-950/50 text-cyan-400 border-cyan-900/40',
  completed:  'bg-emerald-950/50 text-emerald-400 border-emerald-900/40',
  cancelled:  'bg-rose-950/50 text-rose-400 border-rose-900/40',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 text-[8px] font-extrabold uppercase rounded-full border tracking-wider ${STATUS_STYLES[status] ?? 'bg-slate-800 text-slate-400 border-slate-700'}`}>
      {status}
    </span>
  );
}

// ─── Cart Product Search + Manual entry ───────────────────────────────────────
function CartBuilder({
  products,
  cartItems,
  onAdd,
  onRemove,
  onSend,
}: {
  products: Product[];
  cartItems: CartItem[];
  onAdd: (product: Product, qty?: number) => void;
  onRemove: (id: string) => void;
  onSend: () => void;
}) {
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [showManual, setShowManual] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filtered = search.trim()
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualPrice) return;
    onAdd({
      id: `manual-${Date.now()}`,
      name: manualName.trim(),
      price: Number(manualPrice),
    });
    setManualName('');
    setManualPrice('');
    setShowManual(false);
  };

  const cartTotal = cartItems.reduce((s, i) => s + i.product.price * i.qty, 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-xs text-white">🛒 WhatsApp Cart</h4>
          <p className="text-[9px] text-slate-400 mt-0.5">Build & send a PayHere checkout to the customer</p>
        </div>
      </div>

      {/* Add from catalog */}
      <div className="relative" ref={searchRef}>
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <Icons.Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search catalog..."
              value={search}
              onChange={e => { setSearch(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
              className="w-full pl-7 pr-3 py-1.5 bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-lg text-[10px] text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowManual(v => !v)}
            title="Add custom item manually"
            className={`px-2 py-1.5 text-[10px] font-bold rounded-lg border transition-colors flex items-center gap-1 ${showManual ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
          >
            <Icons.Plus size={11} />
            Custom
          </button>
        </div>

        {/* Dropdown catalog results */}
        {showSearch && (
          <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-slate-950 border border-slate-800 rounded-xl shadow-xl max-h-44 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-3 text-[10px] text-slate-500 text-center">No products found</div>
            ) : (
              filtered.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { onAdd(p); setShowSearch(false); setSearch(''); }}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-800/60 text-[10px] transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt="" className="w-7 h-7 rounded-md object-cover border border-slate-800 flex-shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0">
                        <Icons.Package size={10} className="text-slate-600" />
                      </div>
                    )}
                    <span className="text-slate-300 group-hover:text-white truncate font-medium">{p.name}</span>
                  </div>
                  <span className="text-emerald-400 font-bold ml-2 flex-shrink-0">LKR {p.price.toLocaleString()}</span>
                </button>
              ))
            )}
            <button
              type="button"
              onClick={() => setShowSearch(false)}
              className="w-full text-center py-1.5 text-[9px] text-slate-600 hover:text-slate-400 border-t border-slate-900 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Manual custom item form */}
      {showManual && (
        <form
          onSubmit={handleManualAdd}
          className="bg-slate-950 border border-indigo-900/40 rounded-xl p-3 flex flex-col gap-2"
        >
          <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Add Custom Item</span>
          <input
            type="text"
            placeholder="Item name e.g. Packaging fee"
            value={manualName}
            onChange={e => setManualName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500/60 rounded-lg px-3 py-1.5 text-[10px] text-white placeholder-slate-500 outline-none transition-all"
            required
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Price (LKR)"
              value={manualPrice}
              onChange={e => setManualPrice(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500/60 rounded-lg px-3 py-1.5 text-[10px] text-white placeholder-slate-500 outline-none transition-all"
              required
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </form>
      )}

      {/* Cart contents */}
      {cartItems.length > 0 && (
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-2 text-[10px]">
          <div className="flex flex-col gap-1.5 border-b border-slate-800 pb-2">
            {cartItems.map(item => (
              <div key={item.product.id} className="flex items-center justify-between gap-2">
                <span className="text-slate-300 truncate flex-1 font-medium">
                  {item.product.name}
                  <span className="text-slate-500 ml-1">×{item.qty}</span>
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-slate-200 font-semibold">LKR {(item.product.price * item.qty).toLocaleString()}</span>
                  <button
                    type="button"
                    onClick={() => onRemove(item.product.id)}
                    className="w-4 h-4 rounded-full bg-rose-950/60 hover:bg-rose-900 text-rose-400 flex items-center justify-center text-[10px] font-bold transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Delivery fee</span>
            <span className="text-slate-300">LKR 350</span>
          </div>
          <div className="flex items-center justify-between font-bold text-white border-t border-slate-800 pt-1.5">
            <span>Total</span>
            <span className="text-emerald-400">LKR {(cartTotal + 350).toLocaleString()}</span>
          </div>
          <button
            type="button"
            onClick={onSend}
            className="w-full py-2 mt-1 bg-gradient-to-r from-indigo-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-[10px] font-bold text-white rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10"
          >
            <Icons.Send size={11} />
            Send Checkout Link to Customer
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Order History Panel ───────────────────────────────────────────────────────
function OrderHistory({ orders, loading }: { orders: Order[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-6">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-6 flex flex-col items-center gap-1.5 text-slate-600">
        <Icons.Package size={20} />
        <p className="text-[10px]">No orders yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {orders.map(order => (
        <div key={order.id} className="bg-slate-950 border border-slate-800/60 rounded-xl p-2.5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-500 font-mono">#{order.id.slice(-6).toUpperCase()}</span>
            <StatusBadge status={order.status} />
          </div>

          {/* Items summary */}
          <div className="flex flex-col gap-0.5">
            {(order.items || []).map((item, i) => (
              <div key={i} className="flex justify-between text-[9px]">
                <span className="text-slate-400 truncate">{item.name} ×{item.qty}</span>
                <span className="text-slate-300 ml-1 flex-shrink-0">LKR {(item.price * item.qty).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-slate-900 pt-1.5">
            <span className="text-[9px] text-slate-500">
              {order.createdAt
                ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
                : '—'}
            </span>
            <span className="text-[10px] font-bold text-white">LKR {order.total.toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab toggle pill ─────────────────────────────────────────────────────────
function TabPill({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="flex bg-slate-950 border border-slate-900 rounded-lg p-0.5">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${
            active === t.key
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Inbox Page ──────────────────────────────────────────────────────────
export default function Inbox() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Cart builder state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [generatedLink, setGeneratedLink] = useState('');

  // UI state
  const [inputText, setInputText] = useState('');
  const [simText, setSimText] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showSimulator, setShowSimulator] = useState(false);
  const [crmTab, setCrmTab] = useState<'profile' | 'orders' | 'cart'>('profile');

  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [businessId, setBusinessId] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const lastScrollChatId = useRef<string | null>(null);
  const lastMessagesHash = useRef<string>('');

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    if (!activeChat) return;

    const lastMsg = messages[messages.length - 1];
    const messagesHash = `${messages.length}-${lastMsg?.id || ''}-${lastMsg?.content || ''}-${lastMsg?.timestamp || ''}`;

    const isNewChat = activeChat.id !== lastScrollChatId.current;
    const isNewMessage = messagesHash !== lastMessagesHash.current;

    if (isNewChat) {
      scrollToBottom();
      lastScrollChatId.current = activeChat.id;
      lastMessagesHash.current = messagesHash;
    } else if (isNewMessage) {
      const container = chatContainerRef.current;
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        if (isNearBottom) {
          scrollToBottom();
        }
      }
      lastMessagesHash.current = messagesHash;
    }
  }, [messages, activeChat]);

  // Initial loading
  useEffect(() => {
    const bizId = localStorage.getItem('selectedBusinessId') || 'demo-clothing-store';
    setBusinessId(bizId);
    fetchChats(bizId);
    fetchProducts(bizId);
  }, []);

  // Live polling
  useEffect(() => {
    if (!businessId) return;
    const interval = setInterval(() => {
      fetchChats(businessId, false);
      if (activeChat) fetchMessages(businessId, activeChat.id, false);
    }, 3000);
    return () => clearInterval(interval);
  }, [businessId, activeChat]);

  // ─── Data fetchers ────────────────────────────────────────────────────────
  const fetchChats = async (bizId: string, showSpinner = true) => {
    if (showSpinner) setLoadingChats(true);
    try {
      const res = await fetch(`http://localhost:5000/api/businesses/${bizId}/chats`);
      if (res.ok) {
        const data = await res.json();
        setChats(data);
        if (data.length > 0 && !activeChat && showSpinner) handleSelectChat(bizId, data[0]);
      }
    } catch {
      const fallback = [
        { id: '94772223333', name: 'Lahiru Mudith', lastMessage: 'black shirt thiyeda size L?', lastMessageTime: new Date().toISOString(), unread: true, aiActive: true },
        { id: '94711112222', name: 'Nimal Silva', lastMessage: 'Delivery ගාස්තුව කීයද?', lastMessageTime: new Date(Date.now() - 3600000).toISOString(), unread: false, aiActive: true },
        { id: '94755556666', name: 'Sanduni Perera', lastMessage: 'Do you have denim jackets?', lastMessageTime: new Date(Date.now() - 7200000).toISOString(), unread: false, aiActive: true },
      ];
      setChats(fallback);
      if (fallback.length > 0 && !activeChat && showSpinner) handleSelectChat(bizId, fallback[0]);
    } finally {
      if (showSpinner) setLoadingChats(false);
    }
  };

  const fetchProducts = async (bizId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/businesses/${bizId}/products`);
      if (res.ok) setProducts(await res.json());
    } catch {
      setProducts([
        { id: '1', name: 'Slim Fit Cotton Shirt', price: 3450, images: [] },
        { id: '2', name: 'Linen Casual Shirt', price: 2900, images: [] },
        { id: '3', name: 'Floral Summer Dress', price: 4200, images: [] },
        { id: '4', name: 'Denim Jacket Classic', price: 5900, images: [] },
        { id: '5', name: 'Chino Trousers', price: 3800, images: [] },
      ]);
    }
  };

  const fetchMessages = async (bizId: string, chatId: string, showSpinner = true) => {
    if (showSpinner) setLoadingMessages(true);
    try {
      const res = await fetch(`http://localhost:5000/api/businesses/${bizId}/chats/${chatId}/messages`);
      if (res.ok) setMessages(await res.json());
    } catch {
      setMessages([
        { id: 'm1', role: 'user', content: 'Hi, product details kiyanna puluwanda?', timestamp: new Date(Date.now() - 7200000).toISOString(), type: 'text' },
        { id: 'm2', role: 'model', content: 'Hi! Welcome to StyleHub. Slim Fit Cotton Shirt thiyenawa. LKR 3450. Mona wageda balanne?', timestamp: new Date(Date.now() - 7190000).toISOString(), type: 'text' },
      ]);
    } finally {
      if (showSpinner) setLoadingMessages(false);
    }
  };

  const fetchCustomerCRM = async (bizId: string, customerPhone: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/businesses/${bizId}/customers`);
      if (res.ok) {
        const list: Customer[] = await res.json();
        const found = list.find(c => c.id === customerPhone);
        setCustomer(found ?? fallbackCustomer(customerPhone));
      } else {
        setCustomer(fallbackCustomer(customerPhone));
      }
    } catch {
      setCustomer(fallbackCustomer(customerPhone));
    }
  };

  const fetchCustomerOrders = async (bizId: string, customerId: string) => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`http://localhost:5000/api/businesses/${bizId}/orders`);
      if (res.ok) {
        const all: Order[] = await res.json();
        setOrders(all.filter(o => o.customerId === customerId));
      } else {
        setOrders(mockOrders(customerId));
      }
    } catch {
      setOrders(mockOrders(customerId));
    } finally {
      setLoadingOrders(false);
    }
  };

  // ─── Chat selection ───────────────────────────────────────────────────────
  const handleSelectChat = async (bizId: string, chat: Chat) => {
    setActiveChat(chat);
    setCartItems([]);
    setGeneratedLink('');
    setOrders([]);
    setCrmTab('profile');
    await fetchMessages(bizId, chat.id, true);
    await fetchCustomerCRM(bizId, chat.id);
    await fetchCustomerOrders(bizId, chat.id);
  };

  // ─── AI toggle ────────────────────────────────────────────────────────────
  const handleToggleAI = async () => {
    if (!activeChat) return;
    const newState = !activeChat.aiActive;
    setActiveChat({ ...activeChat, aiActive: newState });
    setChats(chats.map(c => c.id === activeChat.id ? { ...c, aiActive: newState } : c));
    try {
      await fetch(`http://localhost:5000/api/businesses/${businessId}/chats/${activeChat.id}/toggle-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiActive: newState }),
      });
    } catch { /* silent */ }
  };

  // ─── Manual send ──────────────────────────────────────────────────────────
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;
    const textToSend = inputText;
    setInputText('');
    setMessages(prev => [...prev, { id: Math.random().toString(), role: 'model', content: textToSend, timestamp: new Date().toISOString(), type: 'text' }]);
    setTimeout(scrollToBottom, 50);
    try {
      await fetch(`http://localhost:5000/api/businesses/${businessId}/chats/${activeChat.id}/send`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: textToSend }),
      });
      fetchChats(businessId, false);
    } catch { /* silent */ }
  };

  // ─── Simulate incoming ────────────────────────────────────────────────────
  const handleSimulateIncoming = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simText.trim() || !activeChat) return;
    const textToSend = simText;
    setSimText('');
    setMessages(prev => [...prev, { id: Math.random().toString(), role: 'user', content: textToSend, timestamp: new Date().toISOString(), type: 'text' }]);
    setTimeout(scrollToBottom, 50);
    try {
      await fetch(`http://localhost:5000/api/webhook/simulate/incoming`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, fromPhone: activeChat.id, text: textToSend }),
      });
      setTimeout(() => {
        fetchChats(businessId, false);
        fetchMessages(businessId, activeChat.id, false);
      }, 1500);
    } catch { /* silent */ }
  };

  // ─── Tag management ───────────────────────────────────────────────────────
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim() || !customer || !activeChat) return;
    const updatedTags = [...(customer.tags || []), newTag.trim()];
    setCustomer({ ...customer, tags: updatedTags });
    setNewTag('');
    try {
      await fetch(`http://localhost:5000/api/businesses/${businessId}/customers`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: customer.id, name: customer.name, phone: customer.phone, tags: updatedTags, language: customer.language }),
      });
    } catch { /* silent */ }
  };

  // ─── Cart operations ──────────────────────────────────────────────────────
  const addToCart = (product: Product, qty = 1) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      return existing
        ? prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + qty } : i)
        : [...prev, { product, qty }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(i => i.product.id !== productId));
  };

  const generatePaymentLink = async () => {
    if (cartItems.length === 0 || !activeChat) return;
    const cartTotal = cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
    const total = cartTotal + 350;
    try {
      const orderRes = await fetch(`http://localhost:5000/api/businesses/${businessId}/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: activeChat.id, items: cartItems.map(i => ({ name: i.product.name, price: i.product.price, qty: i.qty })), status: 'pending', total }),
      });
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        const checkoutUrl = `http://localhost:3000/checkout?order=${orderData.id}&amount=${total}&business=${businessId}`;
        setGeneratedLink(checkoutUrl);
        const linkMsg = `🛒 *Your Cart is Ready!*\n\n` +
          cartItems.map(item => `• ${item.product.name} ×${item.qty} — LKR ${(item.product.price * item.qty).toLocaleString()}`).join('\n') +
          `\n🚚 Delivery: LKR 350\n💳 *Total: LKR ${total.toLocaleString()}*\n\nComplete payment: ${checkoutUrl}`;
        await fetch(`http://localhost:5000/api/businesses/${businessId}/chats/${activeChat.id}/send`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: linkMsg }),
        });
        fetchMessages(businessId, activeChat.id, false);
        // Refresh orders
        fetchCustomerOrders(businessId, activeChat.id);
        setCartItems([]);
      }
    } catch (e) { console.error('Cart order failed:', e); }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const fallbackCustomer = (phone: string): Customer => ({
    id: phone, name: chatName(phone), phone, language: 'Singlish', tags: ['New Customer'], totalSpent: 0,
  });

  const chatName = (id: string): string => {
    const map: Record<string, string> = {
      '94772223333': 'Lahiru Mudith',
      '94711112222': 'Nimal Silva',
      '94755556666': 'Sanduni Perera',
    };
    return map[id] ?? id;
  };

  const mockOrders = (cid: string): Order[] => {
    if (cid === '94772223333') return [
      { id: 'ord-abc001', customerId: cid, status: 'completed', items: [{ name: 'Slim Fit Cotton Shirt', price: 3450, qty: 2 }], total: 7250, createdAt: new Date(Date.now() - 86400000 * 7).toISOString() },
      { id: 'ord-abc002', customerId: cid, status: 'shipped', items: [{ name: 'Denim Jacket Classic', price: 5900, qty: 1 }], total: 6250, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    ];
    return [];
  };

  const totalSpent = orders.filter(o => o.status === 'completed' || o.status === 'paid').reduce((s, o) => s + o.total, 0);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-10rem)] grid grid-cols-12 gap-4 relative">

      {/* ── 1. Conversations Sidebar ─────────────────────────────────────────── */}
      <div className="col-span-3 bg-slate-900/50 border border-slate-900 rounded-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-900/80">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Icons.MessageSquare size={16} />
            Conversations
          </h3>
        </div>

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
                  className={`w-full flex items-start justify-between p-3 rounded-xl transition-all text-left group ${
                    isActive ? 'bg-indigo-600/20 border border-indigo-500/20' : 'hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {chat.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                          {chat.name}
                        </span>
                        <span className="text-[8px] text-slate-500 font-semibold flex-shrink-0">
                          {new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate leading-relaxed">{chat.lastMessage}</p>
                    </div>
                  </div>
                  {chat.unread && <div className="w-2 h-2 rounded-full bg-emerald-500 ml-2 animate-pulse flex-shrink-0 mt-1" />}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── 2. Main Chat Panel ────────────────────────────────────────────────── */}
      <div className="col-span-6 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col overflow-hidden relative">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="px-5 py-3 border-b border-slate-900/80 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-xs font-bold text-white">
                  {activeChat.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{activeChat.name}</h4>
                  <span className="text-[9px] text-slate-500 font-mono">+{activeChat.id}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400">AI AUTO-REPLY</span>
                <button
                  onClick={handleToggleAI}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors relative ${activeChat.aiActive ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${activeChat.aiActive ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
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
                          ? 'bg-slate-850 text-slate-100 border border-slate-800 rounded-tl-sm'
                          : 'bg-indigo-600/80 text-white shadow-md rounded-tr-sm'
                      }`}>
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

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-900/80 flex gap-2 bg-slate-900/30">
              <input
                type="text"
                placeholder="Type a manual reply... (AI is paused when you type)"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
              <button type="submit" className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-colors">
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

      {/* ── 3. CRM Panel ─────────────────────────────────────────────────────── */}
      <div className="col-span-3 bg-slate-900/50 border border-slate-900 rounded-2xl flex flex-col overflow-hidden">
        {customer ? (
          <>
            {/* CRM Header with spend stat */}
            <div className="p-4 border-b border-slate-900/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-sm font-bold text-white">
                  {customer.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xs text-white truncate">{customer.name}</h3>
                  <p className="text-[9px] text-slate-500 font-mono">+{customer.phone}</p>
                </div>
              </div>

              {totalSpent > 0 && (
                <div className="mt-3 flex items-center gap-2 bg-emerald-950/30 border border-emerald-900/30 rounded-xl px-3 py-2">
                  <Icons.Package size={12} className="text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider">Total Spent</p>
                    <p className="text-xs font-extrabold text-emerald-400">LKR {totalSpent.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tab navigation */}
            <div className="px-3 pt-3 pb-0">
              <TabPill
                tabs={[
                  { key: 'profile', label: 'Profile' },
                  { key: 'orders', label: `Orders ${orders.length > 0 ? `(${orders.length})` : ''}` },
                  { key: 'cart', label: '🛒 Cart' },
                ]}
                active={crmTab}
                onChange={(k) => setCrmTab(k as typeof crmTab)}
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4">

              {/* ─ Profile Tab ─ */}
              {crmTab === 'profile' && (
                <div className="flex flex-col gap-4">
                  {/* Details */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Language</span>
                      <span className="text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-900/30 text-[9px]">
                        {customer.language || 'English'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Orders</span>
                      <span className="text-white font-semibold">{orders.length}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-400">SEGMENTS</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(customer.tags || []).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 text-[9px] bg-slate-800 text-indigo-400 border border-slate-700 rounded-full font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <form onSubmit={handleAddTag} className="flex gap-1.5 mt-1">
                      <input
                        type="text"
                        placeholder="Add tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-lg px-2.5 py-1 text-[10px] text-white placeholder-slate-500 outline-none transition-all"
                      />
                      <button type="submit" className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white rounded-lg transition-colors">Add</button>
                    </form>
                  </div>
                </div>
              )}

              {/* ─ Orders Tab ─ */}
              {crmTab === 'orders' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">ORDER HISTORY</span>
                    <button
                      onClick={() => activeChat && fetchCustomerOrders(businessId, activeChat.id)}
                      className="text-[9px] text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1"
                    >
                      <Icons.RefreshCw size={9} />
                      Refresh
                    </button>
                  </div>
                  <OrderHistory orders={orders} loading={loadingOrders} />
                </div>
              )}

              {/* ─ Cart Tab ─ */}
              {crmTab === 'cart' && (
                <CartBuilder
                  products={products}
                  cartItems={cartItems}
                  onAdd={addToCart}
                  onRemove={removeFromCart}
                  onSend={generatePaymentLink}
                />
              )}
            </div>

            {/* Generated link strip */}
            {generatedLink && (
              <div className="px-3 pb-3">
                <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-xl px-3 py-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <p className="text-[9px] text-emerald-400 font-medium truncate">Checkout link sent!</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center text-slate-600 text-xs">
            Select a thread to load customer profile
          </div>
        )}
      </div>

      {/* ── Floating WhatsApp Simulator ───────────────────────────────────────── */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        {showSimulator && activeChat && (
          <div className="w-80 bg-slate-900 border border-emerald-500/40 p-4 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col gap-3 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  WhatsApp Simulator
                </h4>
                <p className="text-[9px] text-slate-400 mt-0.5">Send as the customer · tests AI auto-reply</p>
              </div>
              <button onClick={() => setShowSimulator(false)} className="text-slate-500 hover:text-white">×</button>
            </div>

            <form onSubmit={handleSimulateIncoming} className="flex flex-col gap-2">
              <textarea
                placeholder={`Try: "black shirt thiyeda?" or "ගාස්තුව කීයද?" or "refund policy?"`}
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                className="w-full h-16 bg-slate-950 border border-slate-800 focus:border-emerald-500/40 rounded-lg p-2 text-[10px] text-white placeholder-slate-500 outline-none resize-none transition-all"
                required
              />
              <button type="submit" className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-[10px] font-bold text-white rounded-lg transition-colors flex items-center justify-center gap-1">
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
            Test AI (Simulator)
          </button>
        )}
      </div>
    </div>
  );
}
