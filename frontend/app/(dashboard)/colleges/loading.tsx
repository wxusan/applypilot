export default function CollegesLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-8 bg-gray-100 rounded w-52 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-72" />
      </div>

      {/* Search & filter panel */}
      <div className="bg-white rounded-xl p-6" style={{ border: '0.5px solid #e5e7eb' }}>
        {/* Search bar */}
        <div className="mb-6">
          <div className="h-3 bg-gray-100 rounded w-24 mb-2" />
          <div className="h-11 bg-gray-100 rounded-lg w-full" />
        </div>
        {/* Filter grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="h-3 bg-gray-100 rounded w-28 mb-2" />
              <div className="h-9 bg-gray-100 rounded-lg w-full" />
            </div>
          ))}
        </div>
        {/* Search button */}
        <div className="h-11 bg-gray-200 rounded-lg w-full" />
      </div>

      {/* College cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-5 flex flex-col gap-3"
            style={{ border: '0.5px solid #e5e7eb' }}
          >
            <div className="h-4 bg-gray-100 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
            <div className="space-y-2 mt-2">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="flex justify-between">
                  <div className="h-3 bg-gray-100 rounded w-24" />
                  <div className="h-3 bg-gray-100 rounded w-12" />
                </div>
              ))}
            </div>
            <div className="h-9 bg-gray-100 rounded-lg mt-2 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
