'use client'

import { useState } from 'react'

type FilterTab = 'all' | 'staff' | 'student' | 'system'

interface LogEntry {
  id: string
  author: string
  role: string
  action: string
  timestamp: string
  type: 'edit' | 'status' | 'ai'
  before?: string
  after?: string
  note?: string
  fromStatus?: string
  toStatus?: string
  aiNote?: string
}

const LOG_ENTRIES: LogEntry[] = [
  {
    id: '1',
    author: 'Marcus Thorne',
    role: 'Senior Lead',
    action: 'modified Personal Statement draft',
    timestamp: 'Today, 11:42 AM',
    type: 'edit',
    before: '"...and that\'s when I realized the power of community service in suburban Ohio."',
    after: '"...this epiphany catalyzed my commitment to grassroots educational reform within underserved Midwestern corridors."',
    note: 'Refining voice for Ivy League resonance. Previous draft was too colloquial.',
  },
  {
    id: '2',
    author: 'Sarah Jenkins',
    role: 'Operations',
    action: 'updated Dossier Status',
    timestamp: 'Yesterday, 4:15 PM',
    type: 'status',
    fromStatus: 'Review Pending',
    toStatus: 'Verified & Finalized',
  },
  {
    id: '3',
    author: 'Pilot AI',
    role: 'AI Architect',
    action: 'generated supplemental essay draft',
    timestamp: 'Oct 22, 2023',
    type: 'ai',
    aiNote: 'AI identified a thematic gap in activities section. Generated targeted supplement for Yale "Why Yale?" prompt.',
  },
]

interface StaffEditsLogProps {
  studentName?: string
  studentSubtitle?: string
}

export default function StaffEditsLog({
  studentName = 'Elena Rodriguez',
  studentSubtitle = 'Academic Dossier: Class of 2025 • Stanford Early Action Track',
}: StaffEditsLogProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('staff')

  return (
    <div className="p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary/60">Profile Archive</span>
            <span className="material-symbols-outlined text-xs text-primary/40">arrow_forward_ios</span>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Activity Log</span>
          </div>
          <h2 className="text-4xl font-headline font-extrabold text-primary tracking-tight">{studentName}</h2>
          <p className="text-on-surface-variant mt-2 font-body">{studentSubtitle}</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/15 text-sm font-semibold text-primary hover:bg-surface-bright shadow-sm transition-all">
            <span className="material-symbols-outlined text-sm">download</span>
            Export Audit
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-br from-primary to-primary-container text-sm font-semibold text-white shadow-lg shadow-primary/10 hover:opacity-95 transition-all">
            <span className="material-symbols-outlined text-sm">add</span>
            New Entry
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-12 gap-4 mb-8">
        <div className="col-span-8 bg-surface-container-low rounded-xl p-2 flex items-center gap-1">
          {(['all', 'staff', 'student', 'system'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-bold ring-1 ring-primary/5'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {tab === 'all' ? 'All Activities' : tab === 'staff' ? 'Staff Edits' : tab === 'student' ? 'Student Submissions' : 'System Triggers'}
            </button>
          ))}
        </div>
        <div className="col-span-4 bg-surface-container-low rounded-xl p-2 flex items-center justify-between">
          <span className="text-xs font-bold uppercase text-primary/40 ml-4">Filter: Last 30 Days</span>
          <button className="w-10 h-10 flex items-center justify-center bg-surface-container-lowest rounded-lg text-primary shadow-sm">
            <span className="material-symbols-outlined text-sm">calendar_month</span>
          </button>
        </div>
      </div>

      {/* Timeline Audit Log */}
      <div className="space-y-4">
        {LOG_ENTRIES.map((entry) => (
          <div key={entry.id} className={`bg-surface-container-lowest rounded-xl p-6 shadow-[0_40px_40px_rgba(3,22,53,0.03)] border-l-4 ${entry.type === 'ai' ? 'border-surface-tint' : 'border-primary'}`}>
            <div className="flex items-start gap-6">
              <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-surface-container ${entry.type === 'ai' ? 'bg-slate-900' : 'bg-primary-fixed'}`}>
                  {entry.type === 'ai' ? (
                    <span className="material-symbols-outlined text-white">auto_awesome</span>
                  ) : (
                    <span className="material-symbols-outlined text-on-primary-fixed text-lg">person</span>
                  )}
                </div>
                <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full ring-2 ring-white ${entry.type === 'ai' ? 'bg-white' : 'bg-primary text-white'}`}>
                  <span className="material-symbols-outlined text-[10px] text-primary">
                    {entry.type === 'edit' ? 'edit' : entry.type === 'status' ? 'rule' : 'auto_awesome'}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-headline font-bold text-primary">{entry.author}</span>
                    <span className="text-xs font-medium px-2 py-0.5 bg-primary-fixed text-on-primary-fixed rounded-full">{entry.role}</span>
                    <span className="text-on-surface-variant text-sm ml-2">{entry.action}</span>
                  </div>
                  <span className="text-xs font-medium text-on-surface-variant flex-shrink-0">{entry.timestamp}</span>
                </div>

                {entry.type === 'edit' && entry.before && entry.after && (
                  <div className="bg-surface-container-low rounded-lg p-4 mt-3 space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-red-50/50 p-2 rounded line-through text-red-700 text-sm font-body italic">{entry.before}</div>
                      <span className="material-symbols-outlined text-slate-300">arrow_forward</span>
                      <div className="flex-1 bg-green-50/50 p-2 rounded text-green-700 text-sm font-body">{entry.after}</div>
                    </div>
                    {entry.note && <p className="text-xs text-on-surface-variant italic">{entry.note}</p>}
                  </div>
                )}

                {entry.type === 'status' && entry.fromStatus && entry.toStatus && (
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high rounded text-sm font-bold text-on-surface-variant opacity-50">
                      <span className="material-symbols-outlined text-sm">pending</span>
                      {entry.fromStatus}
                    </div>
                    <span className="material-symbols-outlined text-slate-300">arrow_forward</span>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded text-sm font-bold shadow-md shadow-primary/10">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      {entry.toStatus}
                    </div>
                  </div>
                )}

                {entry.type === 'ai' && entry.aiNote && (
                  <div className="mt-3 p-4 bg-surface-container-low rounded-lg border border-outline-variant/10">
                    <p className="text-sm text-on-surface-variant leading-relaxed">{entry.aiNote}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
