'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

interface StudentRowActionsProps {
  studentId: string
  studentName: string
  currentStatus: string
}

export default function StudentRowActions({ studentId, studentName, currentStatus }: StudentRowActionsProps) {
  const router = useRouter()
  const { success: toastSuccess, error: toastError } = useToast()

  const [open, setOpen] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isArchived = currentStatus === 'archived'

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleArchiveToggle = async () => {
    setOpen(false)
    setLoading(true)
    try {
      await apiFetch(`/api/students/${studentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: isArchived ? 'intake' : 'archived' }),
      })
      toastSuccess(isArchived ? `${studentName} restored to active roster.` : `${studentName} archived.`)
      setShowArchiveModal(false)
      router.refresh()
    } catch {
      toastError('Failed to update student. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await apiFetch(`/api/students/${studentId}`, { method: 'DELETE' })
      toastSuccess(`${studentName} permanently deleted.`)
      router.refresh()
    } catch {
      toastError('Failed to delete student. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      {/* Trigger */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
          className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-xl">more_vert</span>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-9 z-50 w-44 bg-white rounded-xl shadow-xl border border-outline-variant/20 overflow-hidden py-1">
            <Link
              href={`/students/${studentId}/profile`}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
              onClick={() => setOpen(false)}
            >
              <span className="material-symbols-outlined text-base text-on-surface-variant">person</span>
              View Profile
            </Link>

            <button
              onClick={() => { setOpen(false); setShowArchiveModal(true) }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-base text-on-surface-variant">
                {isArchived ? 'unarchive' : 'archive'}
              </span>
              {isArchived ? 'Restore' : 'Archive'}
            </button>

            <div className="my-1 border-t border-outline-variant/10" />

            <button
              onClick={() => { setOpen(false); setShowDeleteModal(true) }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <span className="material-symbols-outlined text-base">delete</span>
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !loading && setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 flex flex-col gap-5">
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
                  <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>Deleting…</>
                ) : (
                  <><span className="material-symbols-outlined text-sm">delete_forever</span>Yes, Delete</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !loading && setShowArchiveModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 flex flex-col gap-5">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600 text-2xl">{isArchived ? 'unarchive' : 'archive'}</span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-primary mb-1">
                {isArchived ? 'Restore Student?' : 'Archive Student?'}
              </h2>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                {isArchived
                  ? <><span className="font-bold text-primary">{studentName}</span> will be moved back to your active roster.</>
                  : <><span className="font-bold text-primary">{studentName}</span> will be archived and won't count against your student slot. You can restore them anytime.</>
                }
              </p>
            </div>
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
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #031635 0%, #1a2b4b 100%)' }}
              >
                {loading ? (
                  <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>{isArchived ? 'Restoring…' : 'Archiving…'}</>
                ) : isArchived ? (
                  <><span className="material-symbols-outlined text-sm">unarchive</span>Yes, Restore</>
                ) : (
                  <><span className="material-symbols-outlined text-sm">archive</span>Yes, Archive</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
