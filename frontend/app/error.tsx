'use client'

import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={22} className="text-red-500" />
          </div>
          <h1 className="text-[18px] font-semibold text-gray-900 mb-1">Something went wrong</h1>
          <p className="text-[13px] text-gray-500 mb-6">
            {error.message || 'An unexpected error occurred. Our team has been notified.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="h-9 px-5 rounded-[6px] text-[13px] font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
              style={{ backgroundColor: '#1D9E75' }}
            >
              Try again
            </button>
            <Link
              href="/dashboard"
              className="h-9 px-5 rounded-[6px] text-[13px] font-medium text-gray-700 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
              style={{ border: '0.5px solid #e5e7eb' }}
            >
              Go to Dashboard
            </Link>
          </div>
          {error.digest && (
            <p className="text-[10px] text-gray-300 font-mono mt-6">Error ID: {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  )
}
