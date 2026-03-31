// @ts-nocheck
import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import StudentTabs from '@/components/students/StudentTabs'
import StudentHeader from '@/components/students/StudentHeader'
import ChatPanel from '@/components/students/ChatPanel'
import StudentDossier from '@/components/students/StudentDossier'

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
    <div>
      <StudentHeader student={student} />
      <StudentTabs studentId={params.id} active="profile" />
      <ChatPanel studentId={params.id} studentName={student.full_name || undefined} />
      <StudentDossier student={student} />
    </div>
  )
}
