'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import StudentTabs from '@/components/students/StudentTabs'

interface Portal {
  id: string
  student_id: string
  university_name: string
  portal_url?: string
  portal_pin?: string
  activation_status: 'not_started' | 'activated' | 'failed'
  decision_status: 'pending' | 'accepted' | 'rejected' | 'waitlisted' | 'deferred'
  missing_documents: string[]
  uploaded_documents: string[]
  last_checked_at?: string
  created_at: string
}

const ACTIVATION_COLORS: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-700',
  activated: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
}

const DECISION_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  accepted: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  waitlisted: 'bg-yellow-100 text-yellow-800',
  deferred: 'bg-orange-100 text-orange-800',
}

const ACTIVATION_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  activated: 'Activated',
  failed: 'Failed',
}

const DECISION_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted ✓',
  rejected: 'Rejected',
  waitlisted: 'Waitlisted',
  deferred: 'Deferred',
}

export default function PortalsPage() {
  const params = useParams()
  const studentId = params.id as string

  const [portals, setPortals] = useState<Portal[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [activatingId, setActivatingId] = useState<string | null>(null)
  // Map of portalId → { jobId, progress message }
  const [activationJobs, setActivationJobs] = useState<Record<string, { jobId: string; progress: string }>>({})
  const [formData, setFormData] = useState({ university_name: '', portal_url: '', portal_pin: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPortals = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiFetch(`/api/portals?student_id=${studentId}`)
      setPortals(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch portals:', err)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    fetchPortals()
  }, [fetchPortals])

  const handleAddPortal = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      setSubmitting(true)
      await apiFetch('/api/portals', {
        method: 'POST',
        body: JSON.stringify({
          student_id: studentId,
          university_name: formData.university_name,
          portal_url: formData.portal_url || undefined,
          portal_pin: formData.portal_pin || undefined,
        }),
      })
      setFormData({ university_name: '', portal_url: '', portal_pin: '' })
      setShowModal(false)
      await fetchPortals()
    } catch (err: any) {
      setError(err?.message || 'Failed to create portal')
    } finally {
      setSubmitting(false)
    }
  }

  const handleActivate = async (portalId: string) => {
    setActivatingId(portalId)
    try {
      const res = await apiFetch<{ job_id: string; message: string }>(
        `/api/portals/${portalId}/activate`,
        { method: 'POST' }
      )
      setActivationJobs(prev => ({
        ...prev,
        [portalId]: { jobId: res.job_id, progress: 'Opening portal...' },
      }))
    } catch (err: any) {
      console.error('Failed to activate portal:', err)
      setActivatingId(null)
    }
  }

  // Poll all active activation jobs every 3 seconds
  useEffect(() => {
    const activePortalIds = Object.keys(activationJobs)
    if (activePortalIds.length === 0) return

    const interval = setInterval(async () => {
      for (const portalId of activePortalIds) {
        const { jobId } = activationJobs[portalId]
        try {
          const job = await apiFetch<{
            status: string
            error_message?: string
            output_data?: { activated_at?: string }
          }>(`/api/agent-jobs/${jobId}`)

          if (job.status === 'running') {
            setActivationJobs(prev => ({
              ...prev,
              [portalId]: { jobId, progress: 'Activating portal...' },
            }))
          } else if (job.status === 'completed' || job.status === 'failed') {
            setActivationJobs(prev => {
              const next = { ...prev }
              delete next[portalId]
              return next
            })
            setActivatingId(null)
            await fetchPortals()
          }
        } catch {
          setActivationJobs(prev => {
            const next = { ...prev }
            delete next[portalId]
            return next
          })
          setActivatingId(null)
        }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [activationJobs, fetchPortals])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <span className="material-symbols-outlined text-3xl" style={{ color: '#1D9E75' }}>
              open_in_browser
            </span>
            <h1 className="text-2xl font-bold" style={{ color: '#031635' }}>
              Application Portals
            </h1>
          </div>
          <p className="text-gray-500 text-sm ml-10">
            Track university portal activations and upload required documents
          </p>
        </div>

        {/* Tabs */}
        <StudentTabs studentId={studentId} active="portals" />

        <div className="mt-6">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500">
              {portals.length} portal{portals.length !== 1 ? 's' : ''} tracked
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1D9E75' }}
            >
              <span className="material-symbols-outlined text-base">add</span>
              Add Portal Manually
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#1D9E75' }} />
            </div>
          )}

          {/* Empty state */}
          {!loading && portals.length === 0 && (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-16 text-center">
              <span className="material-symbols-outlined text-5xl text-gray-300 block mb-3">open_in_browser</span>
              <p className="text-gray-500 mb-2 font-medium">No portals yet</p>
              <p className="text-gray-400 text-sm mb-6">
                Portals are created automatically when the automation agent finds activation emails,
                or you can add them manually.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#1D9E75' }}
              >
                Add Portal Manually
              </button>
            </div>
          )}

          {/* Portal cards */}
          {!loading && portals.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {portals.map((portal) => (
                <div key={portal.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  {/* University name + badges */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-bold text-base" style={{ color: '#031635' }}>
                      {portal.university_name}
                    </h3>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ACTIVATION_COLORS[portal.activation_status] || 'bg-gray-100 text-gray-700'}`}>
                        {ACTIVATION_LABELS[portal.activation_status] || portal.activation_status}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${DECISION_COLORS[portal.decision_status] || 'bg-gray-100 text-gray-700'}`}>
                        {DECISION_LABELS[portal.decision_status] || portal.decision_status}
                      </span>
                    </div>
                  </div>

                  {/* Portal URL */}
                  {portal.portal_url && (
                    <a
                      href={portal.portal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline mb-3 break-all"
                    >
                      <span className="material-symbols-outlined text-sm">link</span>
                      {portal.portal_url}
                    </a>
                  )}

                  {/* PIN */}
                  {portal.portal_pin && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-sm text-gray-400">pin</span>
                      <span className="text-xs text-gray-600">PIN: <span className="font-mono font-semibold">{portal.portal_pin}</span></span>
                    </div>
                  )}

                  {/* Uploaded docs */}
                  {portal.uploaded_documents && portal.uploaded_documents.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Uploaded</p>
                      <ul className="space-y-1">
                        {portal.uploaded_documents.map((doc) => (
                          <li key={doc} className="flex items-center gap-1.5 text-sm text-emerald-700">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            {doc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Missing docs */}
                  {portal.missing_documents && portal.missing_documents.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Missing Documents</p>
                      <ul className="space-y-1.5">
                        {portal.missing_documents.map((doc) => (
                          <li key={doc} className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5 text-sm text-orange-700">
                              <span className="material-symbols-outlined text-sm">error</span>
                              {doc}
                            </span>
                            <button className="text-xs px-2 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 whitespace-nowrap">
                              Upload
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Activate button */}
                  {(portal.activation_status === 'not_started' || portal.activation_status === 'failed') && (
                    <button
                      onClick={() => handleActivate(portal.id)}
                      disabled={!!activationJobs[portal.id] || activatingId === portal.id}
                      className="w-full mt-2 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                      style={{ backgroundColor: portal.activation_status === 'failed' ? '#EF4444' : '#1D9E75' }}
                    >
                      {activationJobs[portal.id] ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {activationJobs[portal.id].progress}
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            {portal.activation_status === 'failed' ? 'replay' : 'play_circle'}
                          </span>
                          {portal.activation_status === 'failed' ? 'Retry Activation' : 'Activate Portal'}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Last checked */}
                  {portal.last_checked_at && (
                    <p className="text-xs text-gray-400 mt-3">
                      Last checked {formatDate(portal.last_checked_at)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Portal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold" style={{ color: '#031635' }}>Add Portal Manually</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <span className="material-symbols-outlined text-xl text-gray-500">close</span>
              </button>
            </div>

            <form onSubmit={handleAddPortal} className="px-6 py-5 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  University Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.university_name}
                  onChange={(e) => setFormData({ ...formData, university_name: e.target.value })}
                  placeholder="e.g. Harvard University"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#1D9E75' } as React.CSSProperties}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Portal URL <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  value={formData.portal_url}
                  onChange={(e) => setFormData({ ...formData, portal_url: e.target.value })}
                  placeholder="https://apply.university.edu/portal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Portal PIN <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.portal_pin}
                  onChange={(e) => setFormData({ ...formData, portal_pin: e.target.value })}
                  placeholder="One-time PIN from activation email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 font-mono"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: '#1D9E75' }}
                >
                  {submitting ? 'Creating…' : 'Create Portal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
