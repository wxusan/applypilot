export default function ApprovalsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-7 w-48 bg-gray-100 rounded-[6px]" />
      <div className="h-4 w-72 bg-gray-100 rounded-[6px]" />

      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-[10px] p-5"
          style={{ border: '0.5px solid #e5e7eb' }}
        >
          <div className="flex items-start gap-4">
            <div className="h-9 w-9 rounded-full bg-gray-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-gray-100 rounded" />
              <div className="h-3 w-2/3 bg-gray-100 rounded" />
              <div className="h-3 w-1/2 bg-gray-100 rounded" />
            </div>
            <div className="flex gap-2 shrink-0">
              <div className="h-8 w-20 bg-gray-100 rounded-[6px]" />
              <div className="h-8 w-20 bg-gray-100 rounded-[6px]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
