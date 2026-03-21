import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import StudentTabs from '@/components/students/StudentTabs'
import StudentHeader from '@/components/students/StudentHeader'
import { formatDate } from '@/lib/utils'

export default async function StudentProfilePage({ params }: { params: { id: string } }) {
  const anonClient = createServerClient()
  const { data: { session } } = await anonClient.auth.getSession()
  if (!session) notFound()

  const supabase = createServiceClient()

  const { data: member } = await supabase
    .from('agency_members')
    .select('agency_id')
    .eq('user_id', session.user.id)
    .single()
  if (!member) notFound()

  const { data: student, error } = await supabase
    .from('students')
    .select('*, applications(id, university_name, status, deadline_regular, decision)')
    .eq('id', params.id)
    .eq('agency_id', member.agency_id)
    .single()

  if (error || !student) notFound()

  return (
    <div className="space-y-5">
      <StudentHeader student={student} />
      <StudentTabs studentId={params.id} active="profile" />

      {/* Profile sections */}
      <div className="grid grid-cols-3 gap-4">
        {/* Personal Info */}
        <div className="bg-white rounded-[10px] p-5" style={{ border: '0.5px solid #e5e7eb' }}>
          <h3 className="text-[13px] font-semibold text-gray-700 mb-3">Personal</h3>
          <dl className="space-y-2">
            <ProfileRow label="Email" value={student.email} />
            <ProfileRow label="Phone" value={student.phone} />
            <ProfileRow label="DOB" value={formatDate(student.date_of_birth)} />
            <ProfileRow label="Nationality" value={student.nationality} />
            <ProfileRow label="Telegram" value={student.telegram_username} />
          </dl>
        </div>

        {/* Academic */}
        <div className="bg-white rounded-[10px] p-5" style={{ border: '0.5px solid #e5e7eb' }}>
          <h3 className="text-[13px] font-semibold text-gray-700 mb-3">Academic</h3>
          <dl className="space-y-2">
            <ProfileRow label="High School" value={student.high_school_name} />
            <ProfileRow label="Country" value={student.high_school_country} />
            <ProfileRow label="Grad Year" value={student.graduation_year?.toString()} />
            <ProfileRow label="GPA" value={student.gpa ? `${student.gpa} / ${student.gpa_scale}` : null} mono />
            <ProfileRow label="Major" value={student.intended_major} />
          </dl>
        </div>

        {/* Test Scores */}
        <div className="bg-white rounded-[10px] p-5" style={{ border: '0.5px solid #e5e7eb' }}>
          <h3 className="text-[13px] font-semibold text-gray-700 mb-3">Test Scores</h3>
          <dl className="space-y-2">
            <ProfileRow label="SAT" value={student.sat_total?.toString()} mono />
            <ProfileRow label="SAT Math" value={student.sat_math?.toString()} mono />
            <ProfileRow label="SAT Reading" value={student.sat_reading?.toString()} mono />
            <ProfileRow label="ACT" value={student.act_score?.toString()} mono />
            <ProfileRow label="TOEFL" value={student.toefl_score?.toString()} mono />
            <ProfileRow label="IELTS" value={student.ielts_score?.toString()} mono />
          </dl>
        </div>
      </div>

      {/* Parent Info */}
      {(student.parent_name || student.parent_email || student.parent_phone) && (
        <div className="bg-white rounded-[10px] p-5" style={{ border: '0.5px solid #e5e7eb' }}>
          <h3 className="text-[13px] font-semibold text-gray-700 mb-3">Parent / Guardian</h3>
          <div className="flex items-center gap-8">
            <ProfileRow label="Name" value={student.parent_name} />
            <ProfileRow label="Email" value={student.parent_email} />
            <ProfileRow label="Phone" value={student.parent_phone} />
          </div>
        </div>
      )}

      {/* Notes */}
      {student.notes && (
        <div className="bg-white rounded-[10px] p-5" style={{ border: '0.5px solid #e5e7eb' }}>
          <h3 className="text-[13px] font-semibold text-gray-700 mb-2">Notes</h3>
          <p className="text-[13px] text-gray-600 whitespace-pre-wrap">{student.notes}</p>
        </div>
      )}
    </div>
  )
}

function ProfileRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string | null | undefined
  mono?: boolean
}) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.5px] shrink-0 w-20">
        {label}
      </dt>
      <dd className={`text-[13px] text-gray-700 ${mono ? 'font-mono' : ''}`}>
        {value ?? '—'}
      </dd>
    </div>
  )
}
