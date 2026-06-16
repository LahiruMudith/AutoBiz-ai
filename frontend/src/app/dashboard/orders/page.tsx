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

  const statusColumns: { label: string; key: Order['status']; color: string; border: string }[] = [
    { label: 'Pending Inquiry', key: 'pending', color: 'bg-slate-900/50', border: 'border-slate-800' },
    { label: 'Confirmed Cart', key: 'confirmed', color: 'bg-indigo-950/20', border: 'border-indigo-500/10' },
    { label: 'Paid Success', key: 'paid', color: 'bg-emerald-950/20', border: 'border-emerald-500/10' },
    { label: 'Delivered Island-wide', key: 'delivered', color: 'bg-cyan-950/20', border: 'border-cyan-500/10' }
  ];

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header Panel */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Icons.ShoppingBag size={20} className="text-indigo-400" />
          Order Pipeline
        </h2>
        <p className="text-xs text-slate-400">Track and manage customer shopping orders generated in WhatsApp threads</p>
      </div>

      {/* Pipeline Kanban Columns */}
      {loading ? (
        <div className="flex justify-center items-center py-20 flex-grow">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-grow items-start overflow-x-auto">
          {statusColumns.map((col) => {
            const colOrders = orders.filter(o => o.status === col.key);
            return (
              <div
                key={col.key}
                className={`flex flex-col gap-4 p-4 rounded-2xl border ${col.border} ${col.color} min-h-[30rem] w-full min-w-[240px] shrink-0`}
              >
                {/* Column Title */}
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">{col.label}</span>
                  <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-850 px-2 py-0.5 rounded-full font-bold">
                    {colOrders.length}
                  </span>
                </div>

                {/* Orders Stack */}
                <div className="flex flex-col gap-3 overflow-y-auto max-h-[32rem] pr-1">
                  {colOrders.length > 0 ? (
                    colOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col gap-3 text-left hover:border-slate-700 transition-all group"
                      >
                        {/* Order Meta */}
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[11px] font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {ord.customerName}
                          </span>
                          <span className="text-[9px] text-slate-500 font-semibold shrink-0">
                            {new Date(ord.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        {/* Order Items */}
                        <div className="flex flex-col gap-1 text-[10px] text-slate-400 border-b border-slate-950 pb-2">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="truncate max-w-[130px]">{item.name}</span>
                              <span className="font-semibold text-slate-300">x{item.qty}</span>
                            </div>
                          ))}
                        </div>

                        {/* Order Total */}
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-500">TOTAL:</span>
                          <span className="text-white">LKR {ord.total.toLocaleString()}</span>
                        </div>

                        {/* Quick state actions */}
                        <div className="flex gap-1.5 border-t border-slate-950/40 pt-2.5">
                          {col.key === 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(ord.id, 'confirmed')}
                              className="w-full py-1 bg-indigo-600 hover:bg-indigo-500 text-[9px] font-bold text-white rounded-md transition-colors"
                            >
                              Confirm order
                            </button>
                          )}
                          {col.key === 'confirmed' && (
                            <button
                              onClick={() => handleUpdateStatus(ord.id, 'paid')}
                              className="w-full py-1 bg-emerald-600 hover:bg-emerald-500 text-[9px] font-bold text-white rounded-md transition-colors"
                            >
                              Mark as paid
                            </button>
                          )}
                          {col.key === 'paid' && (
                            <button
                              onClick={() => handleUpdateStatus(ord.id, 'delivered')}
                              className="w-full py-1 bg-cyan-600 hover:bg-cyan-500 text-[9px] font-bold text-white rounded-md transition-colors"
                            >
                              Ship / Deliver
                            </button>
                          )}
                          {col.key === 'delivered' && (
                            <div className="w-full flex items-center justify-center gap-1 py-1 text-[9px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/20 rounded-md">
                              <Icons.Check size={10} />
                              Completed
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center text-slate-600 text-[10px]">
                      Empty Column
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
