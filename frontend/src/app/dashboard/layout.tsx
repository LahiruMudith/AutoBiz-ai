'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Icons from '../../components/ui/icons';

interface Business {
  id: string;
  name: string;
  type: string;
  subscription?: {
    plan: string;
    status: string;
  };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const businessId = localStorage.getItem('selectedBusinessId');
    if (!businessId) {
      router.push('/');
      return;
    }

    const fetchBusinessDetails = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/businesses/${businessId}`);
        if (res.ok) {
          const data = await res.json();
          setBusiness(data);
        } else {
          throw new Error('Business not found');
        }
      } catch (err) {
        console.warn('Fallback to local business profile');
        setBusiness({
          id: businessId,
          name: businessId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          type: 'Clothing Store',
          subscription: { plan: 'business', status: 'active' }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessDetails();
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem('selectedBusinessId');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
          <p className="text-xs text-slate-400">Loading your business workspace...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Overview', href: '/dashboard', icon: 'Home' as const },
    { name: 'Inbox', href: '/dashboard/inbox', icon: 'MessageSquare' as const },
    { name: 'Products', href: '/dashboard/products', icon: 'Package' as const },
    { name: 'Customers', href: '/dashboard/customers', icon: 'Users' as const },
    { name: 'Orders', href: '/dashboard/orders', icon: 'ShoppingBag' as const },
    { name: 'Settings', href: '/dashboard/settings', icon: 'Settings' as const },
  ];

  const planColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'enterprise': return 'bg-purple-950 text-purple-300 border-purple-500/30';
      case 'business': return 'bg-indigo-950 text-indigo-300 border-indigo-500/30';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/60 border-r border-slate-900 backdrop-blur-xl flex flex-col justify-between p-4 z-20 shrink-0">
        <div className="flex flex-col gap-8">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center font-bold text-white text-sm shadow-md">
              A
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-tight text-white leading-none">AutoBiz AI</h2>
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">WORKSPACE</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = Icons[item.icon];
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/35 to-indigo-600/10 text-indigo-300 border-l-2 border-indigo-500 font-bold pl-4'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-indigo-400' : 'text-slate-400'} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Workspace Footer Profile */}
        <div className="flex flex-col gap-4 border-t border-slate-900 pt-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 text-sm font-bold text-slate-200 uppercase">
              {business?.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate leading-none mb-1">
                {business?.name}
              </p>
              <span className={`inline-block px-1.5 py-0.5 text-[9px] font-semibold border rounded-full ${planColor(business?.subscription?.plan || 'starter')}`}>
                {business?.subscription?.plan?.toUpperCase() || 'STARTER'}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800/30 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-900/30 rounded-xl text-[11px] font-bold text-slate-400 hover:text-rose-400 transition-all"
          >
            Switch Workspace
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Topbar */}
        <header className="h-16 border-b border-slate-900 bg-slate-950/50 backdrop-blur-xl flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 live-indicator" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              AI Sales Agent Status: <span className="text-emerald-400">Active</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-400 font-semibold bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-850">
              ⚡ Webhook: <span className="text-indigo-400">Simulated Sandbox</span>
            </span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
