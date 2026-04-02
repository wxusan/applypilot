'use client'

import { useState } from 'react'

interface StudentPreviewRow {
  name: string
  id: string
  gpa: string
  university: string
  status: string
}

interface ExportPreviewProps {
  onClose?: () => void
  onExport?: () => void
  /** Real student rows to display in the preview table. Falls back to sample data if omitted. */
  students?: StudentPreviewRow[]
  /** Total number of students in the export (shown in footer). Defaults to students.length. */
  totalCount?: number
}

const ALL_FIELDS = [
  { id: 'name', label: 'Student Name', defaultChecked: true },
  { id: 'app_id', label: 'Application ID', defaultChecked: true },
  { id: 'gpa', label: 'GPA (Weighted)', defaultChecked: true },
  { id: 'universities', label: 'Target Universities', defaultChecked: true },
  { id: 'status', label: 'Admission Status', defaultChecked: true },
  { id: 'notes', label: 'Internal Notes', defaultChecked: false },
  { id: 'last_login', label: 'Last Login Date', defaultChecked: false },
]

const SAMPLE_ROWS: StudentPreviewRow[] = [
  { name: 'A. Thorne', id: 'APP-2209', gpa: '4.0 W', university: 'Yale, Harvard', status: 'Under Review' },
  { name: 'E. Rodriguez', id: 'APP-1847', gpa: '3.98 W', university: 'Oxford, MIT', status: 'Interview Scheduled' },
  { name: 'K. Nakamura', id: 'APP-3301', gpa: '3.92 W', university: 'Stanford, Princeton', status: 'Documents Pending' },
]

export default function ExportPreview({ onClose, onExport, students, totalCount }: ExportPreviewProps) {
  const previewRows = students && students.length > 0 ? students : SAMPLE_ROWS
  const exportTotal = totalCount ?? previewRows.length
  const [checkedFields, setCheckedFields] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_FIELDS.map((f) => [f.id, f.defaultChecked]))
  )
  const [delimiter, setDelimiter] = useState('comma')
  const [encoding, setEncoding] = useState('utf8')

  const toggleField = (id: string) => {
    setCheckedFields((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm"></div>
      <div className="relative w-full max-w-5xl bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-surface-container-low flex justify-between items-center border-b border-outline-variant/5">
          <div>
            <h2 className="font-headline font-extrabold text-2xl text-primary tracking-tight">Export to CSV Preview</h2>
            <p className="font-body text-sm text-on-surface-variant mt-1">Review and configure the data set for your academic dossier export.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left: Field Selection */}
          <aside className="w-full md:w-72 bg-surface-container-low border-r border-outline-variant/10 p-6 flex flex-col gap-6 overflow-y-auto">
            <div>
              <h3 className="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-4">Include Fields</h3>
              <div className="space-y-3">
                {ALL_FIELDS.map((field) => (
                  <label key={field.id} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="rounded-sm border-outline text-primary focus:ring-primary w-4 h-4"
                      checked={checkedFields[field.id]}
                      onChange={() => toggleField(field.id)}
                    />
                    <span className={`font-label text-sm transition-colors group-hover:text-primary ${checkedFields[field.id] ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                      {field.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-outline-variant/10">
              <h3 className="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-3">Format Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Delimiter</label>
                  <select
                    className="w-full text-xs bg-surface-container border-none rounded-lg focus:ring-primary outline-none p-2"
                    value={delimiter}
                    onChange={(e) => setDelimiter(e.target.value)}
                  >
                    <option value="comma">Comma (,)</option>
                    <option value="semicolon">Semicolon (;)</option>
                    <option value="tab">Tab (\t)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Encoding</label>
                  <select
                    className="w-full text-xs bg-surface-container border-none rounded-lg focus:ring-primary outline-none p-2"
                    value={encoding}
                    onChange={(e) => setEncoding(e.target.value)}
                  >
                    <option value="utf8">UTF-8</option>
                    <option value="utf16">UTF-16</option>
                    <option value="ascii">ASCII</option>
                  </select>
                </div>
              </div>
            </div>
          </aside>

          {/* Right: Data Preview */}
          <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-primary">Data Preview</h3>
              <span className="text-xs font-medium text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                {Object.values(checkedFields).filter(Boolean).length} columns selected
              </span>
            </div>

            <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container text-on-surface-variant font-bold uppercase tracking-widest">
                    <tr>
                      {checkedFields['name'] && <th className="px-4 py-3">Student Name</th>}
                      {checkedFields['app_id'] && <th className="px-4 py-3">App ID</th>}
                      {checkedFields['gpa'] && <th className="px-4 py-3">GPA</th>}
                      {checkedFields['universities'] && <th className="px-4 py-3">Universities</th>}
                      {checkedFields['status'] && <th className="px-4 py-3">Status</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {previewRows.map((row, i) => (
                      <tr key={i} className="hover:bg-surface-container/50 transition-colors">
                        {checkedFields['name'] && <td className="px-4 py-3 font-semibold text-primary">{row.name}</td>}
                        {checkedFields['app_id'] && <td className="px-4 py-3 font-mono text-on-surface-variant">{row.id}</td>}
                        {checkedFields['gpa'] && <td className="px-4 py-3">{row.gpa}</td>}
                        {checkedFields['universities'] && <td className="px-4 py-3">{row.university}</td>}
                        {checkedFields['status'] && (
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant rounded text-[10px] font-bold">{row.status}</span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-outline-variant/10 bg-surface-container-low">
                <span className="text-[11px] text-on-surface-variant italic">
                  Showing {previewRows.length} of {exportTotal} records — actual export will contain all qualifying data
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-surface-container-low border-t border-outline-variant/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">info</span>
            <span className="text-[11px] font-medium italic">Estimated file size: ~2.4 MB (CSV)</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors">
              Cancel
            </button>
            <button
              onClick={onExport}
              className="px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-white font-bold text-sm rounded-lg shadow-lg shadow-primary/10 hover:brightness-110 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
