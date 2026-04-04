import Link from 'next/link'
import StudentActions from './StudentActions'
import StatusPill from '@/components/ui/StatusPill'

interface StudentHeaderProps {
  student: {
    id: string
    full_name: string
    preferred_name?: string | null
    email?: string | null
    status: string
    season?: string | null
    graduation_year?: number | null
    gpa?: number | null
    gpa_scale?: string | null
    sat_total?: number | null
    act_score?: number | null
    nationality?: string | null
    high_school_name?: string | null
    intended_major?: string | null
    created_at?: string
    telegram_username?: string | null
    applications?: {
      id: string
      university_name: string
      status: string
      deadline_regular?: string | null
      decision?: string | null
    }[]
  }
}


export default function StudentHeader({ student }: StudentHeaderProps) {
  const subParts = [
    student.nationality,
    student.high_school_name,
  ].filter(Boolean)

  const initials = student.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-6">
        {/* Back */}
        <Link
          href="/students"
          className="p-2 rounded-xl border border-outline-variant hover:border-primary transition-all text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>

        {/* Avatar */}
        <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center text-on-primary-container text-xl font-bold shadow-lg">
          {initials}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-headline font-extrabold text-primary tracking-tight">
              {student.full_name}
            </h2>
            {student.graduation_year && (
              <span className="bg-primary-container text-on-primary-container text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter">
                Class of {student.graduation_year}
              </span>
            )}
          </div>
          {subParts.length > 0 && (
            <p className="text-on-surface-variant flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-sm">location_on</span>
              {subParts.join(' · ')}
            </p>
          )}
          <div className="mt-3 flex gap-4">
            {student.gpa && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-xs">grade</span>
                {Number(student.gpa).toFixed(2)} GPA
              </div>
            )}
            {student.sat_total && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-xs">article</span>
                {student.sat_total} SAT
              </div>
            )}
            {student.act_score && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-xs">article</span>
                ACT {student.act_score}
              </div>
            )}
            <StatusPill status={student.status} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {student.email && (
          <a
            href={`mailto:${student.email}`}
            className="p-2 bg-white rounded-xl border border-outline-variant hover:border-primary transition-all text-on-surface-variant hover:text-primary"
          >
            <span className="material-symbols-outlined">mail</span>
          </a>
        )}
        <StudentActions
          studentId={student.id}
          studentName={student.full_name}
          currentStatus={student.status}
        />
        <Link
          href={`/students/${student.id}/edit`}
          className="flex items-center gap-2 text-white px-6 py-2.5 rounded-xl font-bold text-sm"
          style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
        >
          <span className="material-symbols-outlined text-sm">edit</span>
          Edit Profile
        </Link>
      </div>
    </div>
  )
}
