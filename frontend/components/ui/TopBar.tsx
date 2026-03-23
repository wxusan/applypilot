'use client'

import Link from 'next/link'

interface TopBarProps {
  agency: { id: string; name: string } | null
  user: { full_name: string; email: string } | null
}

export default function TopBar({ agency, user }: TopBarProps) {
  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  return (
    <header className="w-full h-16 flex items-center px-8 justify-between bg-surface sticky top-0 z-40 border-b border-outline-variant/10">
      {/* Left */}
      <div className="flex items-center gap-4">
        <h1 className="font-headline font-bold text-lg text-primary">
          {agency?.name ?? 'ApplyPilot'}
        </h1>
        <div className="bg-surface-container-low h-6 w-[1px]" />
        <span className="text-on-surface-variant text-sm font-medium">Dashboard</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-6">
        <Link href="/notifications" className="relative group">
          <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors duration-200">
            notifications
          </span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border-2 border-surface" />
        </Link>
        <Link href="/search">
          <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors duration-200">
            search
          </span>
        </Link>
        <Link href="/settings">
          <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors duration-200">
            settings
          </span>
        </Link>
        <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/20">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
        </div>
      </div>
    </header>
  )
}
