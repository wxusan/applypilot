import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import StudentTabs from '@/components/students/StudentTabs'
import StudentHeader from '@/components/students/StudentHeader'
import DocumentChecklist from '@/components/documents/DocumentChecklist'
import DocumentUpload from '@/components/documents/DocumentUpload'
import StatusPill from '@/components/ui/StatusPill'
import { formatDate } from '@/lib/utils'
import { FileText, ExternalLink, Trash2 } from 'lucide-react'

const REQUIRED_DOC_TYPES = [
  { type: 'transcript', label: 'Transcript' },
  { type: 'test_score', label: 'Test Score' },
  { type: 'passport', label: 'Passport' },
  { type: 'recommendation_letter', label: 'Recommendation Letter' },
  { type: 'financial_statement', label: 'Financial Statement' },
]

const ALL_DOC_TYPE_LABELS: Record<string, string> = {
  transcript: 'Transcript',
  test_score: 'Test Score',
  passport: 'Passport',
  recommendation_letter: 'Recommendation Letter',
  financial_statement: 'Financial Statement',
  essay: 'Essay',
  cv: 'CV / Resume',
  other: 'Other',
}

export default async function StudentDocumentsPage({
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

  const [{ data: student }, { data: documents }] = await Promise.all([
    supabase
      .from('students')
      .select('id, full_name, status, nationality, high_school_name, graduation_year, email, telegram_username')
      .eq('id', params.id)
      .eq('agency_id', member.agency_id)
      .single(),
    supabase
      .from('documents')
      .select('*')
      .eq('student_id', params.id)
      .eq('agency_id', member.agency_id)
      .order('created_at', { ascending: false }),
  ])

  if (!student) notFound()

  // Build checklist
  const docsByType: Record<string, typeof documents> = {}
  for (const doc of documents ?? []) {
    if (!docsByType[doc.doc_type]) docsByType[doc.doc_type] = []
    docsByType[doc.doc_type]!.push(doc)
  }

  const checklistItems = REQUIRED_DOC_TYPES.map((item) => ({
    type: item.type,
    label: item.label,
    required: true,
    uploaded: (docsByType[item.type]?.length ?? 0) > 0,
    documents: (docsByType[item.type] ?? []).map((d) => ({
      id: d.id,
      file_name: d.file_name,
      storage_url: d.storage_url,
      status: d.status,
      created_at: d.created_at,
    })),
  }))

  // Add any extra non-required types that have been uploaded
  const requiredKeys = new Set(REQUIRED_DOC_TYPES.map((r) => r.type))
  for (const [type, docs] of Object.entries(docsByType)) {
    if (!requiredKeys.has(type)) {
      checklistItems.push({
        type,
        label: ALL_DOC_TYPE_LABELS[type] ?? type,
        required: false,
        uploaded: true,
        documents: docs!.map((d) => ({
          id: d.id,
          file_name: d.file_name,
          storage_url: d.storage_url,
          status: d.status,
          created_at: d.created_at,
        })),
      })
    }
  }

  const uploadedCount = checklistItems.filter((i) => i.uploaded).length
  const requiredTotal = REQUIRED_DOC_TYPES.length

  return (
    <div className="space-y-5">
      <StudentHeader student={student} />
      <StudentTabs studentId={params.id} active="documents" />

      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gray-500">
          {documents?.length ?? 0} document{(documents?.length ?? 0) !== 1 ? 's' : ''} ·{' '}
          {checklistItems.filter((i) => i.required && i.uploaded).length}/{requiredTotal} required uploaded
        </p>
        <DocumentUpload studentId={params.id} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Checklist */}
        <div className="col-span-1">
          <DocumentChecklist items={checklistItems} />
        </div>

        {/* All documents table */}
        <div className="col-span-2">
          <div className="bg-white rounded-[10px] overflow-hidden" style={{ border: '0.5px solid #e5e7eb' }}>
            <div className="px-5 py-3" style={{ borderBottom: '0.5px solid #e5e7eb' }}>
              <p className="text-[12px] font-medium text-gray-500 uppercase tracking-[0.5px]">
                All Documents
              </p>
            </div>

            {!documents || documents.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-[13px] text-gray-400">No documents uploaded yet.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '0.5px solid #e5e7eb' }}>
                    {['File', 'Type', 'Status', 'Uploaded'].map((col) => (
                      <th
                        key={col}
                        className="text-left px-5 py-2 text-[11px] font-medium text-gray-400 uppercase tracking-[0.5px]"
                      >
                        {col}
                      </th>
                    ))}
                    <th className="px-5 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc, i) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-gray-50 transition-colors"
                      style={i < documents.length - 1 ? { borderBottom: '0.5px solid #f3f4f6' } : undefined}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <FileText size={13} className="text-gray-300 shrink-0" />
                          {doc.storage_url ? (
                            <a
                              href={doc.storage_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[13px] text-[#185FA5] hover:underline flex items-center gap-1 truncate max-w-[200px]"
                            >
                              {doc.file_name}
                              <ExternalLink size={10} />
                            </a>
                          ) : (
                            <span className="text-[13px] text-gray-700 truncate max-w-[200px]">
                              {doc.file_name}
                            </span>
                          )}
                        </div>
                        {doc.file_size_bytes && (
                          <p className="text-[10px] text-gray-400 ml-5">
                            {(doc.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-[12px] text-gray-500 capitalize">
                        {ALL_DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill status={doc.status} />
                      </td>
                      <td className="px-5 py-3 text-[12px] text-gray-400">
                        {formatDate(doc.created_at)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {/* Delete is handled via API — link to a client action */}
                        <span className="text-[11px] text-gray-300 cursor-not-allowed" title="Delete via admin">
                          <Trash2 size={13} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
