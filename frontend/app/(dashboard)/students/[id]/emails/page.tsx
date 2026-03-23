// @ts-nocheck
import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import StudentTabs from '@/components/students/StudentTabs'
import StudentHeader from '@/components/students/StudentHeader'
import { formatDate } from '@/lib/utils'

const CATEGORY_STYLES: Record<string, string> = {
  admission_decision: 'bg-emerald-100 text-emerald-700',
  interview_invite: 'bg-secondary-container text-secondary',
  financial_aid: 'bg-amber-100 text-amber-700',
  document_request: 'bg-pink-100 text-pink-700',
  general: 'bg-surface-container text-on-surface-variant',
}

export default async function StudentEmailsPage({
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

  const [{ data: student }, { data: emails }] = await Promise.all([
    supabase
      .from('students')
      .select('id, full_name, status, nationality, high_school_name, graduation_year, email, telegram_username')
      .eq('id', params.id)
      .eq('agency_id', member.agency_id)
      .single(),
    supabase
      .from('emails')
      .select(
        'id, direction, from_address, to_address, subject, received_at, ' +
        'category, university_name, importance, is_read, draft_status, body_plain'
      )
      .eq('student_id', params.id)
      .eq('agency_id', member.agency_id)
      .order('received_at', { ascending: false })
      .limit(100),
  ])

  if (!student) notFound()

  const totalEmails = emails?.length ?? 0
  const unreadCount = (emails ?? []).filter((e) => !e.is_read && e.direction === 'inbound').length

  return (
    <div className="space-y-6">
      <StudentHeader student={student} />
      <StudentTabs studentId={params.id} active="emails" />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-on-surface-variant">
            <span className="font-bold text-primary">{totalEmails}</span>{' '}
            email{totalEmails !== 1 ? 's' : ''}
          </p>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-secondary-container text-secondary uppercase tracking-tighter">
              {unreadCount} unread
            </span>
          )}
        </div>
      </div>

      {totalEmails === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-16 text-center border border-outline-variant/10">
          <div className="w-16 h-16 bg-surface-container rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-on-surface-variant/40 text-3xl">mail</span>
          </div>
          <h3 className="font-headline font-bold text-xl text-primary mb-2">No Emails Synced</h3>
          <p className="text-on-surface-variant">Connect a student email account to start syncing messages.</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="px-6 py-4 border-b border-outline-variant/10 bg-surface-container-low/30 flex items-center gap-4">
            <h3 className="font-headline font-bold text-primary">Email History</h3>
            <div className="h-4 w-px bg-outline-variant/30" />
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              {totalEmails} Messages
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/30">
                  <th className="px-6 py-3 text-[10px] font-extrabold text-on-surface-variant/60 uppercase tracking-widest w-8"></th>
                  <th className="px-6 py-3 text-[10px] font-extrabold text-on-surface-variant/60 uppercase tracking-widest">From / To</th>
                  <th className="px-6 py-3 text-[10px] font-extrabold text-on-surface-variant/60 uppercase tracking-widest">Subject</th>
                  <th className="px-6 py-3 text-[10px] font-extrabold text-on-surface-variant/60 uppercase tracking-widest">University</th>
                  <th className="px-6 py-3 text-[10px] font-extrabold text-on-surface-variant/60 uppercase tracking-widest">Category</th>
                  <th className="px-6 py-3 text-[10px] font-extrabold text-on-surface-variant/60 uppercase tracking-widest">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {emails!.map((email) => {
                  const catClass = CATEGORY_STYLES[email.category] ?? CATEGORY_STYLES.general
                  const isUnread = !email.is_read && email.direction === 'inbound'
                  return (
                    <tr key={email.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="pl-6 pr-3 py-4 w-8">
                        <span
                          className={`material-symbols-outlined text-lg ${email.direction === 'inbound' ? 'text-secondary' : 'text-on-surface-variant/40'}`}
                        >
                          {email.direction === 'inbound' ? 'call_received' : 'call_made'}
                        </span>
                      </td>
                      <td className="px-3 py-4 max-w-[160px]">
                        <p className={`text-xs truncate ${isUnread ? 'font-bold text-on-surface' : 'text-on-surface-variant'}`}>
                          {email.direction === 'inbound' ? email.from_address : email.to_address}
                        </p>
                      </td>
                      <td className="px-3 py-4 max-w-[280px]">
                        <p className={`text-sm truncate ${isUnread ? 'font-bold text-on-surface' : 'font-medium text-on-surface'}`}>
                          {email.subject || '(no subject)'}
                        </p>
                        {email.body_plain && (
                          <p className="text-xs text-on-surface-variant/60 truncate mt-0.5">
                            {email.body_plain.slice(0, 80)}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-4 text-xs text-on-surface-variant">
                        {email.university_name ?? '—'}
                      </td>
                      <td className="px-3 py-4">
                        {email.category ? (
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-tighter whitespace-nowrap ${catClass}`}>
                            {email.category.replace(/_/g, ' ')}
                          </span>
                        ) : (
                          <span className="text-xs text-on-surface-variant/40">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant whitespace-nowrap">
                        {email.received_at ? formatDate(email.received_at) : '—'}
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
