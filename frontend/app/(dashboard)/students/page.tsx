// @ts-nocheck
import { createServerClient } from '@/lib/supabase-server'
import Link from 'next/link'
import StatusPill from '@/components/ui/StatusPill'
import CopyButton from '@/components/ui/CopyButton'
import { formatDate, deadlineClass, formatDateMono, formatDistanceToNow } from '@/lib/utils'
import { Plus } from 'lucide-react'
import ExportButtons from '@/components/export/ExportButtons'

const STATUS_OPTIONS = [
  'intake', 'forms', 'writing', 'review',
  'submitted', 'accepted', 'rejected',
]

const PAGE_SIZE = 20

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; season?: string; page?: string }
}) {
  const anonClient = createServerClient()
  const { data: { session } } = await anonClient.auth.getSession()

  const { createServiceClient } = await import('@/lib/supabase-server')
  const supabase = createServiceClient()

  const { q, status, season } = searchParams
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  // Resolve agency_id for this user
  const { data: member } = await supabase
    .from('agency_members')
    .select('agency_id')
    .eq('user_id', session!.user.id)
    .eq('is_active', true)
    .single()
  const agencyId = member?.agency_id as string

  let query = supabase
    .from('students')
    .select(
      `id, full_name, preferred_name, email, status, season,
       graduation_year, gpa, gpa_scale, sat_total, act_score,
       nationality, high_school_name, intended_major, created_at, updated_at,
       applications(id, university_name, status, deadline_regular)`,
      { count: 'exact' }
    )
    .eq('agency_id', agencyId)
    .order('updated_at', { ascending: false })

  if (q) query = query.ilike('full_name', `%${q}%`)
  if (status) query = query.eq('status', status)
  if (season) query = query.eq('season', season)

  const { data, count } = await query.range(offset, offset + PAGE_SIZE - 1)
  const students = data as any[] | null
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900">Students</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            {count ?? 0} student{count !== 1 ? 's' : ''} in your agency
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons students={students ?? []} />
          <Link
            href="/students/new"
            className="h-9 px-4 rounded-[6px] text-[13px] font-medium text-white flex items-center gap-2 transition hover:opacity-90"
            style={{ backgroundColor: '#1D9E75' }}
          >
            <Plus size={14} />
            Add Student
          </Link>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <form method="GET" className="flex-1 min-w-[200px] max-w-xs">
          {status && <input type="hidden" name="status" value={status} />}
          {season && <input type="hidden" name="season" value={season} />}
          <div className="relative">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search by name…"
              className="w-full h-8 pl-8 pr-3 text-[13px] rounded-[6px] bg-white focus:outline-none focus:ring-1 focus:ring-brand"
              style={{ border: '0.5px solid #d1d5db' }}
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              width="12" height="12" viewBox="0 0 16 16" fill="none"
            >
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </form>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Link
            href={q ? `/students?q=${q}` : '/students'}
            className="h-7 px-3 rounded-[6px] text-[12px] transition"
            style={
              !status
                ? { backgroundColor: '#E1F5EE', color: '#0F6E56', fontWeight: 500 }
                : { border: '0.5px solid #e5e7eb', color: '#6B7280' }
            }
          >
            All
          </Link>
          {STATUS_OPTIONS.map((s) => (
            <Link
              key={s}
              href={q ? `/students?status=${s}&q=${q}` : `/students?status=${s}`}
              className="h-7 px-3 rounded-[6px] text-[12px] capitalize transition"
              style={
                status === s
                  ? { backgroundColor: '#E1F5EE', color: '#0F6E56', fontWeight: 500 }
                  : { border: '0.5px solid #e5e7eb', color: '#6B7280' }
              }
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-[10px] overflow-x-auto" style={{ border: '0.5px solid #e5e7eb' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '0.5px solid #e5e7eb' }}>
              {['Name', 'Status', 'Class', 'GPA', 'SAT / ACT', 'Universities', 'Next Deadline', 'Updated'].map(
                (col) => (
                  <th
                    key={col}
                    className="text-left px-5 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-[0.5px]"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {!students || students.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-[13px] text-gray-400">
                  {q || status ? (
                    'No students match your filters.'
                  ) : (
                    <>
                      No students yet.{' '}
                      <Link href="/students/new" className="text-brand hover:underline">
                        Add your first student.
                      </Link>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              students.map((student, i) => {
                type App = { id: string; university_name: string; status: string; deadline_regular: string | null }
                const apps = (student.applications as App[]) ?? []
                const nextDeadline = apps
                  .map((a) => a.deadline_regular)
                  .filter(Boolean)
                  .sort()
                  .at(0)

                return (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50 transition-colors"
                    style={i < students.length - 1 ? { borderBottom: '0.5px solid #e5e7eb' } : undefined}
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/students/${student.id}/profile`}
                        className="text-[13px] font-medium text-gray-900 hover:text-brand-dark transition-colors"
                      >
                        {student.full_name}
                      </Link>
                      {student.email && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <p className="text-[11px] text-gray-400 truncate max-w-[160px]">
                            {student.email}
                          </p>
                          <CopyButton text={student.email} label="email" />
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3">
                      <StatusPill status={student.status} />
                    </td>

                    <td className="px-5 py-3 text-[13px] text-gray-600 font-mono">
                      {student.graduation_year ?? '—'}
                    </td>

                    <td className="px-5 py-3 text-[13px] text-gray-600 font-mono">
                      {student.gpa ? Number(student.gpa).toFixed(2) : '—'}
                    </td>

                    <td className="px-5 py-3 text-[13px] text-gray-600 font-mono">
                      {student.sat_total
                        ? student.sat_total
                        : student.act_score
                        ? `ACT ${student.act_score}`
                        : '—'}
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {apps.slice(0, 2).map((app) => (
                          <span
                            key={app.id}
                            className="text-[11px] text-gray-500 rounded-[4px] px-1.5 py-0.5 bg-gray-50 whitespace-nowrap"
                            style={{ border: '0.5px solid #e5e7eb' }}
                          >
                            {app.university_name}
                          </span>
                        ))}
                        {apps.length > 2 && (
                          <span className="text-[11px] text-gray-400">+{apps.length - 2}</span>
                        )}
                        {apps.length === 0 && <span className="text-[13px] text-gray-400">—</span>}
                      </div>
                    </td>

                    <td className="px-5 py-3">
                      <span className={deadlineClass(nextDeadline)}>
                        {nextDeadline ? formatDateMono(nextDeadline) : '—'}
                      </span>
                    </td>

                    <td className="px-5 py-3 text-[12px] text-gray-400">
                      <span title={formatDate(student.updated_at || student.created_at)}>
                        {formatDistanceToNow(new Date(student.updated_at || student.created_at))} ago
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-gray-500">
            Page {page} of {totalPages} · {count} students
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`/students?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), ...(season ? { season } : {}), page: String(page - 1) })}`}
                className="h-8 px-3 rounded-[6px] text-[12px] font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                style={{ border: '0.5px solid #e5e7eb' }}
              >
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/students?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), ...(season ? { season } : {}), page: String(page + 1) })}`}
                className="h-8 px-3 rounded-[6px] text-[12px] font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                style={{ border: '0.5px solid #e5e7eb' }}
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
