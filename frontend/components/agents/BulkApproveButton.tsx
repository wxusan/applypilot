'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCheck } from 'lucide-react'
import { agentJobsApi } from '@/lib/api'

export default function BulkApproveButton({ jobIds }: { jobIds: string[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleBulkApprove = async () => {
    if (!window.confirm(`Approve all ${jobIds.length} pending item(s)? This cannot be undone.`)) return
    setLoading(true)
    try {
      await Promise.all(jobIds.map(id => agentJobsApi.approve(id)))
      // Placeholder email notification log
      console.info(`[Notification] ${jobIds.length} approvals granted at ${new Date().toISOString()}`)
      setDone(true)
      router.refresh()
    } catch (err) {
      console.error('Bulk approve failed', err)
    } finally {
      setLoading(false)
    }
  }

  if (done) return null

  return (
    <button
      onClick={handleBulkApprove}
      disabled={loading || jobIds.length === 0}
      aria-label={`Approve all ${jobIds.length} pending items`}
      className="h-9 px-4 rounded-[6px] text-[13px] font-medium text-white flex items-center gap-2 transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
      style={{ backgroundColor: '#1D9E75' }}
    >
      <CheckCheck size={14} />
      {loading ? 'Approving…' : `Approve All (${jobIds.length})`}
    </button>
  )
}
