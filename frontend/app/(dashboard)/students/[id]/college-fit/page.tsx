'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import StudentTabs from '@/components/students/StudentTabs'

interface Student {
  id: string
  full_name: string
  graduation_year?: number | null
  high_school_name?: string | null
  gpa?: number | null
  sat_total?: number | null
  act_score?: number | null
}

interface CollegeRecommendation {
  name: string
  category: 'reach' | 'target' | 'safety'
  fit_score: number
  why: string
  strengths: string[]
  gaps: string[]
}

interface FitResponse {
  recommendations: CollegeRecommendation[]
  generated_at: string
  cached: boolean
}

const CATEGORY_CONFIG = {
  reach:  { label: 'Reach',  color: '#DC2626', bg: '#FEE2E2', border: '#FECACA', icon: 'north_east' },
  target: { label: 'Target', color: '#D97706', bg: '#FEF3C7', border: '#FDE68A', icon: 'trending_flat' },
  safety: { label: 'Safety', color: '#059669', bg: '#D1FAE5', border: '#A7F3D0', icon: 'south_east' },
}

function FitScoreBar({ score, category }: { score: number; category: string }) {
  const cfg = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] ?? CATEGORY_CONFIG.target
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: cfg.color }}
        />
      </div>
      <span className="text-[11px] font-bold" style={{ color: cfg.color }}>{score}</span>
    </div>
  )
}

export default function CollegeFitPage() {
  const params = useParams<{ id: string }>()
  const [student, setStudent] = useState<Student | null>(null)
  const [fitData, setFitData] = useState<FitResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<'all' | 'reach' | 'target' | 'safety'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Load student
  useEffect(() => {
    apiFetch<Student>(`/api/students/${params.id}`)
      .then(setStudent)
      .catch(() => {})
  }, [params.id])

  const loadFit = useCallback(async (refresh = false) => {
    setLoading(true)
    setError(null)
    try {
      const url = `/api/students/${params.id}/college-fit${refresh ? '?refresh=true' : ''}`
      const res = await apiFetch<FitResponse>(url)
      setFitData(res)
    } catch (e: any) {
      setError(e.message || 'Failed to generate college fit')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => { loadFit() }, [loadFit])

  const displayName = student?.full_name ?? '...'
  const displayInitials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const gradYear = student?.graduation_year ?? '—'

  const filtered = fitData?.recommendations?.filter(
    (r) => activeCategory === 'all' || r.category === activeCategory
  ) ?? []

  const reaches = fitData?.recommendations?.filter((r) => r.category === 'reach').length ?? 0
  const targets = fitData?.recommendations?.filter((r) => r.category === 'target').length ?? 0
  const safeties = fitData?.recommendations?.filter((r) => r.category === 'safety').length ?? 0

  return (
    <div className="space-y-5">
      {/* Student Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-[15px] shrink-0"
            style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
          >
            {displayInitials}
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-[#031635]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {displayName}
            </h1>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Class of {gradYear} · {student?.high_school_name ?? '—'}
              {student?.gpa && <span className="ml-2">GPA {student.gpa}</span>}
              {student?.sat_total && <span className="ml-2">SAT {student.sat_total}</span>}
            </p>
          </div>
        </div>
        <button
          onClick={() => loadFit(true)}
          disabled={loading}
          className="h-8 px-4 rounded-lg text-[12px] font-semibold text-white flex items-center gap-1.5 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
            {loading ? 'sync' : 'refresh'}
          </span>
          {loading ? 'Analyzing...' : 'Refresh Analysis'}
        </button>
      </div>

      <StudentTabs studentId={params.id} active="college-fit" />

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] px-4 py-3 rounded-xl">
          <span className="font-semibold">Error:</span> {error}
          {error.includes('OpenAI') || error.includes('API') ? (
            <p className="mt-1 text-[12px]">Make sure your OpenAI API key is set in Railway environment variables.</p>
          ) : null}
          <button onClick={() => loadFit()} className="ml-3 underline font-semibold">Retry</button>
        </div>
      )}

      {/* Loading state */}
      {loading && !fitData && (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '0.5px solid #e5e7eb' }}>
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse"
              style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
            >
              <span className="material-symbols-outlined text-white text-2xl">psychology</span>
            </div>
            <div>
              <p className="text-[15px] font-bold text-[#031635]">AI is analyzing this student...</p>
              <p className="text-[13px] text-gray-500 mt-1">
                Comparing profile against thousands of admission data points. This takes ~15 seconds.
              </p>
            </div>
            <div className="flex gap-1.5 mt-2">
              {[0,1,2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full animate-bounce bg-[#031635]"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {fitData && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 text-center" style={{ border: '0.5px solid #e5e7eb' }}>
              <p className="text-[28px] font-bold text-[#031635]">{fitData.recommendations.length}</p>
              <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mt-0.5">Total Colleges</p>
            </div>
            {(['reach', 'target', 'safety'] as const).map((cat) => {
              const cfg = CATEGORY_CONFIG[cat]
              const count = fitData.recommendations.filter((r) => r.category === cat).length
              return (
                <div key={cat} className="rounded-xl p-4 text-center" style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  <p className="text-[28px] font-bold" style={{ color: cfg.color }}>{count}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: cfg.color }}>
                    {cfg.label}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2">
            {(['all', 'reach', 'target', 'safety'] as const).map((cat) => {
              const isActive = activeCategory === cat
              const cfg = cat !== 'all' ? CATEGORY_CONFIG[cat] : null
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="px-4 py-2 rounded-full text-[12px] font-semibold transition-all"
                  style={
                    isActive
                      ? cfg
                        ? { backgroundColor: cfg.color, color: 'white' }
                        : { background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)', color: 'white' }
                      : { border: '0.5px solid #e5e7eb', color: '#6B7280' }
                  }
                >
                  {cat === 'all' ? `All (${fitData.recommendations.length})` : `${CATEGORY_CONFIG[cat].label} (${fitData.recommendations.filter((r) => r.category === cat).length})`}
                </button>
              )
            })}
            <div className="ml-auto">
              {fitData.cached && (
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>cached</span>
                  Cached · {new Date(fitData.generated_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* College cards */}
          <div className="space-y-3">
            {filtered.map((rec, idx) => {
              const cfg = CATEGORY_CONFIG[rec.category]
              const isExpanded = expandedId === rec.name
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl overflow-hidden transition-all"
                  style={{ border: `1px solid ${isExpanded ? cfg.color + '40' : '#e5e7eb'}` }}
                >
                  <button
                    className="w-full flex items-center gap-4 p-5 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : rec.name)}
                  >
                    {/* Category badge */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cfg.bg }}
                    >
                      <span className="material-symbols-outlined text-[18px]" style={{ color: cfg.color }}>
                        {cfg.icon}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-[14px] font-bold text-[#031635]">{rec.name}</h3>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ color: cfg.color, backgroundColor: cfg.bg }}
                        >
                          {cfg.label.toUpperCase()}
                        </span>
                      </div>
                      <FitScoreBar score={rec.fit_score} category={rec.category} />
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Fit Score</p>
                        <p className="text-[16px] font-bold" style={{ color: cfg.color }}>{rec.fit_score}</p>
                      </div>
                      <span className="material-symbols-outlined text-gray-400 transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        expand_more
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-4" style={{ borderTop: '0.5px solid #e5e7eb' }}>
                      <p className="text-[13px] text-gray-700 leading-relaxed pt-4">{rec.why}</p>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>check_circle</span>
                            Profile Strengths
                          </p>
                          <ul className="space-y-1.5">
                            {rec.strengths.map((s, i) => (
                              <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700">
                                <span className="text-emerald-500 mt-0.5">•</span>
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>warning</span>
                            Areas to Strengthen
                          </p>
                          <ul className="space-y-1.5">
                            {rec.gaps.map((g, i) => (
                              <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700">
                                <span className="text-amber-500 mt-0.5">•</span>
                                {g}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Link
                          href={`/students/${params.id}/applications`}
                          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-semibold text-white"
                          style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>add</span>
                          Add Application
                        </Link>
                        <Link
                          href={`/students/${params.id}/essays`}
                          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-semibold text-gray-600"
                          style={{ border: '0.5px solid #e5e7eb' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>edit_document</span>
                          Write Essay
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {!loading && !fitData && !error && (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '0.5px solid #e5e7eb' }}>
          <span className="material-symbols-outlined text-gray-300 text-5xl block mb-3">school</span>
          <h3 className="text-[15px] font-bold text-[#031635] mb-2">College Fit Analysis</h3>
          <p className="text-[13px] text-gray-500 mb-5 max-w-md mx-auto">
            AI will analyze this student&apos;s profile and generate personalized college recommendations with fit scores.
          </p>
          <button
            onClick={() => loadFit()}
            className="h-10 px-6 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
          >
            Generate Recommendations
          </button>
        </div>
      )}
    </div>
  )
}
