export default function WorkflowLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Tab bar placeholder */}
      <div className="flex gap-1 border-b border-gray-100 pb-0">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-100 rounded-t w-20" />
        ))}
      </div>

      {/* Active workflow card */}
      <div className="bg-white rounded-xl p-5" style={{ border: '0.5px solid #e5e7eb' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-100 rounded w-40" />
          <div className="h-7 bg-gray-100 rounded w-20" />
        </div>

        {/* Workflow step rows */}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-lg p-4"
              style={{ background: '#f9fafb' }}
            >
              {/* Step number circle */}
              <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-48" />
                <div className="h-2.5 bg-gray-200 rounded w-32" />
              </div>
              {/* Status pill */}
              <div className="h-5 bg-gray-200 rounded-full w-20" />
              {/* Action button */}
              <div className="h-7 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* New workflow button area */}
      <div className="h-10 bg-gray-100 rounded-lg w-40" />
    </div>
  )
}
