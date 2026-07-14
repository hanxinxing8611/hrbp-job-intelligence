import type { SalaryBreakdown } from '@/data/types'

interface Props {
  breakdown: SalaryBreakdown
  rangeMin: number
  rangeMax: number
}

const percentiles: { key: keyof SalaryBreakdown; label: string }[] = [
  { key: 'p10', label: 'P10' },
  { key: 'p25', label: 'P25' },
  { key: 'p50', label: 'P50 中位' },
  { key: 'p75', label: 'P75' },
  { key: 'p90', label: 'P90' },
]

export default function SalaryBreakdownChart({ breakdown, rangeMin, rangeMax }: Props) {
  const max = breakdown.p90 + 10
  const positions = percentiles.map((p) => ({
    ...p,
    value: breakdown[p.key],
    leftPct: (breakdown[p.key] / max) * 100,
  }))

  const rangeLeft = (rangeMin / max) * 100
  const rangeWidth = ((rangeMax - rangeMin) / max) * 100

  return (
    <div className="rounded border border-ink-700/60 bg-ink-800/40 p-5">
      <div className="mb-1 flex items-center justify-between">
        <h4 className="font-serif text-sm font-bold text-paper">薪资分位解析</h4>
        <span className="font-mono text-[10px] text-muted">同岗位市场分位</span>
      </div>
      <p className="mb-4 font-mono text-[10px] text-muted">
        本岗位区间 {rangeMin}-{rangeMax}K · 金色高亮区间
      </p>

      {/* 区间条 */}
      <div className="relative mb-6 h-1.5 rounded-full bg-ink-700/60">
        <div
          className="absolute top-0 h-full rounded-full bg-gold/40"
          style={{ left: `${rangeLeft}%`, width: `${rangeWidth}%` }}
        />
        {positions.map((p) => (
          <div
            key={p.key}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${p.leftPct}%` }}
          >
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                p.key === 'p50' ? 'bg-gold' : 'bg-paper/50'
              }`}
            />
          </div>
        ))}
      </div>

      {/* 分位标签 */}
      <div className="relative h-10">
        {positions.map((p) => (
          <div
            key={p.key}
            className="absolute -translate-x-1/2 text-center"
            style={{ left: `${p.leftPct}%` }}
          >
            <div className={`font-mono text-xs font-bold ${p.key === 'p50' ? 'text-gold' : 'text-paper/70'}`}>
              {p.value}K
            </div>
            <div className="font-mono text-[9px] text-muted">{p.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
