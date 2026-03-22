'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Root error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-2 h-2 rounded-full bg-brand" />
          <span className="text-[15px] font-semibold text-gray-900">ApplyPilot</span>
        </div>

        <div className="bg-white rounded-[10px] p-10" style={{ border: '0.5px solid #e5e7eb' }}>
          <p className="text-[48px] font-bold text-gray-100 leading-none mb-4">Oops</p>
          <h1 className="text-[20px] font-semibold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-[13px] text-gray-500 mb-6">
            {error.message || 'An unexpected error occurred.'}
            {error.digest && (
              <span className="block mt-1 text-[11px] font-mono text-gray-300">
                Error ID: {error.digest}
              </span>
            )}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="h-9 px-5 rounded-[6px] text-[13px] font-medium text-white transition hover:opacity-90"
              style={{ backgroundColor: '#1D9E75' }}
            >
              Try again
            </button>
            <Link
              href="/dashboard"
              className="h-9 px-5 rounded-[6px] text-[13px] text-gray-500 flex items-center hover:bg-gray-50 transition"
              style={{ border: '0.5px solid #e5e7eb' }}
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
