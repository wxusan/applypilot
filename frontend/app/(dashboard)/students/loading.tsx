export default function StudentsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-100 rounded w-32" />
        <div className="h-9 bg-gray-100 rounded w-28" />
      </div>
      {/* Search + filters */}
      <div className="flex gap-2">
        <div className="h-9 bg-gray-100 rounded flex-1" />
        <div className="h-9 bg-gray-100 rounded w-24" />
        <div className="h-9 bg-gray-100 rounded w-24" />
      </div>
      {/* Table rows */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white rounded-[10px] p-4 flex items-center gap-4" style={{ border: '0.5px solid #e5e7eb' }}>
          <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-gray-100 rounded w-36" />
            <div className="h-2.5 bg-gray-100 rounded w-24" />
          </div>
          <div className="h-5 bg-gray-100 rounded w-16" />
          <div className="h-5 bg-gray-100 rounded w-12" />
        </div>
      ))}
    </div>
  )
}
