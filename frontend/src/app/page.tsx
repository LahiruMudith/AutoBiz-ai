'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icons from '../components/ui/icons';

interface Business {
  id: string;
  name: string;
  type: string;
  whatsappNumber: string;
  subscription?: {
    plan: string;
    status: string;
  };
}

export default function Home() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBizName, setNewBizName] = useState('');
  const [newBizType, setNewBizType] = useState('Clothing Store');
  const [newBizPhone, setNewBizPhone] = useState('+94');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Fetch all registered businesses from Express API
  const fetchBusinesses = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/businesses');
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data);
      }
    } catch (err) {
      console.error('Error fetching businesses:', err);
      // Fallback fallback data for standalone frontend mode
      setBusinesses([
        {
          id: 'demo-clothing-store',
          name: 'StyleHub Clothing',
          type: 'Clothing Store',
          whatsappNumber: '+94771234567',
          subscription: { plan: 'business', status: 'active' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const handleLogin = (businessId: string) => {
    // Save selected business in localStorage for multi-tenant simulation
    localStorage.setItem('selectedBusinessId', businessId);
    router.push('/dashboard');
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName) {
      setError('Please provide a business name');
      return;
    }
    setCreating(true);
    setError('');

    const generatedId = newBizName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    try {
      const res = await fetch('http://localhost:5000/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: generatedId,
          name: newBizName,
          type: newBizType,
          whatsappNumber: newBizPhone
        })
      });

      if (res.ok) {
        setNewBizName('');
        setNewBizPhone('+94');
        fetchBusinesses();
        // Automatically login the new tenant
        handleLogin(generatedId);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to create business');
      }
    } catch (err) {
      setError('Failed to reach backend. Creating in local state only.');
      // Local state fallback
      const localBiz: Business = {
        id: generatedId,
        name: newBizName,
        type: newBizType,
        whatsappNumber: newBizPhone,
        subscription: { plan: 'starter', status: 'active' }
      };
      setBusinesses([...businesses, localBiz]);
      handleLogin(generatedId);
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/20 blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between py-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-indigo-500/20">
            A
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              AutoBiz AI
            </h1>
            <p className="text-[10px] text-emerald-400 font-semibold tracking-widest uppercase">
              24/7 WHATSAPP AUTOMATION
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com"
            target="_blank"
            className="text-slate-400 hover:text-white transition-colors"
          >
            Documentation
          </a>
        </div>
      </div>

      {/* Hero Content Section */}
      <div className="max-w-5xl mx-auto w-full grid md:grid-cols-12 gap-12 items-center my-auto z-10">
        <div className="md:col-span-7 flex flex-col gap-6 text-left">
          <span className="px-3 py-1 text-xs font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-500/20 rounded-full w-fit">
            🚀 Sri Lanka's Leading WhatsApp Automation Platform
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-white">
            Automate sales and support on{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
              WhatsApp
            </span>{' '}
            using AI
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
            Empower your store, restaurant, or service business with a custom AI agent. Handle customer inquiries, share catalogs, create carts, and accept payments 24/7.
          </p>

          <div className="flex flex-col gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
            <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider">
              ✨ Interactive Sandbox Demo Features
            </h3>
            <ul className="grid grid-cols-2 gap-3 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Live Multilingual AI (Singlish/Sinhala)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Customer Chat Simulation
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                PayHere Sandbox Billing
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Complete Product/Order Flow
              </li>
            </ul>
          </div>
        </div>

        {/* Tenant Switcher & Register Card */}
        <div className="md:col-span-5">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col gap-6">
            <div>
              <h3 className="text-xl font-bold text-white">Get Started</h3>
              <p className="text-xs text-slate-400">Select a business profile or create a new one to login</p>
            </div>

            {/* Business List Selector */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-slate-400">SELECT BUSINESS PROFILE:</span>
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400" />
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                  {businesses.map((biz) => (
                    <button
                      key={biz.id}
                      onClick={() => handleLogin(biz.id)}
                      className="flex items-center justify-between p-3.5 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 rounded-2xl transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-700 text-slate-300 font-bold group-hover:border-emerald-500/50 transition-colors">
                          {biz.name[0]}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {biz.name}
                          </div>
                          <div className="text-[11px] text-slate-400">{biz.type}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {biz.subscription?.plan === 'business' && (
                          <span className="px-2 py-0.5 text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-500/20 rounded-full font-medium">
                            Business
                          </span>
                        )}
                        <Icons.ChevronDown className="-rotate-90 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" size={16} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-500 font-bold tracking-widest">OR</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Create New Business Form */}
            <form onSubmit={handleCreateBusiness} className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-slate-400">CREATE A NEW TENANT:</span>
              
              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  placeholder="Business Name (e.g. TastyBites)"
                  value={newBizName}
                  onChange={(e) => setNewBizName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newBizType}
                  onChange={(e) => setNewBizType(e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none transition-all"
                >
                  <option value="Clothing Store">Clothing Store</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Beauty Salon">Beauty Salon</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Grocery Store">Grocery Store</option>
                </select>
                <input
                  type="text"
                  placeholder="WhatsApp Number"
                  value={newBizPhone}
                  onChange={(e) => setNewBizPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>

              {error && <div className="text-[11px] text-rose-500 font-semibold">{error}</div>}

              <button
                type="submit"
                disabled={creating}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-xs font-bold text-white rounded-xl shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {creating ? 'Creating Profile...' : 'Launch Business Platform'}
                <Icons.Plus size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto w-full text-center text-xs text-slate-500 z-10 border-t border-slate-900/60 pt-6">
        AutoBiz AI © 2026. Made for modern enterprise automation in Sri Lanka.
      </div>
    </main>
  );
}
