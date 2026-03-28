'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Tab {
  label: string
  href: string
  icon: string
  ownerOnly?: boolean
}

const TABS: Tab[] = [
  { label: 'Agency Profile', href: '/settings', icon: 'business' },
  { label: 'Team', href: '/settings/staff', icon: 'group', ownerOnly: true },
  { label: 'Billing', href: '/settings/billing', icon: 'credit_card', ownerOnly: true },
  { label: 'API Tokens', href: '/settings/tokens', icon: 'key', ownerOnly: true },
]

export default function SettingsNav({ role }: { role: string }) {
  const pathname = usePathname()
  const isOwner = role === 'owner' || role === 'admin'

  const visibleTabs = TABS.filter(tab => !tab.ownerOnly || isOwner)

  return (
    <div className="mb-8 border-b border-outline-variant/20">
      <nav className="flex gap-1 -mb-px">
        {visibleTabs.map((tab) => {
          // Exact match for /settings, prefix match for sub-pages
          const isActive =
            tab.href === '/settings'
              ? pathname === '/settings'
              : pathname.startsWith(tab.href)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap
                ${isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-primary hover:border-primary/40'
                }
              `}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
