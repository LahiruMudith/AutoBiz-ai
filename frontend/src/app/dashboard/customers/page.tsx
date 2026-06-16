'use client';

import React, { useState, useEffect } from 'react';
import Icons from '../../../components/ui/icons';

interface Customer {
  id: string;
  name: string;
  phone: string;
  language: string;
  tags: string[];
  totalOrders: number;
  totalSpent: number;
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
    <span className={`px-2.5 py-0.5 text-[8px] font-extrabold uppercase rounded-full border tracking-wider ${STATUS_STYLES[status] ?? 'bg-slate-800 text-slate-400 border-slate-700'}`}>
      {status}
    </span>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected Customer details (Drawer)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Create customer form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('947');
  const [language, setLanguage] = useState('Singlish');
  const [tagInput, setTagInput] = useState('');

  const [businessId, setBusinessId] = useState('');

  useEffect(() => {
    const bizId = localStorage.getItem('selectedBusinessId') || 'demo-clothing-store';
    setBusinessId(bizId);
    fetchCustomers(bizId);
  }, []);

  const fetchCustomers = async (bizId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/businesses/${bizId}/customers`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (e) {
      console.warn('Fallback to local customers data');
      setCustomers([
        { id: '94772223333', name: 'Lahiru Mudith', phone: '94772223333', language: 'Singlish', tags: ['VIP Customer', 'Frequent Buyer'], totalOrders: 3, totalSpent: 10850 },
        { id: '94711112222', name: 'Nimal Silva', phone: '94711112222', language: 'Sinhala', tags: ['New Customer'], totalOrders: 1, totalSpent: 3450 },
        { id: '94755556666', name: 'Sanduni Perera', phone: '94755556666', language: 'English', tags: ['High Value Customer'], totalOrders: 2, totalSpent: 15500 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (bizId: string, customerId: string) => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`http://localhost:5000/api/businesses/${bizId}/orders`);
      if (res.ok) {
        const allOrders: Order[] = await res.json();
        // filter by matching customerId
        const filtered = allOrders.filter(o => o.customerId === customerId);
        setCustomerOrders(filtered);
      } else {
        setCustomerOrders(mockOrders(customerId));
      }
    } catch {
      setCustomerOrders(mockOrders(customerId));
    } finally {
      setLoadingOrders(false);
    }
  };

  const mockOrders = (cid: string): Order[] => {
    if (cid === '94772223333') return [
      { id: 'ord-abc001', customerId: cid, status: 'completed', items: [{ name: 'Slim Fit Cotton Shirt', price: 3450, qty: 2 }], total: 7250, createdAt: new Date(Date.now() - 86400000 * 7).toISOString() },
      { id: 'ord-abc002', customerId: cid, status: 'shipped', items: [{ name: 'Denim Jacket Classic', price: 5900, qty: 1 }], total: 6250, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    ];
    if (cid === '94711112222') return [
      { id: 'ord-abc003', customerId: cid, status: 'paid', items: [{ name: 'Linen Casual Shirt', price: 2900, qty: 1 }], total: 3250, createdAt: new Date(Date.now() - 86400000 * 1).toISOString() }
    ];
    return [];
  };

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    fetchOrders(businessId, c.id);
  };

  const handleOpenAdd = () => {
    setName('');
    setPhone('947');
    setLanguage('Singlish');
    setTagInput('');
    setShowAddModal(true);
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const parsedTags = tagInput ? tagInput.split(',').map(t => t.trim()).filter(Boolean) : [];
    
    const newCust = {
      id: phone.trim(),
      name,
      phone: phone.trim(),
      language,
      tags: parsedTags
    };

    try {
      const res = await fetch(`http://localhost:5000/api/businesses/${businessId}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCust)
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchCustomers(businessId);
      }
    } catch (err) {
      setCustomers([...customers, { ...newCust, totalOrders: 0, totalSpent: 0 }]);
      setShowAddModal(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6 relative min-h-screen pb-16">
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Icons.Users size={20} className="text-indigo-400" />
            Customer Directory
          </h2>
          <p className="text-xs text-slate-400">View customer languages, order metrics, and VIP segments</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-indigo-600/10 flex items-center gap-1.5 transition-all"
        >
          <Icons.Plus size={16} />
          Register Customer
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-2xl flex gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name, phone number, or segment tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl pl-4 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Customers Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400" />
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Customer</th>
                  <th className="p-4">WhatsApp Phone</th>
                  <th className="p-4">Language</th>
                  <th className="p-4">Segments</th>
                  <th className="p-4 text-center">Orders</th>
                  <th className="p-4 text-right">Total Spent</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className="border-b border-slate-900/50 hover:bg-slate-800/10 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-300 font-bold text-xs uppercase">
                          {c.name[0]}
                        </div>
                        <span className="font-bold text-white">{c.name}</span>
                      </td>
                      <td className="p-4 font-mono text-slate-300">{c.phone}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-emerald-950/50 text-emerald-400 border border-emerald-900/30 rounded-full font-bold text-[10px]">
                          {c.language}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5">
                          {c.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-slate-850 text-indigo-400 border border-slate-700 rounded-full text-[9px] font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-300">{c.totalOrders || 0}</td>
                      <td className="p-4 text-right font-extrabold text-white">LKR {c.totalSpent?.toLocaleString() || 0}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleSelectCustomer(c)}
                          className="px-3 py-1 bg-slate-800 hover:bg-indigo-600 hover:text-white text-[10px] font-bold text-slate-300 rounded-lg transition-all"
                        >
                          View Orders
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                      No customer files match search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Side Slide-Over Drawer for Customer Details & Order History */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm">
          {/* Backdrop Closer */}
          <div className="absolute inset-0" onClick={() => setSelectedCustomer(null)} />

          {/* Drawer container */}
          <div className="relative w-full max-w-lg h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-10 animate-slide-left">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-sm font-bold text-white">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{selectedCustomer.name}</h3>
                  <span className="text-[10px] text-slate-500 font-mono">+{selectedCustomer.phone}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 rounded-full bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition-colors"
              >
                ×
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
              
              {/* Customer Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Total Orders</span>
                  <span className="text-xl font-extrabold text-white">{customerOrders.length || selectedCustomer.totalOrders}</span>
                </div>
                <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Total Spent</span>
                  <span className="text-xl font-extrabold text-emerald-400">
                    LKR {(customerOrders.filter(o => o.status === 'completed' || o.status === 'paid').reduce((s, o) => s + o.total, 0) || selectedCustomer.totalSpent).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Profile Details */}
              <div className="flex flex-col gap-2.5 bg-slate-950/20 border border-slate-850/55 p-4 rounded-xl">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Preferred Language</span>
                  <span className="px-2 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 rounded-full text-[10px] font-bold">
                    {selectedCustomer.language}
                  </span>
                </div>
                <div className="flex justify-between items-start text-xs pt-2 border-t border-slate-900/60">
                  <span className="text-slate-400">Segments</span>
                  <div className="flex flex-wrap gap-1 justify-end max-w-[70%]">
                    {selectedCustomer.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-slate-800 text-indigo-400 border border-slate-700 rounded-full text-[9px] font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order History list */}
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Icons.ShoppingBag size={14} className="text-indigo-400" />
                  Order History Timeline
                </h4>

                {loadingOrders ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-400" />
                  </div>
                ) : customerOrders.length === 0 ? (
                  <div className="py-12 flex flex-col items-center gap-2 border border-dashed border-slate-850 rounded-xl text-slate-500 text-xs">
                    <Icons.Package size={24} className="text-slate-750" />
                    <span>No orders found for this customer profile</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {customerOrders.map((order) => (
                      <div key={order.id} className="bg-slate-950/40 border border-slate-850/80 rounded-xl p-3.5 flex flex-col gap-3">
                        {/* Order info bar */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-400">#{order.id.slice(-6).toUpperCase()}</span>
                            <span className="text-[10px] text-slate-500">
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : '—'}
                            </span>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>

                        {/* Items in order */}
                        <div className="flex flex-col gap-1.5 border-t border-b border-slate-900/60 py-2.5">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                              <span className="text-slate-300 font-medium">
                                {item.name} <span className="text-slate-500 text-[10px] ml-1">×{item.qty}</span>
                              </span>
                              <span className="text-slate-200">LKR {(item.price * item.qty).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>

                        {/* Total pricing */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Includes LKR 350 Delivery</span>
                          <span className="font-extrabold text-white text-sm">LKR {order.total.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 text-left">
            <div>
              <h3 className="font-bold text-base text-white">Register Customer</h3>
              <p className="text-xs text-slate-400">Initialize a customer contact for CRM cataloging</p>
            </div>

            <form onSubmit={handleAddCustomer} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400">FULL NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Lahiru Mudith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400">WHATSAPP PHONE NUMBER</label>
                <input
                  type="text"
                  placeholder="e.g. 94772223333"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400">PREFERRED DIALECT / LANGUAGE</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none transition-all"
                >
                  <option value="English">English Only</option>
                  <option value="Sinhala">Sinhala (සිංහල)</option>
                  <option value="Singlish">Singlish (Sinhala + English letters)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400">SEGMENTS (COMMA SEPARATED)</label>
                <input
                  type="text"
                  placeholder="VIP Customer, Frequent Buyer"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-950 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-indigo-600/15 transition-all"
                >
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
