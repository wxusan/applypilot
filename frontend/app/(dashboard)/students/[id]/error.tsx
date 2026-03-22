'use client'

import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'

export default function StudentPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/students" className="text-gray-400 hover:text-gray-700 transition">
          <ArrowLeft size={16} />
        </Link>
        <span className="text-[13px] text-gray-400">Back to Students</span>
      </div>
      <div
        className="bg-white rounded-[10px] p-12 flex flex-col items-center text-center"
        style={{ border: '0.5px solid #e5e7eb' }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: '#FCEBEB' }}
        >
          <AlertCircle size={18} style={{ color: '#A32D2D' }} />
        </div>
        <h2 className="text-[15px] font-semibold text-gray-900 mb-1">
          Failed to load student
        </h2>
        <p className="text-[13px] text-gray-500 max-w-xs mb-5">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="h-9 px-5 rounded-[6px] text-[13px] font-medium text-white transition hover:opacity-90"
            style={{ backgroundColor: '#1D9E75' }}
          >
            Try again
          </button>
          <Link
            href="/students"
            className="h-9 px-5 rounded-[6px] text-[13px] text-gray-600 hover:bg-gray-50 transition flex items-center"
            style={{ border: '0.5px solid #e5e7eb' }}
          >
            Back to Students
          </Link>
        </div>
      </div>
    </div>
  )
}
