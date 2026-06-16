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

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
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
      // Fallback
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
    <div className="flex flex-col gap-6">
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                      No customer files match search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
