'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Icon from '@/components/Icon'
import Button from '@/components/Button'
import Modal from '@/components/Modal'
import PageHeader from '@/components/PageHeader'
import LoadingSpinner from '@/components/LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'

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

const statusColors = {
  not_started: 'bg-gray-100 text-gray-800',
  activated: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-gray-100 text-gray-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  waitlisted: 'bg-yellow-100 text-yellow-800',
  deferred: 'bg-orange-100 text-orange-800',
}

export default function PortalsPage() {
  const params = useParams()
  const studentId = params.id as string

  const [portals, setPortals] = useState<Portal[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    university_name: '',
    portal_url: '',
    portal_pin: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPortals()
  }, [studentId])

  const fetchPortals = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/portals?student_id=${studentId}`)
      if (response.ok) {
        const data = await response.json()
        setPortals(data)
      }
    } catch (error) {
      console.error('Failed to fetch portals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPortal = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const response = await fetch('/api/portals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          university_name: formData.university_name,
          portal_url: formData.portal_url || undefined,
          portal_pin: formData.portal_pin || undefined,
        }),
      })

      if (response.ok) {
        setFormData({ university_name: '', portal_url: '', portal_pin: '' })
        setShowModal(false)
        await fetchPortals()
      }
    } catch (error) {
      console.error('Failed to create portal:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleActivatePortal = async (portalId: string) => {
    try {
      const response = await fetch(`/api/portals/${portalId}/activate`, {
        method: 'POST',
      })
      if (response.ok) {
        await fetchPortals()
      }
    } catch (error) {
      console.error('Failed to activate portal:', error)
    }
  }

  const getActivationStatusBadge = (status: Portal['activation_status']) => {
    const labels = {
      not_started: 'Not Started',
      activated: 'Activated',
      failed: 'Failed',
    }
    return labels[status] || status
  }

  const getDecisionStatusBadge = (status: Portal['decision_status']) => {
    const labels = {
      pending: 'Pending',
      accepted: 'Accepted',
      rejected: 'Rejected',
      waitlisted: 'Waitlisted',
      deferred: 'Deferred',
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Application Portals"
        subtitle="Track university portal activations and upload required documents"
        icon="open_in_browser"
      />

      {portals.length === 0 ? (
        <div className="mt-8 p-12 border-2 border-dashed border-gray-300 rounded-lg text-center">
          <Icon name="inbox" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-6">
            No portal sessions yet. Portals are created automatically when the automation agent finds activation emails.
          </p>
          <Button
            variant="primary"
            onClick={() => setShowModal(true)}
          >
            Add Portal Manually
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {portals.map((portal) => (
              <div
                key={portal.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    {portal.university_name}
                  </h3>
                </div>

                {/* Badges */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      statusColors[portal.activation_status]
                    }`}
                  >
                    {getActivationStatusBadge(portal.activation_status)}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      statusColors[portal.decision_status]
                    }`}
                  >
                    {getDecisionStatusBadge(portal.decision_status)}
                  </span>
                </div>

                {/* Uploaded Documents */}
                {portal.uploaded_documents.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Uploaded Documents
                    </h4>
                    <ul className="space-y-1">
                      {portal.uploaded_documents.map((doc) => (
                        <li key={doc} className="flex items-center gap-2 text-sm text-emerald-700">
                          <Icon name="check_circle" className="w-4 h-4" />
                          {doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Documents */}
                {portal.missing_documents.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Missing Documents
                    </h4>
                    <ul className="space-y-2">
                      {portal.missing_documents.map((doc) => (
                        <li
                          key={doc}
                          className="flex items-center justify-between gap-2 text-sm text-gray-700"
                        >
                          <span>{doc}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Upload handler would go here
                              console.log(`Upload ${doc} for ${portal.university_name}`)
                            }}
                          >
                            Upload
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                {portal.activation_status === 'not_started' && (
                  <div className="mb-4">
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => handleActivatePortal(portal.id)}
                    >
                      Activate Portal
                    </Button>
                  </div>
                )}

                {/* Last Checked */}
                {portal.last_checked_at && (
                  <p className="text-xs text-gray-500">
                    Last checked: {formatDistanceToNow(new Date(portal.last_checked_at), { addSuffix: true })}
                  </p>
                )}
              </div>
            ))}
          </div>

          <Button
            variant="primary"
            onClick={() => setShowModal(true)}
          >
            Add Portal Manually
          </Button>
        </>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Portal Manually"
      >
        <form onSubmit={handleAddPortal} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              University Name
            </label>
            <input
              type="text"
              value={formData.university_name}
              onChange={(e) =>
                setFormData({ ...formData, university_name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Portal URL (Optional)
            </label>
            <input
              type="url"
              value={formData.portal_url}
              onChange={(e) =>
                setFormData({ ...formData, portal_url: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Portal PIN (Optional)
            </label>
            <input
              type="text"
              value={formData.portal_pin}
              onChange={(e) =>
                setFormData({ ...formData, portal_pin: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Portal'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
