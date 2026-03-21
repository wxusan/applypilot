interface Stats {
  totalStudents: number
  activeApplications: number
  pendingApprovals: number
  urgentDeadlines: number
}

export default function StatsRow({ stats }: { stats: Stats }) {
  const cards = [
    { label: 'Total Students', value: stats.totalStudents, color: '#1D9E75' },
    { label: 'Active Applications', value: stats.activeApplications, color: '#185FA5' },
    { label: 'Pending Approvals', value: stats.pendingApprovals, color: '#854F0B' },
    { label: 'Urgent Deadlines', value: stats.urgentDeadlines, color: '#A32D2D' },
  ]

  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-[10px] px-5 py-4"
          style={{ border: '0.5px solid #e5e7eb' }}
        >
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-[0.5px] mb-2">
            {card.label}
          </p>
          <p className="text-[28px] font-semibold leading-none" style={{ color: card.color }}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}
