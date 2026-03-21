export default function KanbanLoading() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 animate-pulse">
      {[...Array(5)].map((_, col) => (
        <div
          key={col}
          className="w-64 shrink-0 rounded-[10px] p-3 space-y-3"
          style={{ backgroundColor: '#f9fafb', border: '0.5px solid #e5e7eb' }}
        >
          {/* Column header */}
          <div className="flex items-center justify-between">
            <div className="h-3 bg-gray-200 rounded w-20" />
            <div className="h-4 w-4 rounded bg-gray-200" />
          </div>
          {/* Cards */}
          {[...Array(col === 0 ? 3 : col === 1 ? 4 : 2)].map((_, card) => (
            <div key={card} className="bg-white rounded-[8px] p-3 space-y-2" style={{ border: '0.5px solid #e5e7eb' }}>
              <div className="h-3 bg-gray-100 rounded w-3/4" />
              <div className="h-2.5 bg-gray-100 rounded w-1/2" />
              <div className="flex gap-1 mt-1">
                <div className="h-4 bg-gray-100 rounded w-12" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
