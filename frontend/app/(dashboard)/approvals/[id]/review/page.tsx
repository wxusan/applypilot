'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

/**
 * This sub-route (/approvals/[id]/review) was an early design mockup.
 * The real approval review UI now lives at /approvals/[id].
 * Redirect there automatically.
 */
export default function ApprovalReviewRedirect() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  useEffect(() => {
    router.replace(`/approvals/${params.id}`)
  }, [params.id, router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex items-center gap-3 text-gray-400">
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px' }}>sync</span>
        <span className="text-[14px]">Redirecting to approval review...</span>
      </div>
    </div>
  )
}
