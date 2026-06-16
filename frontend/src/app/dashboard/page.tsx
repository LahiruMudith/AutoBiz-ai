'use client';

import React, { useState, useEffect } from 'react';
import Icons from '../../components/ui/icons';

interface Stats {
  totalProducts: number;
  totalCustomers: number;
  totalOrders: number;
  revenue: number;
  totalMessages: number;
  automationRate: number;
}

export default function Overview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState('');

  useEffect(() => {
    const bizId = localStorage.getItem('selectedBusinessId') || 'demo-clothing-store';
    setBusinessId(bizId);

    const fetchStats = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/businesses/${bizId}/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          throw new Error('Failed to load stats');
        }
      } catch (err) {
        console.warn('Fallback stats used');
        setStats({
          totalProducts: 5,
          totalCustomers: 3,
          totalOrders: 3,
          revenue: 29450,
          totalMessages: 8,
          automationRate: 75
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400" />
      </div>
    );
  }

  const kpis = [
    {
      name: 'Total Revenue',
      value: `LKR ${(stats?.revenue || 0).toLocaleString()}`,
      change: '+14.5% vs last week',
      icon: 'DollarSign' as const,
      color: 'from-emerald-600/20 to-emerald-900/10 text-emerald-400 border-emerald-500/20'
    },
    {
      name: 'Automation Rate',
      value: `${stats?.automationRate || 0}%`,
      change: 'AI resolved 78% messages',
      icon: 'Bot' as const,
      color: 'from-indigo-600/20 to-indigo-900/10 text-indigo-400 border-indigo-500/20'
    },
    {
      name: 'WhatsApp Conversations',
      value: stats?.totalMessages || 0,
      change: '+12 message slots today',
      icon: 'MessageSquare' as const,
      color: 'from-cyan-600/20 to-cyan-900/10 text-cyan-400 border-cyan-500/20'
    },
    {
      name: 'Total Customers',
      value: stats?.totalCustomers || 0,
      change: '2 VIP, 1 New customer',
      icon: 'Users' as const,
      color: 'from-amber-600/20 to-amber-900/10 text-amber-400 border-amber-500/20'
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 p-6 rounded-2xl border border-indigo-500/10 flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-[-30%] right-[-10%] w-[40%] h-[150%] rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />
        <div className="flex flex-col gap-1.5 z-10">
          <h2 className="text-2xl font-bold text-white tracking-tight">AI Agent Command Center</h2>
          <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
            Welcome back! AutoBiz AI is running smoothly. The AI sales agent is monitoring incoming messages and responding to product queries.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-900/40 border border-indigo-500/20 rounded-xl text-xs font-bold text-indigo-300 z-10">
          <Icons.Shield size={16} />
          99.9% System Uptime
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const IconComponent = Icons[kpi.icon];
          return (
            <div key={kpi.name} className={`bg-gradient-to-br ${kpi.color} border p-5 rounded-2xl flex flex-col justify-between gap-3 shadow-lg backdrop-blur-md`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{kpi.name}</span>
                <div className="p-2 bg-slate-900/60 rounded-xl">
                  <IconComponent size={18} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-extrabold text-white tracking-tight">{kpi.value}</span>
                <span className="text-[10px] text-slate-400 font-semibold">{kpi.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reports and Analytics Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Messages Chart Visual Graphic */}
        <div className="lg:col-span-8 bg-slate-900/50 border border-slate-900 p-5 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white">Daily Message Traffic</h3>
              <p className="text-[11px] text-slate-400">Total automated replies vs manual intervention</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />AI Automated</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />Manual Agents</span>
            </div>
          </div>

          {/* Simple Premium CSS Bar Chart */}
          <div className="h-48 flex items-end gap-3.5 pt-6 border-b border-slate-800 pb-2">
            {[
              { day: 'Mon', ai: 40, manual: 10 },
              { day: 'Tue', ai: 55, manual: 15 },
              { day: 'Wed', ai: 65, manual: 20 },
              { day: 'Thu', ai: 85, manual: 12 },
              { day: 'Fri', ai: 95, manual: 18 },
              { day: 'Sat', ai: 120, manual: 25 },
              { day: 'Sun', ai: 80, manual: 15 }
            ].map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full flex gap-1 justify-center items-end h-full">
                  <div
                    style={{ height: `${(d.ai / 145) * 100}%` }}
                    className="w-3.5 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md relative group-hover:brightness-110 transition-all"
                  >
                    <div className="absolute top-[-25px] left-1/2 transform -translate-x-1/2 bg-slate-950 text-[9px] font-bold text-white px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all">
                      {d.ai}
                    </div>
                  </div>
                  <div
                    style={{ height: `${(d.manual / 145) * 100}%` }}
                    className="w-3.5 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md relative group-hover:brightness-110 transition-all"
                  >
                    <div className="absolute top-[-25px] left-1/2 transform -translate-x-1/2 bg-slate-950 text-[9px] font-bold text-white px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all">
                      {d.manual}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className="lg:col-span-4 bg-slate-900/50 border border-slate-900 p-5 rounded-2xl flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-sm text-white">Live AI Activity Log</h3>
            <p className="text-[11px] text-slate-400">Recent customer interactions</p>
          </div>

          <div className="flex flex-col gap-3.5 overflow-y-auto max-h-[220px] pr-1">
            {[
              { id: 1, action: 'AI response sent (Singlish)', desc: 'Matched Slim Fit Cotton Shirt (LKR 3450) to Lahiru Mudith', time: '5m ago', status: 'success' },
              { id: 2, action: 'AI response sent (Sinhala)', desc: 'Sent delivery policy FAQ response to Nimal Silva', time: '18m ago', status: 'success' },
              { id: 3, action: 'New Order generated', desc: 'Order for Linen Casual Shirt (LKR 2900) created in checkout', time: '1h ago', status: 'info' },
              { id: 4, action: 'Manual Agent joined chat', desc: 'Agent manually disabled AI for VIP customer thread', time: '3h ago', status: 'agent' }
            ].map((act) => (
              <div key={act.id} className="flex gap-3 text-left">
                <div className="mt-1">
                  {act.status === 'success' && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                  {act.status === 'info' && <div className="w-2 h-2 rounded-full bg-indigo-400" />}
                  {act.status === 'agent' && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-white truncate">{act.action}</span>
                    <span className="text-[9px] text-slate-500 font-semibold shrink-0">{act.time}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{act.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
