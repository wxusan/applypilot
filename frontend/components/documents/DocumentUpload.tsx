'use client'

import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

const DOC_TYPES = [
  { value: 'transcript', label: 'Transcript' },
  { value: 'test_score', label: 'Test Score' },
  { value: 'passport', label: 'Passport' },
  { value: 'recommendation_letter', label: 'Recommendation Letter' },
  { value: 'financial_statement', label: 'Financial Statement' },
  { value: 'essay', label: 'Essay' },
  { value: 'cv', label: 'CV / Resume' },
  { value: 'other', label: 'Other' },
]

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const MAX_MB = 20

interface DocumentUploadProps {
  studentId: string
  onUploadComplete?: () => void
}

export default function DocumentUpload({ studentId, onUploadComplete }: DocumentUploadProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [docType, setDocType] = useState('transcript')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  function handleFileSelect(f: File) {
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError('Only PDF, JPG, PNG, WEBP, DOC, DOCX files are allowed')
      return
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_MB} MB`)
      return
    }
    setFile(f)
    setError(null)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFileSelect(f)
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('student_id', studentId)
      formData.append('doc_type', docType)

      // Get token from Supabase
      const { createBrowserClient } = await import('@/lib/supabase-browser')
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${apiUrl}/api/documents/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(body.detail || `Upload failed (${res.status})`)
      }

      setOpen(false)
      setFile(null)
      setDocType('transcript')
      onUploadComplete?.()
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setError(msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-9 px-4 rounded-[6px] text-[13px] font-medium text-white flex items-center gap-2 transition hover:opacity-90"
        style={{ backgroundColor: '#1D9E75' }}
      >
        <Upload size={14} />
        Upload Document
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
          <div
            className="bg-white rounded-[12px] w-full max-w-md p-6"
            style={{ border: '0.5px solid #e5e7eb' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-semibold text-gray-900">Upload Document</h2>
              <button
                onClick={() => { setOpen(false); setFile(null); setError(null) }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#1D9E75] bg-white"
                  style={{ border: '0.5px solid #d1d5db' }}
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className="rounded-[8px] p-6 text-center cursor-pointer transition"
                style={{
                  border: dragOver ? '1.5px dashed #1D9E75' : '1px dashed #d1d5db',
                  backgroundColor: dragOver ? '#F0FAF5' : '#FAFAFA',
                }}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFileSelect(f)
                  }}
                />
                {file ? (
                  <div>
                    <p className="text-[13px] font-medium text-gray-700">{file.name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload size={20} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-[13px] text-gray-500">
                      Drop file here or <span className="text-[#1D9E75]">browse</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      PDF, JPG, PNG, WEBP, DOC, DOCX · Max {MAX_MB} MB
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <p className="text-[12px] text-[#A32D2D]">{error}</p>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setOpen(false); setFile(null); setError(null) }}
                  className="h-9 px-4 rounded-[6px] text-[13px] text-gray-500 hover:bg-gray-50 transition"
                  style={{ border: '0.5px solid #e5e7eb' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="h-9 px-4 rounded-[6px] text-[13px] font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#1D9E75' }}
                >
                  {uploading ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
