'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

/**
 * /students/[id]/transcripts was an early design mockup.
 * Document management (including transcripts) now lives at /students/[id]/documents.
 * Redirect there automatically.
 */
export default function TranscriptsRedirect() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  useEffect(() => {
    router.replace(`/students/${params.id}/documents`)
  }, [params.id, router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex items-center gap-3 text-gray-400">
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px' }}>sync</span>
        <span className="text-[14px]">Redirecting to Documents...</span>
      </div>
    </div>
  )
}
