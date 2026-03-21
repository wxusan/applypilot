// @ts-nocheck
import { createServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import StudentHeader from '@/components/students/StudentHeader'
import StudentEditForm from '@/components/students/StudentEditForm'

export default async function StudentEditPage({
  params,
}: {
  params: { id: string }
}) {
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
    .select('*')
    .eq('id', params.id)
    .eq('agency_id', member.agency_id)
    .single()

  if (error || !student) notFound()

  return (
    <div className="space-y-5">
      <StudentHeader student={student} />

      <div className="bg-white rounded-[10px] p-6" style={{ border: '0.5px solid #e5e7eb' }}>
        <h2 className="text-[15px] font-semibold text-gray-900 mb-5">Edit Student</h2>
        <StudentEditForm student={student} />
      </div>
    </div>
  )
}
