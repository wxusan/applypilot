'use client'

export default function ApprovalsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold text-gray-900">Approval Queue</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Something went wrong loading approvals.</p>
      </div>
      <div
        className="bg-white rounded-[10px] p-8 text-center"
        style={{ border: '0.5px solid #e5e7eb' }}
      >
        <p className="text-[13px] text-[#A32D2D] mb-4">{error.message || 'Failed to load approval queue.'}</p>
        <button
          onClick={reset}
          className="h-9 px-4 rounded-[6px] text-[13px] font-medium text-white"
          style={{ backgroundColor: '#1D9E75' }}
        >
          Try again
        </button>
      </div>
    </div>
  )
}
