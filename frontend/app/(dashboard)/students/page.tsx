import { createServerClient } from '@/lib/supabase-server'
import Link from 'next/link'
import StatusPill from '@/components/ui/StatusPill'

const STATUS_OPTIONS = [
  'intake', 'forms', 'writing', 'review',
  'submitted', 'accepted', 'rejected', 'archived',
]

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; season?: string }
}) {
  const anonClient = createServerClient()
  const { data: { session } } = await anonClient.auth.getSession()

  const { createServiceClient } = await import('@/lib/supabase-server')
  const supabase = createServiceClient()

  const { q, status, season } = searchParams

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
       nationality, high_school_name, intended_major, created_at,
       applications(id, university_name, status, deadline_regular)`,
      { count: 'exact' }
    )
    .eq('agency_id', agencyId)
    .order('updated_at', { ascending: false })

  if (q) query = query.ilike('full_name', `%${q}%`)
  if (status) {
    // Explicit filter — show exactly that status (including archived)
    query = query.eq('status', status)
  } else {
    // Default: hide archived students from the active roster
    query = query.neq('status', 'archived')
  }
  if (season) query = query.eq('season', season)

  const { data, count } = await query
  const students = data as any[] | null

  const isEmpty = !students || students.length === 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-headline font-extrabold tracking-tighter text-primary mb-2">
            Student Roster
          </h1>
          <p className="text-on-surface-variant font-medium">
            {status === 'archived'
              ? `${count ?? 0} archived student${(count ?? 0) !== 1 ? 's' : ''}`
              : `Managing ${count ?? 0} active applicant${(count ?? 0) !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/students/import"
            className="flex items-center gap-2 px-4 py-2.5 text-primary text-sm font-semibold rounded-xl border border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-bright transition-colors"
          >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            Import CSV
          </Link>
          <Link
            href="/students/form-upload"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border hover:bg-gray-50 transition-colors"
            style={{ color: '#1D9E75', borderColor: '#1D9E75' }}
          >
            <span className="material-symbols-outlined text-sm">description</span>
            Upload Intake Form
          </Link>
          <Link
            href="/students/new"
            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-xl shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Student
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 bg-surface-container-low p-2 rounded-2xl flex flex-wrap gap-2">
          <Link
            href={q ? `/students?q=${q}` : '/students'}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
              !status ? 'bg-primary text-white shadow-md' : 'bg-white text-on-surface-variant hover:bg-white/80'
            }`}
          >
            All Students
          </Link>
          {STATUS_OPTIONS.map((s) => (
            s === 'archived' ? (
              // Archived tab gets a subtle separator and dimmed style
              <span key="archived-group" className="flex items-center gap-2">
                <span className="w-px h-5 bg-outline-variant/30 mx-1" />
                <Link
                  href={q ? `/students?status=archived&q=${q}` : '/students?status=archived'}
                  className={`px-4 py-2 text-xs font-bold rounded-xl capitalize transition-colors ${
                    status === 'archived'
                      ? 'bg-gray-500 text-white shadow-md'
                      : 'bg-white text-gray-400 hover:bg-white/80'
                  }`}
                >
                  📦 Archived
                </Link>
              </span>
            ) : (
              <Link
                key={s}
                href={q ? `/students?status=${s}&q=${q}` : `/students?status=${s}`}
                className={`px-4 py-2 text-xs font-bold rounded-xl capitalize transition-colors ${
                  status === s ? 'bg-primary text-white shadow-md' : 'bg-white text-on-surface-variant hover:bg-white/80'
                }`}
              >
                {s}
              </Link>
            )
          ))}
        </div>
        <div className="bg-surface-container-low p-2 rounded-2xl flex items-center gap-3">
          <form method="GET" className="flex items-center gap-2 w-full px-2">
            {status && <input type="hidden" name="status" value={status} />}
            {season && <input type="hidden" name="season" value={season} />}
            <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search students..."
              className="bg-transparent border-none text-sm text-on-surface focus:ring-0 focus:outline-none w-full placeholder:text-on-surface-variant/50"
            />
          </form>
        </div>
      </div>

      {/* Empty State */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center px-12 py-24">
          <div className="relative w-full max-w-4xl flex flex-col items-center">
            <div className="absolute -z-10 top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary-fixed/30 rounded-full blur-[100px] opacity-40" />
            <div className="text-center max-w-xl mx-auto">
              <span className="inline-block px-3 py-1 bg-primary-fixed text-on-primary-fixed font-label text-[10px] font-bold tracking-widest uppercase rounded-full mb-6">
                Welcome to ApplyPilot
              </span>
              <h1 className="text-4xl font-headline font-bold text-primary tracking-tight mb-4">
                Your workspace is ready for its first architect.
              </h1>
              <p className="text-on-surface-variant font-body leading-relaxed mb-10 text-lg">
                {q || status
                  ? 'No students match your current filters.'
                  : 'Start your agency journey by building your student roster. Once added, you can begin tracking applications, managing documents, and using Pilot AI to optimize their academic trajectories.'}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/students/new"
                  className="px-8 py-4 text-white font-bold rounded-xl shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center gap-3"
                  style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
                >
                  <span className="material-symbols-outlined">add</span>
                  Add Your First Student
                </Link>
                <button className="px-8 py-4 bg-white border border-outline-variant text-primary font-bold rounded-xl hover:bg-surface-container-low transition-all flex items-center gap-3 group">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">file_upload</span>
                  Bulk Import Students
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Student Table */
        <div className="bg-surface-container-lowest rounded-[2rem] shadow-sm overflow-hidden border border-outline-variant/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50 border-b border-outline-variant/10">
                  <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Name</th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Status</th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant text-center">GPA</th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant text-center">SAT / ACT</th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Universities</th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Next Deadline</th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Added</th>
                  <th className="px-6 py-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {students.map((student) => {
                  type App = { id: string; university_name: string; status: string; deadline_regular: string | null }
                  const apps = (student.applications as App[]) ?? []
                  const nextDeadline = apps
                    .map((a) => a.deadline_regular)
                    .filter(Boolean)
                    .sort()
                    .at(0)

                  const isUrgent = nextDeadline
                    ? new Date(nextDeadline).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
                    : false

                  const addedDate = new Date(student.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })

                  const deadlineDisplay = nextDeadline
                    ? new Date(nextDeadline).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })
                    : null

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-surface-container-low/30 transition-colors group"
                    >
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container text-sm font-bold flex-shrink-0">
                            {getInitials(student.full_name)}
                          </div>
                          <div className="flex flex-col">
                            <Link
                              href={`/students/${student.id}/profile`}
                              className="text-sm font-bold text-primary hover:text-primary-container transition-colors"
                            >
                              {student.full_name}
                            </Link>
                            {student.email && (
                              <span className="text-[11px] text-on-surface-variant">
                                {student.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <StatusPill status={student.status} />
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-semibold text-primary">
                          {student.gpa ? Number(student.gpa).toFixed(2) : '—'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-semibold text-primary">
                          {student.sat_total
                            ? student.act_score
                              ? `${student.sat_total} / ${student.act_score}`
                              : student.sat_total.toString()
                            : student.act_score
                            ? `ACT ${student.act_score}`
                            : '—'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 flex-wrap">
                          {apps.slice(0, 2).map((app) => (
                            <span
                              key={app.id}
                              className="text-[11px] text-on-surface-variant rounded-lg px-2 py-0.5 bg-surface-container border border-outline-variant/20 whitespace-nowrap"
                            >
                              {app.university_name}
                            </span>
                          ))}
                          {apps.length > 2 && (
                            <span className="text-[11px] text-on-surface-variant/60">
                              +{apps.length - 2}
                            </span>
                          )}
                          {apps.length === 0 && <span className="text-sm text-on-surface-variant/50">—</span>}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {deadlineDisplay ? (
                          <div className="flex flex-col">
                            <span className={`text-sm font-bold ${isUrgent ? 'text-error' : 'text-primary'}`}>
                              {deadlineDisplay}
                            </span>
                            {isUrgent && (
                              <span className="text-[10px] font-medium text-error/80">Urgent</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-on-surface-variant/50">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm text-on-surface-variant">{addedDate}</span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/students/${student.id}/profile`}
                          className="p-2 text-on-surface-variant hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-xl">more_vert</span>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
