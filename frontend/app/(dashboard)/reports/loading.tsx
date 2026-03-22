export default function ReportsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div>
        <div className="h-7 w-32 bg-gray-200 rounded mb-1" />
        <div className="h-4 w-48 bg-gray-100 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-[10px] p-6 h-40" style={{ border: '0.5px solid #e5e7eb' }} />
        ))}
      </div>
    </div>
  )
}
