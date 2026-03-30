import Link from 'next/link'

export type StudentTab = 'profile' | 'applications' | 'documents' | 'emails' | 'deadlines' | 'activity' | 'college-fit' | 'essays' | 'credentials' | 'workflow' | 'portals'

const TABS: { key: StudentTab; label: string }[] = [
  { key: 'profile',      label: 'Profile' },
  { key: 'applications', label: 'Applications' },
  { key: 'documents',    label: 'Documents' },
  { key: 'emails',       label: 'Emails' },
  { key: 'essays',       label: 'Essays' },
  { key: 'deadlines',    label: 'Deadlines' },
  { key: 'college-fit',  label: 'College Fit' },
  { key: 'credentials',  label: 'Credentials' },
  { key: 'workflow',     label: 'Workflow' },
  { key: 'activity',     label: 'Activity Log' },
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
              className={`pb-4 text-sm font-medium transition-all relative ${
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
