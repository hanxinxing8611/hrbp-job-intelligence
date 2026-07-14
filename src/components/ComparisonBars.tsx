import type { CompanyComparison } from '@/data/types'

interface Props {
  data: CompanyComparison[]
  companyName: string
}

export default function ComparisonBars({ data, companyName }: Props) {
  const maxValue = 100

  return (
    <div className="space-y-4">
      {data.map((item, i) => {
        const valuePct = (item.value / maxValue) * 100
        const avgPct = (item.industryAvg / maxValue) * 100
        const aboveAvg = item.value >= item.industryAvg
        return (
          <div key={item.metric}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[12px] text-paper/80">{item.metric}</span>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className={aboveAvg ? 'text-gold' : 'text-crimson'}>
                  {item.value}
                </span>
                <span className="text-muted">行业 {item.industryAvg}</span>
              </div>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-ink-700/50">
              {/* 行业均值标记 */}
              <div
                className="absolute top-0 z-10 h-full w-0.5 bg-muted"
                style={{ left: `${avgPct}%` }}
              />
              {/* 公司值条 */}
              <div
                className={`bar-grow absolute top-0 h-full rounded-full ${
                  aboveAvg ? 'bg-gold' : 'bg-crimson/70'
                }`}
                style={{
                  width: `${valuePct}%`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            </div>
          </div>
        )
      })}
      <div className="flex items-center gap-4 pt-1 font-mono text-[10px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-gold" />
          {companyName}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-0.5 bg-muted" />
          行业均值线
        </span>
      </div>
    </div>
  )
}
