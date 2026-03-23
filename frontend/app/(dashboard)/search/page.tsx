'use client'

import { useState } from 'react'

const MOCK_DOCUMENTS = [
  {
    id: '1',
    name: 'Fall 2024 Admissions Policy_Final.pdf',
    type: 'pdf',
    typeColor: 'bg-error-container text-on-error-container',
    size: '2.4 MB',
    date: 'Dec 12, 2024',
    author: 'AA',
    authorBg: 'bg-primary-fixed',
    preview: true,
  },
  {
    id: '2',
    name: 'Hansen_Marcus_Transcript_2024.pdf',
    type: 'pdf',
    typeColor: 'bg-secondary-container text-on-secondary-container',
    size: '1.1 MB',
    date: 'Dec 10, 2024',
    author: 'MH',
    authorBg: 'bg-primary-fixed-dim',
    preview: false,
  },
  {
    id: '3',
    name: 'Master_Email_Templates_2024.docx',
    type: 'docx',
    typeColor: 'bg-tertiary-container text-on-tertiary-container',
    size: '48 KB',
    date: 'Dec 8, 2024',
    author: 'SJ',
    authorBg: 'bg-surface-tint',
    preview: false,
  },
  {
    id: '4',
    name: 'Q4_Strategy_Notes.pdf',
    type: 'pdf',
    typeColor: 'bg-error-container text-on-error-container',
    size: '820 KB',
    date: 'Dec 5, 2024',
    author: 'AA',
    authorBg: 'bg-primary-fixed',
    preview: false,
  },
]

const FILTER_CHIPS = ['All Types', 'PDF', 'DOCX', 'Student', 'Agency']

interface SearchPageProps {
  searchParams?: { q?: string }
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams?.q ?? 'Admissions 2024'
  const [activeFilter, setActiveFilter] = useState('All Types')

  return (
    <div className="px-8 pt-12 pb-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight mb-2">
              Keyword: &ldquo;{query}&rdquo;
            </h1>
            <p className="text-on-surface-variant text-sm">{MOCK_DOCUMENTS.length} documents matched across all dossiers</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
              <input
                className="pl-10 pr-4 py-2.5 bg-surface-container rounded-full border-none focus:ring-2 focus:ring-primary/20 text-sm font-body w-full md:w-64 outline-none"
                placeholder="Search within results..."
                type="text"
                defaultValue={query}
              />
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2 pt-2">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => setActiveFilter(chip)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                activeFilter === chip
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {chip}
            </button>
          ))}
          <div className="h-6 w-[1px] bg-outline-variant mx-1 self-center"></div>
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-sm">tune</span>
            Advanced
          </button>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Keyword Analysis Card (spans 2 cols) */}
          <div className="md:col-span-2 bg-primary-container p-6 rounded-xl border border-primary/20 relative overflow-hidden flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary-fixed-dim text-sm">analytics</span>
                <span className="text-xs font-bold text-on-primary-container uppercase tracking-widest">Keyword Analysis</span>
              </div>
              <h3 className="font-headline font-bold text-xl text-white mb-2">Keyword Analysis: {query}</h3>
              <p className="text-on-primary-container text-sm leading-relaxed">
                Found across {MOCK_DOCUMENTS.length} documents. Most references appear in admission policy and student transcript files.
              </p>
              <div className="mt-6 flex gap-3">
                <button className="px-5 py-2.5 bg-primary-fixed text-on-primary-fixed rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
                  View All Matches
                </button>
                <button className="px-5 py-2.5 bg-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/20 transition-colors">
                  Export Results
                </button>
              </div>
            </div>
            <div className="w-full md:w-48 aspect-square rounded-xl bg-primary/40 backdrop-blur-sm border border-white/5 flex flex-col items-center justify-center p-4 text-center flex-shrink-0">
              <div className="text-3xl font-extrabold text-white mb-1">{MOCK_DOCUMENTS.length}</div>
              <div className="text-[10px] text-on-primary-container font-bold uppercase tracking-widest">Matched Files</div>
              <div className="mt-4 flex -space-x-2">
                {['bg-slate-400', 'bg-slate-500', 'bg-slate-600'].map((bg, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 border-primary-container ${bg}`}></div>
                ))}
              </div>
            </div>
          </div>

          {/* Document Cards */}
          {MOCK_DOCUMENTS.map((doc) => (
            <div
              key={doc.id}
              className="group bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col gap-4"
            >
              <div className="flex justify-between items-start">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${doc.typeColor}`}>
                  <span className="material-symbols-outlined text-2xl">
                    {doc.type === 'pdf' ? 'picture_as_pdf' : 'description'}
                  </span>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm">more_horiz</span>
                </button>
              </div>

              <div className="flex-1">
                <h3 className="font-headline font-bold text-base text-primary leading-tight group-hover:text-surface-tint transition-colors line-clamp-2">
                  {doc.name}
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">{doc.size} · {doc.date}</p>
              </div>

              {doc.preview && (
                <div className="h-20 rounded-lg bg-surface-container relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5"></div>
                  <div className="p-3 space-y-1.5">
                    <div className="h-2 w-3/4 bg-white/60 rounded-full"></div>
                    <div className="h-2 w-full bg-white/40 rounded-full"></div>
                    <div className="h-2 w-2/3 bg-white/40 rounded-full"></div>
                  </div>
                </div>
              )}

              <div className="mt-auto pt-4 border-t border-surface-container flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full ${doc.authorBg} flex items-center justify-center text-[10px] font-bold text-on-primary-fixed`}>
                    {doc.author}
                  </div>
                  <span className="text-[11px] text-on-surface-variant">{doc.author}</span>
                </div>
                <button className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                  Open
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
