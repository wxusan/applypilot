'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import EditApplicationForm from './EditApplicationForm'

interface Application {
  id: string
  university_name: string
  application_type: string
  status: string
  deadline_regular: string | null
  deadline_financial_aid: string | null
  deadline_scholarship: string | null
  decision: string | null
  portal_url: string | null
  portal_username: string | null
  scholarship_amount: number | null
  financial_aid_amount: number | null
  application_fee_paid: boolean
  fee_waiver_used: boolean
  notes: string | null
}

export default function ApplicationCardActions({ application }: { application: Application }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      // Auto-cancel after 4s
      setTimeout(() => setConfirmDelete(false), 4000)
      return
    }
    setDeleting(true)
    try {
      await apiFetch(`/api/applications/${application.id}`, { method: 'DELETE' })
      router.refresh()
    } catch {
      // Silently swallow; user can retry
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setEditOpen(true)}
          className="h-7 w-7 rounded-[5px] flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          title="Edit application"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`h-7 px-2 rounded-[5px] flex items-center gap-1 text-[11px] transition
            ${confirmDelete
              ? 'bg-[#A32D2D] text-white'
              : 'text-gray-400 hover:text-[#A32D2D] hover:bg-red-50'
            }`}
          title={confirmDelete ? 'Click again to confirm delete' : 'Delete application'}
        >
          <Trash2 size={11} />
          {confirmDelete ? 'Confirm?' : ''}
        </button>
      </div>

      {editOpen && (
        <EditApplicationForm
          application={application}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  )
}
