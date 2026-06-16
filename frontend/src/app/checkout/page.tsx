'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order') || 'MOCK_ORDER';
  const amount = Number(searchParams.get('amount')) || 3800;
  const businessId = searchParams.get('business') || 'demo-clothing-store';

  const [businessName, setBusinessName] = useState('StyleHub Clothing');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    // Fetch business name
    const fetchBusiness = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/businesses/${businessId}`);
        if (res.ok) {
          const data = await res.json();
          setBusinessName(data.name);
        }
      } catch (e) {
        console.warn('Fallback business name');
      }
    };
    fetchBusiness();
  }, [businessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvv) {
      alert('Please fill all card details');
      return;
    }
    setPaying(true);

    try {
      // 1. Fire webhook notification to backend
      const res = await fetch('http://localhost:5000/api/webhook/payhere/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: 'MOCK_MERCHANT_ID',
          order_id: `SUB_${businessId}_${Date.now()}`, // standard notify structure
          payhere_amount: amount,
          payhere_currency: 'LKR',
          status_code: 2 // Successful
        })
      });

      // 2. Update order status to 'paid'
      const updateOrderRes = await fetch(`http://localhost:5000/api/businesses/${businessId}/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' })
      });

      if (res.ok && updateOrderRes.ok) {
        setTimeout(() => {
          setPaying(false);
          setPaid(true);
        }, 1500);
      } else {
        throw new Error('Transaction declined');
      }
    } catch (err) {
      // Offline fallback
      setTimeout(() => {
        setPaying(false);
        setPaid(true);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-red-900/10 blur-[100px] pointer-events-none" />

      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 flex flex-col gap-6 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-[10px] font-black text-white">
              P
            </div>
            <span className="font-extrabold text-sm text-white tracking-wide">
              payhere<span className="text-red-500 font-bold">.</span>
            </span>
          </div>
          <span className="px-2 py-0.5 text-[8px] font-bold bg-amber-950 text-amber-400 border border-amber-500/20 rounded uppercase tracking-widest">
            Secure Gateway
          </span>
        </div>

        {paid ? (
          <div className="flex flex-col items-center gap-4 text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl">
              ✓
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Payment Successful</h3>
              <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">
                Thank you! Your payment of <strong>LKR {amount.toLocaleString()}</strong> to <strong>{businessName}</strong> has been authorized.
              </p>
            </div>
            <p className="text-[10px] text-slate-500">You can now close this window and return to WhatsApp.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider">Payment Details</h3>
              <p className="text-xs text-slate-500 mt-0.5">Authorize transfer to {businessName}</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col gap-1.5 text-xs text-left">
              <div className="flex justify-between text-slate-400">
                <span>Pay to:</span>
                <span className="text-white font-bold">{businessName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Order Reference:</span>
                <span className="text-white font-mono text-[10px]">{orderId}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm border-t border-slate-800 pt-2 mt-2">
                <span className="text-slate-200">Total Charged:</span>
                <span className="text-emerald-400">LKR {amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider text-left">CREDIT / DEBIT CARD</span>
              
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[8px] font-bold text-slate-500">CARD NUMBER</label>
                <input
                  type="text"
                  placeholder="4111 2222 3333 4444"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-700 outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-bold text-slate-500">EXPIRY</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-700 outline-none transition-all"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-bold text-slate-500">CVV</label>
                  <input
                    type="password"
                    placeholder="123"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-700 outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={paying}
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-xs font-bold text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
            >
              {paying ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                  Authorizing Payment...
                </>
              ) : (
                `Confirm LKR ${amount.toLocaleString()}`
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
