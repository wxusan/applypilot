import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-[72px] font-bold text-gray-100 leading-none select-none">404</p>
        <h1 className="text-[20px] font-semibold text-gray-900 mt-2 mb-1">Page not found</h1>
        <p className="text-[13px] text-gray-500 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-block h-9 px-5 rounded-[6px] text-[13px] font-medium text-white"
          style={{ backgroundColor: '#1D9E75', lineHeight: '36px' }}
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
