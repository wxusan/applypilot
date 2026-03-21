export default function DashboardLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-[10px] p-5 h-24" style={{ border: '0.5px solid #e5e7eb' }}>
            <div className="h-3 bg-gray-100 rounded w-20 mb-3" />
            <div className="h-7 bg-gray-100 rounded w-12" />
          </div>
        ))}
      </div>
      {/* Content rows */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-[10px] h-64" style={{ border: '0.5px solid #e5e7eb' }} />
        <div className="bg-white rounded-[10px] h-64" style={{ border: '0.5px solid #e5e7eb' }} />
      </div>
    </div>
  )
}
