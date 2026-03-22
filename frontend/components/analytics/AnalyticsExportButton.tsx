'use client'

import { Download } from 'lucide-react'

interface Props {
  data: {
    studentsByStatus: Record<string, number>
    decisionCounts: Record<string, number>
    jobsByDay: Record<string, number>
    complianceRate: number | null
    totalStudents: number
    totalApps: number
    acceptanceRate: number | null
  }
}

export default function AnalyticsExportButton({ data }: Props) {
  const handleExport = () => {
    const lines: string[] = []
    lines.push('ApplyPilot Analytics Export')
    lines.push(`Generated,${new Date().toLocaleDateString()}`)
    lines.push('')
    lines.push('KPI Summary')
    lines.push(`Total Students,${data.totalStudents}`)
    lines.push(`Total Applications,${data.totalApps}`)
    lines.push(`Acceptance Rate,${data.acceptanceRate !== null ? data.acceptanceRate + '%' : 'N/A'}`)
    lines.push(`Deadline Compliance,${data.complianceRate !== null ? data.complianceRate + '%' : 'N/A'}`)
    lines.push('')
    lines.push('Students by Pipeline Stage')
    lines.push('Status,Count')
    for (const [status, count] of Object.entries(data.studentsByStatus)) {
      lines.push(`${status},${count}`)
    }
    lines.push('')
    lines.push('Application Decisions')
    lines.push('Decision,Count')
    for (const [decision, count] of Object.entries(data.decisionCounts)) {
      lines.push(`${decision},${count}`)
    }
    lines.push('')
    lines.push('Agent Activity (Last 30 Days)')
    lines.push('Date,Jobs')
    for (const [date, count] of Object.entries(data.jobsByDay)) {
      lines.push(`${date},${count}`)
    }

    const csv = lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      aria-label="Export analytics data as CSV"
      className="h-8 px-3 rounded-[6px] text-[12px] font-medium flex items-center gap-1.5 transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
      style={{ border: '0.5px solid #d1d5db', backgroundColor: '#fff', color: '#374151' }}
    >
      <Download size={13} />
      Export CSV
    </button>
  )
}
