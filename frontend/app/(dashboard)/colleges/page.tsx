'use client'

import { useState, useEffect, useRef } from 'react'
import { apiFetch } from '@/lib/api'

interface College {
  id: string
  name: string
  city: string
  state: string
  us_news_rank?: number | null
  acceptance_rate?: number | null
  avg_gpa?: number | null
  avg_sat?: number | null
  regular_decision_deadline?: string | null
  application_fee?: number | null
  website?: string | null
}

export default function CollegesPage() {
  const [colleges, setColleges] = useState<College[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [rankMin, setRankMin] = useState('')
  const [rankMax, setRankMax] = useState('')
  const [acceptanceRateMax, setAcceptanceRateMax] = useState('100')
  const [state, setState] = useState('')

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadColleges = async (params: Record<string, string>) => {
    setLoading(true)
    setError(null)
    try {
      // Build query string from params so filters are actually applied
      const qs = new URLSearchParams(params).toString()
      const url = qs ? `/api/colleges?${qs}` : '/api/colleges'
      const response = await apiFetch<{ colleges: College[] }>(url)
      setColleges(response.colleges || [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const triggerSearch = (overrides: Record<string, string> = {}) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      const params: Record<string, string> = { ...overrides }
      if (!overrides.name && searchQuery) params.name = searchQuery
      if (rankMin) params.rank_min = rankMin
      if (rankMax) params.rank_max = rankMax
      if (acceptanceRateMax !== '100') params.acceptance_rate_max = acceptanceRateMax
      if (state) params.state = state
      loadColleges(params)
    }, 300)
  }

  useEffect(() => {
    loadColleges({})
  }, [])

  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    triggerSearch({ name: e.target.value })
  }

  const handleFilterChange = () => triggerSearch()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#031635] mb-2">College Explorer</h1>
        <p className="text-gray-500">Search and discover colleges for your students</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl p-6 border-0.5 space-y-6" style={{ borderColor: '#e5e7eb' }}>
        {/* Search Bar */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">College Name</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchQueryChange}
              placeholder="Search by college name..."
              className="w-full px-4 py-3 rounded-lg border-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#031635]/20"
              style={{ borderColor: '#e5e7eb' }}
            />
            <span className="absolute right-4 top-3 material-symbols-outlined text-gray-400" style={{ fontSize: '20px' }}>search</span>
          </div>
        </div>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Rank Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">US News Rank (Min)</label>
            <input
              type="number"
              value={rankMin}
              onChange={(e) => {
                setRankMin(e.target.value)
                handleFilterChange()
              }}
              placeholder="e.g. 1"
              className="w-full px-4 py-2 rounded-lg border-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#031635]/20"
              style={{ borderColor: '#e5e7eb' }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">US News Rank (Max)</label>
            <input
              type="number"
              value={rankMax}
              onChange={(e) => {
                setRankMax(e.target.value)
                handleFilterChange()
              }}
              placeholder="e.g. 100"
              className="w-full px-4 py-2 rounded-lg border-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#031635]/20"
              style={{ borderColor: '#e5e7eb' }}
            />
          </div>

          {/* Acceptance Rate */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Max Acceptance Rate</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={acceptanceRateMax}
                onChange={(e) => {
                  setAcceptanceRateMax(e.target.value)
                  handleFilterChange()
                }}
                className="flex-1"
              />
              <span className="text-sm font-semibold text-gray-600 min-w-[3rem]">{acceptanceRateMax}%</span>
            </div>
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => {
                setState(e.target.value)
                handleFilterChange()
              }}
              placeholder="e.g. California"
              className="w-full px-4 py-2 rounded-lg border-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#031635]/20"
              style={{ borderColor: '#e5e7eb' }}
            />
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={() => triggerSearch()}
          className="w-full px-6 py-3 bg-[#031635] text-white font-semibold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>search</span>
          Search Colleges
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : colleges.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border-0.5" style={{ borderColor: '#e5e7eb' }}>
          <span className="material-symbols-outlined text-gray-300 text-5xl block mb-4">school</span>
          <p className="text-gray-500 font-medium">No colleges found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {colleges.map((college) => (
            <div
              key={college.id}
              className="bg-white rounded-xl p-5 border-0.5 hover:shadow-lg transition-all flex flex-col"
              style={{ borderColor: '#e5e7eb' }}
            >
              <div className="flex-1">
                <h3 className="text-[15px] font-bold text-[#031635] mb-2">{college.name}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {college.city && college.state ? `${college.city}, ${college.state}` : 'Location TBD'}
                </p>

                <div className="space-y-3 text-[13px]">
                  {college.us_news_rank && (
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-gray-600">US News Rank:</span>
                      <span className="font-semibold text-[#031635]">#{college.us_news_rank}</span>
                    </div>
                  )}
                  {college.acceptance_rate != null && (
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-gray-600">Acceptance Rate:</span>
                      <span className="font-semibold text-[#031635]">{(college.acceptance_rate * 100).toFixed(1)}%</span>
                    </div>
                  )}
                  {college.avg_gpa && (
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-gray-600">Avg GPA:</span>
                      <span className="font-semibold text-[#031635]">{college.avg_gpa.toFixed(2)}</span>
                    </div>
                  )}
                  {college.avg_sat && (
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-gray-600">Avg SAT:</span>
                      <span className="font-semibold text-[#031635]">{college.avg_sat.toLocaleString()}</span>
                    </div>
                  )}
                  {college.regular_decision_deadline && (
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-gray-600">RD Deadline:</span>
                      <span className="font-semibold text-[#031635]">
                        {new Date(college.regular_decision_deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  {college.application_fee && (
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-gray-600">App Fee:</span>
                      <span className="font-semibold text-[#031635]">${college.application_fee}</span>
                    </div>
                  )}
                </div>
              </div>

              {college.website && (
                <a
                  href={college.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 px-4 py-2 bg-[#1D9E75] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all text-center flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span>
                  View Website
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
