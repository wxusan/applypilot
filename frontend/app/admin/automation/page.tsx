'use client'

import { useState } from 'react'

const AGENCIES = [
  {
    id: 'OX',
    initials: 'OX',
    name: 'Oxford Admissions Elite',
    tier: 'Enterprise Platinum',
    balance: 450000,
    balanceLabel: '450,000 UZS',
    status: 'unpaid' as const,
    expanded: true,
  },
  {
    id: 'IV',
    initials: 'IV',
    name: 'Ivy League Strategic',
    tier: 'Standard Core',
    balance: 0,
    balanceLabel: 'Settled',
    status: 'settled' as const,
    expanded: false,
  },
]

const RECENT_TRANSACTIONS = [
  {
    icon: 'check_circle',
    iconBg: 'bg-secondary-fixed',
    iconColor: 'text-primary',
    agency: 'Oxford Admissions Elite',
    note: '"Paid 150k UZS via Click"',
    time: 'Today, 09:42 AM',
  },
  {
    icon: 'info',
    iconBg: 'bg-surface-container-high',
    iconColor: 'text-on-surface-variant',
    agency: 'Global Scholars Group',
    note: 'Pending manual bank verify',
    time: 'Yesterday',
  },
  {
    icon: 'check_circle',
    iconBg: 'bg-secondary-fixed',
    iconColor: 'text-primary',
    agency: 'Future Leaders LLC',
    note: '"Paid 2.1M UZS via Transfer"',
    time: 'Oct 24, 2023',
  },
]

export default function AdminAutomationPage() {
  const [userSeats, setUserSeats] = useState(12)
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'Click', notes: '' })

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen">
      {/* Main Canvas */}
      <main className="min-h-screen">
        <section className="p-10 space-y-10">

          {/* Header Section */}
          <div className="flex justify-between items-end">
            <div>
              <h3 className="font-headline text-3xl font-extrabold text-primary tracking-tight">Billing &amp; Agency Oversight</h3>
              <p className="text-on-surface-variant mt-2 max-w-lg">
                Manage institutional accounts, verify manual transactions, and adjust architectural capacity for elite partner agencies.
              </p>
            </div>
            <button className="bg-gradient-to-br from-primary to-primary-container text-white px-6 py-2.5 rounded-lg font-label font-semibold text-sm shadow-lg shadow-primary/10 flex items-center gap-2 hover:brightness-110 transition-all">
              <span className="material-symbols-outlined text-[20px]">add</span>
              New Dossier
            </button>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-12 gap-6">

            {/* Left: Agency Panels */}
            <div className="col-span-12 lg:col-span-8 space-y-6">

              {/* Oxford Admissions — Expanded */}
              <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl overflow-hidden shadow-sm">
                {/* Summary Row */}
                <div className="p-6 flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-secondary-fixed flex items-center justify-center text-primary font-bold">OX</div>
                    <div>
                      <h4 className="font-headline font-bold text-on-surface">Oxford Admissions Elite</h4>
                      <p className="text-xs text-on-surface-variant">Tier: Enterprise Platinum</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="text-right">
                      <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Unpaid Balance</p>
                      <p className="text-lg font-bold text-error">450,000 UZS</p>
                    </div>
                    <span className="material-symbols-outlined text-primary rotate-180">expand_more</span>
                  </div>
                </div>

                {/* Expanded Billing Panel */}
                <div className="border-t border-outline-variant/10 bg-surface/50 p-8">
                  <div className="grid grid-cols-2 gap-10">

                    {/* Left: Transaction Logging */}
                    <div className="space-y-6">
                      <h5 className="font-headline font-bold text-sm uppercase tracking-widest text-primary/60">Record Manual Payment</h5>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-on-surface-variant">Amount (UZS)</label>
                            <input
                              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm outline-none"
                              placeholder="e.g. 150,000"
                              type="text"
                              value={paymentForm.amount}
                              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-on-surface-variant">Payment Method</label>
                            <select
                              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm outline-none"
                              value={paymentForm.method}
                              onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                            >
                              <option>Click</option>
                              <option>Payme</option>
                              <option>Bank Transfer</option>
                              <option>Cash</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-on-surface-variant">Admin Notes</label>
                          <textarea
                            className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm outline-none resize-none"
                            placeholder="e.g. Paid 150k UZS via Click. Reference #8812"
                            rows={2}
                            value={paymentForm.notes}
                            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                          />
                        </div>
                        <button className="w-full py-3 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary-container transition-colors">
                          Approve &amp; Record Transaction
                        </button>
                      </div>
                    </div>

                    {/* Right: Plan Limit Adjustments */}
                    <div className="space-y-6">
                      <h5 className="font-headline font-bold text-sm uppercase tracking-widest text-primary/60">Architectural Capacity</h5>
                      <div className="space-y-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">person_add</span>
                            <span className="text-sm font-medium">User Seat Limit</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setUserSeats(Math.max(0, userSeats - 1))}
                              className="h-8 w-8 rounded-full border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container-high transition-colors"
                            >
                              -
                            </button>
                            <span className="font-bold w-4 text-center">{userSeats}</span>
                            <button
                              onClick={() => setUserSeats(userSeats + 1)}
                              className="h-8 w-8 rounded-full border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container-high transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">auto_awesome</span>
                            <span className="text-sm font-medium">Monthly AI Tokens</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded">Unlimited</span>
                            <button className="text-xs text-primary font-bold hover:underline">Edit</button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">storage</span>
                            <span className="text-sm font-medium">Storage Allocation</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold">500 GB</span>
                            <button className="h-8 w-8 rounded-full border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container-high transition-colors">+</button>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-outline-variant/10">
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-on-surface-variant">Dossier Completion Efficiency</span>
                            <span className="font-bold">94%</span>
                          </div>
                          <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                            <div className="bg-primary h-full w-[94%]"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ivy League Strategic — Collapsed */}
              <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary font-bold">IV</div>
                    <div>
                      <h4 className="font-headline font-bold text-on-surface">Ivy League Strategic</h4>
                      <p className="text-xs text-on-surface-variant">Tier: Standard Core</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="text-right">
                      <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Status</p>
                      <p className="text-sm font-bold text-secondary">Settled</p>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant">expand_more</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Rail: Global Stats & Activity */}
            <div className="col-span-12 lg:col-span-4 space-y-6">

              {/* Total Receivables */}
              <div className="bg-primary text-white p-8 rounded-xl shadow-xl shadow-primary/20 relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                  <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
                </div>
                <div className="relative z-10">
                  <h5 className="text-primary-fixed text-xs font-bold uppercase tracking-widest mb-1">Total Receivables</h5>
                  <p className="text-4xl font-headline font-extrabold">2.4M UZS</p>
                  <div className="mt-6 flex items-center gap-2 text-primary-fixed-dim text-sm">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    <span>+12.4% vs last month</span>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-6">
                <h5 className="font-headline font-bold text-on-surface mb-6">Recent Transactions</h5>
                <div className="space-y-6">
                  {RECENT_TRANSACTIONS.map((tx, i) => (
                    <div key={i} className="flex gap-4">
                      <div className={`h-10 w-10 rounded-full ${tx.iconBg} flex items-center justify-center ${tx.iconColor}`}>
                        <span className="material-symbols-outlined text-[20px]">{tx.icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">{tx.agency}</p>
                        <p className="text-xs text-on-surface-variant italic">{tx.note}</p>
                        <p className="text-[10px] text-outline mt-1 uppercase font-semibold">{tx.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Pilot Quick Action */}
              <div
                className="border border-primary/10 p-6 rounded-xl flex flex-col gap-4"
                style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(24px)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">auto_awesome</span>
                  <span className="font-headline font-bold text-sm text-primary">Pilot Insight</span>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  3 agencies are nearing their dossier limits. Would you like to send an automated upgrade proposal?
                </p>
                <button className="bg-surface-container-lowest border border-primary/20 text-primary py-2 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all">
                  Generate Proposals
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8">
        <button className="h-14 w-14 rounded-full bg-primary text-white shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-105 transition-transform">
          <span className="material-symbols-outlined text-3xl">support_agent</span>
        </button>
      </div>
    </div>
  )
}
