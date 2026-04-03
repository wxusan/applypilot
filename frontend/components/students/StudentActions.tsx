'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

interface StudentActionsProps {
  studentId: string
  studentName: string
  currentStatus: string
}

export default function StudentActions({ studentId, studentName, currentStatus }: StudentActionsProps) {
  const router = useRouter()
  const { success: toastSuccess, error: toastError } = useToast()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const isArchived = currentStatus === 'archived'

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setLoading(true)
    try {
      await apiFetch(`/api/students/${studentId}`, { method: 'DELETE' })
      toastSuccess(`${studentName} has been permanently deleted.`)
      router.push('/students')
      router.refresh()
    } catch {
      toastError('Failed to delete student. Please try again.')
      setLoading(false)
    }
  }

  // ── Archive / Restore ──────────────────────────────────────────────────
  const handleArchiveToggle = async () => {
    const newStatus = isArchived ? 'accepted' : 'archived'
    setLoading(true)
    try {
      await apiFetch(`/api/students/${studentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      if (isArchived) {
        toastSuccess(`${studentName} has been restored to active roster.`)
      } else {
        toastSuccess(`${studentName} has been archived. Their slot is now free.`)
      }
      setShowArchiveModal(false)
      router.refresh()
    } catch {
      toastError('Failed to update student. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Archive / Restore */}
        {isArchived ? (
          <button
            onClick={() => setShowArchiveModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-bright transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-sm">unarchive</span>
            Restore
          </button>
        ) : (
          <button
            onClick={() => setShowArchiveModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-bright transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-sm">archive</span>
            Archive
          </button>
        )}

        {/* Delete */}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors text-red-600"
        >
          <span className="material-symbols-outlined text-sm">delete</span>
          Delete
        </button>
      </div>

      {/* ── Delete Confirmation Modal ───────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !loading && setShowDeleteModal(false)}
          />

          {/* Dialog */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 flex flex-col gap-5">
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-600 text-2xl">delete_forever</span>
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-primary mb-1">Delete Student?</h2>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                You're about to permanently delete{' '}
                <span className="font-bold text-primary">{studentName}</span>.
                All their applications, essays, documents, and history will be erased.
                <br /><br />
                <span className="font-semibold text-red-600">This cannot be undone.</span>
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container-low transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    Deleting…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">delete_forever</span>
                    Yes, Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Archive / Restore Confirmation Modal ───────────────────────── */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !loading && setShowArchiveModal(false)}
          />

          {/* Dialog */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 flex flex-col gap-5">
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600 text-2xl">
                {isArchived ? 'unarchive' : 'archive'}
              </span>
            </div>

            {isArchived ? (
              <div>
                <h2 className="text-xl font-extrabold text-primary mb-1">Restore Student?</h2>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  <span className="font-bold text-primary">{studentName}</span> will be moved back
                  to your active roster with status <span className="font-semibold">Accepted</span>.
                  They will count toward your active student slot again.
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-extrabold text-primary mb-1">Archive Student?</h2>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  <span className="font-bold text-primary">{studentName}</span> will be moved to
                  the archived list. They'll no longer appear in your active roster and
                  <span className="font-semibold"> won't count against your student slot</span> —
                  freeing up space for a new student.
                  <br /><br />
                  Their full profile, applications, and history are kept safe. You can restore them
                  at any time.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowArchiveModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container-low transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleArchiveToggle}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)', color: 'white' }}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    {isArchived ? 'Restoring…' : 'Archiving…'}
                  </>
                ) : isArchived ? (
                  <>
                    <span className="material-symbols-outlined text-sm">unarchive</span>
                    Yes, Restore
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">archive</span>
                    Yes, Archive
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
