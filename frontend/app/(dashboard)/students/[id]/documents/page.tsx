// @ts-nocheck
import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import StudentTabs from '@/components/students/StudentTabs'
import StudentHeader from '@/components/students/StudentHeader'
import DocumentChecklist from '@/components/documents/DocumentChecklist'
import DocumentUpload from '@/components/documents/DocumentUpload'
import StatusPill from '@/components/ui/StatusPill'
import { formatDate } from '@/lib/utils'

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

const DOC_TYPE_ICONS: Record<string, { icon: string; bg: string; color: string }> = {
  transcript: { icon: 'description', bg: 'bg-blue-50', color: 'text-blue-600' },
  test_score: { icon: 'quiz', bg: 'bg-purple-50', color: 'text-purple-600' },
  passport: { icon: 'badge', bg: 'bg-amber-50', color: 'text-amber-600' },
  recommendation_letter: { icon: 'recommend', bg: 'bg-emerald-50', color: 'text-emerald-600' },
  financial_statement: { icon: 'attach_money', bg: 'bg-green-50', color: 'text-green-600' },
  essay: { icon: 'history_edu', bg: 'bg-indigo-50', color: 'text-indigo-600' },
  cv: { icon: 'work', bg: 'bg-cyan-50', color: 'text-cyan-600' },
  other: { icon: 'folder', bg: 'bg-surface-container', color: 'text-on-surface-variant' },
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

  const totalDocs = documents?.length ?? 0
  const requiredUploaded = checklistItems.filter((i) => i.required && i.uploaded).length
  const requiredTotal = REQUIRED_DOC_TYPES.length

  return (
    <div className="space-y-6">
      <StudentHeader student={student} />
      <StudentTabs studentId={params.id} active="documents" />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-on-surface-variant">
          <span className="font-bold text-primary">{totalDocs}</span> document{totalDocs !== 1 ? 's' : ''}{' '}
          &middot; <span className="font-bold text-on-surface">{requiredUploaded}/{requiredTotal}</span> required uploaded
        </p>
        <DocumentUpload studentId={params.id} />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Upload zone + Categories */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Upload Zone */}
          <div className="bg-surface-container-low rounded-2xl p-8 border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center text-center group hover:border-primary/40 transition-colors">
            <div className="w-16 h-16 bg-surface-container-lowest rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-primary text-3xl">upload_file</span>
            </div>
            <h3 className="font-headline font-bold text-primary mb-1">Upload New Document</h3>
            <p className="text-xs text-on-surface-variant mb-4 px-4">
              Drag and drop files here or <span className="text-primary font-semibold cursor-pointer underline decoration-primary/30">browse files</span>
            </p>
            <div className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest font-bold">
              Max size 25MB &bull; PDF, DOCX, JPG
            </div>
          </div>

          {/* Category Quick Filter */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/10">
            <h3 className="font-headline font-bold text-primary mb-4 text-lg">Categories</h3>
            <div className="space-y-1">
              <button className="w-full flex items-center justify-between p-3 rounded-xl bg-primary-fixed/30 text-primary">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
                  <span className="text-sm font-semibold">All Files</span>
                </div>
                <span className="text-xs font-bold opacity-60">{totalDocs}</span>
              </button>
              {[
                { type: 'transcript', label: 'Transcripts', icon: 'description' },
                { type: 'test_score', label: 'Test Scores', icon: 'quiz' },
                { type: 'essay', label: 'Essays', icon: 'history_edu' },
                { type: 'recommendation_letter', label: 'Recommendations', icon: 'recommend' },
                { type: 'other', label: 'Other', icon: 'more_horiz' },
              ].map((cat) => (
                <button key={cat.type} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-container transition-colors text-on-surface-variant">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </div>
                  <span className="text-xs font-bold opacity-40">{docsByType[cat.type]?.length ?? 0}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Document Table */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="font-headline font-bold text-primary">Managed Documents</h3>
                <div className="h-4 w-px bg-outline-variant/30" />
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  {totalDocs} Total
                </span>
              </div>
            </div>

            {totalDocs === 0 ? (
              <div className="px-6 py-16 text-center">
                <span className="material-symbols-outlined text-on-surface-variant/30 text-4xl mb-3 block">folder_open</span>
                <p className="text-sm text-on-surface-variant">No documents uploaded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/30">
                      <th className="px-6 py-3 text-[10px] font-extrabold text-on-surface-variant/60 uppercase tracking-widest">Document Name</th>
                      <th className="px-6 py-3 text-[10px] font-extrabold text-on-surface-variant/60 uppercase tracking-widest">Category</th>
                      <th className="px-6 py-3 text-[10px] font-extrabold text-on-surface-variant/60 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-3 text-[10px] font-extrabold text-on-surface-variant/60 uppercase tracking-widest">Uploaded</th>
                      <th className="px-6 py-3 text-[10px] font-extrabold text-on-surface-variant/60 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {documents!.map((doc) => {
                      const iconInfo = DOC_TYPE_ICONS[doc.doc_type] ?? DOC_TYPE_ICONS.other
                      return (
                        <tr key={doc.id} className="hover:bg-surface-container-low/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg ${iconInfo.bg} flex items-center justify-center`}>
                                <span
                                  className={`material-symbols-outlined text-xl ${iconInfo.color}`}
                                  style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                  {iconInfo.icon}
                                </span>
                              </div>
                              <div>
                                {doc.storage_url ? (
                                  <a
                                    href={doc.storage_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
                                  >
                                    {doc.file_name}
                                  </a>
                                ) : (
                                  <div className="text-sm font-semibold text-primary">{doc.file_name}</div>
                                )}
                                {doc.file_size_bytes && (
                                  <div className="text-[10px] text-on-surface-variant font-medium">
                                    {(doc.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-surface-container text-[10px] font-bold text-on-surface-variant rounded uppercase">
                              {ALL_DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <StatusPill status={doc.status} />
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-on-surface-variant">
                            {formatDate(doc.created_at)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {doc.storage_url && (
                                <a
                                  href={doc.storage_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary-fixed/50 transition-all"
                                >
                                  <span className="material-symbols-outlined text-lg">download</span>
                                </a>
                              )}
                              <button className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant/40 cursor-not-allowed" title="Delete via admin">
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
