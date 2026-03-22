'use client'

import { Bell, ChevronRight } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface TopBarProps {
  agency: { id: string; name: string } | null
  user: { full_name: string; email: string } | null
  pendingCount?: number
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  students: 'Students',
  approvals: 'Approvals',
  kanban: 'Kanban',
  analytics: 'Analytics',
  settings: 'Settings',
  staff: 'Staff',
  billing: 'Billing',
  profile: 'Profile',
  new: 'New Student',
  edit: 'Edit',
  applications: 'Applications',
  documents: 'Documents',
  deadlines: 'Deadlines',
  emails: 'Emails',
  activity: 'Activity',
  admin: 'Admin',
  agencies: 'Agencies',
  audit: 'Audit',
  notifications: 'Notifications',
}

function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  // Build breadcrumb items skipping UUID-like segments (show as "Profile" etc.)
  const crumbs: { label: string; href: string }[] = []
  let path = ''
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    path += `/${seg}`
    // Skip UUIDs
    const isUuid = /^[0-9a-f-]{36}$/.test(seg)
    if (isUuid) continue
    const label = ROUTE_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1)
    crumbs.push({ label, href: path })
  }

  if (crumbs.length <= 1) return null

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[12px]">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={11} className="text-gray-300" />}
          {i === crumbs.length - 1 ? (
            <span className="text-gray-700 font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="text-gray-400 hover:text-gray-600 transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}

export default function TopBar({ agency, user, pendingCount = 0 }: TopBarProps) {
  return (
    <header
      className="h-[52px] shrink-0 flex items-center justify-between px-6 bg-white"
      style={{ borderBottom: '0.5px solid #e5e7eb' }}
    >
      {/* Left: breadcrumb */}
      <div className="pl-8 md:pl-0">
        <Breadcrumbs />
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/notifications"
          aria-label={`Notifications${pendingCount > 0 ? ` (${pendingCount} unread)` : ''}`}
          className="relative w-7 h-7 flex items-center justify-center rounded-[6px] text-gray-400 hover:bg-gray-50 transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
        >
          <Bell size={15} />
          {pendingCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-[9px] font-bold text-white px-0.5"
              style={{ backgroundColor: '#EF4444' }}
            >
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
        </Link>
        {user && (
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full bg-brand-light flex items-center justify-center"
              title={user.full_name}
            >
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
