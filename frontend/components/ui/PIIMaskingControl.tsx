'use client'

import { useState } from 'react'

interface MaskingField {
  id: string
  category: string
  subtitle: string
  example: string
  status: 'STRICT MASK' | 'PATTERN MASK' | 'UNMASKED'
  enabled: boolean
}

const DEFAULT_FIELDS: MaskingField[] = [
  { id: 'identity', category: 'Student Identity', subtitle: 'Full name and middle initials', example: 'Alex J. Richardson → [MASKED]', status: 'STRICT MASK', enabled: true },
  { id: 'contact', category: 'Contact Info', subtitle: 'Emails and verified phone numbers', example: 'a.rich@gmail.com → a****@****.com', status: 'PATTERN MASK', enabled: true },
  { id: 'financial', category: 'Financial Records', subtitle: 'Transaction IDs and amounts', example: 'TXN-4929... → TXN-XXXX...', status: 'UNMASKED', enabled: false },
]

interface PIIMaskingControlProps {
  securityScore?: number
  onSave?: (fields: MaskingField[], masterEnabled: boolean) => void
}

export default function PIIMaskingControl({
  securityScore = 98.4,
  onSave,
}: PIIMaskingControlProps) {
  const [masterEnabled, setMasterEnabled] = useState(true)
  const [fields, setFields] = useState<MaskingField[]>(DEFAULT_FIELDS)

  const toggleField = (id: string) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)))
  }

  const selectAll = () => setFields((prev) => prev.map((f) => ({ ...f, enabled: true })))
  const deselectAll = () => setFields((prev) => prev.map((f) => ({ ...f, enabled: false })))

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-12">
      {/* Hero Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-on-primary-container font-medium text-sm">
          <span className="material-symbols-outlined text-sm">security</span>
          <span>Security &amp; Governance</span>
        </div>
        <h2 className="text-4xl font-extrabold text-primary tracking-tight">Audit Log Privacy Controls</h2>
        <p className="text-on-surface-variant max-w-2xl leading-relaxed">
          Configure how Personally Identifiable Information (PII) is handled within the global platform audit trail. Masking ensures sensitive student and consultant data is obfuscated for non-privileged reviewers.
        </p>
      </div>

      {/* Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Master Toggle Card */}
        <div className="md:col-span-2 bg-surface-container-lowest rounded-xl p-8 shadow-[0_4px_20px_rgba(3,22,53,0.04)] flex flex-col justify-between border border-outline-variant/10">
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-container/10 text-primary text-xs font-bold tracking-wider uppercase">
                Global Directive
              </div>
              <h3 className="text-2xl font-bold text-primary">Master PII Masking</h3>
              <p className="text-on-surface-variant text-sm max-w-md">
                When enabled, all student names, emails, phone numbers, and home addresses will be replaced with{' '}
                <code className="bg-surface-container px-1 rounded text-primary-container font-mono text-xs">[MASKED]</code>{' '}
                in all audit log exports and UI views.
              </p>
            </div>
            {/* Toggle */}
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={masterEnabled}
                onChange={(e) => setMasterEnabled(e.target.checked)}
              />
              <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/5 space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase">
                <span className="material-symbols-outlined text-sm">visibility_off</span>
                Active Fields
              </div>
              <p className="text-[11px] text-on-surface-variant">Name, DOB, Email, Passport ID, Phone, Transcripts</p>
            </div>
            <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/5 space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase">
                <span className="material-symbols-outlined text-sm">history</span>
                Log Retention
              </div>
              <p className="text-[11px] text-on-surface-variant">Masking applied to logs up to 24 months old.</p>
            </div>
          </div>
        </div>

        {/* Security Score Card */}
        <div className="bg-primary text-white rounded-xl p-8 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-10">
            <span className="material-symbols-outlined text-[180px]">verified_user</span>
          </div>
          <div className="relative z-10 space-y-6">
            <div className="space-y-1">
              <span className="text-primary-fixed-dim text-xs font-bold uppercase tracking-widest">Security Score</span>
              <div className="text-5xl font-extrabold tracking-tighter">{securityScore}<span className="text-xl font-normal opacity-60">%</span></div>
            </div>
            <p className="text-sm text-primary-fixed leading-snug">
              Current masking protocols exceed SOC2 Type II and GDPR requirements for academic data processing.
            </p>
            <button className="w-full py-3 bg-primary-fixed text-on-primary-fixed font-bold text-sm rounded-lg hover:bg-white transition-colors">
              Generate Audit Report
            </button>
          </div>
        </div>

        {/* Granular Settings Table */}
        <div className="md:col-span-3 bg-surface-container-low rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 bg-surface-container-high/50 flex justify-between items-center">
            <h4 className="font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined">tune</span>
              Granular Masking Scope
            </h4>
            <div className="flex gap-2">
              <button onClick={selectAll} className="px-4 py-2 bg-white text-primary text-xs font-bold rounded-lg border border-outline-variant/20 hover:bg-surface transition-colors">Select All</button>
              <button onClick={deselectAll} className="px-4 py-2 bg-white text-primary text-xs font-bold rounded-lg border border-outline-variant/20 hover:bg-surface transition-colors">Deselect All</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/10">
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Data Category</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Example Entry</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Status</th>
                  <th className="px-8 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {fields.map((field) => (
                  <tr key={field.id} className="hover:bg-surface-container-high/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-bold text-primary text-sm">{field.category}</div>
                      <div className="text-[11px] text-on-surface-variant">{field.subtitle}</div>
                    </td>
                    <td className="px-8 py-5 font-mono text-xs text-on-surface-variant">{field.example}</td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        field.enabled
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}>
                        {field.enabled ? field.status : 'UNMASKED'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => toggleField(field.id)}>
                        <span
                          className={`material-symbols-outlined cursor-pointer text-2xl ${field.enabled ? 'text-primary' : 'text-slate-300'}`}
                          style={field.enabled ? { fontVariationSettings: "'FILL' 1" } : undefined}
                        >
                          {field.enabled ? 'toggle_on' : 'toggle_off'}
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 border-t border-outline-variant/10 flex justify-end">
            <button
              onClick={() => onSave?.(fields, masterEnabled)}
              className="px-8 py-3 bg-gradient-to-br from-primary to-primary-container text-white font-bold text-sm rounded-lg shadow-lg shadow-primary/10 hover:brightness-110 transition-all"
            >
              Save Privacy Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
