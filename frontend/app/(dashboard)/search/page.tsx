'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'

interface Student {
  id: string
  full_name: string
  email?: string | null
  high_school_name?: string | null
  graduation_year?: number | null
  gpa?: number | null
  sat_total?: number | null
  act_score?: number | null
  status?: string | null
  target_country?: string | null
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const [inputValue, setInputValue] = useState(query)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!query.trim()) {
      setStudents([])
      setTotal(0)
      return
    }
    setLoading(true)
    const params = new URLSearchParams({ q: query, limit: '30' })
    apiFetch<{ students: Student[]; total: number }>(`/api/students?${params.toString()}`)
      .then((res) => {
        setStudents(res.students ?? [])
        setTotal(res.total ?? 0)
      })
      .catch(() => {
        setStudents([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(inputValue.trim())}`
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#031635]" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {query ? (
              <>Search: &ldquo;{query}&rdquo;</>
            ) : (
              'Search Students'
            )}
          </h1>
          {query && (
            <p className="text-[13px] text-gray-500 mt-0.5">
              {loading ? 'Searching...' : `${total} student${total !== 1 ? 's' : ''} found`}
            </p>
          )}
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: '18px' }}>
              search
            </span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search by student name..."
              className="pl-10 pr-4 py-2 rounded-xl text-[13px] text-gray-700 outline-none focus:ring-2 focus:ring-[#031635]/20 w-72"
              style={{ border: '0.5px solid #e5e7eb' }}
            />
          </div>
          <button
            type="submit"
            className="h-9 px-4 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Empty prompt */}
      {!query && !loading && (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '0.5px solid #e5e7eb' }}>
          <span className="material-symbols-outlined text-gray-300 text-5xl block mb-3">search</span>
          <h3 className="text-[15px] font-bold text-[#031635] mb-2">Search your students</h3>
          <p className="text-[13px] text-gray-500">Type a student name in the search box above to find matching records.</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse" style={{ border: '0.5px solid #e5e7eb' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
                <div className="flex-1">
                  <div className="h-3 bg-gray-100 rounded w-3/4 mb-1.5" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded w-full mb-1.5" />
              <div className="h-2 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && query && students.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => (
            <Link
              key={student.id}
              href={`/students/${student.id}/profile`}
              className="bg-white rounded-xl p-5 hover:shadow-md transition-all block"
              style={{ border: '0.5px solid #e5e7eb' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-[13px] shrink-0"
                  style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
                >
                  {getInitials(student.full_name)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-bold text-[#031635] truncate">{student.full_name}</h3>
                  <p className="text-[11px] text-gray-400 truncate">
                    {student.high_school_name ?? student.email ?? '—'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {student.graduation_year && (
                  <span className="text-[11px] text-gray-500">Class of {student.graduation_year}</span>
                )}
                {student.gpa && (
                  <span className="text-[11px] text-gray-500">GPA {student.gpa}</span>
                )}
                {student.sat_total && (
                  <span className="text-[11px] text-gray-500">SAT {student.sat_total}</span>
                )}
                {student.act_score && (
                  <span className="text-[11px] text-gray-500">ACT {student.act_score}</span>
                )}
              </div>

              {student.status && (
                <div className="mt-3">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: student.status === 'active' ? '#D1FAE5' : '#F3F4F6',
                      color: student.status === 'active' ? '#059669' : '#6B7280',
                    }}
                  >
                    {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* No results */}
      {!loading && query && students.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '0.5px solid #e5e7eb' }}>
          <span className="material-symbols-outlined text-gray-300 text-5xl block mb-3">person_search</span>
          <h3 className="text-[15px] font-bold text-[#031635] mb-2">No students found</h3>
          <p className="text-[13px] text-gray-500 mb-5">
            No students match &ldquo;{query}&rdquo;. Try a different name or check the spelling.
          </p>
          <Link
            href="/students"
            className="h-10 px-6 rounded-xl text-[13px] font-semibold text-white inline-flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>people</span>
            Browse All Students
          </Link>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center gap-3 text-gray-400 py-12 justify-center">
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px' }}>sync</span>
        <span className="text-[14px]">Loading search...</span>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
