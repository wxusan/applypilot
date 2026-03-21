export default function AnalyticsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-[10px] p-5 h-24" style={{ border: '0.5px solid #e5e7eb' }}>
            <div className="h-3 bg-gray-100 rounded w-24 mb-3" />
            <div className="h-8 bg-gray-100 rounded w-16" />
          </div>
        ))}
      </div>
      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-[10px] h-64" style={{ border: '0.5px solid #e5e7eb' }} />
        <div className="bg-white rounded-[10px] h-64" style={{ border: '0.5px solid #e5e7eb' }} />
      </div>
      {/* Bottom charts */}
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-[10px] h-48" style={{ border: '0.5px solid #e5e7eb' }} />
        ))}
      </div>
    </div>
  )
}
