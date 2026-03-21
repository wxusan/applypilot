export default function SettingsLoading() {
  return (
    <div className="space-y-5 max-w-2xl animate-pulse">
      <div className="space-y-1">
        <div className="h-7 w-32 bg-gray-100 rounded-[6px]" />
        <div className="h-4 w-64 bg-gray-100 rounded-[6px]" />
      </div>

      {/* Profile section skeleton */}
      <div
        className="bg-white rounded-[10px] p-6 space-y-5"
        style={{ border: '0.5px solid #e5e7eb' }}
      >
        <div className="h-5 w-28 bg-gray-100 rounded" />
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-gray-100" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-1/3 bg-gray-100 rounded" />
            <div className="h-3 w-1/4 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-20 bg-gray-100 rounded" />
              <div className="h-9 bg-gray-100 rounded-[6px]" />
            </div>
          ))}
        </div>
        <div className="h-9 w-24 bg-gray-100 rounded-[6px] ml-auto" />
      </div>
    </div>
  )
}
