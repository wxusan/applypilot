'use client'

import { Bell } from 'lucide-react'

interface TopBarProps {
  agency: { id: string; name: string } | null
  user: { full_name: string; email: string } | null
}

export default function TopBar({ agency, user }: TopBarProps) {
  return (
    <header
      className="h-[52px] shrink-0 flex items-center justify-between px-6 bg-white"
      style={{ borderBottom: '0.5px solid #e5e7eb' }}
    >
      {/* Left: breadcrumb placeholder */}
      <div />

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        <button className="w-7 h-7 flex items-center justify-center rounded-[6px] text-gray-400 hover:bg-gray-50 transition">
          <Bell size={15} />
        </button>
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand-light flex items-center justify-center">
              <span className="text-[10px] font-semibold text-brand-dark">
                {user.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
