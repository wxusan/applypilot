'use client'

import { useState } from 'react'
import { Download, Printer } from 'lucide-react'

interface Student {
  id: string
  full_name: string
  preferred_name?: string | null
  email?: string | null
  status: string
  season?: string | null
  graduation_year?: number | null
  gpa?: number | null
  gpa_scale?: number | null
  sat_total?: number | null
  act_score?: number | null
  nationality?: string | null
  high_school_name?: string | null
  intended_major?: string | null
  created_at: string
  applications?: {
    id: string
    university_name: string
    status: string
    deadline_regular?: string | null
    decision?: string | null
  }[]
}

interface Props {
  students: Student[]
  /** If a single student, used for the PDF page title */
  singleStudent?: boolean
}

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return ''
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function studentsToCSV(students: Student[]): string {
  const headers = [
    'Full Name', 'Preferred Name', 'Email', 'Status', 'Season',
    'Graduation Year', 'GPA', 'GPA Scale', 'SAT Total', 'ACT Score',
    'Nationality', 'High School', 'Intended Major', 'Created At',
    'Applications Count', 'Universities',
  ]

  const rows = students.map((s) => [
    s.full_name,
    s.preferred_name ?? '',
    s.email ?? '',
    s.status,
    s.season ?? '',
    s.graduation_year ?? '',
    s.gpa ?? '',
    s.gpa_scale ?? '',
    s.sat_total ?? '',
    s.act_score ?? '',
    s.nationality ?? '',
    s.high_school_name ?? '',
    s.intended_major ?? '',
    s.created_at ? new Date(s.created_at).toLocaleDateString() : '',
    s.applications?.length ?? 0,
    (s.applications ?? []).map((a) => a.university_name).join('; '),
  ])

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function generatePrintHTML(students: Student[], title: string): string {
  const rows = students.map((s) => {
    const apps = s.applications ?? []
    return `
      <div class="student-block">
        <h2>${s.full_name}${s.preferred_name ? ` (${s.preferred_name})` : ''}</h2>
        <table>
          <tr><td>Email</td><td>${s.email ?? '—'}</td></tr>
          <tr><td>Status</td><td>${s.status}</td></tr>
          <tr><td>Season</td><td>${s.season ?? '—'}</td></tr>
          <tr><td>Grad Year</td><td>${s.graduation_year ?? '—'}</td></tr>
          <tr><td>GPA</td><td>${s.gpa ? `${s.gpa} / ${s.gpa_scale ?? 4}` : '—'}</td></tr>
          <tr><td>SAT</td><td>${s.sat_total ?? '—'}</td></tr>
          <tr><td>ACT</td><td>${s.act_score ?? '—'}</td></tr>
          <tr><td>Nationality</td><td>${s.nationality ?? '—'}</td></tr>
          <tr><td>High School</td><td>${s.high_school_name ?? '—'}</td></tr>
          <tr><td>Major</td><td>${s.intended_major ?? '—'}</td></tr>
        </table>
        ${apps.length > 0 ? `
          <h3>Applications (${apps.length})</h3>
          <table>
            <thead><tr><th>University</th><th>Status</th><th>Deadline</th><th>Decision</th></tr></thead>
            <tbody>
              ${apps.map((a) => `
                <tr>
                  <td>${a.university_name}</td>
                  <td>${a.status}</td>
                  <td>${a.deadline_regular ?? '—'}</td>
                  <td>${a.decision ?? '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
      </div>
    `
  })

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  body { font-family: -apple-system, sans-serif; font-size: 12px; color: #111; margin: 20px; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  .meta { font-size: 10px; color: #666; margin-bottom: 20px; }
  .student-block { border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px; margin-bottom: 16px; page-break-inside: avoid; }
  h2 { font-size: 15px; margin: 0 0 10px; }
  h3 { font-size: 12px; margin: 12px 0 6px; color: #374151; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  td, th { padding: 3px 8px; text-align: left; border-bottom: 0.5px solid #f3f4f6; }
  th { font-weight: 600; font-size: 10px; color: #6b7280; text-transform: uppercase; }
  td:first-child { color: #6b7280; width: 120px; }
  @media print { body { margin: 10px; } }
</style>
</head>
<body>
<h1>${title}</h1>
<p class="meta">Generated ${new Date().toLocaleDateString()} · ApplyPilot</p>
${rows.join('')}
</body>
</html>`
}

export default function ExportButtons({ students, singleStudent = false }: Props) {
  const [exporting, setExporting] = useState(false)

  const handleCSV = () => {
    setExporting(true)
    try {
      const csv = studentsToCSV(students)
      const filename = singleStudent
        ? `${students[0]?.full_name?.replace(/\s+/g, '_') ?? 'student'}_export.csv`
        : `students_export_${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csv, filename)
    } finally {
      setExporting(false)
    }
  }

  const handlePDF = () => {
    const title = singleStudent
      ? `${students[0]?.full_name ?? 'Student'} — ApplyPilot Report`
      : `Students Report — ApplyPilot`
    const html = generatePrintHTML(students, title)

    const win = window.open('', '_blank')
    if (!win) {
      alert('Please allow popups to export PDF.')
      return
    }
    win.document.write(html)
    win.document.close()
    win.onload = () => {
      win.print()
    }
  }

  const btnBase =
    'h-8 px-3 rounded-[6px] text-[12px] font-medium flex items-center gap-1.5 transition hover:opacity-90 disabled:opacity-60'

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCSV}
        disabled={exporting || students.length === 0}
        className={btnBase}
        style={{
          border: '0.5px solid #d1d5db',
          backgroundColor: '#fff',
          color: '#374151',
        }}
        title="Export as CSV"
      >
        <Download size={13} />
        CSV
      </button>
      <button
        onClick={handlePDF}
        disabled={students.length === 0}
        className={btnBase}
        style={{
          border: '0.5px solid #d1d5db',
          backgroundColor: '#fff',
          color: '#374151',
        }}
        title="Export as PDF (print dialog)"
      >
        <Printer size={13} />
        PDF
      </button>
    </div>
  )
}
