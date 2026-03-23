'use client'

import { useState } from 'react'

interface AuditExportConfigProps {
  onClose?: () => void
  onExport?: () => void
}

const AGENCIES = [
  { id: 'elite', name: 'Elite Global Prep', checked: true },
  { id: 'ivy', name: 'Ivy Bridge Int.', checked: true },
  { id: 'oxford', name: 'Oxford Scholars', checked: false },
  { id: 'pacific', name: 'Pacific Consulting', checked: false },
]

export default function AuditExportConfig({ onClose, onExport }: AuditExportConfigProps) {
  const [startDate, setStartDate] = useState('2023-10-01')
  const [endDate, setEndDate] = useState('2023-10-24')
  const [agencies, setAgencies] = useState(AGENCIES)
  const [piiMasking, setPiiMasking] = useState(true)
  const [tokenize, setTokenize] = useState(false)

  const toggleAgency = (id: string) => {
    setAgencies((prev) => prev.map((a) => (a.id === id ? { ...a, checked: !a.checked } : a)))
  }

  const selectAll = () => setAgencies((prev) => prev.map((a) => ({ ...a, checked: true })))

  return (
    <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-xl shadow-[0px_40px_80px_rgba(3,22,53,0.12)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-bright">
          <div>
            <h2 className="text-2xl font-headline font-extrabold text-primary tracking-tight">Export Configuration</h2>
            <p className="text-sm text-on-surface-variant font-body mt-1">Configure global CSV audit parameters for administrative review.</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-outline">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-8 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* Date Range */}
          <div className="space-y-4">
            <label className="block font-headline font-bold text-xs uppercase tracking-widest text-primary">Timeframe Selection</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase ml-1">Start Date</span>
                <div className="flex items-center bg-surface-container rounded-lg px-4 py-3 border border-outline-variant/15 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-fixed/30 transition-all">
                  <input
                    className="bg-transparent border-none p-0 w-full text-sm font-medium focus:ring-0 outline-none"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase ml-1">End Date</span>
                <div className="flex items-center bg-surface-container rounded-lg px-4 py-3 border border-outline-variant/15 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-fixed/30 transition-all">
                  <input
                    className="bg-transparent border-none p-0 w-full text-sm font-medium focus:ring-0 outline-none"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Agency Selection */}
          <div className="space-y-4">
            <label className="block font-headline font-bold text-xs uppercase tracking-widest text-primary">Target Scope</label>
            <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Select Participating Agencies</span>
                <button onClick={selectAll} className="text-[10px] font-bold text-primary uppercase hover:underline">Select All</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {agencies.map((agency) => (
                  <label
                    key={agency.id}
                    className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/10 cursor-pointer hover:border-primary/30 transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant"
                      checked={agency.checked}
                      onChange={() => toggleAgency(agency.id)}
                    />
                    <span className="text-xs font-semibold">{agency.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Privacy Masking */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block font-headline font-bold text-xs uppercase tracking-widest text-primary">Data Security &amp; Privacy</label>
              <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded text-[9px] font-bold uppercase">Compliance Required</span>
            </div>
            <div className="space-y-3">
              {/* PII Masking */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-container">
                <div className="mt-1">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">PII Masking</p>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={piiMasking}
                        onChange={(e) => setPiiMasking(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">Automatically redact Student Emails, Phone Numbers, and Physical Addresses from the exported file.</p>
                </div>
              </div>

              {/* Tokenize API Secrets */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-outline-variant/20">
                <div className="mt-1">
                  <span className="material-symbols-outlined text-on-surface-variant">vpn_key</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">Tokenize API Secrets</p>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={tokenize}
                        onChange={(e) => setTokenize(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">Replace sensitive authentication headers with unique system tokens for audit trail continuity.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-surface-container-low flex items-center justify-between border-t border-outline-variant/10">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">info</span>
            <span className="text-[11px] font-medium italic">Approx. file size: 4.2 MB (CSV)</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors">Cancel</button>
            <button
              onClick={onExport}
              className="px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-white font-bold text-sm rounded-lg shadow-lg shadow-primary/10 hover:brightness-110 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Generate Export
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
