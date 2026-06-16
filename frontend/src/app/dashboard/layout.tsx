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

// ─── Collapse toggle icon ────────────────────────────────────────────────────
function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(true);
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.add('theme-light');
      document.documentElement.classList.remove('theme-dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('theme-dark');
      document.documentElement.classList.remove('theme-light');
    }
  }, []);

  useEffect(() => {
    // Update live clock
    setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('theme-dark');
      document.documentElement.classList.remove('theme-light');
    } else {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.add('theme-light');
      document.documentElement.classList.remove('theme-dark');
    }
  };

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
    { name: 'Overview',   href: '/dashboard',           icon: 'Home'          as const },
    { name: 'Inbox',      href: '/dashboard/inbox',     icon: 'MessageSquare' as const },
    { name: 'Products',   href: '/dashboard/products',  icon: 'Package'       as const },
    { name: 'Customers',  href: '/dashboard/customers', icon: 'Users'         as const },
    { name: 'Orders',     href: '/dashboard/orders',    icon: 'ShoppingBag'   as const },
    { name: 'Settings',   href: '/dashboard/settings',  icon: 'Settings'      as const },
  ];

  const planColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'enterprise': return 'bg-purple-950 text-purple-300 border-purple-500/30';
      case 'business':   return 'bg-indigo-950 text-indigo-300 border-indigo-500/30';
      default:           return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className={`min-h-screen flex overflow-hidden ${isDark ? 'theme-dark bg-slate-950 text-slate-100' : 'theme-light bg-slate-50 text-slate-900'}`}>

      {/* ─── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className="relative flex flex-col justify-between bg-slate-900/60 border-r border-slate-900 backdrop-blur-xl z-20 shrink-0 overflow-hidden"
        style={{
          width: collapsed ? '68px' : '240px',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* ── Toggle Button (pinned to right edge) ───────────────────────────── */}
        <button
          onClick={() => setCollapsed(v => !v)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute top-4 -right-3 z-30 w-6 h-6 rounded-full bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-white flex items-center justify-center shadow-lg transition-all"
        >
          <CollapseIcon collapsed={collapsed} />
        </button>

        {/* ── Top content ───────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6 p-3 pt-4">

          {/* Logo / Brand */}
          <div className="flex items-center gap-3 px-1 pt-1 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center font-bold text-white text-sm shadow-md flex-shrink-0">
              A
            </div>
            <div
              className="overflow-hidden transition-all"
              style={{
                opacity: collapsed ? 0 : 1,
                maxWidth: collapsed ? 0 : 200,
                transition: 'opacity 0.2s ease, max-width 0.3s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <h2 className="font-extrabold text-sm tracking-tight text-white leading-none">AutoBiz AI</h2>
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">WORKSPACE</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = Icons[item.icon];
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={`flex items-center gap-3 rounded-xl text-xs font-semibold tracking-wide transition-all overflow-hidden group ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/35 to-indigo-600/10 text-indigo-300 border-l-2 border-indigo-500 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                  style={{
                    padding: collapsed ? '10px 18px' : '10px 14px',
                    paddingLeft: isActive
                      ? (collapsed ? '16px' : '14px')
                      : (collapsed ? '18px' : '14px'),
                    transition: 'padding 0.3s ease',
                  }}
                >
                  <Icon
                    size={16}
                    className={`flex-shrink-0 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'}`}
                  />
                  <span
                    className="transition-all overflow-hidden whitespace-nowrap"
                    style={{
                      opacity: collapsed ? 0 : 1,
                      maxWidth: collapsed ? 0 : 200,
                      transition: 'opacity 0.2s ease, max-width 0.3s ease',
                    }}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ── Footer: Workspace Info + Logout ───────────────────────────────── */}
        <div className="flex flex-col gap-3 border-t border-slate-900 p-3 pb-4">
          {/* Business avatar + name row */}
          <div className="flex items-center gap-3 overflow-hidden px-1">
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 text-sm font-bold text-slate-200 uppercase flex-shrink-0">
              {business?.name[0]}
            </div>
            <div
              className="min-w-0 overflow-hidden transition-all"
              style={{
                opacity: collapsed ? 0 : 1,
                maxWidth: collapsed ? 0 : 180,
                transition: 'opacity 0.2s ease, max-width 0.3s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <p className="text-xs font-bold text-white truncate leading-none mb-1">
                {business?.name}
              </p>
              <span className={`inline-block px-1.5 py-0.5 text-[9px] font-semibold border rounded-full ${planColor(business?.subscription?.plan || 'starter')}`}>
                {business?.subscription?.plan?.toUpperCase() || 'STARTER'}
              </span>
            </div>
          </div>

          {/* Switch Workspace button */}
          <button
            onClick={handleLogout}
            title={collapsed ? 'Switch Workspace' : undefined}
            className="flex items-center justify-center gap-2 py-2 px-2 bg-slate-800/30 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-900/30 rounded-xl text-[11px] font-bold text-slate-400 hover:text-rose-400 transition-all overflow-hidden"
          >
            {/* Simple door/exit icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span
              className="overflow-hidden whitespace-nowrap transition-all"
              style={{
                opacity: collapsed ? 0 : 1,
                maxWidth: collapsed ? 0 : 160,
                transition: 'opacity 0.2s ease, max-width 0.3s ease',
              }}
            >
              Switch Workspace
            </span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────────────────────── */}
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
            {/* Live Clock Timer */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 rounded-lg border border-slate-850 text-[11.5px] font-mono text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400 animate-pulse">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{time || 'Loading...'}</span>
            </div>

            {/* Webhook Badge */}
            <span className="text-[11px] text-slate-400 font-semibold bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-850">
              ⚡ Webhook: <span className="text-indigo-400">Simulated Sandbox</span>
            </span>

            {/* Theme Toggler Button */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-2 rounded-lg bg-slate-900/80 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition-all flex items-center justify-center"
            >
              {isDark ? <Icons.Sun size={15} /> : <Icons.Moon size={15} />}
            </button>
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
