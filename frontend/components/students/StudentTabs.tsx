import Link from 'next/link'

export type StudentTab = 'profile' | 'applications' | 'documents' | 'emails' | 'deadlines' | 'activity'

const TABS: { key: StudentTab; label: string }[] = [
  { key: 'profile',      label: 'Profile' },
  { key: 'applications', label: 'Applications' },
  { key: 'documents',    label: 'Documents' },
  { key: 'emails',       label: 'Emails' },
  { key: 'deadlines',    label: 'Deadlines' },
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
    <div className="flex" style={{ borderBottom: '0.5px solid #e5e7eb' }}>
      {TABS.map((tab) => {
        const isActive = active === tab.key
        return (
          <Link
            key={tab.key}
            href={`/students/${studentId}/${tab.key}`}
            className="px-4 py-2.5 text-[13px] transition-colors whitespace-nowrap"
            style={
              isActive
                ? {
                    color: '#1D9E75',
                    fontWeight: 500,
                    borderBottom: '2px solid #1D9E75',
                    marginBottom: '-0.5px',
                  }
                : { color: '#9CA3AF' }
            }
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
