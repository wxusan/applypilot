'use client'

// All charts use inline SVG — no external chart library needed.

const STATUS_COLORS: Record<string, string> = {
  intake:    '#6B7280',
  active:    '#3B82F6',
  forms:     '#8B5CF6',
  writing:   '#F59E0B',
  review:    '#EC4899',
  submitted: '#F97316',
  accepted:  '#22C55E',
  rejected:  '#EF4444',
}

const DECISION_COLORS: Record<string, string> = {
  accepted:  '#22C55E',
  rejected:  '#EF4444',
  waitlisted:'#F59E0B',
  pending:   '#D1D5DB',
}

interface Props {
  studentsByStatus: Record<string, number>
  decisionCounts: Record<string, number>
  jobsByDay: Record<string, number>
  complianceRate: number | null
  completedOnTime: number
  totalPastDeadlines: number
}

// ── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({
  data,
  colors,
  size = 160,
}: {
  data: { label: string; value: number }[]
  colors: Record<string, string>
  size?: number
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-[12px] text-gray-300">No data</span>
      </div>
    )
  }

  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38
  const innerR = size * 0.22
  const gap = 0.02 // radians gap between slices

  let cumAngle = -Math.PI / 2
  const slices: { path: string; color: string; label: string; value: number }[] = []

  for (const d of data) {
    if (d.value === 0) continue
    const angle = (d.value / total) * (2 * Math.PI) - gap
    const x1 = cx + r * Math.cos(cumAngle)
    const y1 = cy + r * Math.sin(cumAngle)
    const x2 = cx + r * Math.cos(cumAngle + angle)
    const y2 = cy + r * Math.sin(cumAngle + angle)
    const ix1 = cx + innerR * Math.cos(cumAngle)
    const iy1 = cy + innerR * Math.sin(cumAngle)
    const ix2 = cx + innerR * Math.cos(cumAngle + angle)
    const iy2 = cy + innerR * Math.sin(cumAngle + angle)
    const large = angle > Math.PI ? 1 : 0
    const path = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${ix1} ${iy1}`,
      'Z',
    ].join(' ')
    slices.push({ path, color: colors[d.label] ?? '#9CA3AF', label: d.label, value: d.value })
    cumAngle += angle + gap
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} opacity={0.85}>
          <title>{s.label}: {s.value}</title>
        </path>
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={18} fontWeight={600} fill="#111827">
        {total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9} fill="#9CA3AF">
        TOTAL
      </text>
    </svg>
  )
}

// ── Bar Chart ────────────────────────────────────────────────────────────────
function BarChart({
  data,
  colors,
  height = 140,
}: {
  data: { label: string; value: number }[]
  colors: Record<string, string>
  height?: number
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const barW = 36
  const gap = 14
  const padLeft = 8
  const padBottom = 28
  const chartH = height - padBottom
  const totalW = padLeft + data.length * (barW + gap)

  return (
    <svg width={totalW} height={height} style={{ overflow: 'visible' }}>
      {data.map((d, i) => {
        const barH = Math.max((d.value / maxVal) * chartH, d.value > 0 ? 4 : 0)
        const x = padLeft + i * (barW + gap)
        const y = chartH - barH
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={4}
              fill={colors[d.label] ?? '#9CA3AF'}
              opacity={0.85}
            />
            {d.value > 0 && (
              <text
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize={10}
                fontWeight={600}
                fill="#374151"
              >
                {d.value}
              </text>
            )}
            <text
              x={x + barW / 2}
              y={chartH + 16}
              textAnchor="middle"
              fontSize={10}
              fill="#9CA3AF"
            >
              {d.label.charAt(0).toUpperCase() + d.label.slice(1, 5)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Sparkline ────────────────────────────────────────────────────────────────
function SparkLine({
  data,
  width = 400,
  height = 80,
}: {
  data: { date: string; count: number }[]
  width?: number
  height?: number
}) {
  const maxVal = Math.max(...data.map((d) => d.count), 1)
  const padX = 8
  const padY = 12
  const chartW = width - padX * 2
  const chartH = height - padY * 2

  if (data.length === 0) {
    return (
      <svg width={width} height={height}>
        <text x={width / 2} y={height / 2} textAnchor="middle" fontSize={11} fill="#9CA3AF">
          No data
        </text>
      </svg>
    )
  }

  const points = data.map((d, i) => {
    const x = data.length > 1 ? padX + (i / (data.length - 1)) * chartW : padX + chartW / 2
    const y = padY + chartH - (d.count / maxVal) * chartH
    return { x, y, ...d }
  })

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD =
    pathD +
    ` L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`

  // X-axis labels: show every 7 days
  const labelIndices = data
    .map((_, i) => i)
    .filter((i) => i % 7 === 0 || i === data.length - 1)

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {/* Area fill */}
      <path d={areaD} fill="#1D9E75" fillOpacity={0.08} />
      {/* Line */}
      <path d={pathD} fill="none" stroke="#1D9E75" strokeWidth={2} strokeLinejoin="round" />
      {/* Dots for non-zero */}
      {points.map((p, i) =>
        p.count > 0 ? (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="#1D9E75">
            <title>{p.date}: {p.count} jobs</title>
          </circle>
        ) : null
      )}
      {/* X labels */}
      {labelIndices.map((i) => {
        const p = points[i]
        const d = new Date(data[i].date)
        const label = `${d.getMonth() + 1}/${d.getDate()}`
        return (
          <text key={i} x={p.x} y={height} textAnchor="middle" fontSize={9} fill="#9CA3AF">
            {label}
          </text>
        )
      })}
    </svg>
  )
}

// ── Legend ───────────────────────────────────────────────────────────────────
function Legend({ items }: { items: { label: string; value: number; color: string }[] }) {
  return (
    <div className="space-y-1.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-[12px] text-gray-500 capitalize flex-1">{item.label}</span>
          <span className="text-[12px] font-medium text-gray-700">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Card wrapper ─────────────────────────────────────────────────────────────
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[10px] p-5" style={{ border: '0.5px solid #e5e7eb' }}>
      <h2 className="text-[14px] font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  )
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function AnalyticsCharts({
  studentsByStatus,
  decisionCounts,
  jobsByDay,
  complianceRate,
  completedOnTime,
  totalPastDeadlines,
}: Props) {
  const statusData = Object.entries(studentsByStatus)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)

  const decisionData = ['accepted', 'rejected', 'waitlisted', 'pending'].map((label) => ({
    label,
    value: decisionCounts[label] ?? 0,
  }))

  const jobsData = Object.entries(jobsByDay).map(([date, count]) => ({ date, count }))

  return (
    <div className="space-y-4">
      {/* Row 1: Donut + Bar */}
      <div className="grid grid-cols-2 gap-4">
        <ChartCard title="Students by Pipeline Stage">
          <div className="flex items-center gap-6">
            <DonutChart data={statusData} colors={STATUS_COLORS} size={160} />
            <Legend
              items={statusData.map((d) => ({
                label: d.label,
                value: d.value,
                color: STATUS_COLORS[d.label] ?? '#9CA3AF',
              }))}
            />
          </div>
        </ChartCard>

        <ChartCard title="Application Decisions">
          <div className="flex items-end gap-6">
            <BarChart data={decisionData} colors={DECISION_COLORS} height={160} />
            <Legend
              items={decisionData
                .filter((d) => d.value > 0)
                .map((d) => ({
                  label: d.label,
                  value: d.value,
                  color: DECISION_COLORS[d.label] ?? '#9CA3AF',
                }))}
            />
          </div>
        </ChartCard>
      </div>

      {/* Row 2: Agent activity sparkline + Compliance */}
      <div className="grid grid-cols-2 gap-4">
        <ChartCard title="Agent Activity (last 30 days)">
          <div className="overflow-x-auto">
            <SparkLine data={jobsData} width={440} height={90} />
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Total:{' '}
            <span className="font-medium text-gray-600">
              {jobsData.reduce((s, d) => s + d.count, 0)} jobs
            </span>
          </p>
        </ChartCard>

        <ChartCard title="Deadline Compliance">
          {totalPastDeadlines === 0 ? (
            <p className="text-[13px] text-gray-400">No past deadlines to evaluate</p>
          ) : (
            <div className="space-y-4">
              {/* Gauge */}
              <div className="flex items-center gap-4">
                <div className="relative w-[100px] h-[100px] shrink-0">
                  <svg viewBox="0 0 100 100" width="100" height="100">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#F3F4F6" strokeWidth="10" />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke={
                        (complianceRate ?? 0) >= 80
                          ? '#22C55E'
                          : (complianceRate ?? 0) >= 60
                          ? '#F59E0B'
                          : '#EF4444'
                      }
                      strokeWidth="10"
                      strokeDasharray={`${((complianceRate ?? 0) / 100) * 238.76} 238.76`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                    <text
                      x="50"
                      y="47"
                      textAnchor="middle"
                      fontSize="18"
                      fontWeight="700"
                      fill="#111827"
                    >
                      {complianceRate}%
                    </text>
                    <text x="50" y="61" textAnchor="middle" fontSize="8" fill="#9CA3AF">
                      RATE
                    </text>
                  </svg>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-[22px] font-semibold text-[#22C55E] leading-none">
                      {completedOnTime}
                    </p>
                    <p className="text-[11px] text-gray-400">completed on time</p>
                  </div>
                  <div>
                    <p className="text-[22px] font-semibold text-[#EF4444] leading-none">
                      {totalPastDeadlines - completedOnTime}
                    </p>
                    <p className="text-[11px] text-gray-400">missed</p>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    of {totalPastDeadlines} total deadlines
                  </p>
                </div>
              </div>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  )
}
