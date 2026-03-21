import { getStatusStyle } from '@/lib/utils'

interface StatusPillProps {
  status: string
}

export default function StatusPill({ status }: StatusPillProps) {
  const style = getStatusStyle(status)
  return (
    <span
      className="inline-block text-[11px] font-medium rounded-[4px] px-2 py-0.5 whitespace-nowrap"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  )
}
