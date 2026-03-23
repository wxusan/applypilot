'use client'

import { useState } from 'react'

interface BillingNotePanelProps {
  agencyName?: string
  agencyId?: string
  totalInvoiced?: number
  paymentsApplied?: number
  outstanding?: number
}

export default function BillingNotePanel({
  agencyName = 'Elite Scholars Hub',
  agencyId = '#4432-B',
  totalInvoiced = 4500,
  paymentsApplied = 3050,
  outstanding = 1450,
}: BillingNotePanelProps) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('bank_transfer')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  return (
    <div className="p-10 bg-surface-container-low/40 border-y border-outline-variant/15">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Info Dossier */}
        <div className="lg:col-span-1 space-y-6">
          <div>
            <h4 className="font-headline font-bold text-primary mb-1 uppercase tracking-widest text-xs">Manual Payment Entry</h4>
            <p className="text-on-surface-variant text-sm leading-relaxed">Record payments received through offline channels or manual gateways to update the agency ledger.</p>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm">
            <div className="flex items-center gap-3 mb-4 text-primary">
              <span className="material-symbols-outlined">account_balance_wallet</span>
              <span className="font-headline font-bold">Ledger Summary</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Total Invoiced</span>
                <span className="font-medium">${totalInvoiced.toLocaleString()}.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Payments Applied</span>
                <span className="font-medium text-green-700">${paymentsApplied.toLocaleString()}.00</span>
              </div>
              <div className="pt-3 border-t border-outline-variant/10 flex justify-between font-bold">
                <span className="text-primary">Remaining</span>
                <span className="text-error">${outstanding.toLocaleString()}.00</span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-error-container/20 rounded-xl border border-error-container/30 flex gap-3">
            <span className="material-symbols-outlined text-error text-sm mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <p className="text-xs text-on-error-container leading-relaxed">
              Manual entries bypass automated billing. Ensure payment evidence is retained before confirming.
            </p>
          </div>
        </div>

        {/* Right: Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Payment Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-sm">$</span>
                <input
                  className="w-full h-12 bg-surface-container pl-8 pr-4 rounded-lg border border-outline-variant/15 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body font-semibold text-primary"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Payment Method</label>
              <select
                className="w-full h-12 bg-surface-container px-4 rounded-lg border border-outline-variant/15 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body text-sm text-on-surface"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="wire">Wire Transfer</option>
                <option value="check">Check</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Reference / Transaction ID</label>
            <input
              className="w-full h-12 bg-surface-container px-4 rounded-lg border border-outline-variant/15 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body text-sm"
              type="text"
              placeholder="e.g. TXN-29910-B"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Internal Notes</label>
            <textarea
              className="w-full bg-surface-container px-4 py-3 rounded-lg border border-outline-variant/15 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body text-sm resize-none"
              placeholder="Optional note for the ledger record..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-4 pt-2">
            <button className="px-6 h-11 font-label font-bold text-sm text-secondary hover:text-primary transition-colors">
              Cancel
            </button>
            <button className="px-8 h-11 bg-gradient-to-br from-primary to-primary-container text-white font-label font-bold text-sm rounded-lg shadow-lg shadow-primary/10 hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2">
              Record Payment
              <span className="material-symbols-outlined text-sm">check_circle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
