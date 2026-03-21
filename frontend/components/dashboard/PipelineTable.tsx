import Link from 'next/link'
import StatusPill from '@/components/ui/StatusPill'
import { deadlineClass, formatDateMono } from '@/lib/utils'

interface Application {
  id: string
  university_name: string
  status: string
  deadline_regular: string | null
}

interface Student {
  id: string
  full_name: string
  status: string
  season: string | null
  applications: Application[]
}

export default function PipelineTable({ students }: { students: Student[] }) {
  return (
    <div className="bg-white rounded-[10px]" style={{ border: '0.5px solid #e5e7eb' }}>
      <div className="px-5 py-3.5" style={{ borderBottom: '0.5px solid #e5e7eb' }}>
        <h2 className="text-[15px] font-semibold text-gray-900">Pipeline</h2>
      </div>

      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '0.5px solid #e5e7eb' }}>
            {['Student', 'Universities', 'Status', 'Next Deadline', 'Season'].map((col) => (
              <th
                key={col}
                className="text-left px-5 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-[0.5px]"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-5 py-6 text-center text-[13px] text-gray-400">
                No students yet. Add your first student to get started.
              </td>
            </tr>
          ) : (
            students.map((student, i) => {
              const nextDeadline = student.applications
                .map((a) => a.deadline_regular)
                .filter(Boolean)
                .sort()
                .at(0)

              return (
                <tr
                  key={student.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  style={
                    i < students.length - 1 ? { borderBottom: '0.5px solid #e5e7eb' } : undefined
                  }
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/students/${student.id}/profile`}
                      className="text-[13px] font-medium text-gray-900 hover:text-brand-dark transition-colors"
                    >
                      {student.full_name}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {student.applications.slice(0, 3).map((app) => (
                        <span
                          key={app.id}
                          className="text-[11px] text-gray-500 bg-gray-50 rounded-[4px] px-1.5 py-0.5"
                          style={{ border: '0.5px solid #e5e7eb' }}
                        >
                          {app.university_name}
                        </span>
                      ))}
                      {student.applications.length > 3 && (
                        <span className="text-[11px] text-gray-400">
                          +{student.applications.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill status={student.status} />
                  </td>
                  <td className="px-5 py-3">
                    <span className={deadlineClass(nextDeadline)}>
                      {nextDeadline ? formatDateMono(nextDeadline) : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-gray-500 font-mono">
                    {student.season ?? '—'}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
