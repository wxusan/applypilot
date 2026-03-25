import Link from 'next/link'

export type StudentTab = 'profile' | 'applications' | 'documents' | 'emails' | 'deadlines' | 'activity'

const TABS: { key: StudentTab; label: string; icon: string }[] = [
  { key: 'profile',      label: 'Profile',      icon: 'person' },
  { key: 'applications', label: 'Applications', icon: 'description' },
  { key: 'documents',    label: 'Documents',    icon: 'folder' },
  { key: 'emails',       label: 'Emails',       icon: 'mail' },
  { key: 'deadlines',    label: 'Deadlines',    icon: 'schedule' },
  { key: 'activity',     label: 'Activity Log', icon: 'history' },
]

export default function StudentTabs({
  studentId,
  active,
}: {
  studentId: string
  active: StudentTab
}) {
  return (
    <div className="mb-8 border-b border-outline-variant/20">
      <div className="flex gap-8">
        {TABS.map((tab) => {
          const isActive = active === tab.key
          return (
            <Link
              key={tab.key}
              href={`/students/${studentId}/${tab.key}`}
              className={`pb-4 text-sm font-medium transition-all flex items-center gap-2 relative ${
                isActive
                  ? 'text-primary font-bold border-b-2 border-primary'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
              style={isActive ? { marginBottom: '-1px' } : {}}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
