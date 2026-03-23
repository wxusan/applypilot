// @ts-nocheck
import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import StudentTabs from '@/components/students/StudentTabs'
import StudentHeader from '@/components/students/StudentHeader'

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

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Academic Standing */}
        <div className="md:col-span-8 bg-surface-container-low rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <span className="material-symbols-outlined text-9xl">school</span>
          </div>
          <div className="flex justify-between items-end mb-8">
            <div>
              <p className="text-[10px] font-extrabold text-primary uppercase tracking-[0.2em] mb-1">Section 01</p>
              <h3 className="text-2xl font-headline font-bold text-primary">Academic Standing</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                Cumulative GPA
              </label>
              <div className="h-14 flex items-center px-4 bg-surface-container-lowest border border-outline-variant/20 rounded-lg">
                <span className={`font-headline font-bold text-lg ${student.gpa ? 'text-primary' : 'text-on-surface-variant/40 italic'}`}>
                  {student.gpa ? `${Number(student.gpa).toFixed(2)} / ${student.gpa_scale ?? '4.0'}` : 'Not set'}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                Graduation Year
              </label>
              <div className="h-14 flex items-center px-4 bg-surface-container-lowest border border-outline-variant/20 rounded-lg">
                <span className={`font-headline font-bold text-lg ${student.graduation_year ? 'text-primary' : 'text-on-surface-variant/40 italic'}`}>
                  {student.graduation_year ? `Class of ${student.graduation_year}` : 'Not set'}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                Intended Major
              </label>
              <div className="h-14 flex items-center px-4 bg-surface-container-lowest border border-outline-variant/20 rounded-lg">
                <span className={student.intended_major ? 'text-on-surface font-medium' : 'text-on-surface-variant/40 italic'}>
                  {student.intended_major ?? 'Not specified'}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                High School
              </label>
              <div className="h-14 flex items-center gap-2 px-4 bg-surface-container-lowest border border-outline-variant/20 rounded-lg">
                {student.high_school_name ? (
                  <>
                    <span className="material-symbols-outlined text-on-surface-variant">apartment</span>
                    <span className="text-on-surface font-medium truncate">{student.high_school_name}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-on-surface-variant/40">apartment</span>
                    <span className="text-on-surface-variant/40 italic">Search for high school...</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Test Scores */}
        <div className="md:col-span-4 bg-primary text-white rounded-2xl p-8 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-primary-fixed uppercase tracking-[0.2em] mb-1">Section 02</p>
            <h3 className="text-2xl font-headline font-bold mb-6">Standardized Testing</h3>
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="font-headline font-semibold">SAT Composite</span>
                <span className={student.sat_total ? 'text-white font-bold text-lg' : 'text-white/40 italic text-sm'}>
                  {student.sat_total ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="font-headline font-semibold">ACT Composite</span>
                <span className={student.act_score ? 'text-white font-bold text-lg' : 'text-white/40 italic text-sm'}>
                  {student.act_score ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="font-headline font-semibold">TOEFL</span>
                <span className={student.toefl_score ? 'text-white font-bold text-lg' : 'text-white/40 italic text-sm'}>
                  {student.toefl_score ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="font-headline font-semibold">IELTS</span>
                <span className={student.ielts_score ? 'text-white font-bold text-lg' : 'text-white/40 italic text-sm'}>
                  {student.ielts_score ?? '—'}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-8 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-primary-fixed">
            <span className="material-symbols-outlined text-base">add_circle</span>
            Add Test Result
          </div>
        </div>

        {/* Personal Details */}
        <div className="md:col-span-4 bg-surface-container-low rounded-2xl p-8">
          <p className="text-[10px] font-extrabold text-primary uppercase tracking-[0.2em] mb-1">Section 03</p>
          <h3 className="text-2xl font-headline font-bold text-primary mb-8">Personal Details</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Legal Name
              </label>
              <p className={`py-1 border-b border-outline-variant/20 ${student.full_name ? 'text-on-surface font-medium' : 'text-on-surface-variant italic'}`}>
                {student.full_name ?? 'Not provided'}
              </p>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Email Address
              </label>
              <p className={`py-1 border-b border-outline-variant/20 ${student.email ? 'text-on-surface font-medium' : 'text-on-surface-variant italic'}`}>
                {student.email ?? 'Not provided'}
              </p>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Nationality
              </label>
              <p className={`py-1 border-b border-outline-variant/20 ${student.nationality ? 'text-on-surface font-medium' : 'text-on-surface-variant italic'}`}>
                {student.nationality ?? 'Not specified'}
              </p>
            </div>
            {student.phone && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  Phone
                </label>
                <p className="py-1 border-b border-outline-variant/20 text-on-surface font-medium">
                  {student.phone}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Parent / Guardian */}
        <div className="md:col-span-4 bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/10">
          <p className="text-[10px] font-extrabold text-primary uppercase tracking-[0.2em] mb-1">Section 04</p>
          <h3 className="text-2xl font-headline font-bold text-primary mb-8">Parent / Guardian</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Name
              </label>
              <p className={`py-1 border-b border-outline-variant/20 ${student.parent_name ? 'text-on-surface font-medium' : 'text-on-surface-variant italic'}`}>
                {student.parent_name ?? 'Not provided'}
              </p>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Email
              </label>
              <p className={`py-1 border-b border-outline-variant/20 ${student.parent_email ? 'text-on-surface font-medium' : 'text-on-surface-variant italic'}`}>
                {student.parent_email ?? 'Not provided'}
              </p>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Phone
              </label>
              <p className={`py-1 border-b border-outline-variant/20 ${student.parent_phone ? 'text-on-surface font-medium' : 'text-on-surface-variant italic'}`}>
                {student.parent_phone ?? 'Not provided'}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="md:col-span-4 bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/10">
          <p className="text-[10px] font-extrabold text-primary uppercase tracking-[0.2em] mb-1">Section 05</p>
          <h3 className="text-2xl font-headline font-bold text-primary mb-6">Notes</h3>
          {student.notes ? (
            <p className="text-on-surface leading-relaxed whitespace-pre-wrap">{student.notes}</p>
          ) : (
            <p className="text-on-surface-variant italic">No notes added yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
