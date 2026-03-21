import Link from 'next/link'
import StatusPill from '@/components/ui/StatusPill'
import ExportButtons from '@/components/export/ExportButtons'
import { ArrowLeft, Mail, MessageCircle } from 'lucide-react'

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
    student.graduation_year ? `Class of ${student.graduation_year}` : null,
  ].filter(Boolean)

  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <Link href="/students" className="text-gray-400 hover:text-gray-700 transition">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-semibold text-gray-900">{student.full_name}</h1>
            <StatusPill status={student.status} />
          </div>
          {subParts.length > 0 && (
            <p className="text-[13px] text-gray-500 mt-0.5">{subParts.join(' · ')}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ExportButtons students={[student as any]} singleStudent />
        {student.email && (
          <a
            href={`mailto:${student.email}`}
            className="h-8 px-3 rounded-[6px] text-[12px] text-gray-500 flex items-center gap-2 hover:bg-gray-50 transition"
            style={{ border: '0.5px solid #e5e7eb' }}
          >
            <Mail size={12} />
            Email
          </a>
        )}
        {student.telegram_username && (
          <a
            href={`https://t.me/${student.telegram_username.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 px-3 rounded-[6px] text-[12px] text-gray-500 flex items-center gap-2 hover:bg-gray-50 transition"
            style={{ border: '0.5px solid #e5e7eb' }}
          >
            <MessageCircle size={12} />
            Telegram
          </a>
        )}
        <Link
          href={`/students/${student.id}/edit`}
          className="h-8 px-3 rounded-[6px] text-[12px] text-gray-500 flex items-center gap-2 hover:bg-gray-50 transition"
          style={{ border: '0.5px solid #e5e7eb' }}
        >
          Edit
        </Link>
      </div>
    </div>
  )
}
