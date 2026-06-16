'use client';

import React, { useState, useEffect } from 'react';
import Icons from '../../../components/ui/icons';

interface OrderItem {
  name: string;
  price: number;
  qty: number;
}

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'paid' | 'delivered';
  total: number;
  createdAt: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'paid'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const bizId = localStorage.getItem('selectedBusinessId') || 'demo-clothing-store';
    setBusinessId(bizId);
    fetchOrders(bizId);
  }, []);

  const fetchOrders = async (bizId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/businesses/${bizId}/orders`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.warn('Fallback to local orders');
      setOrders([
        {
          id: 'o1',
          customerId: '94772223333',
          customerName: 'Lahiru Mudith',
          items: [{ name: 'Slim Fit Cotton Shirt', price: 3450, qty: 1 }],
          status: 'delivered',
          total: 3800,
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
          id: 'o2',
          customerId: '94755556666',
          customerName: 'Sanduni Perera',
          items: [{ name: 'Denim Jacket Classic', price: 5900, qty: 2 }],
          status: 'confirmed',
          total: 12150,
          createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
        },
        {
          id: 'o3',
          customerId: '94711112222',
          customerName: 'Nimal Silva',
          items: [{ name: 'Linen Casual Shirt', price: 2900, qty: 1 }],
          status: 'pending',
          total: 3250,
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    // Optimistic UI update
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    try {
      await fetch(`http://localhost:5000/api/businesses/${businessId}/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {
      console.error('Failed to update status in backend:', e);
    }
  };

  // Tab mapping
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const confirmedOrders = orders.filter(o => o.status === 'confirmed');
  const paidOrders = orders.filter(o => o.status === 'paid' || o.status === 'delivered');

  const getFilteredOrders = () => {
    let list: Order[] = [];
    if (activeTab === 'pending') list = pendingOrders;
    else if (activeTab === 'confirmed') list = confirmedOrders;
    else if (activeTab === 'paid') list = paidOrders;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return list.filter(o => 
        o.customerName.toLowerCase().includes(q) ||
        o.customerId.toLowerCase().includes(q) ||
        o.items.some(item => item.name.toLowerCase().includes(q))
      );
    }
    return list;
  };

  const activeOrdersList = getFilteredOrders();

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full">Pending Inquiry</span>;
      case 'confirmed':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">Confirmed Cart</span>;
      case 'paid':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full">Paid</span>;
      case 'delivered':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">Delivered</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Icons.ShoppingBag size={20} className="text-indigo-400" />
            Order Pipeline
          </h2>
          <p className="text-xs text-slate-400">Track and manage customer shopping orders generated in WhatsApp threads</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search customer, item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-900/60 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all"
          />
          <Icons.Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-slate-900 pb-px">
        {[
          { key: 'pending', label: 'Pending Inquiry', count: pendingOrders.length, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
          { key: 'confirmed', label: 'Confirmed Cart', count: confirmedOrders.length, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
          { key: 'paid', label: 'Paid Success', count: paidOrders.length, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`relative pb-3 pt-1 px-4 text-xs font-bold tracking-wide transition-all border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === tab.key
                ? 'border-indigo-500 text-indigo-400 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${tab.color}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* List / Cards Container */}
      {loading ? (
        <div className="flex justify-center items-center py-20 flex-grow">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400" />
        </div>
      ) : (
        <div className="flex-grow">
          {activeOrdersList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeOrdersList.map((ord) => {
                const subtotal = ord.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
                const deliveryFee = 350; // Standard LKR 350 Delivery Island-wide
                
                return (
                  <div
                    key={ord.id}
                    className="bg-slate-900/50 border border-slate-900 hover:border-slate-800 p-5 rounded-2xl flex flex-col gap-4 shadow-lg backdrop-blur-md transition-all group"
                  >
                    {/* Header: Customer Profile */}
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                          {ord.customerName}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          +{ord.customerId}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] text-slate-500 font-semibold">
                          {new Date(ord.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-[9px] text-slate-500 font-medium">
                          {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Order Status Badge */}
                    <div className="flex items-center gap-1.5">
                      {getStatusBadge(ord.status)}
                      <span className="text-[9px] text-slate-500 font-mono">ID: {ord.id}</span>
                    </div>

                    {/* Items List */}
                    <div className="flex flex-col gap-2 bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 text-xs text-slate-400">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Items Summary</div>
                      {ord.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-slate-300 font-medium truncate max-w-[170px]">{item.name}</span>
                          <span className="font-semibold text-slate-400">
                            LKR {item.price.toLocaleString()} x {item.qty}
                          </span>
                        </div>
                      ))}
                      
                      <div className="border-t border-slate-900/50 pt-2 mt-1 flex flex-col gap-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Subtotal:</span>
                          <span className="text-slate-300 font-medium">LKR {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Delivery Fee:</span>
                          <span className="text-slate-300 font-medium">LKR {deliveryFee.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Total */}
                    <div className="flex justify-between items-center text-sm font-bold bg-slate-900/80 p-3 rounded-xl border border-slate-850">
                      <span className="text-slate-400">TOTAL:</span>
                      <span className="text-emerald-400 font-extrabold text-base">LKR {ord.total.toLocaleString()}</span>
                    </div>

                    {/* Tab Actions */}
                    <div className="flex gap-2.5 mt-2">
                      {ord.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'confirmed')}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl transition-all shadow-md hover:shadow-indigo-500/10 flex items-center justify-center gap-1.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Confirm Order & Cart
                        </button>
                      )}
                      {ord.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'paid')}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-xl transition-all shadow-md hover:shadow-emerald-500/10 flex items-center justify-center gap-1.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                          Mark as Paid (Success)
                        </button>
                      )}
                      {ord.status === 'paid' && (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'delivered')}
                          className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white rounded-xl transition-all shadow-md hover:shadow-cyan-500/10 flex items-center justify-center gap-1.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="3" width="15" height="13" />
                            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                            <circle cx="5.5" cy="18.5" r="2.5" />
                            <circle cx="18.5" cy="18.5" r="2.5" />
                          </svg>
                          Ship / Deliver Order
                        </button>
                      )}
                      {ord.status === 'delivered' && (
                        <div className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/20 rounded-xl">
                          <Icons.Check size={14} className="text-emerald-400" />
                          Completed & Delivered
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-3">
              <div className="p-4 bg-slate-900/60 rounded-full text-slate-500 border border-slate-850">
                <Icons.ShoppingBag size={24} />
              </div>
              <p className="font-bold text-sm text-slate-300">No Orders Found</p>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                {searchQuery ? "No orders matched your search criteria." : "There are currently no orders in this pipeline stage."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
