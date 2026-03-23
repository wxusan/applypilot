'use client'

import { useState } from 'react'

type TabId = 'all' | 'students' | 'applications' | 'documents'

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'students', label: 'Students' },
  { id: 'applications', label: 'Applications' },
  { id: 'documents', label: 'Documents' },
]

const MOCK_STUDENTS = [
  { id: '1', name: 'Alexander Chen', subtitle: 'Grade 12 · 4 Active Applications', priority: 'High', initials: 'AC', color: '#dbeafe' },
  { id: '2', name: 'Priya Sharma', subtitle: 'Grade 12 · 2 Active Applications', priority: 'Medium', initials: 'PS', color: '#dcfce7' },
  { id: '3', name: 'Jordan Williams', subtitle: 'Grade 11 · Onboarding', priority: 'Low', initials: 'JW', color: '#f3e8ff' },
]

const MOCK_APPLICATIONS = [
  { id: 'APP-2024-0891', school: 'Stanford University', status: 'In Review', progress: 74, deadline: 'Jan 5, 2025' },
  { id: 'APP-2024-0892', school: 'MIT', status: 'Submitted', progress: 100, deadline: 'Jan 1, 2025' },
  { id: 'APP-2024-0893', school: 'Yale University', status: 'In Progress', progress: 42, deadline: 'Jan 2, 2025' },
  { id: 'APP-2024-0894', school: 'Columbia University', status: 'Draft', progress: 18, deadline: 'Jan 3, 2025' },
]

const MOCK_DOCUMENTS = [
  { id: '1', name: 'Alexander_Chen_Transcript.pdf', type: 'pdf', size: '2.4 MB', date: 'Dec 12, 2024', author: 'A. Chen' },
  { id: '2', name: 'Personal_Statement_Draft_v3.docx', type: 'docx', size: '48 KB', date: 'Dec 10, 2024', author: 'A. Chen' },
  { id: '3', name: 'Recommendation_Letter_Smith.pdf', type: 'pdf', size: '1.1 MB', date: 'Dec 8, 2024', author: 'J. Smith' },
  { id: '4', name: 'Portfolio_Sample.png', type: 'image', size: '5.6 MB', date: 'Dec 5, 2024', author: 'A. Chen' },
]

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  High: { bg: '#fee2e2', text: '#dc2626' },
  Medium: { bg: '#fef9c3', text: '#ca8a04' },
  Low: { bg: '#dcfce7', text: '#16a34a' },
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'In Review': { bg: '#fef9c3', text: '#854d0e' },
  Submitted: { bg: '#dcfce7', text: '#166534' },
  'In Progress': { bg: '#dbeafe', text: '#1e40af' },
  Draft: { bg: '#f1f5f9', text: '#475569' },
}

const DOC_TYPE_CONFIG: Record<string, { icon: string; bg: string; color: string }> = {
  pdf: { icon: 'picture_as_pdf', bg: '#fee2e2', color: '#dc2626' },
  docx: { icon: 'description', bg: '#dbeafe', color: '#2563eb' },
  image: { icon: 'image', bg: '#dcfce7', color: '#16a34a' },
}

interface SearchPageProps {
  searchParams?: { q?: string }
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams?.q ?? 'Alexander Chen'
  const totalResults = MOCK_STUDENTS.length + MOCK_APPLICATIONS.length + MOCK_DOCUMENTS.length

  const [activeTab, setActiveTab] = useState<TabId>('all')

  const showStudents = activeTab === 'all' || activeTab === 'students'
  const showApplications = activeTab === 'all' || activeTab === 'applications'
  const showDocuments = activeTab === 'all' || activeTab === 'documents'

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div>
        <h2 className="text-2xl font-extrabold" style={{ color: '#031635', fontFamily: 'Manrope, sans-serif' }}>
          Search Results for{' '}
          <span style={{ color: '#2563eb' }}>&ldquo;{query}&rdquo;</span>
        </h2>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>
          {totalResults} results found across students, applications, and documents
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ borderBottom: '1px solid #e2e8f0' }}>
        <div className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="pb-3 text-sm font-semibold transition-colors relative"
              style={{
                color: activeTab === tab.id ? '#031635' : '#94a3b8',
                borderBottom: activeTab === tab.id ? '2px solid #031635' : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 12-col grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Results */}
        <div className="col-span-8 space-y-8">
          {/* Students */}
          {showStudents && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#94a3b8' }}>
                Students ({MOCK_STUDENTS.length})
              </h3>
              <div className="space-y-3">
                {MOCK_STUDENTS.map((student) => {
                  const priorityStyle = PRIORITY_COLORS[student.priority]
                  return (
                    <div
                      key={student.id}
                      className="flex items-center gap-4 rounded-2xl p-4 bg-white cursor-pointer hover:shadow-sm transition-shadow"
                      style={{ border: '1px solid #e2e8f0' }}
                    >
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: student.color, color: '#031635' }}
                      >
                        {student.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: '#031635' }}>
                          {student.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                          {student.subtitle}
                        </p>
                      </div>
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: priorityStyle.bg, color: priorityStyle.text }}
                      >
                        {student.priority}
                      </span>
                      <span className="material-symbols-outlined text-[18px]" style={{ color: '#cbd5e1' }}>
                        chevron_right
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Applications */}
          {showApplications && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#94a3b8' }}>
                Applications ({MOCK_APPLICATIONS.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {MOCK_APPLICATIONS.map((app) => {
                  const statusStyle = STATUS_COLORS[app.status] ?? { bg: '#f1f5f9', text: '#475569' }
                  return (
                    <div
                      key={app.id}
                      className="rounded-2xl p-4 bg-white cursor-pointer hover:shadow-sm transition-shadow"
                      style={{ border: '1px solid #e2e8f0', borderLeft: '4px solid #031635' }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#031635' }}>
                            {app.school}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                            {app.id}
                          </p>
                        </div>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                        >
                          {app.status}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs" style={{ color: '#94a3b8' }}>Progress</span>
                          <span className="text-xs font-semibold" style={{ color: '#031635' }}>{app.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: '#e2e8f0' }}>
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${app.progress}%`, backgroundColor: '#031635' }}
                          />
                        </div>
                      </div>
                      <p className="text-xs mt-2" style={{ color: '#94a3b8' }}>
                        Deadline: {app.deadline}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Documents */}
          {showDocuments && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#94a3b8' }}>
                Documents ({MOCK_DOCUMENTS.length})
              </h3>
              <div className="space-y-2">
                {MOCK_DOCUMENTS.map((doc) => {
                  const typeConfig = DOC_TYPE_CONFIG[doc.type] ?? DOC_TYPE_CONFIG.pdf
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 rounded-xl p-4 bg-white cursor-pointer hover:shadow-sm transition-shadow"
                      style={{ border: '1px solid #e2e8f0' }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: typeConfig.bg }}
                      >
                        <span className="material-symbols-outlined text-[20px]" style={{ color: typeConfig.color }}>
                          {typeConfig.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: '#031635' }}>
                          {doc.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                          {doc.size} · {doc.date} · {doc.author}
                        </p>
                      </div>
                      <button
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-50"
                        style={{ color: '#031635', border: '1px solid #e2e8f0' }}
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        Download
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="col-span-4 space-y-4">
          {/* Refine Search */}
          <div className="rounded-3xl p-6" style={{ backgroundColor: '#031635' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#94a3b8' }}>
              Refine Search
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-white block mb-1.5">Date Range</label>
                <select
                  className="w-full text-sm rounded-xl px-3 py-2 font-medium"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  <option value="all" style={{ backgroundColor: '#031635' }}>All time</option>
                  <option value="30d" style={{ backgroundColor: '#031635' }}>Last 30 days</option>
                  <option value="90d" style={{ backgroundColor: '#031635' }}>Last 90 days</option>
                  <option value="year" style={{ backgroundColor: '#031635' }}>This year</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-white block mb-1.5">Authors</label>
                <div className="flex items-center gap-1">
                  {['AC', 'PS', 'JW'].map((initials, i) => (
                    <div
                      key={initials}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer border-2"
                      style={{
                        backgroundColor: ['#dbeafe', '#dcfce7', '#f3e8ff'][i],
                        color: '#031635',
                        borderColor: '#1a2b4b',
                      }}
                      title={initials}
                    >
                      {initials}
                    </div>
                  ))}
                  <button
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>
              </div>
            </div>
            <button
              className="mt-5 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              Update Results
            </button>
          </div>

          {/* Quick Insights */}
          <div className="rounded-3xl p-6 bg-white" style={{ border: '1px solid #e2e8f0' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#94a3b8' }}>
              Quick Insights
            </p>
            <ul className="space-y-2.5">
              {[
                { color: '#dc2626', text: '2 applications missing required documents' },
                { color: '#f59e0b', text: '1 deadline in the next 24 hours' },
                { color: '#16a34a', text: '3 decisions received this week' },
                { color: '#2563eb', text: '12 agent tasks completed today' },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm" style={{ color: '#475569' }}>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pilot AI Suggestion */}
          <div
            className="rounded-3xl p-6"
            style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[20px]" style={{ color: '#facc15' }}>
                auto_awesome
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#94a3b8' }}>
                Pilot AI Suggestion
              </p>
            </div>
            <p className="text-sm" style={{ color: '#475569' }}>
              Based on your search, Alexander Chen has 2 applications with missing supplements.
              Consider running the document agent to auto-gather required materials.
            </p>
            <button
              className="mt-4 text-sm font-semibold transition-colors hover:underline"
              style={{ color: '#031635' }}
            >
              Run Document Agent →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
