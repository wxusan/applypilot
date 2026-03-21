// @ts-nocheck
import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import StudentTabs from '@/components/students/StudentTabs'
import StudentHeader from '@/components/students/StudentHeader'
import StatusPill from '@/components/ui/StatusPill'
import { formatDate } from '@/lib/utils'
import { Mail, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  admission_decision: { bg: '#EAF3DE', color: '#3B6D11' },
  interview_invite: { bg: '#E6F1FB', color: '#185FA5' },
  financial_aid: { bg: '#FAEEDA', color: '#854F0B' },
  document_request: { bg: '#FBEAF0', color: '#993556' },
  general: { bg: '#F3F4F6', color: '#6B7280' },
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

  const unreadCount = (emails ?? []).filter((e) => !e.is_read && e.direction === 'inbound').length

  return (
    <div className="space-y-5">
      <StudentHeader student={student} />
      <StudentTabs studentId={params.id} active="emails" />

      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gray-500">
          {emails?.length ?? 0} email{(emails?.length ?? 0) !== 1 ? 's' : ''}
          {unreadCount > 0 && (
            <span className="ml-2 text-[11px] font-medium px-1.5 py-0.5 rounded-[4px]"
              style={{ backgroundColor: '#E6F1FB', color: '#185FA5' }}>
              {unreadCount} unread
            </span>
          )}
        </p>
      </div>

      {!emails || emails.length === 0 ? (
        <div
          className="bg-white rounded-[10px] p-10 text-center"
          style={{ border: '0.5px solid #e5e7eb' }}
        >
          <Mail size={24} className="mx-auto text-gray-200 mb-3" />
          <p className="text-[13px] text-gray-400">No emails synced yet.</p>
          <p className="text-[12px] text-gray-400 mt-1">
            Connect a student email account to start syncing.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[10px] overflow-hidden" style={{ border: '0.5px solid #e5e7eb' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '0.5px solid #e5e7eb' }}>
                {['', 'From / To', 'Subject', 'University', 'Category', 'Date'].map((col) => (
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
              {emails.map((email, i) => {
                const catStyle = CATEGORY_COLORS[email.category] ?? CATEGORY_COLORS.general
                const isUnread = !email.is_read && email.direction === 'inbound'
                return (
                  <tr
                    key={email.id}
                    className="hover:bg-gray-50 transition-colors"
                    style={i < emails.length - 1 ? { borderBottom: '0.5px solid #f3f4f6' } : undefined}
                  >
                    <td className="pl-5 pr-2 py-3 w-6">
                      {email.direction === 'inbound' ? (
                        <ArrowDownLeft size={13} className="text-[#185FA5]" />
                      ) : (
                        <ArrowUpRight size={13} className="text-gray-400" />
                      )}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-gray-600 max-w-[160px]">
                      <p className={`truncate ${isUnread ? 'font-semibold text-gray-900' : ''}`}>
                        {email.direction === 'inbound' ? email.from_address : email.to_address}
                      </p>
                    </td>
                    <td className="px-3 py-3 max-w-[280px]">
                      <p className={`text-[13px] truncate ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {email.subject || '(no subject)'}
                      </p>
                      {email.body_plain && (
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                          {email.body_plain.slice(0, 80)}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-gray-500">
                      {email.university_name ?? '—'}
                    </td>
                    <td className="px-3 py-3">
                      {email.category ? (
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-[3px] whitespace-nowrap"
                          style={{ backgroundColor: catStyle.bg, color: catStyle.color }}
                        >
                          {email.category.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span className="text-[12px] text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[12px] text-gray-400 whitespace-nowrap">
                      {email.received_at ? formatDate(email.received_at) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
