export default function StudentPageLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-gray-100 rounded" />
          <div className="w-10 h-10 rounded-full bg-gray-100" />
          <div>
            <div className="h-6 bg-gray-100 rounded w-48 mb-1" />
            <div className="h-3 bg-gray-100 rounded w-64" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 bg-gray-100 rounded w-20" />
          <div className="h-8 bg-gray-100 rounded w-20" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 pb-0">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-100 rounded-t w-20" />
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-[10px] p-5"
            style={{ border: '0.5px solid #e5e7eb' }}
          >
            <div className="h-4 bg-gray-100 rounded w-24 mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="flex gap-2">
                  <div className="h-3 bg-gray-100 rounded w-16" />
                  <div className="h-3 bg-gray-100 rounded w-24" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
