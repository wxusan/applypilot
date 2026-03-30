'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import Link from 'next/link'

interface ParsedStudent {
  full_name: string
  email: string
  phone: string
  nationality: string
  graduation_year: string
  high_school_name: string
  high_school_country: string
  gpa: string
  sat_total: string
  intended_major: string
  status: string
  notes: string
}

interface ImportResult {
  success_count: number
  failed_count: number
  errors: Array<{ row: number; error: string }>
}

export default function StudentImportPage() {
  const router = useRouter()
  const [dragActive, setDragActive] = useState(false)
  const [csvContent, setCsvContent] = useState<string | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedStudent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const parseCSV = (content: string): ParsedStudent[] => {
    const lines = content.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

    const rows: ParsedStudent[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const row: any = {}
      headers.forEach((header, idx) => {
        row[header] = values[idx] || ''
      })
      rows.push(row)
    }

    return rows
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files?.length) {
      await processFile(files[0])
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files?.length) {
      await processFile(files[0])
    }
  }

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const content = await file.text()
      setCsvContent(content)
      const rows = parseCSV(content)
      setParsedRows(rows.slice(0, 10))
      setResult(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    if (!parsedRows.length) return

    setIsImporting(true)
    setError(null)
    try {
      const response = await apiFetch<ImportResult>('/api/students/import', {
        method: 'POST',
        body: JSON.stringify({ students: parsedRows }),
      })
      setResult(response)
      setParsedRows([])
      setCsvContent(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    const headers = ['full_name', 'email', 'phone', 'nationality', 'graduation_year', 'high_school_name', 'high_school_country', 'gpa', 'sat_total', 'intended_major', 'status', 'notes']
    const exampleRow = ['John Doe', 'john@example.com', '+1 (555) 000-0000', 'United States', '2025', 'Lincoln High School', 'United States', '3.85', '1540', 'Computer Science', 'intake', 'Top student']

    const csv = [headers.join(','), exampleRow.join(',')].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'students-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#031635] mb-2">Import Students</h1>
        <p className="text-gray-500">Upload a CSV to onboard multiple students at once</p>
      </div>

      {/* Download Template Button */}
      <button
        onClick={downloadTemplate}
        className="inline-flex items-center gap-2 px-6 py-3 bg-white border-0.5 rounded-xl text-[#031635] font-semibold hover:bg-gray-50 transition-all"
        style={{ borderColor: '#e5e7eb' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
        Download Template
      </button>

      {/* Upload Zone */}
      {!csvContent && (
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            dragActive ? 'border-[#1D9E75] bg-emerald-50' : 'border-gray-300 bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <span className="material-symbols-outlined text-gray-400 text-5xl block mb-4">upload_file</span>
          <p className="text-gray-600 font-semibold mb-2">Drag and drop your CSV file here</p>
          <p className="text-gray-400 text-sm mb-4">or</p>
          <label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
              disabled={isLoading}
            />
            <button
              onClick={(e) => {
                e.currentTarget.previousElementSibling?.click()
              }}
              className="px-6 py-2 bg-[#031635] text-white rounded-lg font-semibold hover:opacity-90 transition-all"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Browse Files'}
            </button>
          </label>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Preview Table */}
      {csvContent && !result && (
        <div className="bg-white rounded-xl p-5 border-0.5" style={{ borderColor: '#e5e7eb' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#031635] uppercase tracking-wide">
              {parsedRows.length} students found in CSV
            </h3>
            <button
              onClick={() => {
                setCsvContent(null)
                setParsedRows([])
              }}
              className="text-[12px] text-gray-500 hover:text-gray-700 underline"
            >
              Upload different file
            </button>
          </div>

          {parsedRows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 text-[11px] uppercase">Name</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 text-[11px] uppercase">Email</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 text-[11px] uppercase">Phone</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 text-[11px] uppercase">HS Name</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 text-[11px] uppercase">GPA</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 text-[11px] uppercase">SAT</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-700">{row.full_name}</td>
                      <td className="px-3 py-2 text-gray-600 text-[12px]">{row.email}</td>
                      <td className="px-3 py-2 text-gray-600 text-[12px]">{row.phone}</td>
                      <td className="px-3 py-2 text-gray-600 text-[12px]">{row.high_school_name}</td>
                      <td className="px-3 py-2 text-gray-600 text-[12px]">{row.gpa}</td>
                      <td className="px-3 py-2 text-gray-600 text-[12px]">{row.sat_total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            <Link
              href="/students"
              className="px-6 py-2 text-gray-600 font-semibold hover:bg-gray-50 rounded-lg transition-all"
            >
              Cancel
            </Link>
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="px-8 py-3 bg-[#031635] text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: '16px' }}>sync</span>
                  Importing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>upload</span>
                  Import Students
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Results Panel */}
      {result && (
        <div className="bg-white rounded-xl p-6 border-0.5" style={{ borderColor: '#e5e7eb' }}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
              <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
              <div>
                <p className="font-semibold text-[#031635]">{result.success_count} students created</p>
                {result.failed_count > 0 && (
                  <p className="text-sm text-gray-500">{result.failed_count} rows had errors</p>
                )}
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-700 text-sm mb-3">Failed Rows</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left px-3 py-2 font-semibold text-gray-600 text-[11px] uppercase">Row</th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600 text-[11px] uppercase">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((err, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="px-3 py-2 text-gray-700">{err.row}</td>
                          <td className="px-3 py-2 text-red-600 text-[12px]">{err.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setResult(null)
                  setCsvContent(null)
                  setParsedRows([])
                }}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
              >
                Import Another File
              </button>
              <Link
                href="/students"
                className="flex-1 px-6 py-3 bg-[#031635] text-white font-semibold rounded-xl hover:opacity-90 transition-all text-center"
              >
                Back to Students
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
