'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
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

const TYPE_BADGE: Record<string, string> = {
  weekly: 'bg-secondary-container text-secondary',
  monthly: 'bg-tertiary-fixed text-primary',
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
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight mb-2">
            Performance Reports
          </h1>
          <p className="text-on-surface-variant text-lg">
            Weekly, monthly and yearly PDF reports — automatically generated and sent to your Telegram.
          </p>
        </div>

        {/* Generate buttons */}
        <div className="flex gap-2 shrink-0">
          {(['weekly', 'monthly', 'yearly'] as const).map((type) => (
            <button
              key={type}
              onClick={() => handleGenerate(type)}
              disabled={generating !== null}
              className="flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/30 hover:text-primary text-on-surface-variant text-xs font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
            >
              {generating === type ? (
                <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>
              ) : (
                <span className="material-symbols-outlined text-sm">bar_chart</span>
              )}
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-6">
        {['', 'weekly', 'monthly', 'yearly'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`text-xs font-bold px-4 py-2 rounded-full transition-colors ${
              filter === t
                ? 'bg-primary text-white'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {t === '' ? 'All' : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Reports list */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin">autorenew</span>
          <span className="text-sm">Loading reports...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border-2 border-dashed border-outline-variant/30 text-center py-20">
          <div className="w-16 h-16 bg-surface-container rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-on-surface-variant/40 text-3xl">description</span>
          </div>
          <h3 className="font-headline font-bold text-xl text-primary mb-2">No Reports Yet</h3>
          <p className="text-on-surface-variant max-w-sm mx-auto leading-relaxed">
            Reports are auto-generated weekly, monthly, and yearly. Or click a button above to generate one now.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => {
            const s = r.summary_json || {}
            return (
              <div
                key={r.id}
                className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm p-6 hover:border-outline-variant/20 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-xl">description</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-tighter ${TYPE_BADGE[r.report_type] || 'bg-surface-container text-on-surface-variant'}`}>
                          {TYPE_LABELS[r.report_type] || r.report_type}
                        </span>
                        <span className="text-base font-bold text-primary">{r.period_label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        {formatDate(r.period_start)} &ndash; {formatDate(r.period_end)}
                        <span className="mx-1 opacity-30">&bull;</span>
                        Generated {formatDate(r.generated_at)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload(r.id)}
                    disabled={downloading === r.id || !r.pdf_url}
                    className="flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95"
                    style={{ background: r.pdf_url ? 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' : undefined, color: r.pdf_url ? 'white' : undefined, backgroundColor: !r.pdf_url ? undefined : undefined }}
                  >
                    {downloading === r.id ? (
                      <span className="material-symbols-outlined text-lg animate-spin">autorenew</span>
                    ) : (
                      <span className="material-symbols-outlined text-lg">download</span>
                    )}
                    {r.pdf_url ? 'Download PDF' : 'Generating...'}
                  </button>
                </div>

                {/* Metrics summary */}
                {s && Object.keys(s).length > 0 && (
                  <div className="mt-6 pt-6 border-t border-outline-variant/10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                    {s.total_students !== undefined && (
                      <MetricCard label="Total Students" value={s.total_students} icon="group" />
                    )}
                    {s.applications_submitted !== undefined && (
                      <MetricCard label="Applications" value={s.applications_submitted} icon="send" />
                    )}
                    {s.acceptance_rate_pct !== undefined && (
                      <MetricCard label="Acceptance Rate" value={`${s.acceptance_rate_pct}%`} icon="trending_up" />
                    )}
                    {s.emails_received !== undefined && (
                      <MetricCard label="Emails" value={s.emails_received} icon="mail" />
                    )}
                    {s.deadlines_completed !== undefined && (
                      <MetricCard label="Deadlines Done" value={s.deadlines_completed} icon="task_alt" />
                    )}
                    {s.ai_tokens_used !== undefined && (
                      <MetricCard label="AI Tokens" value={(s.ai_tokens_used || 0).toLocaleString()} icon="bolt" />
                    )}
                    {s.ai_cost_usd !== undefined && (
                      <MetricCard label="AI Cost" value={`$${(s.ai_cost_usd || 0).toFixed(4)}`} icon="payments" />
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

function MetricCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="material-symbols-outlined text-on-surface-variant/60 text-sm">{icon}</span>
        <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">{label}</p>
      </div>
      <p className="text-lg font-extrabold font-headline text-primary">{value}</p>
    </div>
  )
}
