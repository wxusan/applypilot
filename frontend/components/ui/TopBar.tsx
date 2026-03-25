'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface TopBarProps {
  agency: { id: string; name: string } | null
  user: { full_name: string; email: string } | null
  notificationCount?: number
}

const PATH_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/students': 'Students',
  '/kanban': 'Pipeline',
  '/analytics': 'Analytics',
  '/approvals': 'Approvals',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/notifications': 'Notifications',
  '/search': 'Search',
}

function getPageLabel(pathname: string): string {
  // Exact match first
  if (PATH_LABELS[pathname]) return PATH_LABELS[pathname]
  // Prefix match (e.g. /students/123/profile → Students)
  for (const [prefix, label] of Object.entries(PATH_LABELS)) {
    if (pathname.startsWith(prefix + '/')) return label
  }
  return 'Dashboard'
}

export default function TopBar({ agency, user, notificationCount = 0 }: TopBarProps) {
  const pathname = usePathname()
  const pageLabel = getPageLabel(pathname)

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
        <span className="text-on-surface-variant text-sm font-medium">{pageLabel}</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-6">
        <Link href="/notifications" className="relative group">
          <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors duration-200">
            notifications
          </span>
          {notificationCount > 0 && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border-2 border-surface" />
          )}
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
