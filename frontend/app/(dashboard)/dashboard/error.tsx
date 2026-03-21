'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-[20px]">
        ✗
      </div>
      <h2 className="text-[15px] font-semibold text-gray-900">Failed to load dashboard</h2>
      <p className="text-[13px] text-gray-500 max-w-xs text-center">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <button
        onClick={reset}
        className="h-9 px-5 rounded-[6px] text-[13px] font-medium text-white"
        style={{ backgroundColor: '#1D9E75' }}
      >
        Try again
      </button>
    </div>
  )
}
