'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { FileText, Download, RefreshCw, Calendar, BarChart2 } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface Report {
  id: string
  report_type: string
  period_label: string
  period_start: string
  period_end: string
  generated_at: string
  summary_json: {
    total_students?: number
    active_students?: number
    applications_submitted?: number
    acceptance_rate_pct?: number
    emails_received?: number
    deadlines_completed?: number
    ai_tokens_used?: number
    ai_cost_usd?: number
  } | null
  pdf_url: string | null
}

const TYPE_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
}

const TYPE_COLORS: Record<string, string> = {
  weekly: 'bg-blue-100 text-blue-700',
  monthly: 'bg-violet-100 text-violet-700',
  yearly: 'bg-amber-100 text-amber-700',
}

export default function ReportsPage() {
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')
  const [generating, setGenerating] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  async function loadReports() {
    setLoading(true)
    try {
      const params = filter ? `?report_type=${filter}` : ''
      const data = await apiFetch<{ reports: Report[] }>(`/api/reports/${params}`)
      setReports(data.reports || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadReports() }, [filter])

  const handleGenerate = async (type: string) => {
    setGenerating(type)
    toastInfo(`Generating ${type} report… this may take 10–20 seconds.`)
    try {
      await apiFetch('/api/reports/generate', {
        method: 'POST',
        body: JSON.stringify({ report_type: type }),
      })
      toastSuccess(`${TYPE_LABELS[type]} report generated.`)
      await loadReports()
    } catch (err: unknown) {
      toastError((err instanceof Error ? err.message : null) ?? 'Failed to generate report')
    } finally {
      setGenerating(null)
    }
  }

  const handleDownload = async (reportId: string) => {
    setDownloading(reportId)
    try {
      const res = await apiFetch<{ download_url: string; period_label: string }>(`/api/reports/${reportId}/download`)
      if (res.download_url) {
        window.open(res.download_url, '_blank')
        toastSuccess('PDF opened in new tab.')
      }
    } catch {
      toastError('Could not retrieve download link. The PDF may still be generating.')
    } finally {
      setDownloading(null)
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-gray-900 flex items-center gap-2">
            <FileText size={18} className="text-brand" />
            Reports
          </h1>
          <p className="text-[13px] text-gray-500 mt-1">
            Weekly, monthly and yearly PDF reports — automatically generated and sent to your Telegram.
          </p>
        </div>

        {/* Generate buttons */}
        <div className="flex gap-2">
          {(['weekly', 'monthly', 'yearly'] as const).map((type) => (
            <button
              key={type}
              onClick={() => handleGenerate(type)}
              disabled={generating !== null}
              className="flex items-center gap-1.5 border border-gray-200 hover:border-brand hover:text-brand text-gray-600 text-[12px] font-medium px-3 py-1.5 rounded-[7px] transition-colors disabled:opacity-50"
            >
              {generating === type ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <BarChart2 size={12} />
              )}
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {['', 'weekly', 'monthly', 'yearly'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors ${
              filter === t
                ? 'bg-brand text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t === '' ? 'All' : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Reports list */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-[13px]">Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-[10px] border border-dashed border-gray-200 text-center py-16">
          <FileText size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-[14px] font-medium text-gray-500">No reports yet</p>
          <p className="text-[13px] text-gray-400 mt-1">Reports are auto-generated weekly, monthly, and yearly.</p>
          <p className="text-[13px] text-gray-400">Or click a button above to generate one now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const s = r.summary_json || {}
            return (
              <div
                key={r.id}
                className="bg-white rounded-[10px] border border-gray-200 shadow-sm p-5 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-[8px] border border-gray-100">
                      <FileText size={16} className="text-gray-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${TYPE_COLORS[r.report_type] || 'bg-gray-100 text-gray-600'}`}>
                          {TYPE_LABELS[r.report_type] || r.report_type}
                        </span>
                        <span className="text-[14px] font-semibold text-gray-900">{r.period_label}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Calendar size={11} />
                        {formatDate(r.period_start)} – {formatDate(r.period_end)}
                        <span className="mx-1">·</span>
                        Generated {formatDate(r.generated_at)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload(r.id)}
                    disabled={downloading === r.id || !r.pdf_url}
                    className="flex items-center gap-1.5 bg-[#1D9E75] hover:bg-[#0F6E56] disabled:opacity-50 text-white text-[12px] font-medium px-4 py-2 rounded-[7px] transition-colors"
                  >
                    {downloading === r.id ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : (
                      <Download size={12} />
                    )}
                    {r.pdf_url ? 'Download PDF' : 'Generating...'}
                  </button>
                </div>

                {/* Metrics summary strip */}
                {s && Object.keys(s).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-4 gap-4">
                    {s.total_students !== undefined && (
                      <Metric label="Total Students" value={s.total_students} />
                    )}
                    {s.applications_submitted !== undefined && (
                      <Metric label="Applications" value={s.applications_submitted} />
                    )}
                    {s.acceptance_rate_pct !== undefined && (
                      <Metric label="Acceptance Rate" value={`${s.acceptance_rate_pct}%`} />
                    )}
                    {s.emails_received !== undefined && (
                      <Metric label="Emails" value={s.emails_received} />
                    )}
                    {s.deadlines_completed !== undefined && (
                      <Metric label="Deadlines Done" value={s.deadlines_completed} />
                    )}
                    {s.ai_tokens_used !== undefined && (
                      <Metric label="AI Tokens" value={(s.ai_tokens_used || 0).toLocaleString()} />
                    )}
                    {s.ai_cost_usd !== undefined && (
                      <Metric label="AI Cost" value={`$${(s.ai_cost_usd || 0).toFixed(4)}`} />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-[15px] font-semibold text-gray-900 mt-0.5">{value}</p>
    </div>
  )
}
